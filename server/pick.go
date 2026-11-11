// Picked replies: Korean free text gets one of Kyu's written replies from the answer bank, chosen by the
// embedding model (bge-m3) as the entry whose example question is nearest in meaning (docs/adr/0002).
// Nothing here generates text.
package main

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

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
