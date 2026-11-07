# Spike results: Qwen3 on the CodeBite mini PC (2026-11-07)

Box: Intel N100 (4 E-cores, AVX2, no AVX-512), 15 GiB RAM, governor `powersave` (intel_pstate, EPP balance_performance), 16 CodeBite containers running.
Server: `ghcr.io/ggml-org/llama.cpp:server` build 12182, `-c 4096 -np 1 -t 4 --cache-reuse 256`, container `--cpus 4 --cpu-shares 128`.
Prompt: `../facts.en.md` (1,785 tokens) as system prompt, thinking disabled, 8 questions (4 EN, 4 KO), see `bench.py`.
Gate (ADR 0001, Q6): first token < 2 s and a 120-token Korean answer < 20 s on an idle box.

## Idle box

| Run | Fact-sheet prefill (once) | First token p50 / max | Gen tok/s | 120-token KO answer | RAM |
|---|---|---|---|---|---|
| Qwen3-4B Q4_K_M | 127 s (14 tok/s) | 4.0 s / 8.2 s | 3.8 | ~40 s | 4.2 GiB |
| Qwen3-1.7B Q4_K_M | 49 s (36 tok/s) | 1.6 s / 2.7 s | 9.1 | ~16 s | 2.2 GiB |
| Qwen3-1.7B, v2 (examples, temp 0.3, short user turn) | +10 s (cache reuse) | 1.6 s / 3.8 s | 8.9 | ~16 s | 2.2 GiB |

Per-request prefill on this CPU is ~55 to 150 ms per token even with the prefix cached, so the length of the visitor's turn sets the first-token time: 20 tokens ≈ 1.3 s, 40 tokens ≈ 2.7 s (1.7B).

## During Java grading (6 submissions continuously in flight, 1.7B v2)

| Measure | Model idle | Model generating |
|---|---|---|
| Java submission wall time, median | 3.43 s | 4.50 s (+31%) |
| Model first token | 1.6 s | 22 s |
| Model generation | 8.9 tok/s | 0.5 tok/s |

`--cpu-shares 128` did not protect grading: the model still held ~85% of a core. The fallback would fire for the whole grading window, and grading itself got slower.

## Answer quality (see the `.jsonl` files for full text)

- 4B: declined experience and school correctly; still wrote the Python function; Korean "fun" answer invented "레벨 5" and "팀원들과 협업"; mixed English into Korean ("제 fastest way").
- 1.7B without examples: invented "about 3 years of experience"; wrote the code; Korean "fun" answer was generic and never mentioned kyu-rios; broken Korean ("나는 서울에서 나왔습니다", "가장 빠르게 나와 주는 방법").
- 1.7B with examples: declines now work, but by copying the example text nearly verbatim; "fun" in Korean is the example verbatim; free-form Korean still breaks ("나는 이 페이지에 나왔습니다"); long English answers are near-verbatim fact-sheet copies with grammar seams.

## Verdict

4B fails the latency gate outright. 1.7B passes it at the median on an idle box, fails on longer Korean questions, and its free-form Korean is below the bar for a page that promises every sentence is something Kyu would say. Grading on CodeBite slows by about a third while the model generates. Recommendation: do not ship either as the Korean free-text answerer on this box.
