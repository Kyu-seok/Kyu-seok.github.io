#!/usr/bin/env bash
# Read-only look at the gateway on the mini PC (SSH alias `mini`, LAN only): container logs, the last
# question-log lines, and CPU per container. It changes nothing on the box. Usage: box-logs.sh [lines]
set -euo pipefail
n="${1:-30}"
[[ "$n" =~ ^[0-9]+$ ]] || { echo "usage: $0 [lines]" >&2; exit 2; }
# shellcheck disable=SC2029 # $n is a validated number, expanded here on purpose
ssh -n -o ConnectTimeout=5 -o BatchMode=yes mini "
  cd ~/portfolio-ask || exit 1
  echo '== gateway, embed, llama (last $n lines each)'
  docker compose logs --no-color --tail $n gateway embed llama
  echo '== question log (last 5 lines)'
  f=\$(ls log/questions-*.jsonl 2>/dev/null | tail -1)
  if [ -n \"\$f\" ]; then tail -n 5 \"\$f\"; else echo 'no question log found'; fi
  echo '== CPU: this project, then the busiest others'
  cpu=\$(docker stats --no-stream --format '{{.Name}} {{.CPUPerc}}' | sort -k2 -rn)
  printf '%s\\n' \"\$cpu\" | grep '^portfolio-ask'; printf '%s\\n' \"\$cpu\" | grep -v '^portfolio-ask' | head -5
"
