#!/usr/bin/env bash
# The poll that runs on the Raspberry Pi, four times a day, from cron.
#
# GitHub Actions was the plan and it never ran: every dispatch under the old
# `chiefhamim` account ended in `startup_failure`, including a one-line
# `echo hello` workflow, so Actions was blocked at the ACCOUNT level rather
# than by the workflow. The workflow was removed on 2026-09-03 — each
# scheduled tick emailed Hamim a startup failure.
#
# The repo moved to the `esbpowerline` org on 2026-09-09, and that block was a
# property of the old account, so Actions may well work now. Nobody has
# retested it. If it does run, the nightly verify sweeps are the obvious
# candidate to move off this Pi. The Pi stays the better host for the INGEST
# either way — it is on a Bangladeshi connection, so PGCB's ERP and
# Petrobangla see a local visitor, and it is already up 24/7 for the seedbox.
#
# Layout it expects, all created by the setup (see CLAUDE.md § Ingestion):
#   ~/esb-ingest/repo        clone of `authenticating`, deploy-key remote
#   ~/esb-ingest/deps        the npm packages publish-local.ts needs, symlinked
#                            in as repo/node_modules (a full install is ~1.4 GB)
#   ~/esb-ingest/venv        pandas, openpyxl, pypdf, pymupdf
#   ~/esb-ingest/state       workbook archive, extractor drop, source index
#   ~/esb-ingest/logs        one log per run, pruned to 30 days
#
# What happens when the power goes mid-run — which on this mains supply is a
# matter of when, not if:
#   * Every run starts with `git reset --hard origin/authenticating`, so a
#     half-written file in the repo is discarded, never committed.
#   * Downloads are written to a temp name and renamed, and a workbook is only
#     reused after its zip directory reads whole (download.py), so a torn file
#     is refetched rather than trusted.
#   * Publishing is per release row; a cut between rows leaves a day partly
#     published, and the next poll — which re-does the same three days —
#     publishes the rest. Worst case is a few hours with a day's KPIs live and
#     its curve tab saying the curve is not held yet.
#   * The cron lock below means an overlapping poll after a reboot simply
#     exits; the timeout means a hung publisher cannot pin the Pi forever.
#
# cron runs the COPY at ~/esb-ingest/pi-ingest.sh, not this file in the repo:
# the run does `git reset --hard`, and bash reads a script incrementally, so
# rewriting the file being executed can drop it mid-run. The copy is refreshed
# from the repo at the end of each run, so an edit here lands on the next poll.
set -uo pipefail

ROOT="$HOME/esb-ingest"
REPO="$ROOT/repo"
STATE="$ROOT/state"
LOGS="$ROOT/logs"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$LOGS/$STAMP.log"
DAYS="${ESB_INGEST_DAYS:-3}"
# Set by pi-watch.sh, which has already asked the publishers which days moved.
# Running the trailing window on top of that would re-do two days for nothing,
# and the window cannot reach a gas window filed late enough to have fallen out
# of it — which is the case this runner alone could never cover.
DATES="${ESB_INGEST_DATES:-}"
NOTIFY="$ROOT/pi-notify.sh"
SITE="${ESB_SITE_URL:-https://esbpowerline.com}"

mkdir -p "$STATE/pgcb-archive" "$STATE/daily-reports" "$LOGS"
exec >>"$LOG" 2>&1

notify() { [[ -x "$NOTIFY" ]] && "$NOTIFY" "$@"; }

if [[ -n "$DATES" ]]; then
    echo "=== $(date -Is) — days named by the watcher: $DATES ==="
else
    echo "=== $(date -Is) — trailing $DAYS days ==="
fi

# One poll at a time. A reboot mid-run and a cron tick can otherwise overlap,
# and two chains writing the same day file is the one way to corrupt it.
exec 9>"$ROOT/.ingest.lock"
if ! flock -n 9; then
    echo "another poll is still running — leaving it to finish"
    exit 0
fi

