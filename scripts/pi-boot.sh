#!/usr/bin/env bash
# The catch-up that runs once, after the Pi comes back up.
#
# cron has no memory. A slot that falls inside a power cut is simply not run:
# the mains here drops for minutes to hours, and a cut spanning 12:30 means the
# poll for that slot never happens at all — the archive then waits for 16:30
# while PGCB has had the day up for hours. Measured on 2026-09-16: the Pi lost
# power around 10:20 and came back at 10:28, between the 09:30 and 12:30 polls,
# and nothing ran in between but the quarter-hourly watcher.
#
# So: on boot, wait for the two things a run needs to be honest (a synchronised
# clock and a reachable network), then do exactly what the missed slot would
# have done — one hourly NLDC capture, then one poll over the trailing window.
# Both runners take their own lock, so a boot that lands on top of a scheduled
# slot costs nothing: whichever gets the lock first runs, the other exits.
#
# Deliberately NOT a second scheduler. It runs once per boot, and it skips the
# poll when one has already run in the last RECENT_POLL_MIN minutes — a reboot
# right after a poll (a card swap, an upgrade) should not re-do the same three
# days. The hourly capture always runs: it is one request per series when NLDC's
# page has not moved, and the demand/supply page rolls off after ~145 days, so
# an hour missed inside the cut is worth picking up immediately.
#
# cron runs the COPY at ~/esb-ingest/pi-boot.sh; pi-ingest.sh refreshes it from
# the repo at the end of each poll and installs the @reboot line (see SCHEDULE).
set -uo pipefail

ROOT="$HOME/esb-ingest"
LOGS="$ROOT/logs"
NOTIFY="$ROOT/pi-notify.sh"
LOG="$LOGS/boot-$(date +%Y%m%d).log"
# How long to wait for clock and network before giving up on this boot.
WAIT_LIMIT_SEC="${ESB_BOOT_WAIT:-600}"
# A poll this recent means the cut did not cost us a slot.
RECENT_POLL_MIN="${ESB_BOOT_RECENT_MIN:-40}"

mkdir -p "$LOGS"
exec >>"$LOG" 2>&1

notify() { [[ -x "$NOTIFY" ]] && "$NOTIFY" "$@"; }

echo "=== $(date -Is) — boot catch-up (up $(uptime -p)) ==="

# The network stack and NTP are usually seconds behind the login that starts
# this; the loop below is the guard, this is just politeness towards them.
sleep 20

waited=0
while :; do
    clock_ok=no
    net_ok=no
    timedatectl show -p NTPSynchronized --value 2>/dev/null | grep -qx yes && clock_ok=yes
    curl -sSfI --max-time 15 https://www.pgcb.gov.bd >/dev/null 2>&1 && net_ok=yes
    [[ "$clock_ok" == yes && "$net_ok" == yes ]] && break
    if (( waited >= WAIT_LIMIT_SEC )); then
        echo "giving up after ${waited}s: clock_synchronised=$clock_ok network=$net_ok"
        # A run with an unsynchronised clock is refused by pi-ingest.sh anyway,
        # and one without a network would only mark every source unreachable.
        notify warn "boot: catch-up skipped" "clock_synchronised=$clock_ok network=$net_ok after ${waited}s"
        exit 0
    fi
    sleep 20
    waited=$((waited + 20))
done
echo "clock synchronised and network up after ${waited}s"

# The hourly capture first: it is cheap, it writes only database rows, and the
# hour lost to the cut is the most perishable thing on this machine.
if [[ -x "$ROOT/pi-hourly.sh" ]]; then
    echo "--- hourly capture"
    "$ROOT/pi-hourly.sh"
    echo "hourly exit $?"
else
    echo "! pi-hourly.sh missing — nothing to run"
fi

# Then the poll, unless one has just run.
recent="$(find "$LOGS" -maxdepth 1 -name '20*-*.log' -mmin "-$RECENT_POLL_MIN" -print -quit 2>/dev/null)"
if [[ -n "$recent" ]]; then
    echo "a poll ran in the last $RECENT_POLL_MIN min ($(basename "$recent")) — not repeating it"
elif [[ -x "$ROOT/pi-ingest.sh" ]]; then
    echo "--- poll (trailing window)"
    "$ROOT/pi-ingest.sh"
    echo "poll exit $?"
else
    echo "! pi-ingest.sh missing — nothing to run"
fi

echo "=== $(date -Is) — boot catch-up done ==="
