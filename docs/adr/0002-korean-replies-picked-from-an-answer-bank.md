---
status: accepted
date: 2026-11-12
---

# Korean free text gets a picked reply: an embedding model chooses one of Kyu's written replies

Qwen3-1.7B cannot write Korean that Kyu would say: it failed the quality bar twice on the bench, and once live, real answers in the question log were worse (wrong register, invented stories, examples pasted onto the wrong question), so Korean was made scripted again on 2026-11-12 (ADR 0001, 2026-11-12 amendment). Korean free text will instead get a **picked reply**: a small multilingual embedding model (bge-m3) on the same mini PC finds the **answer bank** entry whose example questions are nearest in meaning to the visitor's question, and the page shows the reply Kyu wrote for that entry. No Korean sentence is ever generated.

## Considered options

- **Qwen3-1.7B writes Korean.** Shipped 2026-11-08 over the bar, reverted 2026-11-12 on the question log.
- **Qwen3-1.7B picks an answer id under a grammar.** 12/28 on the dev set (19/28 when `none` was removed, with confidently wrong picks). It routes on names, which the keyword matcher already does.
- **Qwen3-4B as the picker.** Not measured: its first-token time (about 4 s at the median in the spike) already fails the latency gate, which is not loosened.
- **Hosted API.** Rejected in ADR 0001 for the showcase, unchanged.
- **Scripted only (keyword matcher).** The fallback if the picker had failed; misses the casual, paraphrased questions the log shows Korean visitors type.
- **bge-m3 nearest example (chosen).** 22/28 on Claude's first draft bank; after the bank was rewritten, a gate fixed before its questions existed (15 questions written by an agent blind to the bank, at least 13 and every trap to pass) scored 15/15, traps 5/5, about 0.13 s per question. Evidence: `server/spike/picker/RESULTS-picker.md` on branch `prototype/ko-picker`.

## Consequences

- A second resident model on the production box: bge-m3 Q8_0 (635 MB file, about 140 MiB resident at idle), in its own container with the same CPU share as the language model. The language model, its single slot, and the English prompt ceiling are unchanged.
- Every Korean free-text reply is Kyu's own sentence, so a wrong pick shows a true reply about the wrong subject, never an invented one. The picked entry also decides the card.
- There is no score threshold for "nothing fits": scores do not separate it. The answer bank carries explicit entries instead, including one for single-turn follow-ups ("아까 그거") that says the chat cannot see earlier messages.
- The answer bank is product content Kyu must keep in his voice. The gate judged picks only; the bank's replies are Claude's draft until Kyu rewrites them, and that rewrite is required before launch.
- Known weak spot: one-word reactions and small talk (심심해, 신기해) were the least separated in the dev set and are not in the gate. The question log review after launch reads those first.
- The page labels a picked reply as Kyu's words chosen by the embedding model, distinct from both scripted and generated replies.