# Every path the chain would otherwise resolve to a Windows drive.
export ESB_PGCB_ARCHIVE="$STATE/pgcb-archive"
export ESB_DAILY_REPORTS_ROOT="$STATE/daily-reports"
export ESB_SOURCE_INDEX="$STATE/source-index.json"
# daily_extractor/config.py defaults these three to ~/Desktop, which is how a
# grid_backlog folder appeared on the desktop of a machine nobody had ever run
# the extractor on interactively (2026-09-03). Working directories belong with
# the rest of the run state.
export ESB_GRID_BACKLOG="$STATE/grid-backlog"
export ESB_PETROBANGLA_JSON_STAGING="$STATE/grid-backlog/petrobangla_json"
export ESB_PETROBANGLA_HOT_FOLDER="$STATE/petrobangla-inbox"
export PYTHONUTF8=1
export PATH="$HOME/.local/node/bin:$PATH"
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/esb_deploy_key -o IdentitiesOnly=yes"

cd "$REPO" || { notify error "ingest: repo missing" "$REPO is not a checkout"; exit 1; }

# Refuse to run on a machine that has lost its clock: the window is computed as
# "yesterday in Dhaka", so a wrong date silently ingests the wrong days.
if ! timedatectl show -p NTPSynchronized --value | grep -q yes; then
    echo "! clock is not NTP-synchronised — refusing to guess which day it is"
    notify error "ingest: clock not synchronised" "refusing to run until NTP agrees"
    exit 1
fi

# The SD card is the scarce resource on this box (Jellyfin refuses to start
# under 2 GiB free). A poll that fills it would take the media server down.
FREE_MB=$(df -Pm "$HOME" | awk 'NR==2{print $4}')
if [[ "${FREE_MB:-0}" -lt 1024 ]]; then
    echo "! only ${FREE_MB} MB free on the card — refusing to write"
    notify error "ingest: disk nearly full" "${FREE_MB} MB free on the SD card; poll skipped"
    exit 1
fi

# Before doing anything new: is what the LAST poll published actually what the
# live site serves? Assume it is not until proven. The edge cache turns over
# within ten minutes, and polls are hours apart, so a mismatch here is real.
if [[ -f "$STATE/last-published.json" ]]; then
    "$ROOT/venv/bin/python" - "$STATE/last-published.json" "$SITE" <<'PY' || notify warn "ingest: live site disagrees with last publish" "$(tail -1 "$LOG")"
import hashlib, json, sys, urllib.request
# Compare VALUES, not bytes: the release layer re-serialises, so 17.0 comes
# back as 17 and a byte hash of the two disagrees while every figure agrees.
def norm(o):
    if isinstance(o, dict): return {k: norm(v) for k, v in o.items()}
    if isinstance(o, list): return [norm(v) for v in o]
    if isinstance(o, float) and o.is_integer(): return int(o)
    return o
def digest(o): return hashlib.sha256(json.dumps(norm(o), sort_keys=True, separators=(",", ":")).encode()).hexdigest()
state = json.load(open(sys.argv[1]))
day, want = state["day"], state["sha256"]
req = urllib.request.Request(f"{sys.argv[2]}/api/data/daily/{day}.json", headers={
    "User-Agent": "Mozilla/5.0 (esb-pi-verify)", "Referer": f"{sys.argv[2]}/grid-explorer"})
try:
    body = urllib.request.urlopen(req, timeout=30).read()
except Exception as e:
    print(f"live check: could not fetch {day}: {e}"); sys.exit(0)  # network, not a publish fault
got = digest(json.loads(body))
if got != want:
    print(f"live check: {day} on the site differs from what was published ({got[:12]} vs {want[:12]})"); sys.exit(1)
print(f"live check: {day} matches what was published")
PY
fi

# A dirty tree means a previous run half-failed. Reset rather than pile on:
# the archive of record is what is on the remote, and every file this chain
# writes is reproducible from the sources.
git fetch -q origin authenticating || { echo "! fetch failed"; notify error "ingest: git fetch failed" "GitHub unreachable or deploy key rejected"; exit 1; }
git checkout -q authenticating
git reset -q --hard origin/authenticating

