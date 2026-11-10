# kyu-seok.github.io

Portfolio landing page for 염규석 (Kyu-seok Yeum). A single page that works like a chat: five quick questions, a text box, and answers written ahead of time. No LLM, no backend, no analytics.

Live: https://kyu-seok.github.io/

## Run locally

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
```

## Deploy

Pushing to `main` runs `.github/workflows/pages.yml`, which builds and deploys `dist/` with GitHub Actions. The repository's Pages source must be set to **GitHub Actions** (Settings → Pages → Build and deployment).

`https://kyu-seok.github.io/kyu-rious/` is served from the separate `Kyu-seok/kyu-rious` repository and is not affected by this one.

## Replace the avatar

1. Export a memoji sticker (Messages → memoji → long-press → Save as image) or pick a square photo.
2. Save it as `public/avatar.png` with a transparent background (at least 400px on the short side); it sits inside the peach circle.
3. `AVATAR_SRC` in `src/content/index.ts` already points at `/avatar.png`.

## Edit the answers

All copy lives in `src/content/en.ts` and `src/content/ko.ts`. Both files share the shape in `src/content/types.ts`, so the compiler tells you if one language is missing something.

Free-text questions are matched by keyword in `src/chat/answer.ts`. Add synonyms there when a question you expect falls through to the "I can't answer that" reply.

Project covers are in `public/projects/` (CodeBite and wedding-ledger screenshots come from their repos' `docs/` folders; kyu-rious is a screenshot of the live site; VimText is an authored SVG).
