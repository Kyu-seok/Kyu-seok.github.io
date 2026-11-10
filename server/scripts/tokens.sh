#!/usr/bin/env bash
# Count tokens on the live model: llama-server's /tokenize on the mini PC (SSH alias `mini`).
# llama-server listens only on the Docker bridge (172.17.0.1:8091, see docker-compose.yml).
# Usage (from server/): scripts/tokens.sh [file...]
#   no args: the system prompt as main.go builds it, facts.en.md + examples.en.md joined.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ $# -eq 0 ]; then set -- facts.en.md examples.en.md; fi
cat "$@" |
  python3 -c 'import json, sys; print(json.dumps({"content": sys.stdin.read()}))' |
  ssh -o ConnectTimeout=8 mini 'curl -sf -X POST http://172.17.0.1:8091/tokenize -H "Content-Type: application/json" --data-binary @-' |
  python3 -c 'import json, sys; print(len(json.load(sys.stdin)["tokens"]))'
