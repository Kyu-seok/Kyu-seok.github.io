#!/usr/bin/env python3
"""PROTOTYPE final gate: bge-m3 picks from the bank for Kyu's held-out questions. Top match, no threshold.

Usage: python3 gate.py gate.json [--embed http://127.0.0.1:8095]
Pass (fixed 2026-11-12, before the questions were written): at least 13 of 15 correct and every trap correct.
"""
import argparse, json, math, re, sys, urllib.request
from pathlib import Path

HERE = Path(__file__).parent
ap = argparse.ArgumentParser(); ap.add_argument("gate"); ap.add_argument("--embed", default="http://127.0.0.1:8095")
args = ap.parse_args()
src = (HERE / "serve.py").read_text().split("def system_prompt")[0].split("args = ap.parse_args()")[1]
exec(src)  # load_bank()


def embed(texts):
    req = urllib.request.Request(args.embed + "/v1/embeddings", json.dumps({"input": texts, "model": "x"}).encode(), {"Content-Type": "application/json"})
    data = sorted(json.load(urllib.request.urlopen(req, timeout=120))["data"], key=lambda d: d["index"])
    out = []
    for d in data:
        v = d["embedding"]; n = math.sqrt(sum(x * x for x in v)) or 1; out.append([x / n for x in v])
    return out


bank = [e for e in load_bank() if e["examples"]]
ids = {e["id"] for e in load_bank()}
examples = [(e["id"], x) for e in bank for x in e["examples"]]
ev = embed([x for _, x in examples])
gate = json.loads(Path(args.gate).read_text())
bad = [g for g in gate if not set(g["ok"]) <= ids]
if bad:
    sys.exit(f"ids not in the bank: {bad}")
score = traps = trapok = 0
for i, g in enumerate(gate, 1):
    qv = embed([g["q"]])[0]
    best = {}
    for (eid, x), v in zip(examples, ev):
        s = sum(a * b for a, b in zip(qv, v))
        if eid not in best or s > best[eid][0]:
            best[eid] = (s, x)
    (top, (s1, x1)), (second, (s2, _)) = sorted(best.items(), key=lambda kv: -kv[1][0])[:2]
    ok = top in g["ok"]; score += ok
    if g.get("trap"): traps += 1; trapok += ok
    print(f"{i:2} {'✓' if ok else '✗'} {top:<17} {s1:.3f} (2nd {second} {s2:.3f})  want {','.join(g['ok']):<20} {g['q']}")
n = len(gate); need = n - 2
verdict = "PASS" if score >= need and trapok == traps else "FAIL"
print(f"\n{score}/{n} correct (need {need}), traps {trapok}/{traps} (need all) → {verdict}")
