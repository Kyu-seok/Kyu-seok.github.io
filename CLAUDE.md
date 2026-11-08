# kyu-seok.github.io

Portfolio chat page (Vite + React, GitHub Pages) plus `server/`, the Go gateway and llama.cpp model it talks to, deployed separately to the CodeBite mini PC.

- `PRODUCT.md`: what the page is for and its principles. `GLOSSARY.md`: the words (scripted reply, generated reply, intent, card, fact sheet, time budget, question log).
- `docs/adr/`: why the model is self-hosted and why only English free text is generated.
- `server/README.md`: the gateway's API, caps, and how it is deployed and routed. `server/spike/RESULTS.md`: the measurements that set the latency gate; do not loosen it.
- `server/facts.en.md` is the only thing the model knows; keep it under about 3,000 tokens. A change ships on push to `main` (`.github/workflows/deploy-ask.yml`).
- The question log on the mini PC is permanent. Never delete it.
- Run Vite with `--port 5174`; 5173 is taken by the CodeBite dev server. The repo's Pages source must stay "GitHub Actions".
