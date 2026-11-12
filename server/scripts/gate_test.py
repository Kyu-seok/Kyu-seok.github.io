#!/usr/bin/env python3
"""Tests for gate.py, driven the way Kyu runs it: the command, a bank file, fixture files and an embedding
server, asserting only on what it prints and its exit code. The embedding server is a fake that returns fixed
vectors keyed by text, so the nearest entry is known in advance.

Usage (from server/): python3 scripts/gate_test.py   (runs in CI; the gate itself needs the live bge-m3 and does not)
"""
import hashlib
import http.server
import json
import pathlib
import subprocess
import sys
import tempfile
import threading
import unittest

SCRIPTS = pathlib.Path(__file__).resolve().parent
SERVER = SCRIPTS.parent


class FakeEmbed:
    """llama-server's /v1/embeddings, answering from a table; unknown texts get a 500 unless hashed=True."""

    def __init__(self, table, hashed=False):
        self.table = table
        self.hashed = hashed
        fake = self

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                try:
                    data = [{"index": i, "embedding": fake.vector(t)} for i, t in enumerate(body["input"])]
                except KeyError as e:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(f"no vector for {e}".encode())
                    return
                data.reverse()  # llama-server does not promise order; the index field does
                out = json.dumps({"data": data}).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(out)))
                self.end_headers()
                self.wfile.write(out)

            def log_message(self, *args):
                pass

        self.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}"

    def vector(self, text):
        if text in self.table:
            return self.table[text]
        if self.hashed:
            return [b - 128 for b in hashlib.sha256(text.encode()).digest()[:8]]
        raise KeyError(text)

    def close(self):
        self.server.shutdown()
        self.server.server_close()


def bank_md(entries):
    """entries: {id: [example, ...]} → an answer bank file."""
    out = ["# Answer bank (test)", ""]
    for eid, examples in entries.items():
        out.append(f"## {eid} []")
        out += [f"- {x}" for x in examples]
        out += [f"> reply for {eid}", ""]
    return "\n".join(out)


# Three entries on three axes. A question's vector leans toward the entry it should land on.
AXES = {"intro": [1, 0, 0], "decline_code": [0, 1, 0], "followup": [0, 0, 1]}
BANK = {
    "intro": ["자기소개 해 주세요", "누구세요?"],
    "decline_code": ["코드 짜 주세요", "숙제 풀어 주세요"],
    "followup": ["더 자세히", "그거 말고"],
}
EXAMPLE_VECTORS = {x: AXES[eid] for eid, xs in BANK.items() for x in xs}


def toward(eid, runner_up, lean=0.2):
    """A question vector nearest to eid, with runner_up second."""
    return [a + lean * b for a, b in zip(AXES[eid], AXES[runner_up])]


def gate_questions(wrong=0, trap_wrong=False):
    """15 gate questions, 5 of them traps; `wrong` ordinary ones and optionally one trap are labelled so the
    fake's pick misses them."""
    qs, vectors = [], {}
    for i in range(15):
        q = f"질문 {i}"
        trap = i >= 10
        target = "decline_code" if trap else "intro"
        vectors[q] = toward(target, "followup")
        want = target
        if (not trap and i < wrong) or (trap and trap_wrong and i == 10):
            want = "followup"
        g = {"q": q, "ok": [want]}
        if trap:
            g["trap"] = True
        qs.append(g)
    return qs, vectors


