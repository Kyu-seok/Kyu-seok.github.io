# Coding standards

Read during code review, not implementation. Mechanical rules live in the checks (`npm run build` runs tsc, oxlint and the matcher tests in `src/chat/answer.test.mjs`; `server/` has gofmt, vet, tests, shellcheck in CI). What follows are judgement calls no check can make.

## An intent means one thing everywhere

What an intent (Me, Projects, Skills, Fun, Contact) is about is stated in seven places. A change to what one means updates all of them in the same commit:

- The reply and its card: `src/content/en.ts`, `src/content/ko.ts`, and the card in `src/components/Cards.tsx`.
- The keyword matcher, `src/chat/answer.ts`, with a case in `src/chat/answer.test.mjs` for each keyword moved.
- What the model knows, `server/facts.en.md` (held to its token ceiling, `server/scripts/check-prompt-tokens.py`).
- The Korean answer bank, `server/answers.ko.md`: the reply of every entry with that card (and a gate run if its example questions change).
- `PRODUCT.md`, "Capabilities and Constraints".

Reviewer: for a diff that changes one of these for an intent, check the other six and name the ones left stale. Fun moved from kyu-rious to the N100 mini PC on 2026-11-16 (#22) and touched all seven.

## The page and its documents tell one story

What the chat generates, caps, discloses, or falls back to is stated in several places on purpose, because each is read by a different audience. A change to any of it updates all of them in the same commit:

- `PRODUCT.md`, "Capabilities and Constraints".
- Both content files, `src/content/en.ts` and `src/content/ko.ts`: the `how` reply, the top-bar `scriptedNote`, and the `hello` and `unknown` replies.
- `docs/adr/0001-self-hosted-qwen3-with-scripted-fallback.md`, as a dated amendment when a consequence changes.
- `server/README.md` when the gateway's contract or caps change.

Reviewer: for a diff that touches generation, caps, or fallback behaviour, check each of these and name the ones left stale. Every sentence on the page must be true of what ships (PRODUCT.md, principle 1), so a reply that describes a state the visitor is not in ("the model is busy") is a defect, not copy.

## Page and gateway agree on every cap

The page decides locally what to send (it must work without the gateway) and the gateway enforces independently (it is public). Any cap, classification or card id that exists in both, such as the Hangul question cap, what counts as Hangul, and the answer bank's cards (`knownCards` in `server/pick.go`, `ProjectId` in `src/content/types.ts`), carries the same value and the same definition on both sides, and the page's constant names its gateway source. A change to one side without the other is a defect.
