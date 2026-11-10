---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["index.html"]
---

# Surface: / (index.html, src/App.tsx)

Scope: the whole single-page portfolio. Visitor mode: Experience (the chat is the work; the interface recedes into it).

Audience and job: recruiters and engineers deciding in under a minute whether to talk to Kyu. Action: press a quick-action chip, read one answer, click through to GitHub, LinkedIn, email, CodeBite, or kyu-rious.

Proof on hand: CodeBite screenshots, the 30s to 1.9s latency story, kyu-rious live graph with 5 topics / 26 lessons / 232 cards, VimText and wedding-ledger READMEs. Avatar: memoji placeholder until the user exports one.

Constraints: static only, bilingual KO/EN, no LLM, the user pinned the Toukoum-style chat portfolio topology.

## Direction contract

THESIS: A portfolio you talk to. The page is one conversation with Kyu, in Korean or English, where every answer was written by him and lands instantly. It refuses the category default of a headline over three equal project cards, and it refuses to pretend to be an AI.

OWN-WORLD: Pretendard Variable everywhere (Latin and Hangul in one voice), display at 700, body at 400 with tight tracking on display only. Ground: a cool paper white (#f6f7f9) with a faint radial lift behind the hero; surfaces pure white with 1px tinted hairlines and a soft offset shadow. Ink #0f1419, secondary ink tinted from the ground's blue-gray. One accent, "CodeBite orange" (#ea6a12 family), the brand colour of the flagship project: it owns the send button, the active chip, the user bubble, link underlines, caret, and selection. Pill geometry (999px) for input and chips; 20px radius for cards. Icons: authored 20px SVG, 1.75 stroke, round caps, one family. The hero chip row keeps the reference's device of one hue per quick action (amber, green, blue, violet, red on the resting icons); the active chip and every other control take the single accent. No gradient text, no glass or blur anywhere (the sticky top bar is opaque ground with a hairline), no emoji as icons.

STORY: The visitor reads "안녕하세요, 규석입니다 👋 / Backend Engineer", sees the avatar, and understands within two seconds that the pill input and five chips are the whole site. They press Projects, watch the hero fold up into the header while their question appears as a bubble, and a project carousel answers. They believe the work is real because they see it running. They leave through Contact or a project link.

FIRST VIEWPORT: Centered column, max 640px. Top bar: wordmark "Kyu" left, KO/EN toggle and GitHub/LinkedIn icon links right. Middle: greeting line (1.125rem, secondary), display title "Backend Engineer" (clamp 2.25rem to 3rem), avatar 200px circle below it. Lower third: pill composer with an orange send disc, then five chips in one row on desktop (icon above label), wrapping to three chips on the first row and two centered beneath on phones. Primary action is the chip row; the composer is second.

FORM: Pinned by the user, in their words: "I would like to build project like this but not using fastfolio https://www.aaabadcode.com/". A user-pinned direction beats the roll, so no concept roll was run; this quote is the recorded downgrade. seed: none (skipped: user-pinned form)

SIGNATURE INTERACTION: the fold. On the first question, the hero collapses: the avatar scales from 200px to 40px and docks beside the wordmark, the title fades up and out, the composer slides to the bottom edge and becomes sticky, and the chips shrink into a compact row above it. The answer arrives after a 500ms three-dot pause, then text and card fade up with a 12px rise, ease-out expo, 420ms. One motion grammar, used once per transition; reduced-motion drops the pause and the rise.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
