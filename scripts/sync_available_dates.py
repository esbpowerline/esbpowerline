"""Rebuild lib/available-dates.json from what is actually in public/data/daily.

The two drift apart silently. 2026-08-01 was published as a data file but never
added to the index, so getLatestAvailableDate() returned 2026-07-31 and
isDateAvailable('2026-08-01') was false — the newest day the site had was
invisible to every code path that asks the index rather than the filesystem.

Usage:
  python scripts/sync_available_dates.py [--apply]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DAILY = REPO / "public" / "data" / "daily"
INDEX = REPO / "lib" / "available-dates.json"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    on_disk = sorted(p.stem for p in DAILY.glob("*.json") if not p.stem.startswith("_"))
    current = json.loads(INDEX.read_text(encoding="utf-8"))

    missing = sorted(set(on_disk) - set(current))
    stale = sorted(set(current) - set(on_disk))
    print(f"{len(on_disk)} day file(s) on disk, {len(current)} in the index")
    if missing:
        print(f"  {len(missing)} published but unindexed: {missing[:10]}")
    if stale:
        print(f"  {len(stale)} indexed but absent from disk: {stale[:10]}")
    if not missing and not stale and current == on_disk:
        print("Index already matches.")
        return

    if args.apply:
        raw = INDEX.read_bytes()
        body = json.dumps(on_disk, indent=2)
        if b"\r\n" in raw:
            body = body.replace("\n", "\r\n")
        INDEX.write_bytes(body.encode("utf-8"))
        print(f"Rewrote {INDEX.relative_to(REPO)} with {len(on_disk)} dates.")
    else:
        print("Dry run — re-run with --apply.")


if __name__ == "__main__":
    main()
