# portfolio-ask

The gateway and model server behind free-typed questions on kyu-seok.github.io. See `../docs/adr/0001-self-hosted-qwen3-with-scripted-fallback.md` for why, `spike/RESULTS.md` for the measurements.

- `main.go`: Go gateway. Holds the prompt (`facts.en.md` + `examples.en.md`, about 3,100 tokens together; the fact sheet's Voice, Opinions, and Small things sections are what the model may be playful with), temperature 0.3 for every intent (0.6 was measured and rejected, `spike/RESULTS.md`), one generation at a time with a queue of 3, 10 questions/min and 60/hour per IP, 300-char questions, 220 output tokens, 25 s wall clock, SSE streaming, URL allow-list from the fact sheet, permanent question log (`log/questions-YYYY-MM.jsonl`), `/health`, `/metrics`.
- `pick.go`: picked replies for Korean free text (`../docs/adr/0002-korean-replies-picked-from-an-answer-bank.md`). Loads `answers.ko.md`, the answer bank, at startup and refuses to start if it is invalid (duplicate ids, unknown cards, fewer than two example questions, no reply, no `followup` entry). Embeds every example question once bge-m3 is up, retrying in the background; then each pick embeds the question and returns the entry of the single nearest example by cosine similarity, with no threshold.
- `answers.ko.md`: the answer bank. Format and rules are at the top of the file. Ships with the gateway image like the fact sheet.
- `docker-compose.yml`: `llama` (llama.cpp server, Qwen3-1.7B Q4_K_M, low CPU share so CodeBite grading wins), `embed` (llama.cpp server, bge-m3 Q8_0, `--embedding --pooling cls`, same CPU limits and share, 1 GB memory limit, metrics on 8096 bound like llama's), and `gateway`.

## Run on the mini PC

The box is on the home LAN only: SSH alias `mini` (user `kyu`), project in `~/portfolio-ask`. The deploy workflow reaches it from GitHub over the `DEPLOY_*` secrets instead.

```bash
mkdir -p ~/portfolio-ask/models
# once:
wget -O ~/portfolio-ask/models/Qwen3-1.7B-Q4_K_M.gguf \
  https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf
# once (already on the box from the prototype; EMBED_MODEL_FILE in .env names another file):
wget -O ~/portfolio-ask/models/PROTOTYPE-bge-m3-q8_0.gguf \
  https://huggingface.co/ggml-org/bge-m3-Q8_0-GGUF/resolve/main/bge-m3-q8_0.gguf
# every deploy (the GitHub Actions workflow does this over SSH):
rsync -a server/ ~/portfolio-ask/   # excluding models/ and log/
cd ~/portfolio-ask && docker compose up -d --build
```

`.env` next to the compose file sets `ALLOWED_ORIGINS` (comma-separated), `GATEWAY_BIND` (`0.0.0.0` so CodeBite's nginx can reach it through the host), and `LLAMA_BIND` (`172.17.0.1`, the Docker bridge, so only containers on the host can scrape llama-server's metrics).

Public route: the mini PC's Cloudflare Tunnel (`/etc/cloudflared/config.yml`, root-owned, edited by hand) has an ingress rule `ask.code-bite.com` → `http://localhost:8090`; the DNS record is a proxied CNAME to `code-bite.com`. CodeBite's Prometheus scrapes 8090 and 8091 (CodeBite repo, `infra/`).

Log mirror: `scripts/mirror-log.sh` pushes `log/` to a private repo nightly from cron.

## The gate: run it whenever the answer bank's example questions change

`scripts/gate.py` checks a bank change against the live bge-m3, picking exactly as `/pick` does. It runs the 15 held-out gate questions (`scripts/gate/gate.json`, written by an agent that never saw the bank; never edit them to fit it) and the 28 practice questions the bank was tuned on (`scripts/gate/dev.json`, shown for information only). It prints each pick with its score and runner-up, then the verdict: **PASS at 13 of 15 or better with every trap**, exit 0; FAIL, exit 1. If a fixture accepts an id the bank no longer has, it says which; in the gate set that means no verdict (exit 2) until the bank keeps the id. Not in CI: it needs the live model.

```bash
# from a laptop, through an SSH tunnel to the embed container's port on the box:
ssh -N -L 8096:172.17.0.1:8096 mini &
cd server && python3 scripts/gate.py
# on the box itself: python3 scripts/gate.py --embed http://172.17.0.1:8096
```

`python3 scripts/gate_test.py` tests the script against a fake embedding server.

## API

`GET /health` → `{"ready":true,"model":"Qwen3-1.7B","busy":0,"queued":0,"pick_ready":true,"pick_model":"bge-m3"}`. `ready` is false until the fact sheet prefix is cached after a restart (about a minute). `pick_ready` is false until every answer bank example question is embedded, and stays false while bge-m3 is down.

`POST /ask` `{"question":"...","lang":"en","intent":"projects"}` → `text/event-stream` with events `meta`, `token` (`{"text":"..."}`), `done` (`{"outcome","tokens","seconds","tok_s","first_token_s","model"}`). Only English is generated: `lang` must be `en` and the question must contain no Hangul (Korean was generated from 2026-11-08 to 2026-11-12, `../docs/adr/0001-self-hosted-qwen3-with-scripted-fallback.md`). Non-200 responses: 400 bad input, 422 not English, 429 rate limited, 503 busy or warming up.

`POST /pick` `{"question":"어떤 에디터 쓰세요?","lang":"ko","intent":"skills"}` → `{"id":"editor","text":"…","card":"skills","score":0.93,"ms":130,"model":"bge-m3"}`: a picked reply, Kyu's text from the answer bank entry nearest in meaning. `lang` and `intent` are optional and only logged. `card` is the entry's card (`me`, `skills`, `fun`, `contact`, `how`, `project:<name>`, or empty). Non-200 responses: 400 empty or over 40 characters, 422 no Hangul, 429 rate limited (the same per-IP budget as `/ask`), 503 bge-m3 not ready or down. Picks do not wait for the language model. The question log line adds `pick`, `pick_score`, `runner_up` and `runner_up_score`.

`GET /metrics` adds `portfolio_pick_total{outcome}`, the `portfolio_pick_seconds` histogram, and `portfolio_pick_ready`.
