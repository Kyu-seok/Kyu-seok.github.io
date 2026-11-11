#!/usr/bin/env python3
"""PROTOTYPE, throwaway: does a multilingual embedding model pick the right Korean answer id?

Nearest example question by cosine similarity; below the threshold means `none` (the threshold is a slider on
the page, applied in the browser, so you can see every score). Same bank and tests as serve.py.
Usage: python3 serve_embed.py --embed e5=http://127.0.0.1:8094 --embed bge=http://127.0.0.1:8095 [--port 8093]
"""
import argparse, json, math, re, time, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).parent
ap = argparse.ArgumentParser()
ap.add_argument("--embed", action="append", required=True, help="name=url of a llama-server --embedding")
ap.add_argument("--port", type=int, default=8093)
args = ap.parse_args()
MODELS = dict(e.split("=", 1) for e in args.embed)
PREFIX = {"e5": "query: "}  # e5 is trained with "query: " on both sides for symmetric matching
src = (HERE / "serve.py").read_text().split("def system_prompt")[0].split("args = ap.parse_args()")[1]
exec(src)  # load_bank() from serve.py, so both prototypes read the same bank

_cache = {}


def embed(model, texts):
    want = [t for t in texts if (model, t) not in _cache]
    if want:
        body = {"input": [PREFIX.get(model, "") + t for t in want], "model": "x"}
        req = urllib.request.Request(MODELS[model] + "/v1/embeddings", json.dumps(body).encode(), {"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as r:
            data = json.load(r)["data"]
        for t, d in zip(want, sorted(data, key=lambda d: d["index"])):
            v = d["embedding"]; n = math.sqrt(sum(x * x for x in v)) or 1
            _cache[(model, t)] = [x / n for x in v]
    return [_cache[(model, t)] for t in texts]


def pick(model, q):
    bank = [e for e in load_bank() if e["examples"]]
    examples = [(e["id"], x) for e in bank for x in e["examples"]]
    embed(model, [x for _, x in examples])  # cached after the first call
    t0 = time.time()
    qv = embed(model, [q])[0]
    ms = round((time.time() - t0) * 1000)
    best = {}
    for (eid, x), v in zip(examples, embed(model, [x for _, x in examples])):
        s = sum(a * b for a, b in zip(qv, v))
        if eid not in best or s > best[eid][0]:
            best[eid] = (s, x)
    top = sorted(({"id": k, "score": round(s, 4), "example": x} for k, (s, x) in best.items()), key=lambda d: -d["score"])[:5]
    _cache.pop((model, q), None)  # time the question fresh every call
    replies = {e["id"]: e["reply"] for e in load_bank()}
    return {"top": top, "ms": ms, "replies": {d["id"]: replies[d["id"]] for d in top}, "none_reply": replies.get("none", "")}


class H(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json"):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code); self.send_header("Content-Type", ctype + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)

    def do_GET(self):
        if self.path == "/":
            return self._send(200, (HERE / "embed.html").read_bytes(), "text/html")
        if self.path == "/state":
            return self._send(200, {"bank": load_bank(), "tests": json.loads((HERE / "tests.json").read_text()), "models": list(MODELS)})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        b = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        try:
            self._send(200, pick(b["model"], b["q"]))
        except Exception as e:
            self._send(502, {"error": f"{type(e).__name__}: {e}"})

    def log_message(self, *a):
        pass


print(f"PROTOTYPE ko-picker (embeddings) on http://localhost:{args.port}  models: {MODELS}")
ThreadingHTTPServer(("127.0.0.1", args.port), H).serve_forever()
