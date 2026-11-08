#!/usr/bin/env bash
# Nightly: commit and push the question log to a private Git repo, so the mini PC is not its only copy.
# One-time setup (log/ already has files, so it is git-init'ed in place, never cloned over):
#   on GitHub: private repo portfolio-ask-log with a write-enabled deploy key = the mini PC's ~/.ssh/portfolio-ask-log.pub
#   on the mini PC, in ~/portfolio-ask/log:
#     git init -b main && git remote add origin git@github.com:<you>/portfolio-ask-log.git
#     git config core.sshCommand 'ssh -i ~/.ssh/portfolio-ask-log -o IdentitiesOnly=yes'
#   crontab -e  ->  17 3 * * * $HOME/portfolio-ask/scripts/mirror-log.sh >> $HOME/portfolio-ask/mirror.log 2>&1
set -eu
cd "${LOG_DIR:-$HOME/portfolio-ask/log}"
git add -A
git diff --cached --quiet && exit 0
git -c user.name=portfolio-ask -c user.email=ask@code-bite.com commit -q -m "log: $(date -u +%F)"
git push -q origin HEAD
