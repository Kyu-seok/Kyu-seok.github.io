# portfolio-ask

The gateway and model server behind free-typed questions on kyu-seok.github.io. See `../docs/adr/0001-self-hosted-qwen3-with-scripted-fallback.md` for why, `spike/RESULTS.md` for the measurements.

- `main.go`: Go gateway. Holds the prompt (`facts.en.md` + `examples.en.md`, about 3,100 tokens together; the fact sheet's Voice, Opinions, and Small things sections are what the model may be playful with), temperature 0.3 for every intent (0.6 was measured and rejected, `spike/RESULTS.md`), one generation at a time with a queue of 3, 10 questions/min and 60/hour per IP, 300-char questions, 220 output tokens, 25 s wall clock, SSE streaming, URL allow-list from the fact sheet, permanent question log (`log/questions-YYYY-MM.jsonl`), `/health`, `/metrics`.
- `docker-compose.yml`: `llama` (llama.cpp server, Qwen3-1.7B Q4_K_M, low CPU share so CodeBite grading wins) and `gateway`.

## Run on the mini PC

The box is on the home LAN only: SSH alias `mini` (user `kyu`), project in `~/portfolio-ask`. The deploy workflow reaches it from GitHub over the `DEPLOY_*` secrets instead.

```bash
mkdir -p ~/portfolio-ask/models
# once:
wget -O ~/portfolio-ask/models/Qwen3-1.7B-Q4_K_M.gguf \
  https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf
# every deploy (the GitHub Actions workflow does this over SSH):
rsync -a server/ ~/portfolio-ask/   # excluding models/ and log/
cd ~/portfolio-ask && docker compose up -d --build
```

`.env` next to the compose file sets `ALLOWED_ORIGINS` (comma-separated), `GATEWAY_BIND` (`0.0.0.0` so CodeBite's nginx can reach it through the host), and `LLAMA_BIND` (`172.17.0.1`, the Docker bridge, so only containers on the host can scrape llama-server's metrics).

Public route: the mini PC's Cloudflare Tunnel (`/etc/cloudflared/config.yml`, root-owned, edited by hand) has an ingress rule `ask.code-bite.com` → `http://localhost:8090`; the DNS record is a proxied CNAME to `code-bite.com`. CodeBite's Prometheus scrapes 8090 and 8091 (CodeBite repo, `infra/`).

Log mirror: `scripts/mirror-log.sh` pushes `log/` to a private repo nightly from cron.

## API

`GET /health` → `{"ready":true,"model":"Qwen3-1.7B","busy":0,"queued":0}`. `ready` is false until the fact sheet prefix is cached after a restart (about a minute).

`POST /ask` `{"question":"...","lang":"en","intent":"projects"}` → `text/event-stream` with events `meta`, `token` (`{"text":"..."}`), `done` (`{"outcome","tokens","seconds","tok_s","first_token_s","model"}`). Only English is generated: `lang` must be `en` and the question must contain no Hangul (Korean was generated from 2026-11-08 to 2026-11-12, `../docs/adr/0001-self-hosted-qwen3-with-scripted-fallback.md`). Non-200 responses: 400 bad input, 422 not English, 429 rate limited, 503 busy or warming up.
