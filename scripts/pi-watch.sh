#!/usr/bin/env bash
# The watcher that runs between the polls — every 15 minutes, 08:00–23:00 Dhaka.
#
# pi-ingest.sh is a timetable, and a timetable cannot be better than its slots.
# PGCB filed energy day 2026-09-03 between the 09:30 and the 12:30 poll and the
# site carried a stale newest day for three hours; Petrobangla filed the window
# for 2026-09-02 after the 12:30 poll had already run and it waited on 16:30.
# Neither was blocked on anything — the chain has published gasless days since
# it was written — they were waiting on a clock.
#
# So this asks first and works second. watch_sources.py puts one question to
# each publisher, independently, about that publisher's own documents, and
# names only the energy days a publisher demonstrably has and this archive
# demonstrably lacks. Nothing named, nothing runs, and the tick costs one fetch
# of Petrobangla's listing and — while the newest day is already held — not a
# single request to PGCB.
#
# When there IS something, the work is handed to pi-ingest.sh with the days
# named rather than reimplemented here. That runner already owns the lock, the
# clock and disk guards, the live-site check, the reset, the commit, the push
# and its own self-update; a second copy of all that would be a second thing to
# keep in step with it, and the first divergence would be silent.
#
# cron runs the COPY at ~/esb-ingest/pi-watch.sh, for the same reason
# pi-ingest.sh does: a run can `git reset --hard` the file it is being read
# from. pi-ingest.sh refreshes this copy from the repo at the end of each poll.
#
# Offset off :30 rather than */15: a tick that fired at the same minute as a
# scheduled poll would take the lock first, and the poll — the only thing that
# runs the trailing window — would find it held and skip that slot entirely.
#
#   7,22,37,52 8-22 * * *  $HOME/esb-ingest/pi-watch.sh
set -uo pipefail

ROOT="$HOME/esb-ingest"
REPO="$ROOT/repo"
STATE="$ROOT/state"
LOGS="$ROOT/logs"
NOTIFY="$ROOT/pi-notify.sh"

mkdir -p "$STATE" "$LOGS"
# One log per day, not per tick: sixty files a day would bury the poll logs
# they sit next to, and pi-ingest.sh's own `find -mtime +30 -delete` prunes
# these along with them.
exec >>"$LOGS/watch-$(date +%Y%m%d).log" 2>&1

notify() { [[ -x "$NOTIFY" ]] && "$NOTIFY" "$@"; }

# Same paths the chain resolves — watch_sources.py reads the workbook store to
# answer "does PGCB have this day" without going to the network, and files what
# it does fetch there for the chain to pick up.
export ESB_PGCB_ARCHIVE="$STATE/pgcb-archive"
export ESB_DAILY_REPORTS_ROOT="$STATE/daily-reports"
export ESB_SOURCE_INDEX="$STATE/source-index.json"
export ESB_GRID_BACKLOG="$STATE/grid-backlog"
export ESB_PETROBANGLA_JSON_STAGING="$STATE/grid-backlog/petrobangla_json"
export ESB_PETROBANGLA_HOT_FOLDER="$STATE/petrobangla-inbox"
# Outside the repo on purpose: pi-ingest.sh resets the working tree every run,
# and the attempt counters are the only thing standing between a day the parser
# refuses and sixty retries a day.
export ESB_WATCH_STATE="$STATE/watch-state.json"
export PYTHONUTF8=1
export PATH="$HOME/.local/node/bin:$PATH"
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/esb_deploy_key -o IdentitiesOnly=yes"

cd "$REPO" || { echo "$(date -Is) repo missing at $REPO"; exit 1; }

# Test the poll lock without taking it. `flock -n FILE true` acquires, runs and
# releases, so pi-ingest.sh can still take it a moment later; holding it here
# and handing off would deadlock the runner against this script's own fd.
if ! flock -n "$ROOT/.ingest.lock" true; then
    echo "$(date -Is) a poll is running — skipping this tick"
    exit 0
fi

# The archive of record is the remote, so ask what the remote holds. Without
# this the watcher compares against a local tree that a failed push or a commit
# from another machine has already made a lie, and names days that are on the
# site already. A fetch with nothing to fetch is a ref exchange, not 413 MB.
if git fetch -q origin authenticating 2>/dev/null; then
    git reset -q --hard origin/authenticating
else
    echo "$(date -Is) fetch failed — comparing against the local tree instead"
fi

days="$("$ROOT/venv/bin/python" scripts/watch_sources.py)"
status=$?

if [[ $status -ne 0 ]]; then
    echo "$(date -Is) watcher exited $status"
    # A broken watcher is silent by nature — it simply never finds anything —
    # so it has to say so. Once every six hours, not once every fifteen
    # minutes: an alert that arrives 96 times a day is one nobody reads.
    stamp="$STATE/.watch-alert"
    if [[ ! -f "$stamp" ]] || (( $(date +%s) - $(stat -c %Y "$stamp") > 21600 )); then
        touch "$stamp"
        notify error "watch: source check failed" "watch_sources.py exited $status; see $LOGS/watch-$(date +%Y%m%d).log"
    fi
    exit "$status"
fi

if [[ -z "${days// /}" ]]; then
    echo "$(date -Is) nothing new"
    exit 0
fi

dates="$(echo "$days" | tr -s '[:space:]' ',' | sed 's/^,//; s/,$//')"
echo "$(date -Is) new data for: $dates — handing to the poll runner"
export ESB_INGEST_DATES="$dates"
exec "$ROOT/pi-ingest.sh"
