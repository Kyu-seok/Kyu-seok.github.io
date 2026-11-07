#!/usr/bin/env bash
# Nightly: commit and push the question log to a private Git repo, so the mini PC is not its only copy.
# One-time setup on the mini PC:
#   git clone git@github.com:<you>/portfolio-ask-log.git ~/portfolio-ask/log   # the repo's deploy key is ~/.ssh/id_ed25519.pub
#   crontab -e  ->  17 3 * * * ~/portfolio-ask/scripts/mirror-log.sh >> ~/portfolio-ask/mirror.log 2>&1
set -eu
cd "${LOG_DIR:-$HOME/portfolio-ask/log}"
git add -A
git diff --cached --quiet && exit 0
git -c user.name=portfolio-ask -c user.email=ask@code-bite.com commit -q -m "log: $(date -u +%F)"
git push -q origin HEAD
