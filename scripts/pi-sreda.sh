#!/usr/bin/env bash
# SREDA's national renewable register, once a day.
#
# It moved here from pi-weekly.sh on 2026-09-16. SREDA is a standing register —
# a stock as of a date, not a daily series (CLAUDE.md, doctrine rule 7) — so
# there is nothing hourly to ask for: ndre.sreda.gov.bd states one "as of" date
# and it changes when SREDA republishes, on no timetable of ours. But it moves
# oftener than once a week: the dates held on 2026-09-16 were 29 Jun, 6, 8 and
# 13 Jul, 3 and 9 Aug, 1, 3 and 10 Sep — and both weekly runs since the runner
# began produced a new one, which is the signature of a register the weekly
# fetch was sampling rather than following.
#
# A day's delay on a capacity register is not an emergency; the cost of closing
# it is one pass over a dozen pages, and the run writes nothing when the figures
# have not changed (the commit is guarded by `git diff --cached --quiet`), so a
# quiet day costs the fetch and nothing else.
#
# 06:30 Dhaka: after pi-monthly.sh at 05:30 and well before the 09:30 poll. It
# takes the same lock as every other runner — not for the database, where the
# writes are idempotent, but because pi-ingest.sh does `git reset --hard` on the
# checkout and pulling the tree out from under a running job is how one corrupts
# another.
set -uo pipefail
ROOT="$HOME/esb-ingest"; REPO="$ROOT/repo"; LOGS="$ROOT/logs"; NOTIFY="$ROOT/pi-notify.sh"
LOG="$LOGS/sreda-$(date +%Y%m%d).log"
mkdir -p "$LOGS"
exec >>"$LOG" 2>&1
notify() { [[ -x "$NOTIFY" ]] && "$NOTIFY" "$@"; }
echo "=== sreda $(date -Is) ==="

exec 9>"$ROOT/.ingest.lock"
flock -w 1800 9 || { echo "poll still running; skipping"; exit 0; }

export PYTHONUTF8=1 PATH="$HOME/.local/node/bin:$PATH"
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/esb_deploy_key -o IdentitiesOnly=yes"
cd "$REPO" || exit 1
git fetch -q origin authenticating && git reset -q --hard origin/authenticating

if timeout 900 npx tsx lib/data/sreda/ingest-sreda.ts; then
    DAY=$(python3 -c "import json;print(json.load(open('lib/sreda-available-dates.json'))[-1])")
    echo "SREDA register as of $DAY"
    git add public/data/sreda lib/sreda-available-dates.json
    if ! git diff --cached --quiet; then
        # Published before the commit, as the monthly runner does: a release row
        # always wins over the static file, so an unpublished commit changes
        # nothing a reader sees.
        timeout 600 npx tsx --conditions react-server scripts/publish-local.ts --date "$DAY" --no-aggregates | tail -2
        git commit -q -m "chore(data): SREDA register as of $DAY, daily on the Pi"
        git pull -q --rebase origin authenticating && git push -q origin HEAD:authenticating && echo "pushed" \
            || notify warn "sreda: push failed" "release rows are live; commit for $DAY not pushed — see $LOG"
    else
        echo "SREDA unchanged since the last run"
    fi
else
    notify warn "SREDA ingest failed" "ndre.sreda.gov.bd unreachable or layout changed; see $LOG"
fi

find "$LOGS" -name 'sreda-*.log' -mtime +30 -delete
echo "=== sreda done $(date -Is) ==="
