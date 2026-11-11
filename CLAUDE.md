# kyu-seok.github.io

Portfolio chat page (Vite + React, GitHub Pages) plus `server/`, the Go gateway and llama.cpp model it talks to, deployed separately to the CodeBite mini PC.

- `PRODUCT.md`: what the page is for and its principles. `GLOSSARY.md`: the words (scripted reply, generated reply, intent, card, fact sheet, time budget, question log).
- `docs/adr/`: why the model is self-hosted, why Korean free text was scripted at first, generated over a missed quality bar, and scripted again since 2026-11-12. ADR 0002: Korean free text gets a picked reply from Kyu's answer bank, chosen by an embedding model (bge-m3).
- `server/README.md`: the gateway's API, caps, and how it is deployed and routed. `server/spike/RESULTS.md`: the measurements that set the latency gate (do not loosen it) and the Korean quality bar, which Korean generation shipped without meeting and was reverted for; read it before re-arguing either. `server/spike/picker/` on branch `prototype/ko-picker`: Qwen3-1.7B also fails as a Korean answer picker (12/28).
- `server/facts.en.md` is the only thing the model knows. With `examples.en.md` it is held to a token ceiling that CI enforces (`server/scripts/check-prompt-tokens.py`; the reasons are in `server/spike/RESULTS.md`). `server/scripts/tokens.sh` counts on the live model. A change ships on push to `main` (`.github/workflows/deploy-ask.yml`).
- The question log on the mini PC is permanent. Never delete it.
- The repo's Pages source must stay "GitHub Actions".

## Agent skills

### Issue tracker

Issues and specs live in this repo's GitHub Issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
