#!/usr/bin/env bash
# The poll that runs on the Raspberry Pi, four times a day, from cron.
#
# GitHub Actions was the plan (.github/workflows/ingest.yml, still in the repo)
# and it never ran: every dispatch on chiefhamim/esbpowerline ends in
# `startup_failure`, including a one-line `echo hello` workflow, so Actions is
# blocked at the account level rather than by the workflow (2026-09-03). The Pi
# is a better host anyway — it is on a Bangladeshi connection, so PGCB's ERP and
# Petrobangla see a local visitor, and it is already up 24/7 for the seedbox.
#
# Layout it expects, all created by the setup (see CLAUDE.md § Ingestion):
#   ~/esb-ingest/repo        clone of `authenticating`, deploy-key remote
#   ~/esb-ingest/deps        the eight npm packages publish-local.ts needs,
#                            symlinked in as repo/node_modules (a full install
#                            is ~1.4 GB and this card has ~1.6 GB spare)
#   ~/esb-ingest/venv        pandas, openpyxl, pypdf, pymupdf
#   ~/esb-ingest/state       workbook archive, extractor drop, source index
#   ~/esb-ingest/logs        one log per run, pruned to 30 days
#
# Load shedding is not a problem worth engineering around: every run re-does the
# trailing three energy days, so a poll missed while the power is out is picked
# up by the next one.
set -uo pipefail

ROOT="$HOME/esb-ingest"
REPO="$ROOT/repo"
STATE="$ROOT/state"
LOGS="$ROOT/logs"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$LOGS/$STAMP.log"
DAYS="${ESB_INGEST_DAYS:-3}"

mkdir -p "$STATE/pgcb-archive" "$STATE/daily-reports" "$LOGS"
exec >>"$LOG" 2>&1

echo "=== $(date -Is) — trailing $DAYS days ==="

# Every path the chain would otherwise resolve to a Windows drive.
export ESB_PGCB_ARCHIVE="$STATE/pgcb-archive"
export ESB_DAILY_REPORTS_ROOT="$STATE/daily-reports"
export ESB_SOURCE_INDEX="$STATE/source-index.json"
export PYTHONUTF8=1
export PATH="$HOME/.local/node/bin:$PATH"
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/esb_deploy_key -o IdentitiesOnly=yes"

cd "$REPO" || exit 1

# Refuse to run on a machine that has lost its clock: the window is computed as
# "yesterday in Dhaka", so a wrong date silently ingests the wrong days.
if ! timedatectl show -p NTPSynchronized --value | grep -q yes; then
    echo "! clock is not NTP-synchronised — refusing to guess which day it is"
    exit 1
fi

# A dirty tree means a previous run half-failed. Reset rather than pile on:
# the archive of record is what is on the remote, and every file this chain
# writes is reproducible from the sources.
git fetch -q origin authenticating || { echo "! fetch failed"; exit 1; }
git checkout -q authenticating
git reset -q --hard origin/authenticating

"$ROOT/venv/bin/python" scripts/ingest_recent_days.py --days "$DAYS"
status=$?

# Commit only data paths. The chain must never be able to push code from here.
git add public/data lib/available-dates.json
if git diff --cached --quiet; then
    echo "no new files"
else
    days=$(git diff --cached --name-only -- public/data/daily | sed -E 's#.*/([0-9-]+)\.json#\1#' | sort | tr '\n' ' ')
    git commit -q -m "chore(data): ingest energy day(s) ${days:-refresh} from the scheduled poll"
    git pull -q --rebase origin authenticating && git push -q origin HEAD:authenticating \
        && echo "pushed: ${days:-refresh}" || echo "! push failed — the release rows are live, the commit is not"
fi

find "$LOGS" -name '*.log' -mtime +30 -delete
echo "=== $(date -Is) — exit $status ==="
exit $status
