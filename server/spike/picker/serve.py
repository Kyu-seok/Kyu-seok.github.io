#!/usr/bin/env python3
"""PROTOTYPE, throwaway: does Qwen3-1.7B pick the right Korean answer id when only allowed to output an id?

Usage: python3 serve.py [--llama http://127.0.0.1:8092] [--port 8093]   then open http://localhost:8093
Stdlib only. The bank is re-read on every request, so edit PROTOTYPE-bank.ko.md and just ask again.
"""
import argparse, json, re, time, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).parent
ap = argparse.ArgumentParser()
ap.add_argument("--llama", default="http://127.0.0.1:8092")
ap.add_argument("--port", type=int, default=8093)
args = ap.parse_args()


def load_bank():
    entries, cur = [], None
    for line in (HERE / "PROTOTYPE-bank.ko.md").read_text().splitlines():
        m = re.match(r"^## (\w+)\s*\[(.*?)\]", line)
        if m:
            cur = {"id": m[1], "card": m[2], "examples": [], "reply": ""}
            entries.append(cur)
        elif cur and line.startswith("- "):
            cur["examples"].append(line[2:].strip())
        elif cur and line.startswith("> "):
            cur["reply"] += line[2:].strip()
    return entries


def system_prompt(bank):
    lines = [
        "You route a visitor's Korean question to one answer id.",
        "Each line below is an id followed by example questions that id answers.",
        "Pick the id whose examples mean the same thing as the visitor's question.",
        "If no id fits, pick none. Output only the id.",
        "",
    ]
    lines += [f"{e['id']}: " + " | ".join(e["examples"]) for e in bank if e["examples"]]
    lines.append("none: (nothing above fits)")
    return "\n".join(lines)


def pick(question):
    bank = load_bank()
    ids = [e["id"] for e in bank]
    grammar = "root ::= " + " | ".join(f'"{i}"' for i in ids)
    body = {
        "model": "x", "stream": False, "max_tokens": 12, "temperature": 0, "cache_prompt": True,
        "chat_template_kwargs": {"enable_thinking": False},
        "grammar": grammar,
        "messages": [{"role": "system", "content": system_prompt(bank)}, {"role": "user", "content": question}],
    }
    req = urllib.request.Request(args.llama + "/v1/chat/completions", json.dumps(body).encode(), {"Content-Type": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=120) as r:
        res = json.load(r)
    wall = time.time() - t0
    pid = res["choices"][0]["message"]["content"].strip()
    entry = next((e for e in bank if e["id"] == pid), None)
    t = res.get("timings", {})
    return {
        "id": pid, "reply": entry["reply"] if entry else "(id not in bank?)", "card": entry["card"] if entry else "",
        "wall_ms": round(wall * 1000), "prompt_n": t.get("prompt_n"), "prompt_ms": round(t.get("prompt_ms", 0)),
        "predicted_n": t.get("predicted_n"), "predicted_ms": round(t.get("predicted_ms", 0)),
    }


class H(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json"):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code); self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)

    def do_GET(self):
        if self.path == "/":
            return self._send(200, (HERE / "index.html").read_bytes(), "text/html")
        if self.path == "/state":
            bank = load_bank()
            return self._send(200, {"bank": bank, "tests": json.loads((HERE / "tests.json").read_text()),
                                    "prompt": system_prompt(bank), "llama": args.llama})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/pick":
            return self._send(404, {"error": "not found"})
        q = json.loads(self.rfile.read(int(self.headers["Content-Length"])))["q"]
        try:
            self._send(200, pick(q))
        except Exception as e:  # prototype: surface it, don't handle it
            self._send(502, {"error": f"{type(e).__name__}: {e}"})

    def log_message(self, *a):
        pass


print(f"PROTOTYPE ko-picker on http://localhost:{args.port}  (model: {args.llama})")
ThreadingHTTPServer(("127.0.0.1", args.port), H).serve_forever()
