package main

import (
	"os"
	"path/filepath"
	"strings"
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
