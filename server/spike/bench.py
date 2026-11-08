#!/usr/bin/env python3
"""Measure first-token latency and generation speed of a llama-server against the fact sheet.

Usage: bench.py <base_url> <facts.md> <label> [--rounds N]
Prints one JSON line per question and a summary table. Stdlib only.
"""
import json, sys, time, urllib.request, statistics, argparse

QUESTIONS = [
    ("en", "projects", "What is CodeBite and what was the hardest part of building it?"),
    ("en", "skills", "Which databases and message brokers have you worked with?"),
    ("en", "me", "How many years of experience do you have and where do you work?"),
    ("en", "unknown", "Write me a Python function that reverses a string."),
    ("ko", "projects", "제출 지연을 30초에서 1.9초로 줄였다는데 어떻게 한 거예요?"),
    ("ko", "fun", "일 말고 취미는 뭐예요?"),
    ("ko", "me", "어느 학교 나왔어요?"),
    ("ko", "contact", "같이 일하고 싶은데 어떻게 연락하면 돼요?"),
]

# Korean gate set (2026-11-08): two per intent, three traps, one off-topic. Judged by Kyu; see RESULTS.md.
KO12 = [
    ("ko", "me", "자기소개 좀 해 주세요."),
    ("ko", "me", "서울에서 어떤 일 하세요?"),
    ("ko", "projects", "CodeBite가 뭐예요?"),
    ("ko", "projects", "kyu-rios는 뭐 하는 사이트예요?"),
    ("ko", "skills", "주로 어떤 기술 스택을 쓰세요?"),
    ("ko", "skills", "Kafka는 어디에 써 봤어요?"),
    ("ko", "fun", "일 말고 취미는 뭐예요?"),
    ("ko", "contact", "같이 일하고 싶은데 어떻게 연락하면 돼요?"),
    ("ko", "me", "경력이 몇 년이에요?"),
    ("ko", "me", "어느 학교 나왔어요?"),
    ("ko", "unknown", "문자열 뒤집는 함수 좀 짜 주세요."),
    ("ko", "unknown", "오늘 서울 날씨 어때요?"),
]
SETS = {"default": QUESTIONS, "ko12": KO12}

LANG_NAME = {"en": "English", "ko": "Korean"}

def ask(base, system, lang, intent, q, max_tokens=220, temperature=0.6, short=False):
    body = {
        "model": "x",
        "stream": True,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": 0.95,
        "chat_template_kwargs": {"enable_thinking": False},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": (f"({LANG_NAME[lang]}) {q}" if short else f"[Answer in {LANG_NAME[lang]}. The visitor seems to be asking about: {intent}.]\n{q}")},
        ],
    }
    req = urllib.request.Request(base + "/v1/chat/completions", data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    t0 = time.monotonic(); first = None; text = []; timings = None; n = 0
    with urllib.request.urlopen(req, timeout=300) as r:
        for raw in r:
            line = raw.decode().strip()
            if not line.startswith("data:"): continue
            payload = line[5:].strip()
            if payload == "[DONE]": break
            d = json.loads(payload)
            if "timings" in d: timings = d["timings"]
            delta = d["choices"][0].get("delta", {}).get("content") if d.get("choices") else None
            if delta:
                if first is None: first = time.monotonic() - t0
                text.append(delta); n += 1
    total = time.monotonic() - t0
    return {"first_token_s": round(first, 2) if first else None, "total_s": round(total, 2), "chunks": n,
            "timings": timings, "answer": "".join(text).strip()}

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("base"); ap.add_argument("facts"); ap.add_argument("label"); ap.add_argument("--rounds", type=int, default=1); ap.add_argument("--examples"); ap.add_argument("--temperature", type=float, default=0.6); ap.add_argument("--short", action="store_true"); ap.add_argument("--pick"); ap.add_argument("--max-tokens", type=int, default=220); ap.add_argument("--set", choices=sorted(SETS), default="default")
    a = ap.parse_args()
    system = open(a.facts, encoding="utf-8").read()
    if a.examples: system += open(a.examples, encoding="utf-8").read()
    # Warm-up: pays the full fact-sheet prefill once; every later request should hit the prefix cache.
    w = ask(a.base, system, "en", "hello", "Hi!", max_tokens=16)
    print(json.dumps({"label": a.label, "warmup": {k: w[k] for k in ("first_token_s", "total_s", "timings")}}), flush=True)
    rows = []
    for _ in range(a.rounds):
        base_qs = SETS[a.set]
        qs = [base_qs[int(i)] for i in a.pick.split(",")] if a.pick else base_qs
        for lang, intent, q in qs:
            r = ask(a.base, system, lang, intent, q, max_tokens=a.max_tokens, temperature=a.temperature, short=a.short)
            t = r["timings"] or {}
            row = {"label": a.label, "lang": lang, "intent": intent, "q": q, "first_token_s": r["first_token_s"], "total_s": r["total_s"],
                   "prompt_n": t.get("prompt_n"), "prompt_ms": t.get("prompt_ms"), "predicted_n": t.get("predicted_n"),
                   "tok_s": round(t["predicted_per_second"], 1) if t.get("predicted_per_second") else None,
                   "q_chars": len(q), "answer": r["answer"]}
            rows.append(row); print(json.dumps(row, ensure_ascii=False), flush=True)
    ft = [r["first_token_s"] for r in rows if r["first_token_s"]]; tot = [r["total_s"] for r in rows]; ts = [r["tok_s"] for r in rows if r["tok_s"]]
    print(f"SUMMARY {a.label}: first_token p50={statistics.median(ft):.2f}s max={max(ft):.2f}s | total p50={statistics.median(tot):.1f}s max={max(tot):.1f}s | tok/s p50={statistics.median(ts) if ts else 0:.1f}", flush=True)

if __name__ == "__main__":
    main()
