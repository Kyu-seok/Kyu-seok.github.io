// Picked replies: Korean free text gets one of Kyu's written replies from the answer bank, chosen by the
// embedding model (bge-m3) as the entry whose example question is nearest in meaning (docs/adr/0002).
// Nothing here generates text.
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strings"
	"sync/atomic"
	"time"
)

const (
	// maxPickChars is the Korean question cap, kept until a 60-character measurement says otherwise (#10).
	// The page's cap for questions it sends to /pick must equal this and name it (CODING_STANDARDS.md).
	maxPickChars = 40
	pickTimeout  = 10 * time.Second
	embedBatch   = 16 // example questions per embedding request at startup
)

// picker holds the answer bank and, once the embedding model has answered, one vector per example question.
// It is ready while those vectors exist and the embedding model is answering.
type picker struct {
	bank     []bankEntry
	url      string
	model    string // the embedding model's name, sent with every request (EMBED_MODEL_NAME)
	client   *http.Client
	examples []pickExample
	vectors  atomic.Pointer[[][]float64] // nil until the example questions are embedded
	alive    atomic.Bool                 // the embedding model answered its last request
	wake     chan struct{}               // a failed pick asks the background loop to probe now
}

type pickExample struct {
	entry int // index into bank
	text  string
}

func newPicker(bank []bankEntry, url, model string) *picker {
	p := &picker{bank: bank, url: url, model: model, client: &http.Client{Timeout: 2 * time.Minute}, wake: make(chan struct{}, 1)}
	for i, e := range bank {
		for _, x := range e.examples {
			p.examples = append(p.examples, pickExample{i, x})
		}
	}
	return p
}

func (p *picker) ready() bool { return p.vectors.Load() != nil && p.alive.Load() }

// down records that the embedding model failed a request and wakes the background loop to probe it.
func (p *picker) down(err error) {
	if p.alive.Swap(false) {
		log.Printf("picker: embedding model down: %v", err)
	}
	select {
	case p.wake <- struct{}{}:
	default:
	}
}

// run keeps the picker ready for as long as the gateway lives. It embeds every example question once the
// embedding model answers, then probes the model with one example question: every retry while it is down
// (backing off), every 12 retries while it is up. A probe does not re-embed the examples unless the
// vector size changed (a different model). It never gives up and never crashes the gateway.
func (p *picker) run(retry time.Duration) {
	for failures := 0; ; {
		var err error
		if p.vectors.Load() == nil {
			err = p.prepare()
		} else {
			err = p.probe()
		}
		wait := 12 * retry
		if err != nil {
			failures++
			p.down(err)
			log.Printf("picker attempt %d failed: %v", failures, err)
			wait = time.Duration(min(failures, 12)) * retry
		} else {
			if failures > 0 || !p.alive.Load() {
				log.Printf("picker: embedding model answering")
			}
			failures = 0
			p.alive.Store(true)
		}
		select {
		case <-time.After(wait):
		case <-p.wake:
		}
	}
}

// prepare embeds every example question.
func (p *picker) prepare() error {
	start := time.Now()
	vecs, err := p.embedExamples()
	if err != nil {
		return err
	}
	p.vectors.Store(&vecs)
	log.Printf("picker: %d example questions embedded in %s", len(vecs), time.Since(start).Round(time.Millisecond))
	return nil
}

// probe embeds one example question to check that the embedding model answers with vectors of the size the
// examples have; a different size drops the example vectors so the next round embeds them again.
func (p *picker) probe() error {
	ctx, cancel := context.WithTimeout(context.Background(), pickTimeout)
	defer cancel()
	v, err := p.embed(ctx, []string{p.examples[0].text})
	if err != nil {
		return err
	}
	if vecs := p.vectors.Load(); len(v[0]) != len((*vecs)[0]) {
		p.vectors.Store(nil)
		return fmt.Errorf("embedding size changed: %d, examples %d", len(v[0]), len((*vecs)[0]))
	}
	return nil
}

func (p *picker) embedExamples() ([][]float64, error) {
	var vecs [][]float64
	for i := 0; i < len(p.examples); i += embedBatch {
		var texts []string
		for _, x := range p.examples[i:min(i+embedBatch, len(p.examples))] {
			texts = append(texts, x.text)
		}
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		v, err := p.embed(ctx, texts)
		cancel()
		if err != nil {
			return nil, err
		}
		vecs = append(vecs, v...)
	}
	return vecs, nil
}

