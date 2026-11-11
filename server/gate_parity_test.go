package main

import (
	"encoding/json"
	"os/exec"
	"reflect"
	"testing"
)

// scripts/gate.py re-reads the answer bank in Python so it can run without the gateway. If its reading drifts
// from parseAnswerBank, the gate measures picks /pick would never make. This pins the two together on the real bank.
func TestTheGateScriptReadsTheAnswerBankAsTheGatewayDoes(t *testing.T) {
	const read = `import json, sys; sys.path.insert(0, "scripts"); import gate
print(json.dumps([[k, v] for k, v in gate.load_bank("answers.ko.md").items()], ensure_ascii=False))`
	out, err := exec.Command("python3", "-c", read).Output()
	if err != nil {
		t.Fatalf("python3 scripts/gate.py load_bank: %v", err)
	}
	var py [][2]json.RawMessage
	if err := json.Unmarshal(out, &py); err != nil {
		t.Fatalf("decoding gate.py's bank: %v", err)
	}
	type entry struct {
		ID       string
		Examples []string
	}
	var gotPy []entry
	for _, kv := range py {
		var e entry
		if json.Unmarshal(kv[0], &e.ID) != nil || json.Unmarshal(kv[1], &e.Examples) != nil {
			t.Fatalf("unexpected shape from gate.py: %s", out)
		}
		gotPy = append(gotPy, e)
	}

	bank, err := loadAnswerBank("answers.ko.md")
	if err != nil {
		t.Fatal(err)
	}
	var gotGo []entry
	for _, e := range bank {
		gotGo = append(gotGo, entry{e.id, e.examples})
	}
	if !reflect.DeepEqual(gotPy, gotGo) {
		t.Errorf("gate.py and the gateway read answers.ko.md differently:\n gate.py: %v\n gateway: %v", gotPy, gotGo)
	}
}
