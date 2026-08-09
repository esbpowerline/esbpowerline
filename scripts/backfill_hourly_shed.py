"""Fill hourly load shedding and demand on archive days that publish them.

Every day before 2025 carries an hourly generation curve with `loadShed` and
`demand` null, on the belief that PGCB states those only at the evening peak.
It does not. Three sheets carry them and none was read:

  P4            2025+      generation, load shedding and demand, every hour
  Daily Gen     2014-2018  the same three columns, headed "Hourly Generation
                           & Demand"; the unserved column is called Shortage
  YesterdayGen  2018-2024  no sheet of its own, but the station matrix carries
                           a national "Total (MW)" and a "Shortage" beside it.
                           Demand stays null there — it is genuinely unpublished

Only `hourlyLoadData` is rewritten, and only when the new rows reproduce the
L-Curve sheet's own generation on every hour they share. Every other section is
compared before and after and the day is dropped if any of them moved.

A day is also left alone if the replacement would carry less than the archive
already holds — fewer hours, or no shedding where shedding is already recorded.

Usage:
  python scripts/backfill_hourly_shed.py [--apply] [--limit N]
"""
from __future__ import annotations

import argparse
import collections
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from backfill_daily_extremes import DAILY, index_sources, read_source  # noqa: E402
from parse_daily_reports import (  # noqa: E402
    hourly_shed_from_yesterday_gen,
    lcurve_total_series,
    parse_hourly_shed,
)

REPO = Path(__file__).resolve().parent.parent
# The load curve and the hourly sheet are printed from the same telemetry, so
# they agree to the rounding PGCB applies, not to a tolerance band.
GENERATION_TOLERANCE_MW = 2.0


def other_sections(doc: dict) -> str:
    return json.dumps({k: v for k, v in doc.items() if k != "hourlyLoadData"}, sort_keys=True)


def merge_hours(existing: list, found: list) -> list:
    """Fill shedding and demand into the hours already on file, keeping both.

    Replacing the array outright would have cost the 2018-2024 days their 00:00
    hour: the YesterdayGen matrix runs 01:00 to 24:00 and the load curve from
    00:00, so the new rows are one shorter and dropping the old ones loses a
    measured point to gain a published one. Merging keeps the curve as it is and
    only fills the two columns that were null, adding any hour the archive did
    not have — the evening-peak half hour on the P4 days.

    Generation is left as the archive has it. The two sheets are checked against
    each other before this runs, so where they overlap they already agree.
    """
    by_time = {h["time"]: dict(h) for h in existing}
    for row in found:
        target = by_time.setdefault(row["time"], {"time": row["time"], "generation": row["generation"],
                                                  "loadShed": None, "demand": None})
        if row.get("loadShed") is not None:
            target["loadShed"] = row["loadShed"]
        if row.get("demand") is not None:
            target["demand"] = row["demand"]
    return [by_time[t] for t in sorted(by_time)]


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

    stats = collections.Counter()
    by_year = collections.Counter()
    rejected: list[str] = []

    for i, day in enumerate(days):
        target = DAILY / f"{day}.json"
        if not target.exists():
            stats["no archive day for this workbook"] += 1
            continue
        try:
            text = read_source(sources[day])
        except Exception:  # noqa: BLE001
            stats["source unreadable"] += 1
            continue

        rows = parse_hourly_shed(text) or hourly_shed_from_yesterday_gen(text)
        if not rows:
            stats["no hourly sheet"] += 1
            continue

        curve = lcurve_total_series(text)
        if curve:
            shared = [(r["generation"], curve[r["time"]]) for r in rows if r["time"] in curve]
            if not shared or any(abs(a - b) > GENERATION_TOLERANCE_MW for a, b in shared):
                stats["rejected — generation disagrees with the load curve"] += 1
                rejected.append(day)
                continue

        doc = json.loads(target.read_text(encoding="utf-8"))
        existing = doc.get("hourlyLoadData") or []
        merged = merge_hours(existing, rows)

        had_shed = sum(1 for h in existing if h.get("loadShed") is not None)
        gains_shed = sum(1 for h in merged if h.get("loadShed") is not None)
        if len(merged) < len(existing) or gains_shed <= had_shed:
            stats["nothing to add"] += 1
            continue

        before = other_sections(doc)
        doc["hourlyLoadData"] = merged
        if other_sections(doc) != before:
            stats["ABORTED — another section moved"] += 1
            rejected.append(f"{day} (other sections changed)")
            continue

        stats["hours filled"] += 1
        by_year[day[:4]] += 1
        if args.apply:
            target.write_text(json.dumps(doc, indent=2), encoding="utf-8")
        if (i + 1) % 400 == 0:
            print(f"  …{i + 1}/{len(days)}", flush=True)

    print()
    for key, count in sorted(stats.items()):
        print(f"{count:6d} | {key}")
    if by_year:
        print("\ndays gaining hourly shedding, by year:")
        print("  " + "  ".join(f"{y}:{n}" for y, n in sorted(by_year.items())))
    if rejected:
        print(f"\n{len(rejected)} rejected, first few: {', '.join(rejected[:10])}")
    print("\nDRY RUN — nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
