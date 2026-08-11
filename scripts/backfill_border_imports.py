"""Fill cross-border import peak flow, and the years the tracker had none at all.

Two faults, one cause. `borderImportsData` is read from the P1 interconnector
block on the 2025+ layout and from the YesterdayGen sheet before that, and the
older path never set `peakFlow` — so 5,151 of 7,366 rows, every day from 2018
to 2022 and most of 2023-24, publish "Peak Capacity Served: 0 MW". Neither path
exists before 2018-01-11, so the tracker is empty for four years while carrying
a caption saying it has been tracked since December 2013.

The En-Curve sheet carries both, half-hourly, and back to 2014: an HVDC column
from the start, Tripura from 2016, Nepal and Adani on the 2025 layout. That is
already parsed and sitting in public/data/curves.

  peakFlow  the column's maximum across the day. Checked against the figure
            YesterdayGen prints as "HVDC Max Flow": 671 MW on 2019-01-01 from
            both, to the megawatt.
  energy    half-hourly samples summed and halved. Within about 1% of the
            published kWh total, so it is used only where nothing is published
            — an existing figure is left alone rather than replaced by a
            sampled approximation of itself.

Only `borderImportsData` is written, and every other section is compared before
and after.

Usage:
  python scripts/backfill_border_imports.py [--apply] [--limit N]
"""
from __future__ import annotations

import argparse
import collections
import json
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DAILY = REPO / "public" / "data" / "daily"
CURVES = REPO / "public" / "data" / "curves"

# En-Curve column -> the row the Grid Explorer shows. Nepal has never had a row:
# it is on the 2025 sheet and in no other source the site reads.
SOURCES = [
    ("HVDC", "HVDC Bheramara (India)", "C/B Interconnector (West)"),
    ("Adani", "Adani Godda (India)", "C/B Interconnector (North)"),
    ("Tripura", "Tripura Cumilla (India)", "C/B Interconnector (East)"),
    ("Nepal", "Nepal (via India)", "C/B Interconnector (Nepal)"),
]
# Sampled energy against a published total. Wider than the sampling error and
# far tighter than a wrong day.
ENERGY_SANITY = 0.10


def other_sections(doc: dict) -> str:
    return json.dumps({k: v for k, v in doc.items() if k != "borderImportsData"}, sort_keys=True)


def derive(curve: dict) -> dict[str, dict]:
    """Peak MW and day energy per import column, from the half-hourly curve."""
    out = {}
    for column, label, kind in SOURCES:
        if column not in curve["fuels"]:
            continue
        i = curve["fuels"].index(column)
        series = [r["mw"][i] or 0 for r in curve["rows"] if r["mw"][i] is not None]
        if not series or max(series) <= 0:
            continue
        out[label] = {
            "source": label,
            "energy": round(sum(series) / 2 / 1000, 2),
            "peakFlow": round(max(series), 2),
            "type": kind,
        }
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    # Same flag as backfill_energy_curve.py, for the same reason: a daily ingest
    # wants to fill the day it just added without also rewriting the 2018 rows
    # this script still has outstanding.
    ap.add_argument("--from", dest="start", default="")
    args = ap.parse_args()

    days = sorted(p.stem for p in CURVES.glob("*.json") if len(p.stem) == 10)
    if args.start:
        days = [d for d in days if d >= args.start]
    if args.limit:
        days = days[: args.limit]
    print(f"{len(days)} day(s) with a fuel curve")

    stats = collections.Counter()
    peaks_by_year: collections.Counter = collections.Counter()
    rows_by_year: collections.Counter = collections.Counter()
    odd: list[str] = []

    for day in days:
        target = DAILY / f"{day}.json"
        if not target.exists():
            stats["no archive day"] += 1
            continue
        curve = json.loads((CURVES / f"{day}.json").read_text(encoding="utf-8"))
        derived = derive(curve)
        if not derived:
            stats["curve carries no import column"] += 1
            continue

        doc = json.loads(target.read_text(encoding="utf-8"))
        existing = {b["source"]: dict(b) for b in doc.get("borderImportsData") or []}

        changed = False
        for label, found in derived.items():
            row = existing.get(label)
            if row is None:
                existing[label] = found
                rows_by_year[day[:4]] += 1
                changed = True
                continue
            # A published energy figure stays; only the missing peak is filled.
            if row.get("energy") and abs(row["energy"] - found["energy"]) > max(
                0.5, row["energy"] * ENERGY_SANITY
            ):
                odd.append(f"{day} {label}: stored {row['energy']} vs curve {found['energy']} MKWh")
                continue
            if not row.get("peakFlow"):
                row["peakFlow"] = found["peakFlow"]
                peaks_by_year[day[:4]] += 1
                changed = True
            if not row.get("energy"):
                row["energy"] = found["energy"]
                changed = True

        if not changed:
            stats["already complete"] += 1
            continue

        order = [label for _, label, _ in SOURCES if label in existing]
        before = other_sections(doc)
        doc["borderImportsData"] = [existing[label] for label in order]
        if other_sections(doc) != before:
            stats["ABORTED — another section moved"] += 1
            continue

        stats["updated"] += 1
        if args.apply:
            target.write_text(json.dumps(doc, indent=2), encoding="utf-8")

    print()
    for key, count in sorted(stats.items()):
        print(f"{count:6d} | {key}")
    if peaks_by_year:
        print("\npeak flows filled, by year:")
        print("  " + "  ".join(f"{y}:{n}" for y, n in sorted(peaks_by_year.items())))
    if rows_by_year:
        print("\nimport rows added where there were none, by year:")
        print("  " + "  ".join(f"{y}:{n}" for y, n in sorted(rows_by_year.items())))
    if odd:
        print(f"\n{len(odd)} row(s) left alone — stored energy disagrees with the curve:")
        for o in odd[:10]:
            print("   ", o)
    print("\nDRY RUN — nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
