package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

// testConfig is the startup config with the real fact sheet and the given answer bank file.
func testConfig(t *testing.T, bank string) config {
	t.Helper()
	return config{
		listen:     ":0",
		upstream:   "http://127.0.0.1:1",
		modelName:  "Qwen3-1.7B",
		facts:      "facts.en.md",
		examples:   "examples.en.md",
		answers:    bank,
		embedURL:   "http://127.0.0.1:1",
		embedModel: "bge-m3",
		logDir:     t.TempDir(),
		origins:    map[string]bool{},
		timeoutUps: time.Second,
		pickRetry:  10 * time.Millisecond,
	}
}

func writeBank(t *testing.T, text string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "answers.ko.md")
	if err := os.WriteFile(path, []byte(text), 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestTheRealAnswerBankLoadsAtStartup(t *testing.T) {
	if _, err := newGateway(testConfig(t, "answers.ko.md")); err != nil {
		t.Fatalf("real answer bank refused: %v", err)
	}
}

const followupEntry = `
## followup []
- 그거 더 알려줘
- 아까 그거 뭐였죠?
> 이 채팅은 앞선 대화를 기억하지 못합니다.
`

func TestAMalformedAnswerBankStopsStartup(t *testing.T) {
	cases := map[string]string{
		"duplicate id": `
## editor [skills]
- 에디터 뭐 써요?
- Vim 쓰세요?
> 매일 Vim을 씁니다.

## editor [skills]
- IDE는 뭐 써요?
- 개발 도구 뭐 써요?
> Claude Code도 씁니다.
` + followupEntry,
		"unknown card": `
## editor [tools]
- 에디터 뭐 써요?
- Vim 쓰세요?
> 매일 Vim을 씁니다.
` + followupEntry,
		"unknown project card": `
## editor [project:emacs]
- 에디터 뭐 써요?
- Vim 쓰세요?
> 매일 Vim을 씁니다.
` + followupEntry,
		"single example": `
## editor [skills]
- 에디터 뭐 써요?
> 매일 Vim을 씁니다.
` + followupEntry,
		"no followup": `
## editor [skills]
- 에디터 뭐 써요?
- Vim 쓰세요?
> 매일 Vim을 씁니다.
`,
		"no reply": `
## editor [skills]
- 에디터 뭐 써요?
- Vim 쓰세요?
` + followupEntry,
		"malformed heading": `
## editor skills
- 에디터 뭐 써요?
- Vim 쓰세요?
> 매일 Vim을 씁니다.
` + followupEntry,
	}
	for name, text := range cases {
		t.Run(name, func(t *testing.T) {
			_, err := newGateway(testConfig(t, writeBank(t, text)))
			if err == nil {
				t.Fatal("gateway built from a malformed answer bank")
			}
			if !strings.Contains(err.Error(), "answer bank") {
				t.Fatalf("error does not name the answer bank: %v", err)
			}
		})
	}
}

func TestAMissingAnswerBankStopsStartup(t *testing.T) {
	if _, err := newGateway(testConfig(t, filepath.Join(t.TempDir(), "nope.md"))); err == nil {
		t.Fatal("gateway built without an answer bank")
	}
}

// ---- Seam 1: POST /pick over HTTP, with a fake embedding server ----

// pickBank is a small answer bank whose example questions have fixed vectors in fakeVectors.
const pickBank = `# test bank
## editor [skills]
- 에디터 뭐 써요?
- Vim 쓰세요?
> 매일 Vim과 Claude Code를 씁니다.

## codebite [project:codebite]
- CodeBite는 뭐예요?
- 코드바이트 소개해 주세요
> CodeBite는 한국어 알고리즘 연습 플랫폼입니다.
> 미니 PC 한 대에서 돌아갑니다.

## followup []
- 그거 더 알려줘
- 아까 그거 뭐였죠?
> 이 채팅은 앞선 대화를 기억하지 못합니다.
`

// fakeVectors fixes every embedding, so the nearest entry and its cosine score are known in advance.
// Questions are deliberately not unit length: the gateway must normalize what the embedding model returns.
var fakeVectors = map[string][]float64{
	"에디터 뭐 써요?":      {1, 0, 0},
	"Vim 쓰세요?":       {0.8, 0.6, 0},
	"CodeBite는 뭐예요?": {0, 1, 0},
	"코드바이트 소개해 주세요":  {0, 0.6, 0.8},
	"그거 더 알려줘":       {0, 0, 1},
	"아까 그거 뭐였죠?":     {0.6, 0, 0.8},
	"빔 쓰시나요?":        {1.2, 1.6, 0}, // cos: editor 0.96 (Vim 쓰세요?), codebite 0.8, followup 0.36
	"코드바이트가 뭐야":      {0, 0.3, 0.4}, // cos: codebite 1.0, followup 0.8, editor 0.36
}

type fakeEmbed struct {
	srv  *httptest.Server
	down atomic.Bool
}

func newFakeEmbed(t *testing.T) *fakeEmbed {
	f := &fakeEmbed{}
	f.srv = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if f.down.Load() || r.URL.Path != "/v1/embeddings" {
			http.Error(w, "loading model", http.StatusServiceUnavailable)
			return
		}
		var req struct {
			Input []string `json:"input"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		type item struct {
			Index     int       `json:"index"`
			Embedding []float64 `json:"embedding"`
		}
		var data []item
		for i := len(req.Input) - 1; i >= 0; i-- { // out of order: the gateway must sort by index
			v, ok := fakeVectors[req.Input[i]]
			if !ok {
				http.Error(w, "no fake vector for "+req.Input[i], http.StatusInternalServerError)
				return
			}
			data = append(data, item{i, v})
		}
		json.NewEncoder(w).Encode(map[string]any{"data": data})
	}))
	t.Cleanup(f.srv.Close)
	return f
}

// fakeLlama answers every chat completion with one streamed word, so the gateway warms up.
func fakeLlama(t *testing.T) *httptest.Server {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		fmt.Fprint(w, "data: {\"choices\":[{\"delta\":{\"content\":\"Hi \"}}]}\n\ndata: [DONE]\n\n")
	}))
	t.Cleanup(srv.Close)
	return srv
}

type running struct {
	url   string
	embed *fakeEmbed
	log   string
}

// startGateway builds the gateway through the startup path and serves its routes.
func startGateway(t *testing.T, embedDown bool) running {
	t.Helper()
	embed := newFakeEmbed(t)
	embed.down.Store(embedDown)
	cfg := testConfig(t, writeBank(t, pickBank))
	cfg.upstream = fakeLlama(t).URL
	cfg.embedURL = embed.srv.URL
	g, err := newGateway(cfg)
	if err != nil {
		t.Fatal(err)
	}
	g.start()
	srv := httptest.NewServer(g.routes())
	t.Cleanup(srv.Close)
	return running{url: srv.URL, embed: embed, log: cfg.logDir}
}

func post(t *testing.T, url, body string) (int, string) {
	t.Helper()
	resp, err := http.Post(url, "application/json", strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, string(b)
}

// eventually retries f until it reports true or two seconds pass.
func eventually(t *testing.T, what string, f func() bool) {
	t.Helper()
	for deadline := time.Now().Add(2 * time.Second); time.Now().Before(deadline); time.Sleep(10 * time.Millisecond) {
		if f() {
			return
		}
	}
	t.Fatalf("timed out waiting for %s", what)
}

type pickReply struct {
	ID    string  `json:"id"`
	Text  string  `json:"text"`
	Card  string  `json:"card"`
	Score float64 `json:"score"`
	Ms    *int64  `json:"ms"`
	Model string  `json:"model"`
}

// pickOK waits for the picker to be ready and returns the reply to one question.
func pickOK(t *testing.T, gw running, question string) pickReply {
	t.Helper()
	var code int
	var body string
	eventually(t, "the picker to be ready", func() bool {
		code, body = post(t, gw.url+"/pick", `{"question":"`+question+`"}`)
		return code != http.StatusServiceUnavailable
	})
	if code != http.StatusOK {
		t.Fatalf("status %d: %s", code, body)
	}
	var got pickReply
	if err := json.Unmarshal([]byte(body), &got); err != nil {
		t.Fatalf("%v: %s", err, body)
	}
	return got
}

func TestPickReturnsTheEntryOfTheNearestExample(t *testing.T) {
	gw := startGateway(t, false)
	got := pickOK(t, gw, "빔 쓰시나요?")
	if got.ID != "editor" || got.Text != "매일 Vim과 Claude Code를 씁니다." || got.Card != "skills" {
		t.Fatalf("got %+v", got)
	}
	if got.Score != 0.96 || got.Model != "bge-m3" || got.Ms == nil {
		t.Fatalf("score/model/ms: %+v", got)
	}
	got = pickOK(t, gw, "코드바이트가 뭐야")
	if got.ID != "codebite" || got.Card != "project:codebite" || got.Score != 1 ||
		got.Text != "CodeBite는 한국어 알고리즘 연습 플랫폼입니다. 미니 PC 한 대에서 돌아갑니다." {
		t.Fatalf("got %+v", got)
	}
}

// logLines returns the question log, one decoded JSON object per line.
func logLines(t *testing.T, gw running) []map[string]any {
	t.Helper()
	files, _ := filepath.Glob(filepath.Join(gw.log, "questions-*.jsonl"))
	var out []map[string]any
	for _, f := range files {
		b, err := os.ReadFile(f)
		if err != nil {
			t.Fatal(err)
		}
		for _, line := range strings.Split(strings.TrimSpace(string(b)), "\n") {
			if line == "" {
				continue
			}
			var m map[string]any
			if err := json.Unmarshal([]byte(line), &m); err != nil {
				t.Fatalf("log line %q: %v", line, err)
			}
			out = append(out, m)
		}
	}
	return out
}

func TestPickRefusesEmptyLongAndNonKoreanQuestions(t *testing.T) {
	gw := startGateway(t, false)
	pickOK(t, gw, "빔 쓰시나요?")
	before := len(logLines(t, gw))
	cases := []struct {
		body string
		want int
	}{
		{`{"question":"   "}`, http.StatusBadRequest},
		{`{"question":"` + strings.Repeat("가", 41) + `"}`, http.StatusBadRequest},
		{`not json`, http.StatusBadRequest},
		{`{"question":"Which editor do you use?"}`, http.StatusUnprocessableEntity},
	}
	for _, c := range cases {
		if code, body := post(t, gw.url+"/pick", c.body); code != c.want {
			t.Errorf("%s: got %d (%s), want %d", c.body, code, body, c.want)
		}
	}
	if n := len(logLines(t, gw)); n != before {
		t.Fatalf("refused input reached the question log: %d lines, want %d", n, before)
	}
}

func TestPickSharesTheRateLimitWithAsk(t *testing.T) {
	gw := startGateway(t, false)
	pickOK(t, gw, "빔 쓰시나요?") // 1
	eventually(t, "the language model to warm up", func() bool {
		resp, err := http.Get(gw.url + "/health")
		if err != nil {
			return false
		}
		defer resp.Body.Close()
		var h map[string]any
		json.NewDecoder(resp.Body).Decode(&h)
		return h["ready"] == true
	})
	for i := 0; i < perMinute/2; i++ { // 2..6
		if code, body := post(t, gw.url+"/ask", `{"question":"Which editor do you use?","lang":"en"}`); code != http.StatusOK {
			t.Fatalf("ask %d: %d %s", i, code, body)
		}
	}
	for i := 1 + perMinute/2; i < perMinute; i++ { // 7..10
		if code, body := post(t, gw.url+"/pick", `{"question":"빔 쓰시나요?"}`); code != http.StatusOK {
			t.Fatalf("pick %d: %d %s", i, code, body)
		}
	}
	if code, _ := post(t, gw.url+"/pick", `{"question":"빔 쓰시나요?"}`); code != http.StatusTooManyRequests {
		t.Fatalf("pick over the shared cap: got %d, want 429", code)
	}
	if code, _ := post(t, gw.url+"/ask", `{"question":"Which editor do you use?","lang":"en"}`); code != http.StatusTooManyRequests {
		t.Fatalf("ask over the shared cap: got %d, want 429", code)
	}
	last := logLines(t, gw)
	if o := last[len(last)-2]; o["outcome"] != "rate_limited" || o["model"] != "bge-m3" {
		t.Fatalf("rate-limited pick logged as %v", o)
	}
}

func health(t *testing.T, gw running) map[string]any {
	t.Helper()
	resp, err := http.Get(gw.url + "/health")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	var h map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&h); err != nil {
		t.Fatal(err)
	}
	return h
}

func TestPickIs503WhileTheEmbeddingModelIsDownAndRecovers(t *testing.T) {
	gw := startGateway(t, true)
	for i := 0; i < 3; i++ {
		if code, _ := post(t, gw.url+"/pick", `{"question":"빔 쓰시나요?"}`); code != http.StatusServiceUnavailable {
			t.Fatalf("down at startup: got %d, want 503", code)
		}
		time.Sleep(20 * time.Millisecond)
	}
	if h := health(t, gw); h["pick_ready"] != false || h["pick_model"] != "bge-m3" {
		t.Fatalf("health while down: %v", h)
	}

	gw.embed.down.Store(false)
	if got := pickOK(t, gw, "빔 쓰시나요?"); got.ID != "editor" {
		t.Fatalf("after recovery: %+v", got)
	}
	if h := health(t, gw); h["pick_ready"] != true {
		t.Fatalf("health after recovery: %v", h)
	}

	gw.embed.down.Store(true)
	if code, _ := post(t, gw.url+"/pick", `{"question":"빔 쓰시나요?"}`); code != http.StatusServiceUnavailable {
		t.Fatalf("down after ready: got %d, want 503", code)
	}
	gw.embed.down.Store(false)
	if code, body := post(t, gw.url+"/pick", `{"question":"빔 쓰시나요?"}`); code != http.StatusOK {
		t.Fatalf("back again: got %d %s", code, body)
	}
}

func TestAPickIsLoggedWithItsScoreAndRunnerUp(t *testing.T) {
	gw := startGateway(t, false)
	eventually(t, "the picker to be ready", func() bool { return health(t, gw)["pick_ready"] == true })
	if code, body := post(t, gw.url+"/pick", `{"question":"빔 쓰시나요?","lang":"ko","intent":"skills"}`); code != http.StatusOK {
		t.Fatalf("%d %s", code, body)
	}
	lines := logLines(t, gw)
	if len(lines) != 1 {
		t.Fatalf("got %d log lines, want 1", len(lines))
	}
	got := lines[0]
	want := map[string]any{
		"question": "빔 쓰시나요?", "lang": "ko", "intent": "skills", "outcome": "ok", "model": "bge-m3",
		"answer": "매일 Vim과 Claude Code를 씁니다.",
		"pick":   "editor", "pick_score": 0.96, "runner_up": "codebite", "runner_up_score": 0.8,
	}
	for k, v := range want {
		if got[k] != v {
			t.Errorf("log %s = %v, want %v", k, got[k], v)
		}
	}
	if _, ok := got["at"]; !ok {
		t.Error("log line has no time")
	}
}

func TestAskStillRefusesHangul(t *testing.T) {
	gw := startGateway(t, false)
	for _, body := range []string{
		`{"question":"어떤 에디터 쓰세요?","lang":"ko","intent":"skills"}`,
		`{"question":"어떤 에디터 쓰세요?","lang":"en"}`,
	} {
		if code, _ := post(t, gw.url+"/ask", body); code != http.StatusUnprocessableEntity {
			t.Errorf("%s: got %d, want 422", body, code)
		}
	}
}

func TestMetricsCountPicksAndTheirLatency(t *testing.T) {
	gw := startGateway(t, false)
	pickOK(t, gw, "빔 쓰시나요?")
	resp, err := http.Get(gw.url + "/metrics")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	for _, want := range []string{
		`portfolio_pick_total{outcome="ok"} 1`,
		`portfolio_pick_seconds_bucket{le="+Inf"} 1`,
		`portfolio_pick_seconds_count 1`,
		`portfolio_pick_ready 1`,
	} {
		if !strings.Contains(string(b), want) {
			t.Errorf("metrics lack %q:\n%s", want, b)
		}
	}
}
