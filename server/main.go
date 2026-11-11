// Gateway between the portfolio page and a llama-server running Qwen3.
//
// It owns the prompt (fact sheet + examples), enforces the caps decided in ADR 0001,
// streams tokens to the browser as Server-Sent Events, and appends every question
// to the permanent question log.
package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"sync/atomic"
	"time"
	"unicode"
)

const (
	maxQuestionChars = 300
	maxOutputTokens  = 220
	// 0.6 was tried for unknown-intent questions (small talk) and rejected: it wrote `rm -rf *`
	// for a question the same prompt declines at 0.3 (spike/RESULTS.md, small-talk gate).
	temperature  = 0.3
	genWallClock = 25 * time.Second
	queueDepth   = 3
	perMinute    = 10
	perHour      = 60
)

// hasHangul reports whether the question is (at least partly) Korean text.
func hasHangul(s string) bool {
	for _, r := range s {
		if unicode.Is(unicode.Hangul, r) {
			return true
		}
	}
	return false
}

// generated reports whether a question goes to the model: English page, no Hangul. Korean free text was
// generated from 2026-11-08 and reverted on 2026-11-12 because real answers stayed below the bar
// (docs/adr/0001, 2026-11-12 amendment); the page answers it with scripted replies.
func generated(lang, question string) bool {
	return lang == "en" && !hasHangul(question)
}

type config struct {
	listen     string
	upstream   string
	modelName  string
	facts      string
	examples   string
	logDir     string
	origins    map[string]bool
	timeoutUps time.Duration
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func loadConfig() config {
	c := config{
		listen:     env("LISTEN", ":8090"),
		upstream:   strings.TrimRight(env("LLAMA_URL", "http://llama:8080"), "/"),
		modelName:  env("MODEL_NAME", "Qwen3-1.7B"),
		facts:      env("FACTS_FILE", "facts.en.md"),
		examples:   env("EXAMPLES_FILE", "examples.en.md"),
		logDir:     env("LOG_DIR", "./log"),
		origins:    map[string]bool{},
		timeoutUps: genWallClock + 5*time.Second,
	}
	for _, o := range strings.Split(env("ALLOWED_ORIGINS", "https://kyu-seok.github.io"), ",") {
		if o = strings.TrimSpace(o); o != "" {
			c.origins[o] = true
		}
	}
	return c
}

// ---- rate limiting (per IP, in memory, no persistence) ----

type bucket struct {
	minute, hour     int
	minuteAt, hourAt time.Time
	lastSeen         time.Time
}

type limiter struct {
	mu  sync.Mutex
	m   map[string]*bucket
	now func() time.Time
}

func newLimiter() *limiter {
	l := &limiter{m: map[string]*bucket{}, now: time.Now}
	go func() {
		for range time.Tick(10 * time.Minute) {
			l.mu.Lock()
			for k, b := range l.m {
				if l.now().Sub(b.lastSeen) > time.Hour {
					delete(l.m, k)
				}
			}
			l.mu.Unlock()
		}
	}()
	return l
}

func (l *limiter) allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := l.now()
	b, ok := l.m[ip]
	if !ok {
		b = &bucket{minuteAt: now, hourAt: now}
		l.m[ip] = b
	}
	b.lastSeen = now
	if now.Sub(b.minuteAt) >= time.Minute {
		b.minute, b.minuteAt = 0, now
	}
	if now.Sub(b.hourAt) >= time.Hour {
		b.hour, b.hourAt = 0, now
	}
	if b.minute >= perMinute || b.hour >= perHour {
		return false
	}
	b.minute++
	b.hour++
	return true
}

