#!/usr/bin/env bash
# The hourly capture of NLDC's two paginated pages, from cron on the Pi.
#
# Why this exists at all: `scripts/ingest-nldc-hourly.ts` was written and
# backfilled on 2026-09-05 and then never ran again. Nothing referenced it — no
# runner, no cron line — and its documented invocation could not have worked
# anyway, because it imported `@/lib/prisma`, which opens with `server-only` and
# throws outside a React Server Component. So the single most perishable stream
# in the archive was "IMPLEMENTED" on the priority list and stopped dead at
# 2026-09-05T09:00. Measured 2026-09-06: 26 hours missing.
#
# The stakes are the reason this is a runner and not a crontab one-liner. The
# demand/supply/load-shed page rolls off after ~145 days and nothing else in
# Bangladesh keeps it; an hour not captured inside that window is gone for
# good. The generation page is deep today but is served by the same application,
# one configuration change from behaving the same way.
#
# ── What it costs, and why it is shaped this way ──────────────────────────
#
# Cheap by construction, because it runs 24 times a day forever:
#
#   * One request per series on a quiet tick. NLDC's page 1 changes once an
#     hour; identical bytes are the same SourceDocument, so `--recent` stops at
#     an unchanged page 1 instead of walking on to pages it already holds.
#   * No git. Nothing here commits, and nothing pushes. The rows land in
#     Postgres and the site reads them from there — `authenticating` has
#     deployments disabled in vercel.json, but an hourly commit would still
#     churn the repo the four daily polls have to `git reset --hard` against.
#   * No `--report`. Five aggregate scans per series are worth running after a
#     backfill and are pure waste on a poll.
#   * NODE_ENV=production caps the pg pool at 2 connections instead of 10
#     (lib/prisma-database.ts:67). A batch job needs one. The Supabase session
#     pooler is shared with the live site, and it has run out twice in one day
#     — once killing a production build on /about, once blanking the newsroom
#     column on the analysis page. The Pi must not be a third claimant.
#
# ── Tier ceiling ──────────────────────────────────────────────────────────
#
# The script prints `db_size_mb=` on the connection it already has open. The
# free tier stops at 500 MB; measured 2026-09-06 the database was 142 MB and
# growing by roughly 130 MB a year, nearly all of it evidence bytes. That is
# about two and a half years of headroom — far enough away not to change the
# design, close enough that it must announce itself. WARN_MB below is the
# announcement; past it the archive needs either the object-storage move the
# strategic audit describes or an evidence retention window.
#
# ── Failure posture ───────────────────────────────────────────────────────
#
# A missed hour is recoverable while it is inside NLDC's retention window, so a
# single failed tick is not an emergency and does not page anyone: it is logged,
# and the next tick picks the hour up because `--recent` walks back far enough
# to cover it. Sustained failure is a different thing, and CONSECUTIVE_ALERT
# below is what separates them — one bad tick is weather, four in a row is a
# broken pipe.
#
# cron runs the COPY at ~/esb-ingest/pi-hourly.sh, not this file in the repo,
# for the same reason as pi-ingest.sh: a poll rewrites the checkout underneath a
# running script. pi-ingest.sh copies this file into place on every poll, and
# installs the crontab line too, from the SCHEDULE table beside that copy loop:
#
#   17 * * * * /home/pi/esb-ingest/pi-hourly.sh
#
# It has to. Shipping a runner nothing calls is the whole reason the 26 hours
# above went missing, and "a human SSHes in once" is not a property the archive
# can rest on — the line is declared in the repo now, so a Pi that has lost it,
# or never had it, is scheduled again by the next poll.
#
# :17 is deliberate. The scheduled polls run at :30, the watcher at
# :07/:22/:37/:52, and all of them take the same lock; :17 is the widest gap in
# that timetable, so the common case is that this never waits on anything.

set -uo pipefail

ROOT="$HOME/esb-ingest"
REPO="$ROOT/repo"
STATE="$ROOT/state"
LOGS="$ROOT/logs"
LOG="$LOGS/hourly-$(date +%Y%m%d).log"
NOTIFY="$ROOT/pi-notify.sh"