// embed asks llama-server (--embedding) for one unit vector per text, in order. bge-m3 takes no query prefix.
func (p *picker) embed(ctx context.Context, texts []string) ([][]float64, error) {
	body, _ := json.Marshal(map[string]any{"input": texts, "model": p.model})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.url+"/v1/embeddings", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := p.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return nil, fmt.Errorf("embedding model %d: %s", resp.StatusCode, b)
	}
	var out struct {
		Data []struct {
			Index     int       `json:"index"`
			Embedding []float64 `json:"embedding"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("embedding model: %w", err)
	}
	if len(out.Data) != len(texts) {
		return nil, fmt.Errorf("embedding model returned %d vectors for %d texts", len(out.Data), len(texts))
	}
	sort.Slice(out.Data, func(i, j int) bool { return out.Data[i].Index < out.Data[j].Index })
	vecs := make([][]float64, len(texts))
	for i, d := range out.Data {
		var n float64
		for _, x := range d.Embedding {
			n += x * x
		}
		if n = math.Sqrt(n); n == 0 {
			return nil, fmt.Errorf("embedding model returned a zero vector")
		}
		vecs[i] = make([]float64, len(d.Embedding))
		for j, x := range d.Embedding {
			vecs[i][j] = x / n
		}
	}
	return vecs, nil
}

// pickResult is the nearest entry and the best-scoring other entry, for the question log.
type pickResult struct {
	entry, runnerUp      *bankEntry
	score, runnerUpScore float64
}

// pick embeds the question and takes the entry of the single nearest example by cosine similarity.
// There is no threshold: scores do not separate "nothing fits" (docs/adr/0002).
func (p *picker) pick(ctx context.Context, question string) (pickResult, error) {
	vecs := p.vectors.Load()
	if vecs == nil {
		return pickResult{}, errEmbeddingDown
	}
	qv, err := p.embed(ctx, []string{question})
	if err != nil {
		if ctx.Err() != context.Canceled { // a visitor who left says nothing about the embedding model
			p.down(err)
		}
		return pickResult{}, fmt.Errorf("%w: %v", errEmbeddingDown, err)
	}
	best := make([]float64, len(p.bank))
	for i := range best {
		best[i] = math.Inf(-1)
	}
	for i, ev := range *vecs {
		if len(ev) != len(qv[0]) {
			p.down(fmt.Errorf("embedding size changed: %d, examples %d", len(qv[0]), len(ev)))
			return pickResult{}, errEmbeddingDown
		}
		var s float64
		for j := range ev {
			s += ev[j] * qv[0][j]
		}
		if e := p.examples[i].entry; s > best[e] {
			best[e] = s
		}
	}
	var res pickResult
	first, second := -1, -1
	for i, s := range best {
		switch {
		case first < 0 || s > best[first]:
			first, second = i, first
		case second < 0 || s > best[second]:
			second = i
		}
	}
	res.entry, res.score = &p.bank[first], round4(best[first])
	if second >= 0 {
		res.runnerUp, res.runnerUpScore = &p.bank[second], round4(best[second])
	}
	return res, nil
}

func round4(x float64) float64 { return math.Round(x*1e4) / 1e4 }

// errEmbeddingDown means the embedding model did not answer, or not with vectors the examples can be compared to.
var errEmbeddingDown = errors.New("embedding model down")

type pickRequest struct {
	Question string `json:"question"`
	Lang     string `json:"lang"`   // page language, logged only
	Intent   string `json:"intent"` // the keyword matcher's intent, logged only
}

// pickHandler answers POST /pick with a picked reply. It does not take the generation lock: the embedding
// model is its own process, and a pick takes well under a second.
func (g *gateway) pickHandler(w http.ResponseWriter, r *http.Request) {
	if !g.cors(w, r) {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	var req pickRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, 4096)).Decode(&req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	req.Question = strings.TrimSpace(req.Question)
	if req.Question == "" || len([]rune(req.Question)) > maxPickChars {
		http.Error(w, fmt.Sprintf("question must be 1 to %d characters", maxPickChars), http.StatusBadRequest)
		return
	}
	if !hasHangul(req.Question) {
		http.Error(w, "only Korean questions are picked", http.StatusUnprocessableEntity)
		return
	}
	if req.Intent == "" {
		req.Intent = "unknown"
	}
	entry := logEntry{At: time.Now().UTC().Format(time.RFC3339), Lang: req.Lang, Intent: req.Intent, Question: req.Question, Model: g.cfg.embedModel}
	fail := func(outcome string, status int, msg string) {
		g.refuse(w, &g.met.picks, entry, outcome, status, msg)
	}
	if !g.pk.ready() {
		fail("not_ready", http.StatusServiceUnavailable, "embedding model not ready")
		return
	}
	if !g.allowed(r) {
		fail("rate_limited", http.StatusTooManyRequests, rateLimitedMsg)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), pickTimeout)
	defer cancel()
	start := time.Now()
	res, err := g.pk.pick(ctx, req.Question)
	elapsed := time.Since(start)
	if err != nil { // every pick error is errEmbeddingDown
		if r.Context().Err() != nil {
			fail("client_gone", http.StatusRequestTimeout, "client gone")
			return
		}
		log.Printf("pick: %v", err)
		fail("not_ready", http.StatusServiceUnavailable, "embedding model did not answer")
		return
	}
	entry.Outcome = "ok"
	entry.Answer = res.entry.reply
	entry.TotalMs = elapsed.Milliseconds()
	entry.Pick, entry.PickScore = res.entry.id, &res.score
	if res.runnerUp != nil {
		entry.RunnerUp, entry.RunnerUpScore = res.runnerUp.id, &res.runnerUpScore
	}
	g.qlog.write(entry)
	g.met.picks.inc("ok")
	g.met.pickLatency.observe(elapsed)
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	json.NewEncoder(w).Encode(map[string]any{
		"id": res.entry.id, "text": res.entry.reply, "card": res.entry.card,
		"score": res.score, "ms": elapsed.Milliseconds(), "model": g.cfg.embedModel,
	})
}

// bankEntry is one answer bank entry: Kyu's reply, the questions it answers, and the card it carries.
type bankEntry struct {
	id       string
	card     string
	examples []string
	reply    string
}

var (
	headingRe  = regexp.MustCompile(`^## ([a-z0-9_]+) \[([^\]]*)\]$`)
	knownCards = map[string]bool{
		"": true, "me": true, "skills": true, "fun": true, "contact": true, "how": true,
		"project:codebite": true, "project:kyu-rious": true, "project:vimtext": true, "project:wedding-ledger": true,
	}
)

// loadAnswerBank reads and validates the answer bank; any error means the gateway must not start.
func loadAnswerBank(path string) ([]bankEntry, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("answer bank: %w", err)
	}
	bank, err := parseAnswerBank(string(b))
	if err != nil {
		return nil, fmt.Errorf("answer bank %s: %w", path, err)
	}
	return bank, nil
}

