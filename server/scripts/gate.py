#!/usr/bin/env python3
"""The gate: do the answer bank's picks still land? Run it whenever the bank's example questions change.

Embeds every example question in answers.ko.md and each fixture question with the live bge-m3, and picks the way
pick.go does: the entry of the single nearest example by cosine similarity, no prefix, no threshold.

- gate/gate.json: 15 held-out questions written by an agent that never saw the bank (spike/picker on branch
  prototype/ko-picker). Never edit them to fit the bank. Pass: at least 13 of 15 and every trap.
- gate/dev.json: the 28 practice questions the bank was tuned on. Shown for information; not part of the verdict.

Usage (from server/), with bge-m3 reachable at --embed:
  ssh -N -L 8096:172.17.0.1:8096 mini &     # from a laptop; on the box itself use --embed http://172.17.0.1:8096
  python3 scripts/gate.py
Exit: 0 PASS, 1 FAIL, 2 no verdict (a fixture names an id the bank does not have, or the bank or model failed).
Tests: python3 scripts/gate_test.py (a fake embedding server; not in CI).
"""
import argparse
import json
import math
import pathlib
import re
import sys
import urllib.error
import urllib.request

SERVER = pathlib.Path(__file__).resolve().parent.parent
GATE_SIZE, GATE_NEED = 15, 13  # fixed 2026-11-12, before the gate questions were written
HEADING = re.compile(r"^## ([a-z0-9_]+) \[([^\]]*)\]$")


class NoVerdict(Exception):
    pass


def load_bank(path):
    """{id: [example question, ...]} in file order, read as pick.go's parseAnswerBank reads it."""
    bank, current = {}, None
    for n, line in enumerate(pathlib.Path(path).read_text().split("\n"), 1):
        line = line.rstrip(" \t\r")
        if line.startswith("## "):
            m = HEADING.match(line)
            if not m:
                raise NoVerdict(f"{path} line {n}: want `## <id> [<card>]`, got {line!r}")
            current = m.group(1)
            if current in bank:
                raise NoVerdict(f"{path}: duplicate id {current!r}")
            bank[current] = []
        elif current and line.startswith("- "):
            bank[current].append(line[2:].strip())
    if not bank:
        raise NoVerdict(f"{path}: no entries")
    return bank


def embed(url, texts):
    """One unit vector per text, in order, from llama-server's /v1/embeddings."""
    out = []
    for i in range(0, len(texts), 16):
        batch = texts[i:i + 16]
        req = urllib.request.Request(url + "/v1/embeddings", json.dumps({"input": batch, "model": "bge-m3"}).encode(),
                                     {"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)["data"]
        except (urllib.error.URLError, OSError, ValueError, KeyError) as e:
            raise NoVerdict(f"embedding model at {url}: {e}")
        if len(data) != len(batch):
            raise NoVerdict(f"embedding model returned {len(data)} vectors for {len(batch)} texts")
        for d in sorted(data, key=lambda d: d["index"]):
            n = math.sqrt(sum(x * x for x in d["embedding"]))
            if n == 0:
                raise NoVerdict("embedding model returned a zero vector")
            out.append([x / n for x in d["embedding"]])
    return out


class Picker:
    def __init__(self, url, bank):
        self.url = url
        self.examples = [(eid, x) for eid, xs in bank.items() for x in xs]
        self.vectors = embed(url, [x for _, x in self.examples])

    def pick(self, question):
        """[(id, score), ...] best first: each entry scored by its nearest example."""
        qv = embed(self.url, [question])[0]
        best = {}
        for (eid, _), v in zip(self.examples, self.vectors):
            s = sum(a * b for a, b in zip(qv, v))
            if eid not in best or s > best[eid]:
                best[eid] = s
        return sorted(best.items(), key=lambda kv: -kv[1])


def unknown_ids(name, questions, bank):
    """One line per accepted id the bank does not have, so a renamed or dropped entry is never scored silently."""
    lines = []
    for g in questions:
        for eid in g["ok"]:
            if eid not in bank:
                rest = "scored on the rest" if any(x in bank for x in g["ok"]) else "not scored"
                lines.append(f"{name}: {g['q']} accepts `{eid}`, which is not in the bank; {rest}")
    return lines


def run_set(picker, questions, bank):
    """Prints one line per question; returns (correct, scored, traps, traps correct). A question none of whose
    accepted ids is in the bank is printed but not scored."""
    correct = scored = traps = traps_ok = 0
    for i, g in enumerate(questions, 1):
        ranked = picker.pick(g["q"])
        (top, s1), rest = ranked[0], ranked[1:]
        want = [eid for eid in g["ok"] if eid in bank]
        ok = top in want
        if want:
            scored += 1
            correct += ok
            if g.get("trap"):
                traps += 1
                traps_ok += ok
        mark = ("ok  " if ok else "MISS") if want else "--  "
        second = f"{rest[0][0]} {rest[0][1]:.3f}" if rest else "-"
        print(f"{i:2} {mark} {top:<17} {s1:.3f}  (2nd {second})  "
              f"want {','.join(g['ok'])}{' [trap]' if g.get('trap') else ''}  {g['q']}")
    return correct, scored, traps, traps_ok


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--embed", default="http://127.0.0.1:8096", help="bge-m3 llama-server (default: SSH tunnel)")
    ap.add_argument("--bank", default=str(SERVER / "answers.ko.md"))
    ap.add_argument("--gate", default=str(SERVER / "scripts/gate/gate.json"))
    ap.add_argument("--dev", default=str(SERVER / "scripts/gate/dev.json"))
    args = ap.parse_args()

    bank = load_bank(args.bank)
    gate = json.loads(pathlib.Path(args.gate).read_text())
    dev = json.loads(pathlib.Path(args.dev).read_text())
    if len(gate) != GATE_SIZE:
        raise NoVerdict(f"{args.gate}: {len(gate)} questions, the pass line is for {GATE_SIZE}")
    bad = unknown_ids(pathlib.Path(args.gate).name, gate, bank)
    if bad:
        raise NoVerdict("the gate questions are fixed; the bank must keep the ids they accept:\n  " + "\n  ".join(bad))
    for line in unknown_ids(pathlib.Path(args.dev).name, dev, bank):
        print(line)
    picker = Picker(args.embed, bank)

    if dev:
        print(f"\nDev ({len(dev)} practice questions the bank was tuned on)")
        dev_result = run_set(picker, dev, bank)
    print(f"\nGate ({len(gate)} held-out questions)")
    correct, _, traps, traps_ok = run_set(picker, gate, bank)
    passed = correct >= GATE_NEED and traps_ok == traps

    print()
    if dev:
        d_correct, d_scored, d_traps, d_traps_ok = dev_result
        skipped = f", {len(dev) - d_scored} not scored" if d_scored < len(dev) else ""
        print(f"dev {d_correct}/{d_scored}, traps {d_traps_ok}/{d_traps} "
              f"(information only; the bank was tuned on these){skipped}")
    print(f"gate {correct}/{len(gate)} (need {GATE_NEED}), traps {traps_ok}/{traps} (need all): "
          f"{'PASS' if passed else 'FAIL'}")
    return 0 if passed else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except NoVerdict as e:
        print(f"\nno verdict: {e}", file=sys.stderr)
        sys.exit(2)
