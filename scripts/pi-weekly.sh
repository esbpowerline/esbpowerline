#!/usr/bin/env bash
# Weekly on the Pi: the slow-moving sources and the media backup.
#
#   monthly  every held month refetched from the ERP and reparsed (--verify).
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

# SREDA moved to pi-sreda.sh, daily, on 2026-09-16: the register's "as of" date
# changes oftener than once a week, so a weekly fetch was sampling it rather
# than following it.

# --- 1. PGCB monthly reports against the ERP ----------------------------------
# The monthly twin of verify:source. Refetches only months the ledger does not
# already hold as MATCH against the same ERP file id, so a normal week costs
# six listing pages and nothing else — and a workbook PGCB re-uploads under a
# new id is refetched and re-read. First sweep 2026-09-11: 160 of 160 months
# agreed on every headline figure; the five that differed were outage rows the
# old text dumps had lost, re-ingested from the workbooks that day.
export ESB_PGCB_MONTHLY_ARCHIVE="$ROOT/state/pgcb-monthly"
if timeout 3000 "$ROOT/venv/bin/python" scripts/ingest_pgcb_monthly.py --verify | tail -3; then
    git add verification/pgcb-monthly-ledger.json
    if ! git diff --cached --quiet; then
        git commit -q -m "chore(verify): PGCB monthly ledger, weekly on the Pi"
        git pull -q --rebase origin authenticating && git push -q origin HEAD:authenticating && echo "ledger pushed" \
            || notify warn "monthly verify: push failed" "see $LOG"
    fi
else
    notify error "PGCB monthly verify found a published figure that disagrees with the ERP" "see $LOG and verification/pgcb-monthly-ledger.json"
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