func parseAnswerBank(text string) ([]bankEntry, error) {
	var bank []bankEntry
	var replies []string
	closeEntry := func() {
		if len(bank) > 0 {
			bank[len(bank)-1].reply = strings.Join(replies, " ")
		}
		replies = nil
	}
	for n, line := range strings.Split(text, "\n") {
		line = strings.TrimRight(line, " \t\r")
		switch {
		case strings.HasPrefix(line, "## "):
			m := headingRe.FindStringSubmatch(line)
			if m == nil {
				return nil, fmt.Errorf("line %d: want `## <id> [<card>]`, got %q", n+1, line)
			}
			closeEntry()
			bank = append(bank, bankEntry{id: m[1], card: m[2]})
		case len(bank) == 0 || line == "":
			// The preamble before the first entry, and blank lines, are for people.
		case strings.HasPrefix(line, "- "):
			if len(replies) > 0 {
				return nil, fmt.Errorf("line %d: example question after the reply in %q", n+1, bank[len(bank)-1].id)
			}
			e := &bank[len(bank)-1]
			e.examples = append(e.examples, strings.TrimSpace(line[2:]))
		case strings.HasPrefix(line, "> "):
			replies = append(replies, strings.TrimSpace(line[2:]))
		default:
			return nil, fmt.Errorf("line %d: want `- ` example or `> ` reply, got %q", n+1, line)
		}
	}
	closeEntry()

	seen := map[string]bool{}
	for _, e := range bank {
		switch {
		case seen[e.id]:
			return nil, fmt.Errorf("duplicate id %q", e.id)
		case !knownCards[e.card]:
			return nil, fmt.Errorf("%q: unknown card %q", e.id, e.card)
		case len(e.examples) < 2:
			return nil, fmt.Errorf("%q: %d example question(s), want at least 2", e.id, len(e.examples))
		case e.reply == "":
			return nil, fmt.Errorf("%q: no reply", e.id)
		}
		seen[e.id] = true
	}
	if !seen["followup"] {
		return nil, fmt.Errorf("no `followup` entry")
	}
	return bank, nil
}
