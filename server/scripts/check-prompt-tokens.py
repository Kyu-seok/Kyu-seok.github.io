#!/usr/bin/env python3
"""Fail if the system prompt (facts.en.md + examples.en.md, joined as main.go joins them) exceeds CEILING tokens.

Every prompt token slows every generated token on the N100 (spike/RESULTS.md, "Prompt length sets
generation speed"). CEILING is the prompt last benched and shipped (RESULTS.md, small-talk run B).
To raise it: re-run the bench on the new prompt, record it in RESULTS.md, and change CEILING in the
same PR.

Counts with Qwen3-1.7B's Hugging Face tokenizer at a pinned revision, which matches llama-server's
/tokenize on the shipped GGUF; scripts/tokens.sh counts on the real model when you need to confirm.
Usage (from server/): python3 scripts/check-prompt-tokens.py   (needs: pip install tokenizers)
"""
import pathlib
import sys
import urllib.request

from tokenizers import Tokenizer

CEILING = 2270
REVISION = "70d244cc86ccca08cf5af4e1e306ecf908b1ad5e"
TOKENIZER_URL = f"https://huggingface.co/Qwen/Qwen3-1.7B/resolve/{REVISION}/tokenizer.json"

server = pathlib.Path(__file__).resolve().parent.parent
prompt = (server / "facts.en.md").read_text() + (server / "examples.en.md").read_text()

with urllib.request.urlopen(TOKENIZER_URL, timeout=60) as r:
    tokenizer = Tokenizer.from_str(r.read().decode())
n = len(tokenizer.encode(prompt, add_special_tokens=False).ids)

print(f"system prompt: {n} tokens (ceiling {CEILING})")
if n > CEILING:
    print(f"over by {n - CEILING}: trim facts.en.md/examples.en.md, or re-bench and raise CEILING", file=sys.stderr)
    sys.exit(1)
