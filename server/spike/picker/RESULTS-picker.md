# PROTOTYPE result: can Qwen3-1.7B pick a Korean answer id? (2026-11-10 to 11-12)

Question: given only Korean example questions per answer id (no answer text), and a grammar that allows only a bank
id or `none` as output, does Qwen3-1.7B pick the right answer for real visitor questions?

Setup: temporary `llama-server` container on the mini PC (same image, model, CPU limits as live; port 8092), prompt
= `PROTOTYPE-bank.ko.md` index (836 tokens), temperature 0, thinking off. Test set `tests.json`: ko12 + the 12
distinct Korean questions from the question log + 4 extras; accepted ids labelled by Claude before the run.
Pass line (agreed in grilling): at least 24/28, every trap on a decline or `none`, p50 under 2 s.

| Variant | Score | Traps | Latency | Failure shape |
|---|---|---|---|---|
| Base: `none` allowed, "pick the id whose examples mean the same thing" | 12/28 | 1/6 | p50 0.9 s, max 1.9 s | All 16 misses are `none`; picks right only when the question names the thing (CodeBite, VimText, Kafka, 에디터) |
| A: no `none`, forced to the closest id | 19/28 | 3/6 | similar | Wrong picks: 경력이 몇 년이에요? → confused, 문자열 뒤집는 함수 → codebite_arch, 무슨 소리야 → intro, 날씨 → now |
| C: `none` kept, rule says 반말/paraphrase count as a match | 10/28 | 1/6 | similar | Back to `none` everywhere; Kafka → codebite_latency |

Verdict: **fail**. Speed is not the problem (2 output tokens). Qwen3-1.7B does not understand casual Korean well
enough to route it; it matches on names, which the browser keyword matcher already does. Prompt wording moves the
failure between "none for everything" and "confidently wrong", not toward correct.

Next (Kyu, 2026-11-12): one time-boxed round with an embedding model (multilingual-e5-small, then bge-m3) doing
nearest-example search over the same bank, same tests, same pass line. If that fails, Korean free text stays scripted.
