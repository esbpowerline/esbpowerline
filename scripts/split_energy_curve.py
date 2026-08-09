"""Move `energyCurveData` out of the daily payload into public/data/curves/{date}.json.

Same reason the station detail was moved out in 01113a61. The daily loader
builds its path with `path.join(process.cwd(), 'public', 'data', 'daily', ...)`,
which Next's tracer cannot resolve, so every function that transitively imports
the loader bundles the whole directory — and `/api/members/grid-export` includes
it deliberately, because a member export can ask for any date.

At 40 days the curve was ~200KB and belonged inline. Backfilled to 1,611 days it
is 28MB, which took the daily archive from 68MB to 96MB and that function's
static payload from 179MB to 207MB before any code. The limit is 250MB, and a
deploy has already failed once at 256MB.

The curve is only ever read by the browser, when the chart is on screen, so it
belongs in a directory excluded from every bundle.

Usage:
  python scripts/split_energy_curve.py [--apply]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DAILY = REPO / "public" / "data" / "daily"
CURVES = REPO / "public" / "data" / "curves"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    moved = 0
    already = 0
    daily_bytes = 0
    curve_bytes = 0

    for path in sorted(DAILY.glob("*.json")):
        date = path.stem
        if len(date) != 10:
            continue
        doc = json.loads(path.read_text(encoding="utf-8"))
        curve = doc.pop("energyCurveData", None)
        if curve is None:
            already += 1
            continue

        body = json.dumps({"date": date, **curve}, separators=(",", ":"))
        daily_body = json.dumps(doc, indent=2)
        curve_bytes += len(body)
        daily_bytes += len(daily_body)
        moved += 1

        if args.apply:
            CURVES.mkdir(parents=True, exist_ok=True)
            # Compact: fetched by the browser, never hand-edited.
            (CURVES / f"{date}.json").write_text(body, encoding="utf-8")
            path.write_text(daily_body, encoding="utf-8")

    print(f"{moved} day(s) with a curve to move, {already} without")
    if moved:
        print(f"  curves written: {curve_bytes / 1024 / 1024:.1f} MB "
              f"({curve_bytes / moved / 1024:.1f} KB/day)")
    print("\nDRY RUN — nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