# Regenerate the Prisma client when, and only when, the schema has moved.
#
# This is the trap that took the hourly capture down for a day. On 2026-09-06
# every tick logged "0 pages, 0 rows, 2 failed" on both series and exited 0,
# and the cause was that `prisma/schema.prisma` carried `sourceUrl` while the
# generated client on this Pi did not: 132 rejected writes, no alert, and the
# most perishable stream in the archive stopped in silence. The checkout is
# updated by the reset above; the client it generates was updated by nobody.
#
# Keyed on a hash of the schema rather than a timestamp, so it is skipped on
# every ordinary poll — generate takes ~40 s on this hardware and the schema
# changes a few times a month. A failure here is fatal on purpose: continuing
# with a stale client is precisely the silent-corruption case above.
SCHEMA_STAMP="$STATE/schema.sha256"
SCHEMA_NOW=$(sha256sum prisma/schema.prisma | cut -d' ' -f1)
if [[ "$SCHEMA_NOW" != "$(cat "$SCHEMA_STAMP" 2>/dev/null)" ]]; then
    echo "schema changed — regenerating the Prisma client"
    if PATH="$HOME/.local/node/bin:$PATH" timeout 300 npx prisma generate >/dev/null 2>&1; then
        echo "$SCHEMA_NOW" >"$SCHEMA_STAMP"
        echo "  prisma client regenerated"
    else
        echo "! prisma generate failed — refusing to run against a stale client"
        notify error "ingest: prisma generate failed"             "schema.prisma moved but the client could not be regenerated; every script on this Pi would write against the old columns"
        exit 1
    fi
fi

if [[ -n "$DATES" ]]; then
    timeout 1500 "$ROOT/venv/bin/python" scripts/ingest_recent_days.py --dates "$DATES"
else
    timeout 1500 "$ROOT/venv/bin/python" scripts/ingest_recent_days.py --days "$DAYS"
fi
status=$?
if [[ $status -eq 124 ]]; then
    echo "! chain timed out after 25 minutes"
    notify error "ingest: timed out" "chain killed after 25 min; see $LOG"
elif [[ $status -ne 0 ]]; then
    notify error "ingest: a day failed" "$(grep -E '^\| 20' "$LOG" | grep -v published | tail -3)"
fi

# Remember what the newest held day looks like, for the live check next poll.
"$ROOT/venv/bin/python" - "$STATE/last-published.json" <<'PY'
import hashlib, json, sys
def norm(o):
    if isinstance(o, dict): return {k: norm(v) for k, v in o.items()}
    if isinstance(o, list): return [norm(v) for v in o]
    if isinstance(o, float) and o.is_integer(): return int(o)
    return o
dates = json.load(open("lib/available-dates.json"))
day = dates[-1]
doc = json.load(open(f"public/data/daily/{day}.json", encoding="utf-8"))
sha = hashlib.sha256(json.dumps(norm(doc), sort_keys=True, separators=(",", ":")).encode()).hexdigest()
json.dump({"day": day, "sha256": sha}, open(sys.argv[1], "w"))
print(f"recorded {day} {sha[:12]} for the next live check")
PY

# Commit only data paths. The chain must never be able to push code from here.
# recent-artifacts.json is compiled into the admin bundle rather than read from
# disk — it is the only way the deployed coverage screen can see that a day
# shipped with its curve and station detail. The chain rewrites it; if it is not
# committed the panel's strip goes stale while the site itself is fine.
git add public/data lib/available-dates.json lib/data/grid/recent-artifacts.json
if git diff --cached --quiet; then
    echo "no new files"
else
    days=$(git diff --cached --name-only -- public/data/daily | sed -E 's#.*/([0-9-]+)\.json#\1#' | sort | tr '\n' ' ')
    git commit -q -m "chore(data): ingest energy day(s) ${days:-refresh} from the scheduled poll"
    if git pull -q --rebase origin authenticating && git push -q origin HEAD:authenticating; then
        echo "pushed: ${days:-refresh}"
    else
        echo "! push failed — the release rows are live, the commit is not"
        notify warn "ingest: push failed" "release rows are live; commit for ${days:-refresh} not pushed"
    fi
fi

