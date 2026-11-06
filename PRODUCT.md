# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript, plain CSS with custom-property tokens (user chose Vite + React + TS; CSS approach delegated). Static build deployed to GitHub Pages at https://kyu-seok.github.io/ via a GitHub Actions workflow. No server: the chat is scripted, not an LLM (user decision).

## Users

Recruiters, hiring managers, and fellow engineers who land on kyu-seok.github.io from a résumé, LinkedIn, or a GitHub profile. They are deciding in under a minute whether Kyu-seok is worth a conversation. Korean and English readers both; language is a toggle and the chat answers in the active language.

## Product Purpose

A single-page portfolio for 염규석 (Kyu-seok Yeum), a backend engineer in Seoul. It replaces a dormant Jekyll blog. Success: a visitor learns who Kyu is, sees CodeBite and kyu-rios as real, running work, and reaches GitHub, LinkedIn, or email without hunting.

## Positioning

The portfolio is a conversation, modeled on the "ask me anything" chat portfolio format (reference: aaabadcode.com, a Fastfolio site). Unlike that reference, it runs with zero backend: every answer is authored by Kyu and served statically, so it is free, instant, and never hallucinates.

## Operating Context

- Visitors arrive on phones and laptops, in daylight, usually from a link in a résumé or a LinkedIn post.
- kyu-rios lives at https://kyu-seok.github.io/kyu-rios/ in its own repo (Kyu-seok/kyu-rios, Pages via workflow). This site must not interfere with that path.
- The repo previously deployed a Jekyll build to the `gh-pages` branch. Pages must be switched to "GitHub Actions" as its source for the new site.

## Capabilities and Constraints

- Five quick actions: Me, Projects, Skills, Fun, Contact. Each opens a chat answer with a rich card.
- Free-text input: keyword matching against the same answer set, bilingual synonyms, with an honest fallback that says the chat is scripted and lists what it can answer.
- Language toggle KO/EN; initial language from the browser, remembered in localStorage.
- No analytics, no cookies, no external scripts.
- Avatar: user will export a memoji; the build ships a labeled placeholder at `public/avatar.svg` (swap the path in `src/content/index.ts`).
- Fun = kyu-rios second brain only (user decision). Book reviews from the old blog are not included.

## Brand Commitments

- Name: 염규석 / Kyu-seok Yeum. GitHub handle Kyu-seok. GitHub display name "Q, the programmer".
- Voice (from GitHub profile README): plain, systems-minded, "every slow system is telling you something".
- Existing favicons, now in `public/icons/`.
- Visual direction pinned by the user: the Toukoum-style AI-chat portfolio (centered greeting, title, large avatar, pill input, quick-action chips, chat view with cards such as a project carousel).

## Evidence on Hand

- GitHub profile README (Kyu-seok/Kyu-seok): bio, "How I build" philosophy, stack list, email.
- Social: https://www.linkedin.com/in/kyuseok/ , https://github.com/Kyu-seok , yeumkyuseok@gmail.com
- CodeBite README (Kyu-seok/CodeBite) with screenshots in docs/screenshots/: product facts, architecture, latency work (30s to 1.9s), runs on a home mini PC. Live at https://code-bite.com
- kyu-rios site: 5 topics, 26 lessons, 232 review cards; Astro; graph + spaced review. Its Kafka topic is described as "in preparation for the CCDAK exam", which is the source for the CCDAK claim.
- VimText README (Chrome MV3 Vim extension, no npm deps).
- wedding-ledger README with docs/01-main.png.
- Absent: a photo or memoji (placeholder shipped), employer or years-of-experience claims (not stated anywhere; do not invent), education claims (GitHub "company" says Curtin University but role is unconfirmed; omitted).

## Product Principles

1. Every sentence on the page is something Kyu actually did or believes; no filler claims.
2. The chat answers fast and never pretends to be an AI.
3. Projects are shown running (screenshots, live links), not described abstractly.
4. Both languages are first-class; neither reads as a translation afterthought.
5. Zero operational burden: static files, no keys, no services to keep alive.
