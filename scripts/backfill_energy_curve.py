"""Add `energyCurveData` to archive days whose source workbook carries an En-Curve sheet.

PGCB has published a half-hourly generation-by-fuel sheet since mid-2018 and
nothing here read it until now, so the field exists on 40 days and no others.

Strictly additive by construction. A full re-ingest would rebuild every field of
every day it touched, which for ~1,500 days is a large blast radius for one new
key; this reads the day's JSON, inserts one field, and writes it back. Every
other section is compared before and after and the day is dropped if any of them
moved, so the operation cannot quietly rewrite figures it was not asked to.

Days are skipped, not failed, when:
  * the workbook has no En-Curve sheet — true of everything before mid-2018
  * `parse_energy_curve` rejects it, which it does when the stack does not
    reproduce the L-Curve sheet's own national total. That check is the reason
    this is worth running at all: matching column names alone parsed the
    2022-2024 layout with every gas and oil series missing.

Usage:
  python scripts/backfill_energy_curve.py [--apply] [--from YYYY-MM-DD] [--limit N]
"""
from __future__ import annotations

import argparse
import collections
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from backfill_daily_extremes import DAILY, index_sources, read_source  # noqa: E402
from parse_daily_reports import get_sheet_content, parse_energy_curve  # noqa: E402

REPO = Path(__file__).resolve().parent.parent


def other_sections(doc: dict) -> str:
    """Everything except the field being added, as a stable string."""
    return json.dumps({k: v for k, v in doc.items() if k != "energyCurveData"}, sort_keys=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--from", dest="start", default="2018-01-01")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--index-cache", default=str(REPO / "scratch" / "backfill-source-index.json"))
    args = ap.parse_args()

    sources = index_sources(Path(args.index_cache))
    days = [d for d in sorted(sources) if d >= args.start]
    if args.limit:
        days = days[: args.limit]
    print(f"{len(days)} day(s) with a source workbook from {args.start}")

    stats = collections.Counter()
    by_year = collections.Counter()
    rejected: list[str] = []
    columns_seen: collections.Counter = collections.Counter()

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

        if not get_sheet_content(text, "En-Curve"):
            stats["no En-Curve sheet (pre-2018 layout)"] += 1
            continue

        try:
            curve = parse_energy_curve(text)
        except Exception:  # noqa: BLE001
            stats["parser raised"] += 1
            continue

        if not curve:
            stats["rejected — stack does not reconcile with the load curve"] += 1
            rejected.append(day)
            continue

        doc = json.loads(target.read_text(encoding="utf-8"))
        before = other_sections(doc)
        existing = doc.get("energyCurveData")
        doc["energyCurveData"] = curve

        if other_sections(doc) != before:
            # Cannot happen through the assignment above, and that is the point:
            # if it ever does, something else changed the document and this is
            # no longer a single-field edit.
            stats["ABORTED — another section moved"] += 1
            rejected.append(f"{day} (other sections changed)")
            continue

        stats["already had a curve (refreshed)" if existing else "curve added"] += 1
        by_year[day[:4]] += 1
        for fuel in curve["fuels"]:
            if any(r["mw"][curve["fuels"].index(fuel)] is not None for r in curve["rows"]):
                columns_seen[fuel] += 1

        if args.apply:
            target.write_text(json.dumps(doc, indent=2), encoding="utf-8")

        if (i + 1) % 250 == 0:
            print(f"  …{i + 1}/{len(days)}", flush=True)

    print()
    for key, count in sorted(stats.items()):
        print(f"{count:6d} | {key}")
    if by_year:
        print("\ndays gaining a curve, by year:")
        print("  " + "  ".join(f"{y}:{n}" for y, n in sorted(by_year.items())))
    if columns_seen:
        print("\nseries present, by number of days carrying them:")
        for fuel, n in columns_seen.most_common():
            print(f"  {n:6d}  {fuel}")
    if rejected:
        print(f"\n{len(rejected)} day(s) rejected:")
        for r in rejected[:15]:
            print("   ", r)
    print("\nDRY RUN — nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