# How far behind is the archive? Two days back is PGCB being slow; three is us.
"$ROOT/venv/bin/python" - <<'PY' || notify warn "ingest: archive falling behind" "$(tail -1 "$LOG")"
import json, datetime, sys
dates = json.load(open("lib/available-dates.json"))
latest = datetime.date.fromisoformat(dates[-1])
today = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=6))).date()
behind = (today - datetime.timedelta(days=1) - latest).days
print(f"newest held day {latest}, {behind} day(s) behind the newest that can exist")
sys.exit(1 if behind >= 3 else 0)
PY

find "$LOGS" -name '*.log' -mtime +30 -delete

# Pick up any change to this script for the next run (see the note at the top).
if ! cmp -s "$REPO/scripts/pi-ingest.sh" "$ROOT/pi-ingest.sh"; then
    cp "$REPO/scripts/pi-ingest.sh" "$ROOT/pi-ingest.sh"
    chmod +x "$ROOT/pi-ingest.sh"
    echo "runner updated from the repo — effective next poll"
fi
for helper in pi-notify.sh pi-nightly.sh pi-weekly.sh pi-watch.sh pi-hourly.sh pi-monthly.sh; do
    if [[ -f "$REPO/scripts/$helper" ]] && ! cmp -s "$REPO/scripts/$helper" "$ROOT/$helper"; then
        cp "$REPO/scripts/$helper" "$ROOT/$helper"; chmod +x "$ROOT/$helper"
        echo "$helper updated from the repo"
    fi
done

# A helper on disk that nothing schedules is a helper that does not run. That is
# exactly how ingest-nldc-hourly.ts sat "IMPLEMENTED 2026-09-05" on the priority
# list while the most perishable stream in the archive stopped dead — 26 hours
# missing when it was found on 2026-09-06. The loop above guarantees every runner
# is present and current; only the crontab decides whether one is ever called,
# and until now that lived nowhere but the Pi's own crontab and a paragraph of
# CLAUDE.md. Declaring it beside the copy loop closes the gap: a runner added to
# the repo with a schedule next to it is scheduled by the next poll, with no
# session on the Pi at all.
#
# Deliberately additive, and that restraint is the point. A helper already named
# anywhere in the crontab is left exactly as it stands, whatever schedule or
# redirection it carries — those four lines were typed by hand months ago, this
# runner cannot see what else is on them, and rewriting four working jobs to
# match a table authored on a Windows box is a poor trade for installing one
# missing line. A schedule that disagrees with this table is reported and left.
declare -a SCHEDULE=(
    "pi-ingest.sh|30 9,12,16,21 * * *"
    "pi-watch.sh|7,22,37,52 8-22 * * *"
    "pi-hourly.sh|17 * * * *"
    "pi-nightly.sh|30 2 * * *"
    "pi-weekly.sh|30 3 * * 0"
    # PGCB's monthly report, once a day. 05:30 sits after the nightly sweep
    # (which can hold the lock for a while) and well before the 09:30 poll.
    "pi-monthly.sh|30 5 * * *"
)
if command -v crontab >/dev/null; then
    cron_now="$(crontab -l 2>/dev/null || true)"
    declare -a cron_add=()
    for entry in "${SCHEDULE[@]}"; do
        helper="${entry%%|*}"; when="${entry#*|}"
        [[ -x "$ROOT/$helper" ]] || continue
        held="$(grep -F -- "$helper" <<<"$cron_now" | head -1)"
        if [[ -n "$held" ]]; then
            [[ "$held" == "$when "* ]] || echo "cron: $helper runs as '$held' — the repo declares '$when' (left alone)"
            continue
        fi
        cron_add+=("$when $ROOT/$helper")
    done
    if (( ${#cron_add[@]} )); then
        if { [[ -n "$cron_now" ]] && printf '%s\n' "$cron_now"; printf '%s\n' "${cron_add[@]}"; } | crontab -; then
            printf 'cron: installed %s\n' "${cron_add[@]}"
            notify warn "ingest: cron entries installed" "$(printf '%s; ' "${cron_add[@]}")"
        else
            echo "! cron: could not install ${#cron_add[@]} entry(ies) — schedule unchanged"
            notify warn "ingest: cron install failed" "$(printf '%s; ' "${cron_add[@]}")"
        fi
    fi
fi

echo "=== $(date -Is) — exit $status ==="
exit $status
