"""Regenerate lib/data/grid/archive-fallback.ts from public/data/daily.

The file is the offline/fetch-failure copy of the most recent stretch of days.
Its header says "Auto-generated" but no generator was committed, so it drifts
from the canonical JSON silently — after the extremes backfill it would have
kept serving the old forecast-derived maxGen to anyone who hit the fallback.

Only the day map is rebuilt. The surrounding header, the import, and the
getArchiveFallback helper below the map are preserved byte-for-byte, as is the
existing set of days and the file's CRLF line endings (rewriting those would
produce a whole-file diff for no reason).

Usage:
  python scripts/rebuild_archive_fallback.py [--apply]
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TARGET = REPO / "lib" / "data" / "grid" / "archive-fallback.ts"
DAILY = REPO / "public" / "data" / "daily"

OPEN_MARKER = "export const powerGridArchive: Record<string, GridDailyData> = {"


def js_numbers(value):
    """Render integral floats without a trailing ".0", as JSON.stringify does.

    The committed file was generated from JS, so 105.0 appears as 105. Keeping
    that convention holds the diff to values that genuinely changed instead of
    touching every whole number in the file.
    """
    if isinstance(value, bool):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    if isinstance(value, dict):
        return {k: js_numbers(v) for k, v in value.items()}
    if isinstance(value, list):
        return [js_numbers(v) for v in value]
    return value


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    raw = TARGET.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    text = raw.replace("\r\n", "\n")

    start = text.index(OPEN_MARKER) + len(OPEN_MARKER)
    # The map ends at the first line that is exactly "};" — the helper follows.
    end = text.index("\n};", start)
    header, footer = text[:start], text[end + len("\n};"):]

    days = re.findall(r'^  "(\d{4}-\d{2}-\d{2})":', text[start:end], re.M)
    print(f"{len(days)} days in the fallback: {min(days)} -> {max(days)}")

    blocks, missing = [], []
    for day in days:
        fp = DAILY / f"{day}.json"
        if not fp.exists():
            missing.append(day)
            continue
        doc = js_numbers(json.loads(fp.read_text(encoding="utf-8")))
        body = json.dumps(doc, indent=2)
        body = "\n".join(
            line if i == 0 else "    " + line for i, line in enumerate(body.split("\n"))
        )
        blocks.append(f'  "{day}": {body}')

    if missing:
        print(f"WARNING: {len(missing)} day(s) absent from public/data/daily: {missing}")

    rebuilt = header + "\n" + ",\n".join(blocks) + "\n};" + footer
    if crlf:
        rebuilt = rebuilt.replace("\n", "\r\n")

    if rebuilt.encode("utf-8") == TARGET.read_bytes():
        print("No change.")
        return
    if args.apply:
        TARGET.write_bytes(rebuilt.encode("utf-8"))
        print(f"Rewrote {TARGET.relative_to(REPO)} ({len(blocks)} days).")
    else:
        print(f"Would rewrite {TARGET.relative_to(REPO)} ({len(blocks)} days). Re-run with --apply.")


if __name__ == "__main__":
    main()
