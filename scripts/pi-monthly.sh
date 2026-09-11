#!/usr/bin/env bash
# Daily on the Pi: PGCB's monthly System Operation Report.
#
# PGCB posts one workbook a month on its ERP, some days into the following
# month, on no fixed date. Until 2026-09-11 the monthly archive was fed by hand
# from a Desktop folder that no longer exists on any machine, which is how the
# Grid Explorer's Macro Trends sat on June 2026 while July had been on the ERP
# for weeks. A once-a-day look is the whole cost: the listing is one GET, and a
# month already held is never fetched again.
#
# The chain is scripts/ingest_pgcb_monthly.py — the same file a session runs by
# hand on the Windows box. This runner only adds the lock, the publish, the
# commit and the live check. It takes the ingest lock because pi-ingest.sh
# does `git reset --hard` on this checkout and pulling the tree out from under
# a running parser is how one job corrupts another.
#
#   ESB_MONTHLY_MONTHS="2026-07 2026-08"  re-ingest held months — after a parser
#                                         fix, or to publish a month that reached
#                                         the archive by hand and never got its
#                                         release rows.
set -uo pipefail
ROOT="$HOME/esb-ingest"; REPO="$ROOT/repo"; STATE="$ROOT/state"; LOGS="$ROOT/logs"; NOTIFY="$ROOT/pi-notify.sh"
SITE="${ESB_SITE_URL:-https://esbpowerline.com}"
LOG="$LOGS/monthly-$(date +%Y%m%d).log"
LAST="$STATE/monthly-last-published.json"
mkdir -p "$LOGS" "$STATE/pgcb-monthly"
exec >>"$LOG" 2>&1
notify() { [[ -x "$NOTIFY" ]] && "$NOTIFY" "$@"; }
echo "=== monthly $(date -Is) ==="

exec 9>"$ROOT/.ingest.lock"
flock -w 1800 9 || { echo "poll still running; skipping"; exit 0; }

export PYTHONUTF8=1 PATH="$HOME/.local/node/bin:$PATH"
export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/esb_deploy_key -o IdentitiesOnly=yes"
export ESB_PGCB_MONTHLY_ARCHIVE="$STATE/pgcb-monthly"
cd "$REPO" || { notify error "monthly: repo missing" "$REPO is not a checkout"; exit 1; }

# Is what the LAST run published actually what the site serves? Checked a day
# later on purpose: the release route caches a miss for ten minutes, so asking
# seconds after the publish reads a stale 404 and cries wolf. Values are
# compared, not bytes — the release layer re-serialises 17.0 as 17.
if [[ -f "$LAST" ]]; then
    "$ROOT/venv/bin/python" - "$LAST" "$SITE" <<'PY' || notify warn "monthly: live site disagrees with last publish" "$(tail -1 "$LOG")"
import hashlib, json, sys, urllib.request
def norm(o):
    if isinstance(o, dict): return {k: norm(v) for k, v in o.items()}
    if isinstance(o, list): return [norm(v) for v in o]
    if isinstance(o, float) and o.is_integer(): return int(o)
    return o
def digest(o): return hashlib.sha256(json.dumps(norm(o), sort_keys=True, separators=(",", ":")).encode()).hexdigest()
state = json.load(open(sys.argv[1]))
month, want = state["month"], state["sha256"]
# Two runs seconds apart (a hand re-run after the scheduled one) compared a
# fresh digest against a payload the edge had cached from the run before and
# paged Telegram for nothing (2026-09-11 21:36). Inside the cache window the
# answer is not known yet, and "not yet" is not a disagreement.
import time
if time.time() - state.get("published_at", 0) < 900:
    print(f"live check: {month} was published under 15 minutes ago; the edge may still hold the old copy — skipped"); sys.exit(0)
req = urllib.request.Request(f"{sys.argv[2]}/api/data/pgcb-monthly/{month}.json", headers={
    "User-Agent": "Mozilla/5.0 (esb-pi-verify)", "Referer": f"{sys.argv[2]}/grid-explorer"})
try:
    body = urllib.request.urlopen(req, timeout=30).read()
except Exception as e:
    print(f"live check: could not fetch {month}: {e}"); sys.exit(0)  # network, not a publish fault
got = digest(json.loads(body))
if got != want:
    print(f"live check: {month} on the site differs from what was published ({got[:12]} vs {want[:12]})"); sys.exit(1)
print(f"live check: {month} matches what was published")
PY
fi

git fetch -q origin authenticating && git reset -q --hard origin/authenticating \
    || { notify error "monthly: git fetch failed" "GitHub unreachable or deploy key rejected; see $LOG"; exit 1; }

args=()
for m in ${ESB_MONTHLY_MONTHS:-}; do args+=(--month "$m"); done
out="$(timeout 900 "$ROOT/venv/bin/python" scripts/ingest_pgcb_monthly.py "${args[@]}" 2>&1)"; status=$?
printf '%s\n' "$out"
if [[ $status -eq 124 ]]; then
    notify error "monthly: timed out" "ingest killed after 15 min; see $LOG"; exit 1
elif [[ $status -ne 0 ]]; then
    notify error "monthly: ingest failed" "$(grep -E 'ERROR|listing:' <<<"$out" | tail -3)"; exit 1
fi
ingested="$(sed -n 's/^ingested_months=//p' <<<"$out" | tail -1)"
if [[ -z "$ingested" ]]; then
    echo "=== monthly done $(date -Is) — nothing new ==="; exit 0
fi

# Publish BEFORE committing. Production ships from main and only a release row
# reaches readers before the next deploy; if the publish fails, nothing is
# committed, the reset at the top of tomorrow's run discards the parse, and the
# month is found unheld and done again — with the workbook already on disk.
# Aggregates stay on: _series.json is the file Macro Trends opens with.
for m in ${ingested//,/ }; do
    if ! timeout 600 npx tsx --conditions react-server scripts/publish-local.ts --month "$m" | tail -4; then
        notify error "monthly: publish failed for $m" "no release rows, nothing committed; see $LOG"; exit 1
    fi
done

# Data paths only. This chain must never be able to push code from here.
git add lib/pgcb-monthly-data.json lib/pgcb-monthly-detail public/data/pgcb-monthly
if git diff --cached --quiet; then
    echo "files unchanged — a re-parse of a held month; release rows refreshed, nothing to commit"
else
    git commit -q -m "chore(data): ingest PGCB monthly report(s) ${ingested//,/ } from the ERP"
    if git pull -q --rebase origin authenticating && git push -q origin HEAD:authenticating; then
        echo "pushed: $ingested"
    else
        notify warn "monthly: push failed" "release rows are live; commit for $ingested not pushed"
    fi
fi

# Remember the newest month for tomorrow's live check.
"$ROOT/venv/bin/python" - "$LAST" "${ingested##*,}" <<'PY'
import hashlib, json, sys, time
def norm(o):
    if isinstance(o, dict): return {k: norm(v) for k, v in o.items()}
    if isinstance(o, list): return [norm(v) for v in o]
    if isinstance(o, float) and o.is_integer(): return int(o)
    return o
month = sys.argv[2]
doc = json.load(open(f"public/data/pgcb-monthly/{month}.json", encoding="utf-8"))
sha = hashlib.sha256(json.dumps(norm(doc), sort_keys=True, separators=(",", ":")).encode()).hexdigest()
json.dump({"month": month, "sha256": sha, "published_at": int(time.time())}, open(sys.argv[1], "w"))
print(f"recorded {month} {sha[:12]} for the next live check")
PY

echo "=== monthly done $(date -Is) — ingested $ingested ==="
