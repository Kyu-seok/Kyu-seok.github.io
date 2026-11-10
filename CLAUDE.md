# kyu-seok.github.io

Portfolio chat page (Vite + React, GitHub Pages) plus `server/`, the Go gateway and llama.cpp model it talks to, deployed separately to the CodeBite mini PC.

- `PRODUCT.md`: what the page is for and its principles. `GLOSSARY.md`: the words (scripted reply, generated reply, intent, card, fact sheet, time budget, question log).
- `docs/adr/`: why the model is self-hosted, why Korean free text was scripted at first, and why it is generated now despite missing the quality bar.
- `server/README.md`: the gateway's API, caps, and how it is deployed and routed. `server/spike/RESULTS.md`: the measurements that set the latency gate (do not loosen it) and the Korean quality bar, which Korean generation shipped without meeting; read it before re-arguing either.
- `server/facts.en.md` is the only thing the model knows. With `examples.en.md` it is held to a token ceiling that CI enforces (`server/scripts/check-prompt-tokens.py`; the reasons are in `server/spike/RESULTS.md`). `server/scripts/tokens.sh` counts on the live model. A change ships on push to `main` (`.github/workflows/deploy-ask.yml`).
- The question log on the mini PC is permanent. Never delete it.
- The repo's Pages source must stay "GitHub Actions".
