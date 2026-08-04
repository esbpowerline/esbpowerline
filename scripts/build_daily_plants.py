"""Emit per-station detail for each day: public/data/daily/{date}-plants.json.

Two sheets the site has never read:

  GenLog   hourly output for every power station, ~160 x 24 numbers a day.
           Only the 2025+ workbooks carry it.
  Forecast the per-plant table. Only its "Actual Generation on <reported day>"
           pair is taken. The forecast-availability columns and the Remarks
           beside them describe the NEXT day and are deliberately left out —
           mixing the two is the defect the rest of this repair removed.

Kept in its own file per day rather than inside the daily payload, which the
Grid Explorer loads on every view; this is fetched only when the tab is opened.

Both parses are checked against figures the day already publishes before the
file is written — the station sum at each peak against P1, and GenLog's own
national total against the L-Curve — so a day only lands if it reconciles.

Usage:
  python scripts/build_daily_plants.py [--apply] [--limit N]
"""
from __future__ import annotations

import argparse
import collections
import datetime
import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from backfill_daily_extremes import DAILY, index_sources, read_source  # noqa: E402
from parse_daily_reports import (  # noqa: E402
    get_sheet_content,
    lcurve_total_series,
    parse_genlog,
    parse_plant_actuals,
    parse_pgcb_file,
)

REPO = Path(__file__).resolve().parent.parent
# The station total at a peak should reproduce P1's figure for that peak.
# A megawatt of slack absorbs the sheet's own rounding.
PEAK_TOLERANCE_MW = 1.5


def reconcile(plants, genlog, stats, curve):
    """Problems that should stop this day being written, as readable strings."""
    problems = []
    if plants:
        for key, stat_key, label in (
            ("dayPeakMw", "dayPeakGen", "day peak"),
            ("eveningPeakMw", "eveningPeakGen", "evening peak"),
        ):
            published = float(stats.get(stat_key) or 0)
            summed = sum(float(p.get(key) or 0) for p in plants)
            if published and abs(summed - published) > PEAK_TOLERANCE_MW:
                problems.append(
                    f"station sum at {label} is {summed:.1f} MW against a published {published:.1f}"
                )
    if genlog and curve:
        national = genlog.get("totals", {}).get("national") or []
        off = [
            (h, n, curve[h])
            for h, n in zip(genlog["hours"], national)
            if h in curve and abs(n - curve[h]) > PEAK_TOLERANCE_MW
        ]
        if off:
            problems.append(
                f"GenLog's national total disagrees with the load curve on {len(off)} hour(s), "
                f"first {off[0][0]}: {off[0][1]:.1f} vs {off[0][2]:.1f}"
            )
    return problems


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--index-cache", default=str(REPO / "scratch" / "backfill-source-index.json"))
    args = ap.parse_args()

    sources = index_sources(Path(args.index_cache))
    days = sorted(sources)
    if args.limit:
        days = days[: args.limit]
    print(f"{len(days)} day(s) with a source workbook")

    tmp = Path(tempfile.mkdtemp(prefix="esb-plants-"))
    stats = collections.Counter()
    rejected: list[str] = []
    written_bytes = 0

    for i, day in enumerate(days):
        try:
            text = read_source(sources[day])
            scratch = tmp / "p.txt"
            scratch.write_text(text, encoding="utf-8")
            parsed = parse_pgcb_file(str(scratch), datetime.date.fromisoformat(day))
        except Exception:  # noqa: BLE001
            stats["source unreadable"] += 1
            continue
        if not parsed:
            stats["source unreadable"] += 1
            continue

        plants = parse_plant_actuals(get_sheet_content(text, "Forecast"))
        genlog = parse_genlog(text)
        if not plants and not genlog:
            stats["neither sheet present"] += 1
            continue

        problems = reconcile(plants, genlog, parsed.get("systemStats") or {}, lcurve_total_series(text))
        if problems:
            stats["rejected — does not reconcile"] += 1
            rejected.append(f"{day}: {problems[0]}")
            continue

        doc = {"date": day}
        if plants:
            doc["plants"] = plants
            stats["with plant table"] += 1
        if genlog:
            doc["genlog"] = genlog
            stats["with hourly GenLog"] += 1

        # Compact: these are fetched by the browser and never hand-edited, and
        # pretty-printing 160 stations x 24 hours doubles the file (117 KB to
        # 56 KB a day). Stations idle all day are kept — "this plant produced
        # nothing" is itself a fact the page should be able to show.
        body = json.dumps(doc, separators=(",", ":"))
        written_bytes += len(body)
        stats["days written"] += 1
        if args.apply:
            (DAILY / f"{day}-plants.json").write_text(body, encoding="utf-8")
        if (i + 1) % 400 == 0:
            print(f"  …{i + 1}/{len(days)}", flush=True)

    print()
    for k, v in sorted(stats.items()):
        print(f"{v:6d} | {k}")
    if stats["days written"]:
        print(f"\navg {written_bytes / stats['days written'] / 1024:.1f} KB/day, "
              f"{written_bytes / 1024 / 1024:.1f} MB total")
    if rejected:
        print(f"\n{len(rejected)} day(s) rejected:")
        for r in rejected[:12]:
            print("   ", r)
    print("\nDRY RUN — nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