func clientIP(r *http.Request) string {
	if v := r.Header.Get("CF-Connecting-IP"); v != "" {
		return v
	}
	if v := r.Header.Get("X-Forwarded-For"); v != "" {
		return strings.TrimSpace(strings.Split(v, ",")[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// ---- question log: one JSON line per question, monthly files, never deleted ----

type logEntry struct {
	At           string  `json:"at"`
	Lang         string  `json:"lang"`
	Intent       string  `json:"intent"`
	Question     string  `json:"question"`
	Answer       string  `json:"answer,omitempty"`
	Outcome      string  `json:"outcome"`
	FirstTokenMs int64   `json:"first_token_ms,omitempty"`
	TotalMs      int64   `json:"total_ms,omitempty"`
	Tokens       int     `json:"tokens,omitempty"`
	TokPerSec    float64 `json:"tok_s,omitempty"`
	Model        string  `json:"model"`
}

type qlog struct {
	mu  sync.Mutex
	dir string
}

func (q *qlog) write(e logEntry) {
	q.mu.Lock()
	defer q.mu.Unlock()
	name := filepath.Join(q.dir, "questions-"+time.Now().UTC().Format("2006-01")+".jsonl")
	f, err := os.OpenFile(name, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		log.Printf("question log: %v", err)
		return
	}
	defer f.Close()
	b, _ := json.Marshal(e)
	f.Write(append(b, '\n'))
}

// ---- metrics (Prometheus text format, hand-rolled to avoid a dependency) ----

type metrics struct {
	asks      sync.Map     // outcome -> *int64
	genSecs   atomic.Int64 // milliseconds summed
	genTokens atomic.Int64
}

func (m *metrics) count(counter *sync.Map, outcome string) {
	v, _ := counter.LoadOrStore(outcome, new(int64))
	atomic.AddInt64(v.(*int64), 1)
}

func (m *metrics) write(w io.Writer, busy, queued int32, warm bool) {
	fmt.Fprintln(w, "# TYPE portfolio_ask_total counter")
	m.asks.Range(func(k, v any) bool {
		fmt.Fprintf(w, "portfolio_ask_total{outcome=%q} %d\n", k, atomic.LoadInt64(v.(*int64)))
		return true
	})
	fmt.Fprintf(w, "# TYPE portfolio_ask_generation_seconds_total counter\nportfolio_ask_generation_seconds_total %.3f\n", float64(m.genSecs.Load())/1000)
	fmt.Fprintf(w, "# TYPE portfolio_ask_generated_tokens_total counter\nportfolio_ask_generated_tokens_total %d\n", m.genTokens.Load())
	fmt.Fprintf(w, "# TYPE portfolio_ask_busy gauge\nportfolio_ask_busy %d\n", busy)
	fmt.Fprintf(w, "# TYPE portfolio_ask_queued gauge\nportfolio_ask_queued %d\n", queued)
	w1 := 0
	if warm {
		w1 = 1
	}
	fmt.Fprintf(w, "# TYPE portfolio_ask_warm gauge\nportfolio_ask_warm %d\n", w1)
}

// ---- link filter: only URLs that appear in the fact sheet may reach the page ----

var urlRe = regexp.MustCompile(`https?://[^\s)\]>'"]+|www\.[^\s)\]>'"]+`)

type linkFilter struct {
	allowed map[string]bool
	pending strings.Builder
}

// urlKey is how a URL is compared with the fact sheet: trailing punctuation and slash do not count.
func urlKey(u string) string {
	return strings.TrimRight(u, ".,;:/")
}

func newLinkFilter(facts string) *linkFilter {
	f := &linkFilter{allowed: map[string]bool{}}
	for _, u := range urlRe.FindAllString(facts, -1) {
		f.allowed[urlKey(u)] = true
	}
	return f
}

func (f *linkFilter) clean(word string) string {
	return urlRe.ReplaceAllStringFunc(word, func(u string) string {
		if f.allowed[urlKey(u)] {
			return u
		}
		// Keep the sentence punctuation that followed the link.
		return "[link removed]" + strings.TrimLeft(u[len(strings.TrimRight(u, ".,;:")):], "/")
	})
}

// push returns the text that is safe to emit now; words are held until whitespace closes them.
func (f *linkFilter) push(delta string) string {
	f.pending.WriteString(delta)
	s := f.pending.String()
	i := strings.LastIndexAny(s, " \n\t")
	if i < 0 {
		return ""
	}
	out, rest := s[:i+1], s[i+1:]
	f.pending.Reset()
	f.pending.WriteString(rest)
	return f.clean(out)
}

func (f *linkFilter) flush() string {
	s := f.pending.String()
	f.pending.Reset()
	return f.clean(s)
}

// ---- the gateway ----

type gateway struct {
	cfg    config
	system string
	links  *linkFilter
	lim    *limiter
	qlog   *qlog
	met    *metrics
	slot   chan struct{} // capacity 1: one generation at a time
	queued atomic.Int32
	busy   atomic.Int32
	warm   atomic.Bool
	client *http.Client
}

type askRequest struct {
	Question string `json:"question"`
	Lang     string `json:"lang"`
	Intent   string `json:"intent"`
}

func (g *gateway) cors(w http.ResponseWriter, r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin != "" && g.cfg.origins[origin] {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Max-Age", "600")
	}
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return false
	}
	return true
}

func (g *gateway) health(w http.ResponseWriter, r *http.Request) {
	if !g.cors(w, r) {
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	json.NewEncoder(w).Encode(map[string]any{
		"ready":  g.warm.Load(),
		"model":  g.cfg.modelName,
		"busy":   g.busy.Load(),
		"queued": g.queued.Load(),
	})
}

func (g *gateway) metricsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	g.met.write(w, g.busy.Load(), g.queued.Load(), g.warm.Load())
}

type sse struct {
	w  http.ResponseWriter
	fl http.Flusher
}

func (s sse) send(event string, v any) {
	b, _ := json.Marshal(v)
	fmt.Fprintf(s.w, "event: %s\ndata: %s\n\n", event, b)
	s.fl.Flush()
}

const rateLimitedMsg = "too many questions, try again in a minute"

// allowed applies the per-IP limiter that /ask and /pick share: one budget per visitor, whichever path answers.
func (g *gateway) allowed(r *http.Request) bool {
	return g.lim.allow(clientIP(r))
}

// refuse logs a question that got no reply, counts its outcome, and answers with an error status.
func (g *gateway) refuse(w http.ResponseWriter, counter *sync.Map, e logEntry, outcome string, status int, msg string) {
	e.Outcome = outcome
	g.qlog.write(e)
	g.met.count(counter, outcome)
	http.Error(w, msg, status)
}

func (g *gateway) ask(w http.ResponseWriter, r *http.Request) {
	if !g.cors(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	var req askRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, 4096)).Decode(&req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	req.Question = strings.TrimSpace(req.Question)
	if req.Question == "" || len([]rune(req.Question)) > maxQuestionChars {
		http.Error(w, fmt.Sprintf("question must be 1 to %d characters", maxQuestionChars), http.StatusBadRequest)
		return
	}
	if !generated(req.Lang, req.Question) {
		http.Error(w, "only English questions are generated", http.StatusUnprocessableEntity)
		return
	}
	if req.Intent == "" {
		req.Intent = "unknown"
	}
	entry := logEntry{At: time.Now().UTC().Format(time.RFC3339), Lang: req.Lang, Intent: req.Intent, Question: req.Question, Model: g.cfg.modelName}
	fail := func(outcome string, status int, msg string) {
		g.refuse(w, &g.met.asks, entry, outcome, status, msg)
	}
	if !g.warm.Load() {
		fail("not_ready", http.StatusServiceUnavailable, "model warming up")
		return
	}
	if !g.allowed(r) {
		fail("rate_limited", http.StatusTooManyRequests, rateLimitedMsg)
		return
	}
	if g.queued.Add(1) > queueDepth {
		g.queued.Add(-1)
		fail("busy", http.StatusServiceUnavailable, "busy")
		return
	}
	select {
	case g.slot <- struct{}{}:
	case <-r.Context().Done():
		g.queued.Add(-1)
		fail("client_gone", http.StatusRequestTimeout, "client gone")
		return
	}
	g.queued.Add(-1)
	g.busy.Store(1)
	defer func() { <-g.slot; g.busy.Store(0) }()

	fl, ok := w.(http.Flusher)
	if !ok {
		fail("error", http.StatusInternalServerError, "streaming unsupported")
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	out := sse{w, fl}
	out.send("meta", map[string]any{"model": g.cfg.modelName})

	ctx, cancel := context.WithTimeout(r.Context(), genWallClock)
	defer cancel()
	start := time.Now()
	res, err := g.generate(ctx, req, func(text string) { out.send("token", map[string]string{"text": text}) })
	entry.Answer = res.answer
	entry.Tokens = res.tokens
	entry.TotalMs = time.Since(start).Milliseconds()
	entry.FirstTokenMs = res.firstTokenMs
	entry.TokPerSec = res.tokPerSec
	switch {
	case err == nil:
		entry.Outcome = "ok"
	case errors.Is(ctx.Err(), context.DeadlineExceeded):
		entry.Outcome = "cut" // hit the wall clock; whatever streamed stays on the page
	case r.Context().Err() != nil:
		entry.Outcome = "client_gone"
	default:
		entry.Outcome = "error"
		log.Printf("generate: %v", err)
	}
	g.met.count(&g.met.asks, entry.Outcome)
	g.met.genSecs.Add(entry.TotalMs)
	g.met.genTokens.Add(int64(res.tokens))
	g.qlog.write(entry)
	out.send("done", map[string]any{
		"outcome": entry.Outcome, "tokens": res.tokens, "seconds": float64(entry.TotalMs) / 1000,
		"tok_s": res.tokPerSec, "first_token_s": float64(res.firstTokenMs) / 1000, "model": g.cfg.modelName,
	})
}

type genResult struct {
	answer       string
	tokens       int
	firstTokenMs int64
	tokPerSec    float64
}

type chatChunk struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
	} `json:"choices"`
	Timings *struct {
		PredictedN         int     `json:"predicted_n"`
		PredictedPerSecond float64 `json:"predicted_per_second"`
	} `json:"timings"`
}

func (g *gateway) generate(ctx context.Context, req askRequest, emit func(string)) (genResult, error) {
	var res genResult
	body, _ := json.Marshal(map[string]any{
		"model":                "portfolio",
		"stream":               true,
		"max_tokens":           maxOutputTokens,
		"temperature":          temperature,
		"top_p":                0.9,
		"cache_prompt":         true,
		"chat_template_kwargs": map[string]any{"enable_thinking": false},
		"messages": []map[string]string{
			{"role": "system", "content": g.system},
			{"role": "user", "content": "(English) " + req.Question},
		},
	})
	hr, err := http.NewRequestWithContext(ctx, http.MethodPost, g.cfg.upstream+"/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return res, err
	}
	hr.Header.Set("Content-Type", "application/json")
	resp, err := g.client.Do(hr)
	if err != nil {
		return res, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return res, fmt.Errorf("upstream %d: %s", resp.StatusCode, b)
	}
	filter := &linkFilter{allowed: g.links.allowed}
	var answer strings.Builder
	start := time.Now()
	sc := bufio.NewScanner(resp.Body)
	sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for sc.Scan() {
		line := sc.Text()
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		payload := strings.TrimSpace(line[5:])
		if payload == "[DONE]" {
			break
		}
		var ch chatChunk
		if json.Unmarshal([]byte(payload), &ch) != nil {
			continue
		}
		if ch.Timings != nil {
			res.tokens = ch.Timings.PredictedN
			res.tokPerSec = ch.Timings.PredictedPerSecond
		}
		if len(ch.Choices) > 0 && ch.Choices[0].Delta.Content != "" {
			if res.firstTokenMs == 0 {
				res.firstTokenMs = time.Since(start).Milliseconds()
			}
			if safe := filter.push(ch.Choices[0].Delta.Content); safe != "" {
				answer.WriteString(safe)
				emit(safe)
			}
		}
	}
	if safe := filter.flush(); safe != "" {
		answer.WriteString(safe)
		emit(safe)
	}
	res.answer = strings.TrimSpace(answer.String())
	if err := sc.Err(); err != nil && ctx.Err() == nil {
		return res, err
	}
	return res, ctx.Err()
}

// warmUp pays the fact-sheet prefill once so the prefix is cached before the first visitor.
func (g *gateway) warmUp() {
	for attempt := 1; ; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		start := time.Now()
		_, err := g.generate(ctx, askRequest{Question: "Hi!", Lang: "en", Intent: "hello"}, func(string) {})
		cancel()
		if err == nil {
			log.Printf("warm: fact sheet cached in %s", time.Since(start).Round(time.Second))
			g.warm.Store(true)
			return
		}
		log.Printf("warm-up attempt %d failed: %v", attempt, err)
		time.Sleep(time.Duration(min(attempt, 12)) * 5 * time.Second)
	}
}

// newGateway loads the prompt files and builds the gateway; it starts nothing.
func newGateway(cfg config) (*gateway, error) {
	facts, err := os.ReadFile(cfg.facts)
	if err != nil {
		return nil, fmt.Errorf("fact sheet: %w", err)
	}
	system := string(facts)
	if ex, err := os.ReadFile(cfg.examples); err == nil {
		system += string(ex)
	} else {
		log.Printf("no examples file: %v", err)
	}
	if err := os.MkdirAll(cfg.logDir, 0o755); err != nil {
		return nil, fmt.Errorf("log dir: %w", err)
	}
	return &gateway{
		cfg:    cfg,
		system: system,
		links:  newLinkFilter(system),
		lim:    newLimiter(),
		qlog:   &qlog{dir: cfg.logDir},
		met:    &metrics{},
		slot:   make(chan struct{}, 1),
		client: &http.Client{Timeout: 10 * time.Minute},
	}, nil
}

// start runs the background work that makes the gateway ready; it never blocks and never crashes the process.
func (g *gateway) start() {
	go g.warmUp()
}

func (g *gateway) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", g.health)
	mux.HandleFunc("/ask", g.ask)
	mux.HandleFunc("/metrics", g.metricsHandler)
	return mux
}

func main() {
	cfg := loadConfig()
	g, err := newGateway(cfg)
	if err != nil {
		log.Fatal(err)
	}
	g.start()
	srv := &http.Server{Addr: cfg.listen, Handler: g.routes(), ReadHeaderTimeout: 10 * time.Second}
	log.Printf("portfolio-ask listening on %s, upstream %s, model %s, origins %v", cfg.listen, cfg.upstream, cfg.modelName, cfg.origins)
	log.Fatal(srv.ListenAndServe())
}