# How many pages back each series walks. One page carries roughly two days of
# hours, so 2 covers a tick that was skipped, a reboot, or a few hours of
# network trouble without ever walking the archive.
PAGES="${ESB_HOURLY_PAGES:-2}"
# Consecutive failures before anyone is told. See the failure posture above.
CONSECUTIVE_ALERT="${ESB_HOURLY_ALERT_AFTER:-4}"
# Database size, in MB, past which the tier ceiling is worth a warning.
WARN_MB="${ESB_DB_WARN_MB:-400}"
FAILCOUNT="$STATE/hourly-consecutive-failures"

mkdir -p "$STATE" "$LOGS"
exec >>"$LOG" 2>&1

notify() { [[ -x "$NOTIFY" ]] && "$NOTIFY" "$@"; }

echo "=== $(date -Is) — hourly NLDC capture, ${PAGES} page(s) per series ==="

# The same lock every other runner takes. Not for the database — two writers
# would be idempotent, the table is keyed (series, observedAt) — but because
# pi-ingest.sh does `git reset --hard` on this checkout, and pulling the tree
# out from under a running tsx process is how a poll corrupts an unrelated job.
exec 9>"$ROOT/.ingest.lock"
if ! flock -n -w 240 9; then
    echo "another job holds the lock — this hour will be picked up by the next tick"
    exit 0
fi

# The SD card is shared with Jellyfin, which refuses to start under 2 GiB. A
# capture that fills the card to write 34 KB of evidence is a bad trade.
FREE_MB=$(df -Pm "$HOME" | awk 'NR==2{print $4}')
if [[ -n "$FREE_MB" && "$FREE_MB" -lt 1024 ]]; then
    echo "! only ${FREE_MB} MB free — skipping this tick"
    notify error "hourly: disk nearly full" "${FREE_MB} MB free on the SD card; capture skipped"
    exit 1
fi

cd "$REPO" || { notify error "hourly: repo missing" "$REPO is not a checkout"; exit 1; }

export PATH="$HOME/.local/node/bin:$PATH"
export PYTHONUTF8=1
# Caps the pg pool at 2 rather than 10 — see the note above about the pooler.
export NODE_ENV=production

# Deliberately NOT `git pull`. This runner uses whatever the last poll checked
# out; taking a lock and then rewriting the tree hourly would race the four
# jobs that legitimately do that, to pick up changes that arrive daily at most.
OUT=$(timeout 600 npx tsx scripts/ingest-nldc-hourly.ts --recent "$PAGES" 2>&1)
status=$?
echo "$OUT"

if [[ $status -ne 0 ]]; then
    fails=$(( $(cat "$FAILCOUNT" 2>/dev/null || echo 0) + 1 ))
    echo "$fails" >"$FAILCOUNT"
    echo "! capture failed (exit $status) — $fails consecutive"
    if [[ "$fails" -ge "$CONSECUTIVE_ALERT" ]]; then
        notify error "hourly: NLDC capture failing" \
            "$fails consecutive failures; last error: $(echo "$OUT" | tail -3 | tr '\n' ' ')"
    fi
    exit $status
fi

# A clean run resets the counter, so the alert means "still broken" rather than
# "has ever been broken".
[[ -f "$FAILCOUNT" ]] && rm -f "$FAILCOUNT"

# The tier ceiling, announced rather than discovered. `db_size_mb=` is printed
# by the script on the connection it already had open.
DB_MB=$(echo "$OUT" | sed -n 's/^db_size_mb=\([0-9.]*\)$/\1/p' | tail -1)
if [[ -n "$DB_MB" ]]; then
    if awk "BEGIN{exit !($DB_MB > $WARN_MB)}"; then
        echo "! database at ${DB_MB} MB, past the ${WARN_MB} MB mark"
        # Once a day, not once an hour: a ceiling that is still months away
        # should not produce 24 identical alerts.
        STAMPED="$STATE/hourly-db-warned-$(date +%F)"
        if [[ ! -f "$STAMPED" ]]; then
            : >"$STAMPED"
            notify warn "database size" \
                "${DB_MB} MB used; Supabase free tier stops at 500 MB. Evidence bytes are most of the growth — see the retention note in pi-hourly.sh."
        fi
    fi
fi

find "$LOGS" -name 'hourly-*.log' -mtime +14 -delete
find "$STATE" -name 'hourly-db-warned-*' -mtime +7 -delete

echo "=== $(date -Is) — exit 0 ==="
exit 0
