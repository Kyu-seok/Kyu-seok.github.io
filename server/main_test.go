package main

import (
	"net/http"
	"strings"
	"testing"
	"time"
)

const facts = "Email me. Site: https://code-bite.com, source https://github.com/Kyu-seok/CodeBite and https://kyu-seok.github.io/kyu-rios/."

func collect(f *linkFilter, deltas ...string) string {
	var out strings.Builder
	for _, d := range deltas {
		out.WriteString(f.push(d))
	}
	out.WriteString(f.flush())
	return out.String()
}

func TestLinkFilterKeepsFactSheetLinks(t *testing.T) {
	f := newLinkFilter(facts)
	got := collect(f, "See https://code-bite.com/ and ", "https://github.com/Kyu-seok/CodeBite.")
	want := "See https://code-bite.com/ and https://github.com/Kyu-seok/CodeBite."
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}

func TestLinkFilterRemovesUnknownLinks(t *testing.T) {
	f := newLinkFilter(facts)
	got := collect(f, "Visit https://evil.example.com/x today, or www.evil.com.")
	want := "Visit [link removed] today, or [link removed]."
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}

func TestLinkFilterHoldsWordsUntilWhitespaceClosesThem(t *testing.T) {
	f := newLinkFilter(facts)
	var out []string
	for _, d := range []string{"mail ", "https://ev", "il.com/a", " ok"} {
		out = append(out, f.push(d))
	}
	out = append(out, f.flush())
	want := []string{"mail ", "", "", "[link removed] ", "ok"}
	if strings.Join(out, "|") != strings.Join(want, "|") {
		t.Fatalf("got %q, want %q", out, want)
	}
}

func TestLinkFilterCatchesLinkAtEndOfStream(t *testing.T) {
	f := newLinkFilter(facts)
	got := collect(f, "mail me at https://evil.com")
	if got != "mail me at [link removed]" {
		t.Fatalf("got %q", got)
	}
}

func newTestLimiter(start time.Time) (*limiter, *time.Time) {
	now := start
	l := &limiter{m: map[string]*bucket{}, now: func() time.Time { return now }}
	return l, &now
}

func TestLimiterAllowsPerMinuteThenRefuses(t *testing.T) {
	l, now := newTestLimiter(time.Date(2026, 11, 8, 0, 0, 0, 0, time.UTC))
	for i := 0; i < perMinute; i++ {
		if !l.allow("1.1.1.1") {
			t.Fatalf("request %d refused", i+1)
		}
	}
	if l.allow("1.1.1.1") {
		t.Fatal("request over the minute cap was allowed")
	}
	if !l.allow("2.2.2.2") {
		t.Fatal("another IP was refused")
	}
	*now = now.Add(time.Minute)
	if !l.allow("1.1.1.1") {
		t.Fatal("refused after the minute window rolled over")
	}
}

func TestLimiterHourCapHoldsAcrossMinutes(t *testing.T) {
	l, now := newTestLimiter(time.Date(2026, 11, 8, 0, 0, 0, 0, time.UTC))
	for minute := 0; minute < perHour/perMinute; minute++ {
		for i := 0; i < perMinute; i++ {
			if !l.allow("1.1.1.1") {
				t.Fatalf("minute %d request %d refused", minute, i+1)
			}
		}
		*now = now.Add(time.Minute)
	}
	if l.allow("1.1.1.1") {
		t.Fatal("request over the hour cap was allowed in a fresh minute")
	}
	*now = now.Add(time.Hour)
	if !l.allow("1.1.1.1") {
		t.Fatal("refused after the hour window rolled over")
	}
}

func TestClientIPPrefersCloudflareHeader(t *testing.T) {
	r, _ := http.NewRequest(http.MethodPost, "/ask", nil)
	r.RemoteAddr = "10.0.0.1:1234"
	if got := clientIP(r); got != "10.0.0.1" {
		t.Fatalf("remote addr: got %q", got)
	}
	r.Header.Set("X-Forwarded-For", "203.0.113.5, 10.0.0.1")
	if got := clientIP(r); got != "203.0.113.5" {
		t.Fatalf("forwarded: got %q", got)
	}
	r.Header.Set("CF-Connecting-IP", "198.51.100.7")
	if got := clientIP(r); got != "198.51.100.7" {
		t.Fatalf("cloudflare: got %q", got)
	}
}

func TestQuestionLimitShrinksForHangul(t *testing.T) {
	if got := questionLimit("Which editor do you use?"); got != maxQuestionChars {
		t.Fatalf("english: got %d", got)
	}
	if got := questionLimit("어떤 에디터 쓰세요?"); got != maxHangulQuestionChars {
		t.Fatalf("korean: got %d", got)
	}
	if got := questionLimit("Is CodeBite 한국어 only?"); got != maxHangulQuestionChars {
		t.Fatalf("mixed: got %d", got)
	}
}

func TestLangNameAcceptsEnglishAndKoreanOnly(t *testing.T) {
	for lang, want := range map[string]string{"en": "English", "ko": "Korean"} {
		if got, ok := langName(lang); !ok || got != want {
			t.Fatalf("%s: got %q %v", lang, got, ok)
		}
	}
	if _, ok := langName("ja"); ok {
		t.Fatal("ja accepted")
	}
}

func TestOutputTokensShorterForKorean(t *testing.T) {
	if outputTokens("ko") != maxOutputTokensKo || outputTokens("en") != maxOutputTokens {
		t.Fatal("wrong caps")
	}
}
