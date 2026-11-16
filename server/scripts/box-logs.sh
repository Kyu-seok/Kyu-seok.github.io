#!/usr/bin/env bash
# Read-only look at the gateway on the mini PC (SSH alias `mini`, LAN only): container logs, the last
# question-log lines, and CPU per container. It changes nothing on the box. Usage: box-logs.sh [lines]
set -euo pipefail
n="${1:-30}"
[[ "$n" =~ ^[0-9]+$ ]] || { echo "usage: $0 [lines]" >&2; exit 2; }
# shellcheck disable=SC2029 # $n is a validated number, expanded here on purpose
ssh -o ConnectTimeout=5 -o BatchMode=yes mini "
  cd ~/portfolio-ask
  echo '== gateway, embed, llama (last $n lines each)'
  docker compose logs --no-color --tail $n gateway embed llama
  echo '== question log (last 5 lines)'
  tail -n 5 \$(ls log/questions-*.jsonl | tail -1)
  echo '== CPU by container'
  docker stats --no-stream --format '{{.Name}} {{.CPUPerc}}' | sort -k2 -rn | head -8
"
