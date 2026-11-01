#!/usr/bin/env bash
# World oil futures settlements, once a day, for the CMS fuel-price card.
#
# 03:30 Dhaka is 17:30/16:30 New York (daylight saving or not) — after NYMEX
# settles WTI, RBOB and ULSD at 14:30 and ICE settles Brent at 19:30 London.
# The script stores only sessions that have settled, so an early or late run
# writes nothing wrong; it looks back three months every time, so a run lost to
# a power cut is caught up by the next. Weekends and US holidays cost one
# request per contract and change nothing.
#
# Writes rows to Postgres and nothing else: no commit, no push, no deploy. It
# takes the shared lock anyway, because pi-ingest.sh does `git reset --hard` on
# the checkout and pulling the tree out from under a running tsx is how one job
# corrupts another.
set -uo pipefail
ROOT="$HOME/esb-ingest"; REPO="$ROOT/repo"; LOGS="$ROOT/logs"; NOTIFY="$ROOT/pi-notify.sh"
LOG="$LOGS/oil-$(date +%Y%m%d).log"
mkdir -p "$LOGS"
exec >>"$LOG" 2>&1
notify() { [[ -x "$NOTIFY" ]] && "$NOTIFY" "$@"; }
echo "=== oil $(date -Is) ==="

exec 9>"$ROOT/.ingest.lock"
flock -w 1800 9 || { echo "poll still running; skipping"; exit 0; }

export PATH="$HOME/.local/node/bin:$PATH" NODE_ENV=production
cd "$REPO" || exit 1

# The script exits 1 when any series stored nothing — read that, not silence.
if ! timeout 600 npx tsx scripts/ingest-oil-settlements.ts; then
    notify warn "oil settlements: run failed" "Yahoo unreachable, a contract unmatched, or the DB refused; see $LOG"
fi

find "$LOGS" -name 'oil-*.log' -mtime +30 -delete
echo "=== oil done $(date -Is) ==="
