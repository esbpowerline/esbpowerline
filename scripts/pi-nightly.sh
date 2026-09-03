#!/usr/bin/env bash
# Nightly on the Pi: prove the archive, re-check it against the publishers,
# and back the database up. None of this touches Vercel; the only Supabase
# traffic is one pg_dump through the session pooler.
#
#   verify:data    self-consistency across every held day. ERROR means WE
#                  corrupted something; the run is red and you are told.
#   verify:source  refetch the last week's documents from PGCB and Petrobangla,
#                  reparse, diff. INDICATOR means a published figure disagrees
#                  with the source. The ledger is committed — it is the audit
#                  evidence, and the publisher will not serve that document
#                  forever.
#   pg_dump        the whole database, gzipped, 14 kept. The card has room for
#                  a year of these; they move to the HDD once space is freed.
set -uo pipefail
ROOT="$HOME/esb-ingest"; REPO="$ROOT/repo"; LOGS="$ROOT/logs"; NOTIFY="$ROOT/pi-notify.sh"
BACKUPS="$ROOT/backups"
LOG="$LOGS/nightly-$(date +%Y%m%d).log"
mkdir -p "$LOGS" "$BACKUPS"
exec >>"$LOG" 2>&1
notify() { [[ -x "$NOTIFY" ]] && "$NOTIFY" "$@"; }
echo "=== nightly $(date -Is) ==="

exec 9>"$ROOT/.ingest.lock"
flock -w 1800 9 || { echo "poll still running after 30 min; skipping tonight"; exit 0; }

export PYTHONUTF8=1 PATH="$HOME/.local/node/bin:$PATH"
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/esb_deploy_key -o IdentitiesOnly=yes"
export ESB_PGCB_ARCHIVE="$ROOT/state/pgcb-archive" ESB_DAILY_REPORTS_ROOT="$ROOT/state/daily-reports"
export ESB_SOURCE_INDEX="$ROOT/state/source-index.json" ESB_GRID_BACKLOG="$ROOT/state/grid-backlog"
cd "$REPO" || exit 1
git fetch -q origin authenticating && git reset -q --hard origin/authenticating

# --- 1. self-consistency ---------------------------------------------------
if timeout 1200 node scripts/verify-data.mjs --errors-only; then
    echo "verify:data — no ERRORs"
else
    notify error "verify:data found ERRORs" "$(grep -E 'ERROR' "$LOG" | tail -3)"
fi

# --- 2. source fidelity, trailing week -------------------------------------
FROM=$(date -d '8 days ago' +%F); TO=$(date -d 'yesterday' +%F)
if timeout 1500 node scripts/verify-source.mjs --from "$FROM" --to "$TO" --resume --python "$ROOT/venv/bin/python"; then
    echo "verify:source — clean $FROM..$TO"
else
    notify warn "verify:source: drift or indicator" "$FROM..$TO — see $LOG"
fi
git add verification/source-ledger.json
if ! git diff --cached --quiet; then
    git commit -q -m "chore(verify): source ledger, nightly on the Pi ($FROM..$TO)"
    git pull -q --rebase origin authenticating && git push -q origin HEAD:authenticating && echo "ledger pushed" \
        || notify warn "verify: ledger push failed" "see $LOG"
fi

# --- 3. database backup ------------------------------------------------------
# The pooled URL is transaction-mode (6543), which pg_dump cannot use; the same
# credential on 5432 is the session pooler, which it can (tested 2026-09-03).
URL=$(grep '^DATABASE_URL=' "$REPO/.env.local" | cut -d= -f2- | tr -d '"' | sed 's/:6543/:5432/; s/[?&]pgbouncer=true//')
OUT="$BACKUPS/esbpowerline-$(date +%Y%m%d).sql.gz"
if [[ -n "$URL" ]] && PGCONNECT_TIMEOUT=20 timeout 900 pg_dump "$URL" --no-owner --no-privileges | gzip -6 > "$OUT.part" && [[ $(stat -c %s "$OUT.part") -gt 100000 ]]; then
    mv "$OUT.part" "$OUT"
    echo "backup $(du -h "$OUT" | cut -f1) → $OUT"
    ls -1t "$BACKUPS"/esbpowerline-*.sql.gz | tail -n +15 | xargs -r rm -f
else
    rm -f "$OUT.part"
    notify error "database backup failed" "pg_dump did not produce a usable dump; see $LOG"
fi

echo "=== nightly done $(date -Is) ==="
