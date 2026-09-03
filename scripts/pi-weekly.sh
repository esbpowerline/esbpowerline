#!/usr/bin/env bash
# Weekly on the Pi: the slow-moving sources and the media backup.
#
#   SREDA    a standing register, not a daily series — a stock as of a date.
#            Refetched weekly from ndre.sreda.gov.bd, written under
#            public/data/sreda/, published as SREDA_DAILY for that date.
#   media    the Supabase `media` bucket (47 MB, ~660 files) mirrored to the
#            Pi. The bucket is public, so its listing needs only the anon key
#            that every visitor's browser already carries.
set -uo pipefail
ROOT="$HOME/esb-ingest"; REPO="$ROOT/repo"; LOGS="$ROOT/logs"; NOTIFY="$ROOT/pi-notify.sh"
LOG="$LOGS/weekly-$(date +%Y%m%d).log"
mkdir -p "$LOGS" "$ROOT/backups/media"
exec >>"$LOG" 2>&1
notify() { [[ -x "$NOTIFY" ]] && "$NOTIFY" "$@"; }
echo "=== weekly $(date -Is) ==="

exec 9>"$ROOT/.ingest.lock"
flock -w 1800 9 || { echo "poll still running; skipping"; exit 0; }

export PYTHONUTF8=1 PATH="$HOME/.local/node/bin:$PATH"
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/esb_deploy_key -o IdentitiesOnly=yes"
cd "$REPO" || exit 1
git fetch -q origin authenticating && git reset -q --hard origin/authenticating

# --- 1. SREDA register -------------------------------------------------------
if timeout 900 npx tsx lib/data/sreda/ingest-sreda.ts; then
    DAY=$(python3 -c "import json;print(json.load(open('lib/sreda-available-dates.json'))[-1])")
    echo "SREDA register as of $DAY"
    git add public/data/sreda lib/sreda-available-dates.json
    if ! git diff --cached --quiet; then
        timeout 600 npx tsx --conditions react-server scripts/publish-local.ts --date "$DAY" --no-aggregates | tail -2
        git commit -q -m "chore(data): SREDA register as of $DAY, weekly on the Pi"
        git pull -q --rebase origin authenticating && git push -q origin HEAD:authenticating && echo "pushed" \
            || notify warn "sreda: push failed" "see $LOG"
    else
        echo "SREDA unchanged since last week"
    fi
else
    notify warn "SREDA ingest failed" "ndre.sreda.gov.bd unreachable or layout changed; see $LOG"
fi

# --- 2. media bucket mirror ----------------------------------------------------
# Listing comes from Postgres, not the Storage API: the anon key can read
# public objects but cannot LIST them (RLS, no anon policy), and the first
# version of this step "mirrored" an empty listing as success while the bucket
# held 659 files. pi_media_mirror.mjs exits non-zero on a zero listing, a
# query failure, or any file it could not fetch — a backup that backed up
# nothing must never look like one that did.
if ! timeout 1200 node scripts/pi_media_mirror.mjs "$ROOT/backups/media" ; then
    notify warn "media mirror failed or incomplete" "see $LOG"
fi

echo "=== weekly done $(date -Is) ==="
