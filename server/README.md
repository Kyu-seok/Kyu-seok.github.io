# portfolio-ask

The gateway and model server behind free-typed English questions on kyu-seok.github.io. See `../docs/adr/0001-self-hosted-qwen3-with-scripted-fallback.md` for why, `spike/RESULTS.md` for the measurements.

- `main.go`: Go gateway. Holds the prompt (`facts.en.md` + `examples.en.md`), one generation at a time with a queue of 3, 10 questions/min and 60/hour per IP, 300-char questions, 220 output tokens, 25 s wall clock, SSE streaming, URL allow-list from the fact sheet, permanent question log (`log/questions-YYYY-MM.jsonl`), `/health`, `/metrics`.
- `docker-compose.yml`: `llama` (llama.cpp server, Qwen3-1.7B Q4_K_M, low CPU share so CodeBite grading wins) and `gateway`.

## Run on the mini PC

```bash
mkdir -p ~/portfolio-ask/models
# once:
wget -O ~/portfolio-ask/models/Qwen3-1.7B-Q4_K_M.gguf \
  https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf
# every deploy (the GitHub Actions workflow does this over SSH):
rsync -a server/ ~/portfolio-ask/   # excluding models/ and log/
cd ~/portfolio-ask && docker compose up -d --build
```

`.env` next to the compose file sets `ALLOWED_ORIGINS` (comma-separated) and `GATEWAY_BIND` (`0.0.0.0` to reach it on the LAN during development).

## API

`GET /health` → `{"ready":true,"model":"Qwen3-1.7B","busy":0,"queued":0}`. `ready` is false until the fact sheet prefix is cached after a restart (about a minute).

`POST /ask` `{"question":"...","lang":"en","intent":"projects"}` → `text/event-stream` with events `meta`, `token` (`{"text":"..."}`), `done` (`{"outcome","tokens","seconds","tok_s","first_token_s","model"}`). Non-200 responses: 400 bad input, 422 non-English, 429 rate limited, 503 busy or warming up.
