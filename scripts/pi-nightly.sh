#!/usr/bin/env bash
# Nightly on the Pi: prove the archive, re-check it against the publishers,
# and back the database up. None of this touches Vercel; the only Supabase
# traffic is the pg_dump at step 3, which is metered and deliberately tiered.
#
#   verify:data    self-consistency across every held day. ERROR means WE
#                  corrupted something; the run is red and you are told.
#   verify:source  refetch the last week's documents from PGCB and Petrobangla,
#                  reparse, diff. INDICATOR means a published figure disagrees
#                  with the source. The ledger is committed — it is the audit
#                  evidence, and the publisher will not serve that document
#                  forever.
#   pg_dump        the database, gzipped. Two tiers — see the note at step 3;
#                  a full copy weekly, the mutable tables nightly.
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
#
# Two tiers, because this one line had quietly become the largest consumer of
# the Supabase free tier's egress allowance. `pg_dump | gzip` compresses on THIS
# side of the wire: the whole database comes out uncompressed and is shrunk
# here, so the 43 MB that lands on the card cost 164 MB of egress. Measured
# 2026-09-06 with `gzip -l`, which reports the uncompressed size the dump
# actually had — 164,149,407 bytes at 73%. Nightly, that is 4.9 GB/month
# against a 5 GB/month allowance, before a single visitor loads the site. It was
# not always close: the same dump was 73 MB on 2026-09-03 and doubled the night
# the NLDC hourly backfill landed. Nothing announced that; the number simply
# grew into the ceiling.
#
# What the nightly keeps is what exists nowhere else. Four tables are excluded
# from it, each because a copy of the same bytes is already somewhere safe:
#
#   GridHourlyObservation  72 MB on disk, append-only, and NLDC still serves the
#   SourceDocument         pages behind it for ~145 days. A row lost tonight is
#                          re-derivable for months, so it needs a copy inside
#                          that window, not inside 24 hours.
#   DailyReport            28.5 MB of the dump. Duplicated byte for byte by
#                          public/data/daily/*.json, which the poll pushes to
#                          git every run — 4,551 files tracked against 4,478
#                          rows, so git is the superset, not the copy.
#   DataReleaseRevision    41.5 MB of the dump for 167 rows, because a revision
#                          stores the whole payload rather than a diff. The
#                          current revision of each is also in DataRelease,
#                          which the nightly does keep; what is left behind for
#                          a week is superseded history.
#
# DataRelease itself stays nightly. It is the precedence layer — a release wins
# over a static file of the same key — and a revocation is real state that
# exists in no other place.
#
# Measured on the dumps themselves, not estimated:
#
#   Sunday, or no full copy in 7 days   everything      164 MB
#   every other night                   the rest         11 MB
#
# ≈1.0 GB/month against a 5 GB allowance, down from 4.9 GB — with the state that
# exists only in Postgres never more than a day old, and everything else covered
# by git continuously and by the weekly full copy.
URL=$(grep '^DATABASE_URL=' "$REPO/.env.local" | cut -d= -f2- | tr -d '"' | sed 's/:6543/:5432/; s/[?&]pgbouncer=true//')

# Dumps predating the two-tier split were full copies; fold them into the full
# retention so they age out normally instead of sitting on the card forever.
for legacy in "$BACKUPS"/esbpowerline-????????.sql.gz; do
    [[ -e "$legacy" ]] && mv "$legacy" "${legacy%.sql.gz}-full.sql.gz"
done

# A missed Sunday — the Pi down, the lock held past the timeout — must not push
# the full copy out by a week, so the age of the last one decides, not the day
# alone. ESB_BACKUP_KIND overrides both, for a restore drill or a dump taken by
# hand before a migration.
KIND="${ESB_BACKUP_KIND:-}"
if [[ -z "$KIND" ]]; then
    if [[ "$(date +%u)" == 7 ]] || ! find "$BACKUPS" -name 'esbpowerline-*-full.sql.gz' -mtime -7 | grep -q .; then
        KIND=full
    else
        KIND=core
    fi
fi
if [[ "$KIND" == full ]]; then
    MIN=100000; EXCLUDE=()
else
    MIN=20000
    EXCLUDE=(--exclude-table-data='public."GridHourlyObservation"'
             --exclude-table-data='public."SourceDocument"'
             --exclude-table-data='public."DailyReport"'
             --exclude-table-data='public."DataReleaseRevision"')
fi
OUT="$BACKUPS/esbpowerline-$(date +%Y%m%d)-$KIND.sql.gz"
if [[ -n "$URL" ]] && PGCONNECT_TIMEOUT=20 timeout 900 pg_dump "$URL" --no-owner --no-privileges         "${EXCLUDE[@]}" | gzip -6 > "$OUT.part" && [[ $(stat -c %s "$OUT.part") -gt $MIN ]]; then
    mv "$OUT.part" "$OUT"
    echo "backup ($KIND) $(du -h "$OUT" | cut -f1) → $OUT"
    # Pruned per kind. Sharing one retention would let a fortnight of core dumps
    # push the last full copy off the card — the one file a restore cannot do
    # without.
    ls -1t "$BACKUPS"/esbpowerline-*-full.sql.gz 2>/dev/null | tail -n +7  | xargs -r rm -f
    ls -1t "$BACKUPS"/esbpowerline-*-core.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
else
    rm -f "$OUT.part"
    notify error "database backup failed" "pg_dump did not produce a usable $KIND dump; see $LOG"
fi

echo "=== nightly done $(date -Is) ==="
