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

## Round 2: embedding model as the picker (2026-11-12)

`serve_embed.py` + `embed.html`: nearest example question by cosine similarity, `none` below a threshold. Same
bank (Claude's rough draft), same 28 tests, same labels. Containers on the mini PC, CPU limits as live.

- multilingual-e5-small (`cstr/multilingual-e5-small-GGUF` q8_0): does not load on the current llama.cpp image
  ("bert model needs to define token type count"; an old conversion). Not measured.
- bge-m3 (`ggml-org/bge-m3-Q8_0-GGUF`, 635 MB file, ~140 MiB resident at idle): **22/28, traps 4/6**, question
  embedding p50 125 ms, max 257 ms. No threshold improves on always taking the top match: `none` cannot be
  separated by score (그중 하나만 알려줘 scores 0.698; correct picks go as low as 0.589).

| Miss | Picked (score) | Runner-up (score) | Shape |
|---|---|---|---|
| CodeBite가 뭐예요? | codebite_arch 0.906 | codebite 0.881 | bank: both entries' examples carry the name |
| 경력이 몇 년이에요? (trap) | job 0.728 | decline_private 0.725 | knife edge; the reply shown is true, it just does not decline |
| 오늘 서울 날씨 어때요? (trap) | hello 0.733 | decline_general 0.663 | bank: hello example "오늘 기분 어때요?" shares the frame |
| 신기해 | confused 0.581 | reaction 0.535 | one-word reactions are weakly separated |
| 심심해 | confused 0.588 | bored 0.581 | same |
| 그중 하나만 알려줘 | bored 0.698 | – | single-turn follow-up; no threshold catches it |

Verdict: **fails the agreed bar (24/28, all traps) on this draft bank**, but a different failure from Qwen3: every
miss shows one of Kyu's written replies (wrong topic, never invented text), half the misses trace to example
wording in a bank Kyu has not written yet, and `none` needs a different mechanism than a score threshold.