class Gate(unittest.TestCase):
    def run_gate(self, bank, gate, dev, table, hashed=False):
        fake = FakeEmbed(table, hashed)
        self.addCleanup(fake.close)
        tmp = pathlib.Path(tempfile.mkdtemp())
        paths = []
        for name, content in (("bank.md", bank), ("gate.json", gate), ("dev.json", dev)):
            if not isinstance(content, str):
                content = json.dumps(content, ensure_ascii=False)
            (tmp / name).write_text(content)
            paths.append(str(tmp / name))
        r = subprocess.run(
            [sys.executable, str(SCRIPTS / "gate.py"), "--embed", fake.url,
             "--bank", paths[0], "--gate", paths[1], "--dev", paths[2]],
            capture_output=True, text=True, timeout=60)
        return r.returncode, r.stdout + r.stderr

    def test_passes_when_every_gate_question_lands(self):
        gate, vectors = gate_questions()
        code, out = self.run_gate(bank_md(BANK), gate, [], {**EXAMPLE_VECTORS, **vectors})
        self.assertEqual(code, 0, out)
        self.assertIn("gate 15/15 (need 13), traps 5/5 (need all): PASS", out)

    def test_prints_each_pick_with_its_score_and_runner_up(self):
        gate, vectors = gate_questions()
        code, out = self.run_gate(bank_md(BANK), gate, [], {**EXAMPLE_VECTORS, **vectors})
        # 질문 0 leans [1, 0, 0.2]: cosine 1/sqrt(1.04) = 0.981 to intro, 0.2/sqrt(1.04) = 0.196 to followup.
        line = next(ln for ln in out.splitlines() if ln.endswith("질문 0"))
        self.assertRegex(line, r"intro\s+0\.981\s+\(2nd followup 0\.196\)")

    def test_fails_at_12_of_15(self):
        gate, vectors = gate_questions(wrong=3)
        code, out = self.run_gate(bank_md(BANK), gate, [], {**EXAMPLE_VECTORS, **vectors})
        self.assertEqual(code, 1, out)
        self.assertIn("gate 12/15 (need 13), traps 5/5 (need all): FAIL", out)

    def test_passes_at_13_of_15(self):
        gate, vectors = gate_questions(wrong=2)
        code, out = self.run_gate(bank_md(BANK), gate, [], {**EXAMPLE_VECTORS, **vectors})
        self.assertEqual(code, 0, out)
        self.assertIn("gate 13/15 (need 13), traps 5/5 (need all): PASS", out)

    def test_fails_on_one_missed_trap_even_at_14_of_15(self):
        gate, vectors = gate_questions(trap_wrong=True)
        code, out = self.run_gate(bank_md(BANK), gate, [], {**EXAMPLE_VECTORS, **vectors})
        self.assertEqual(code, 1, out)
        self.assertIn("gate 14/15 (need 13), traps 4/5 (need all): FAIL", out)

    def test_gate_naming_an_id_the_bank_lacks_gives_no_verdict(self):
        gate, vectors = gate_questions()
        gate[3]["ok"] = ["intro", "none"]
        code, out = self.run_gate(bank_md(BANK), gate, [], {**EXAMPLE_VECTORS, **vectors})
        self.assertEqual(code, 2, out)
        self.assertIn("gate.json: 질문 3 accepts `none`, which is not in the bank", out)
        self.assertNotIn("PASS", out)
        self.assertNotIn("FAIL", out)

    def test_gate_must_have_15_questions(self):
        gate, vectors = gate_questions()
        code, out = self.run_gate(bank_md(BANK), gate[:14], [], {**EXAMPLE_VECTORS, **vectors})
        self.assertEqual(code, 2, out)
        self.assertIn("14 questions, the pass line is for 15", out)

    def test_dev_score_is_shown_apart_from_the_verdict(self):
        gate, vectors = gate_questions()
        dev = [{"q": "개발 질문 1", "ok": ["intro"]}, {"q": "개발 질문 2", "ok": ["followup"]}]
        vectors.update({"개발 질문 1": toward("intro", "followup"), "개발 질문 2": toward("intro", "followup")})
        code, out = self.run_gate(bank_md(BANK), gate, dev, {**EXAMPLE_VECTORS, **vectors})
        self.assertEqual(code, 0, out)
        self.assertIn("dev 1/2, traps 0/0 (information only; the bank was tuned on these)", out)
        self.assertLess(out.index("dev 1/2"), out.index("PASS"))  # the verdict is the last word

    def test_dev_ids_the_bank_lacks_are_reported_and_not_counted(self):
        gate, vectors = gate_questions()
        dev = [
            {"q": "개발 질문 1", "ok": ["intro", "none"]},  # scored against intro only
            {"q": "개발 질문 2", "ok": ["none"]},  # nothing left to score against
        ]
        vectors.update({"개발 질문 1": toward("intro", "followup"), "개발 질문 2": toward("intro", "followup")})
        code, out = self.run_gate(bank_md(BANK), gate, dev, {**EXAMPLE_VECTORS, **vectors})
        self.assertEqual(code, 0, out)
        self.assertIn("dev.json: 개발 질문 1 accepts `none`, which is not in the bank; scored on the rest", out)
        self.assertIn("dev.json: 개발 질문 2 accepts `none`, which is not in the bank; not scored", out)
        self.assertIn("dev 1/1, traps 0/0 (information only; the bank was tuned on these), 1 not scored", out)

    def test_unreachable_embedding_model_gives_no_verdict(self):
        gate, vectors = gate_questions()
        code, out = self.run_gate(bank_md(BANK), gate, [], {})  # the fake knows no text: 500 on the first call
        self.assertEqual(code, 2, out)
        self.assertIn("no verdict: embedding model at http://127.0.0.1:", out)

    def test_real_bank_and_fixtures_are_read_whole(self):
        """The shipped bank and fixtures, with arbitrary vectors: checks reading and ids, not pick quality."""
        bank = (SERVER / "answers.ko.md").read_text()
        gate = (SCRIPTS / "gate/gate.json").read_text()
        dev = (SCRIPTS / "gate/dev.json").read_text()
        code, out = self.run_gate(bank, gate, dev, {}, hashed=True)
        self.assertIn(code, (0, 1), out)
        self.assertIn("Dev (28 practice questions", out)
        self.assertIn("Gate (15 held-out questions)", out)
        # The prototype's bank had a `none` entry; the real bank dropped it (docs/adr/0002).
        self.assertIn("dev.json: 오늘 서울 날씨 어때요? accepts `none`, which is not in the bank; scored on the rest", out)
        self.assertIn("dev.json: 그중 하나만 알려줘 accepts `none`, which is not in the bank; scored on the rest", out)
        self.assertNotIn("gate.json:", out)


class GateFixture(unittest.TestCase):
    # sha256 of the 15 held-out questions as written blind on 2026-11-12 (prototype/ko-picker, 01780f1). The gate
    # only means something if they are never fitted to the bank, so changing this hash is a decision for its own PR,
    # not a side effect of a bank edit.
    PINNED = "5f1eb40fbf750c2deb63efe45a208b067d424fcce13183fc5dbb9bb1ff75a08d"

    def test_gate_questions_are_the_ones_written_blind(self):
        got = hashlib.sha256((SCRIPTS / "gate/gate.json").read_bytes()).hexdigest()
        self.assertEqual(got, self.PINNED, "gate/gate.json changed; the gate questions are pinned (docs/adr/0002)")


if __name__ == "__main__":
    unittest.main()
