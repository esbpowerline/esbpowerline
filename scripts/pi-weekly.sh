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
SUPA_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$REPO/.env.local" | cut -d= -f2- | tr -d '"')
ANON=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$REPO/.env.local" | cut -d= -f2- | tr -d '"')
if [[ -n "$SUPA_URL" && -n "$ANON" ]]; then
    "$ROOT/venv/bin/python" - "$SUPA_URL" "$ANON" "$ROOT/backups/media" <<'PY' || notify warn "media mirror failed" "see the weekly log"
import json, os, sys, urllib.request
base, anon, dest = sys.argv[1], sys.argv[2], sys.argv[3]
def api(path, body=None):
    req = urllib.request.Request(f"{base}/storage/v1/{path}", data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": anon, "Authorization": f"Bearer {anon}", "Content-Type": "application/json"}, method="POST" if body is not None else "GET")
    return urllib.request.urlopen(req, timeout=60).read()
def walk(prefix=""):
    offset = 0
    while True:
        rows = json.loads(api("object/list/media", {"prefix": prefix, "limit": 1000, "offset": offset}))
        if not rows: break
        for r in rows:
            name = f"{prefix}{r['name']}" if prefix == "" else f"{prefix}/{r['name']}"
            if r.get("id") is None: yield from walk(name)      # folder
            else: yield name, (r.get("metadata") or {}).get("size")
        offset += len(rows)
        if len(rows) < 1000: break
new = kept = 0
for name, size in walk():
    out = os.path.join(dest, name)
    if os.path.exists(out) and (size is None or os.path.getsize(out) == size): kept += 1; continue
    os.makedirs(os.path.dirname(out), exist_ok=True)
    data = urllib.request.urlopen(f"{base}/storage/v1/object/public/media/{name}", timeout=120).read()
    tmp = out + ".part"; open(tmp, "wb").write(data); os.replace(tmp, out); new += 1
print(f"media mirror: {new} fetched, {kept} already held")
PY
else
    echo "media mirror skipped: NEXT_PUBLIC_SUPABASE_URL / ANON key not in .env.local"
fi

echo "=== weekly done $(date -Is) ==="
