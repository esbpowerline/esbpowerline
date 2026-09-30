"""Restore the cross-border import peaks PGCB printed and the archive lost.

On the pre-2025 layout `parse_pgcb_file` reads imports from YesterdayGen, which
carries every interconnector twice: the plant column with its evening-peak
figure, and a summary column repeating the flows with the peak rows left blank.
The parser let the last column win, so the blank overwrote the figure and
1,261 days from 2018 to 2024 published "Grid Import: 0 MW" beside gigawatt-hours
of imports (2018-01-21: PGCB printed 495 MW HVDC and 124 MW Tripura; the archive
held 0 and 0). The parser is fixed; this re-reads the held workbooks with it.

A day is written only when the re-parse proves it is reading that day's
document: the three figures `backfill_daily_extremes.matches_archive` trusts
must agree, and so must every interconnector's energy, which the defect never
touched. Only a peak the archive holds as 0 is replaced, only by a figure the
workbook states, and only `borderImportsData` changes — every other section is
compared before and after. A day with no workbook, or one that fails either
check, is listed and left alone: its 0 is wrong, but a number from anywhere
else would be a guess, and `peakFlow` cannot yet be null.

Not `backfill_border_imports.py`, which takes the day's maximum off the
half-hourly curve. That is a different quantity from the evening-peak figure
this layout prints, and the curve exists for only 348 of these days.

Usage:
  python scripts/repair_border_import_peaks.py            # dry run
  python scripts/repair_border_import_peaks.py --apply
"""
from __future__ import annotations

import argparse
import collections
import datetime
import json
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
os.environ.setdefault("ESB_DAILY_OUTPUT_DIR", tempfile.mkdtemp(prefix="esb-import-peaks-"))

from backfill_daily_extremes import index_sources, matches_archive, read_source  # noqa: E402
from parse_daily_reports import parse_pgcb_file  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
DAILY = REPO / "public" / "data" / "daily"


def zero_peak_rows(doc: dict) -> list[dict]:
    return [
        r for r in doc.get("borderImportsData") or []
        if (r.get("energy") or 0) > 0 and r.get("peakFlow") == 0
    ]


def others(doc: dict) -> str:
    return json.dumps({k: v for k, v in doc.items() if k != "borderImportsData"}, sort_keys=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--index-cache", default=str(REPO / "scratch" / "backfill-source-index.json"))
    args = ap.parse_args()

    targets = []
    for fp in sorted(DAILY.glob("*.json")):
        doc = json.loads(fp.read_text(encoding="utf-8"))
        if zero_peak_rows(doc):
            targets.append((fp, doc))
    print(f"{len(targets)} day(s) publish a zero import peak beside non-zero energy", flush=True)

    sources = index_sources(Path(args.index_cache))
    # The day's own citation, looked up by name across both stores. The index
    # above covers W:'s daily folder only and keys by resolved day; the file a
    # day cites is often elsewhere under the reorganised tree or only in the
    # C: mirror. A wrong match cannot write: matches_archive still has to pass.
    by_name: dict[str, Path] = {}
    for root in (Path(r"W:\Grid-Explorer"), Path(r"C:\ESB-Grid-Archive")):
        if root.exists():
            for p in root.rglob("*.xls*"):
                by_name.setdefault(p.name, p)
    tmp = Path(tempfile.mkdtemp(prefix="esb-import-peaks-src-")) / "p.txt"
    stats: collections.Counter = collections.Counter()
    by_year: collections.Counter = collections.Counter()
    left: list[str] = []
    samples: list[str] = []

    for fp, doc in targets:
        day = fp.stem
        src = sources.get(day) or by_name.get(((doc.get("sourceFiles") or {}).get("pgcb")) or "")
        if src is None:
            stats["no source workbook"] += 1
            left.append(f"{day}: no source workbook held")
            continue
        try:
            tmp.write_text(read_source(src), encoding="utf-8")
            parsed = parse_pgcb_file(str(tmp), datetime.date.fromisoformat(day))
        except Exception as exc:  # noqa: BLE001
            stats["re-parse failed"] += 1
            left.append(f"{day}: re-parse failed ({exc})")
            continue
        if not parsed or not matches_archive(parsed, doc):
            stats["source does not reproduce the day"] += 1
            left.append(f"{day}: {src.name} does not reproduce the archived day")
            continue

        fresh = {r["source"]: r for r in parsed.get("borderImportsData") or []}
        before = others(doc)
        changed, mismatch = [], False
        for row in doc["borderImportsData"]:
            new = fresh.get(row["source"])
            if new is None or abs((new.get("energy") or 0) - (row.get("energy") or 0)) > 0.011:
                mismatch = True
                break
            if row.get("peakFlow") == 0 and (row.get("energy") or 0) > 0 and (new.get("peakFlow") or 0) > 0:
                changed.append((row, new["peakFlow"]))
        if mismatch:
            stats["interconnector energy disagrees"] += 1
            left.append(f"{day}: {src.name} states different import energy")
            continue
        if not changed:
            stats["workbook states no peak either"] += 1
            left.append(f"{day}: {src.name} states no peak for the zero row(s)")
            continue

        for row, peak in changed:
            row["peakFlow"] = peak
        if others(doc) != before:
            stats["ABORTED - another section moved"] += 1
            continue
        stats["repaired"] += 1
        by_year[day[:4]] += 1
        if len(samples) < 8:
            samples.append(f"{day}: " + ", ".join(f"{r['source']} 0 -> {p:g} MW" for r, p in changed))
        if args.apply:
            fp.write_text(json.dumps(doc, indent=2), encoding="utf-8")

    print()
    for key, n in sorted(stats.items()):
        print(f"{n:6d} | {key}")
    if by_year:
        print("\nrepaired, by year: " + "  ".join(f"{y}:{n}" for y, n in sorted(by_year.items())))
    for s in samples:
        print("   ", s)
    if left:
        print(f"\n{len(left)} day(s) left at zero:")
        for line in left:
            print("   ", line)
    print("\nDRY RUN - nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
