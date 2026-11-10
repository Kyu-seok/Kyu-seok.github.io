# Plan: link kyu-rious into the chat

Status: grilled and built 2026-11-10, in PR `feat/notes-card`. Written 2026-11-10.

## Goal

When a visitor asks about something Kyu has studied, the chat points them at the kyu-rious lessons Kyu actually wrote. kyu-rious is the second brain (https://kyu-seok.github.io/kyu-rious/, repo Kyu-seok/kyu-rious); today the chat only knows the one-paragraph summary in the fact sheet.

## Constraints that shape it

- **The latency gate is not loosened** (CLAUDE.md, `server/spike/RESULTS.md`). The first-token budget is 4 s and today's first token takes about 1.5 s.
- **Retrieved text can't be prefix-cached.** Each retrieved token costs about 70 to 110 ms of per-request prefill on the N100, so the budget leaves room for roughly 20 to 30 retrieved tokens. One useful passage is 200 to 400 tokens. Classic RAG, where passages are pasted into the prompt, does not fit.
- **The prompt ceiling is about 2,200 tokens** for fact sheet plus examples, because every prompt token slows every generated token ("Prompt length sets generation speed" in RESULTS.md).
- **Cards are never generated** (GLOSSARY.md). The model pastes the nearest example rather than following rules ("Small-talk gate" in RESULTS.md).
- **The page makes one network call**, to ask.code-bite.com, on first interaction (PRODUCT.md).
- **No LangChain.** The pipeline is three steps in a Go gateway, and a framework would hide the parts this portfolio exists to show.

## Facts already checked

- kyu-rious publishes https://kyu-seok.github.io/kyu-rious/graph.json, built from `site/src/pages/graph.json.ts`. It holds `nodes` (56: topics, lessons, reference sheets) and `relationships` (226). Each node has `id`, `kind`, `topic`, `title`, `summary`, `url`.
- **Lesson summaries are placeholders**, such as "Lesson 1 · Agent Orchestration". Topic summaries are real, and they come from `topics/<slug>/topic.yaml`.
- All titles are in English.
- Checked again 2026-11-10: 5 topics, 28 lessons, 23 reference sheets. The 10 lessons of AI Engineering 101 and Kafka now have real summaries; the other 18 are still placeholders. PRODUCT.md's "26 lessons" is stale.
- Several lesson titles are generic ("Build", "Grilling", "The Big Picture", "On-ramps"), and "build" is already a `projects` keyword. Title matching would misfire.
- Question log (59 rows, mirror as of 2026-11-08): no question about a studied topic. Four ask what kyu-rious is (already routed to the project card); one asks what Kyu is into lately.
- kyu-rious has its own GLOSSARY.md (Topic, Lesson, Reference sheet, Node, Relationship, Review card) and ADRs.

## Proposed design (to be challenged)

```
build time   portfolio build reads kyu-rious graph.json
             → bakes a small index into the page: title, topic, kind, URL per node

visitor asks a question
  1. keyword matcher picks the intent and card, as today
  2. the same matcher scores the kyu-rious index      → top 1 to 3 nodes above a threshold
  3. reply prose: scripted or generated, as today
  4. a new card under the reply links those lessons ("From my notes")
optional: the matched lesson title (~10 tokens) goes to the model with the question,
          so the prose can say "I wrote a lesson on this"
```

The point: retrieval runs in the browser and costs no CPU on the mini PC. The card is Kyu's own lesson list, so it cannot invent anything, and it works when the model is down.

Alternative to keep on the table: per-topic cached prompt slots in llama-server. Each slot caches the fact sheet plus one topic's condensed notes and is routed by intent. Retrieval would then cost no per-request prefill, but each slot takes about 0.5 GB of RAM against a 3 GB limit, and longer context slows generation. This needs a spike before any decision.

## Open questions for the grilling

1. Is the new card its own thing, or part of an existing intent's card? It may need a new glossary term, perhaps "note link".
2. Which questions get it? Every question with a match, only free text, or only the fun and skills intents?
3. Are titles enough to match on, or does kyu-rious add a real one-line summary or keywords per lesson? That would be a change in the kyu-rious repo.
4. How do Korean questions match English titles? Korean keywords, Korean titles, or a decision that Korean visitors don't get the card.
5. Freshness: is the index baked at build time and refreshed nightly, or does kyu-rious's deploy trigger this repo's rebuild? A runtime fetch would break the PRODUCT.md network rule.
6. Does the model get the matched title at all, or does it stay out of this entirely?
7. Is the per-topic cached-slot alternative worth a spike, or is it dropped?
8. ~~Display name: rename "kyu-rios" to "kyu-rious" everywhere?~~ Decided 2026-11-10: yes, see "Already done".
9. Does this deserve an ADR? It reopens ADR 0001's "RAG rejected, revisit if the fact sheet outgrows that".

## Decided (grilling, 2026-11-10)

1. Build the smallest version now, as a showcase of kyu-rious as running work, not as an answer to demand (the log shows none). The 11-22 log review should not read it as either.
2. Match questions against the 5 kyu-rious topics with keyword lists Kyu writes in this repo, English and Korean, like `PROJECT_FOCUS`. Never match on lesson titles or summaries. This settles Korean (open question 4) and needs no kyu-rious change (open question 3).
3. The new block is a Card. The glossary definition changed from "picked from the intent" to "picked by the keyword matcher, never generated", and a reply may carry more than one card.
4. The model stays out: nothing about the notes goes into the prompt, and the prose never mentions them. Gateway, prompt, and token ceiling unchanged (open question 6).
5. The per-topic cached-slot alternative is rejected without a spike: about 0.5 GB of RAM per slot against a 3 GB limit, longer context slows every token, and the log shows no demand (open question 7).
6. Vocabulary: the kyu-rious subjects are **study topics**; the new card is the **notes card** (label "From my notes" / "내 노트에서"). Intent's definition now says "subjects", not "topics". Both are in GLOSSARY.md.
7. The notes card shows one study topic (most keyword hits): its title, its topic summary, and all its lessons as links, collapsed after 3 behind the existing "more" toggle. Reference sheets are left out.
8. It is added to any free-text reply whose question matches a study topic, scripted or generated, model up or down. It never changes the intent or the first card. Chips and the too-long-Korean reply never get it.
9. The lesson list comes from graph.json, fetched by `pages.yml` at build time, plus a daily `schedule:` trigger. The build fails if the fetch fails or a keyed study topic is missing, so Pages keeps the last good deploy. A study topic without keywords is just not matchable. No runtime fetch.
10. No ADR: the model is untouched, so ADR 0001's RAG decision is not reopened, and the change is easy to reverse.
11. Study-topic keywords are specific to the subject and never describe the chat itself: no bare `ai`, `llm`, `model`, `prompt`, `agent`, `qwen` (the log has "Can you show me the prompt you are given"). Phrases instead (`prompt engineering`, `rag`, `ccdak`, `merge conflict`, …). Claude drafts the English and Korean lists in the PR; Kyu edits in review. One keyword hit matches, as in `PROJECT_FOCUS`.
12. Korean: each keyed study topic has a hand-written Korean title and summary in `ko.ts`; lesson titles stay English (they name English pages). The build fails if a keyed study topic lacks its Korean line.
13. Measured offline: at log review, re-run study-topic matching over the logged questions. The page sends nothing new; the gateway is unchanged. Add this to the 2026-11-22 review.
14. The Fun card's topic, lesson, and reference-sheet counts come from the same build-time graph.json fetch (they are wrong today: 26 vs 28 lessons, AI Engineering 101 at 6/6 vs 8/8). Review cards (232) stay hardcoded. The fact sheet's "26 lessons" is fixed by hand in the same PR.
15. PRODUCT.md gains the notes card under Capabilities and corrects the kyu-rious evidence line to 28 lessons.

## Already done

- 2026-11-10: the portfolio's kyu-rious links were changed from `/kyu-rios/` to `/kyu-rious/`, and the GitHub links from `Kyu-seok/kyu-rios` to `Kyu-seok/kyu-rious`. The old Pages path returned 404.
- 2026-11-10: the display name is "kyu-rious" everywhere a visitor or the model sees it, plus the `ProjectId`, the cover images, and the `.impeccable/` notes. The intent keywords dropped the old spellings (no users yet) and added `kyurious`, `kyu rious`, `큐리어스`. The prompt stayed at 2,271 tokens (facts 1,959 + examples 312). `server/spike/` keeps "kyu-rios" because it records what the model said.
