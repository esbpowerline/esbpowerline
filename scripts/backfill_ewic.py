"""Add `ewicData` to archive days whose source workbook carries an EWIC sheet.

PGCB began publishing the East-West Interconnector Log between the reports of
2026-04-16 and 2026-04-24: every workbook from 2026-04-24 on carries an `EWIC`
sheet and none before it does, across a sample spanning 2018-2026. So the field
is recoverable from 2026-04-24 and simply does not exist earlier.

It was nevertheless missing from all but nine days, because `parse_ewic` indexed
its columns for the pipe-table form (leading '|', empty first cell) while the
daily extractor feeds it plain text with no leading delimiter. Every row arrived
shifted by one, matched nothing, and the function returned None without a
warning. That is fixed; this recovers the days lost while it was broken.

Strictly additive by construction, in the same shape as backfill_energy_curve:
the day's JSON is read, one field inserted, and the file written back. Every
other section is serialised before and after and the day is dropped if any of
them moved, so this cannot quietly rewrite a figure it was not asked to.

Usage:
  python scripts/backfill_ewic.py                 # dry run, reports what it would do
  python scripts/backfill_ewic.py --apply
  python scripts/backfill_ewic.py --from 2026-04-24 --limit 10 --apply
"""
from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))

from daily_extractor.convert import xlsx_to_text            # noqa: E402
from daily_extractor.download import download_erp_by_id     # noqa: E402


def read_source(path: Path) -> str:
    """Parser-ready text from either source form — workbook or converted .txt."""
    if path.suffix.lower() == ".txt":
        return path.read_text(encoding="utf-8", errors="ignore")
    return xlsx_to_text(path)

spec = importlib.util.spec_from_file_location("pdr", REPO / "scripts" / "parse_daily_reports.py")
pdr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pdr)

DAILY = REPO / "public" / "data" / "daily"
INDEX_CACHE = REPO / "scratch" / "backfill-source-index.json"
MANIFEST = Path(r"W:\bd-grid-backlog\acquisition\pgcb-manifest.csv")
DOWNLOADS = REPO / "scratch" / "verify-downloads"

# The first day any workbook carries the sheet. Earlier days are not failures.
EWIC_FIRST_DAY = "2026-04-24"


def manifest_doc_ids() -> dict[str, str]:
    if not MANIFEST.exists():
        return {}
    out: dict[str, str] = {}
    with open(MANIFEST, encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            day, doc = row.get("energy_date"), row.get("doc_id")
            if day and doc:
                out[day] = doc
    return out


def others(doc: dict) -> str:
    """Everything except the one field being added, for the before/after guard."""
    return json.dumps({k: v for k, v in doc.items() if k != "ewicData"}, sort_keys=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--from", dest="start", default=EWIC_FIRST_DAY)
    ap.add_argument("--to", dest="end", default="9999-12-31")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--index-cache", default=str(INDEX_CACHE))
    args = ap.parse_args()

    src_index = json.loads(Path(args.index_cache).read_text(encoding="utf-8"))
    doc_ids = manifest_doc_ids()

    days = sorted(
        p.stem for p in DAILY.glob("*.json")
        if args.start <= p.stem <= args.end
    )
    todo = []
    for day in days:
        doc = json.loads((DAILY / f"{day}.json").read_text(encoding="utf-8"))
        if not doc.get("ewicData"):
            todo.append(day)
    if args.limit:
        todo = todo[: args.limit]

    print(f"{len(todo)} day(s) in {args.start}..{args.end} without ewicData")

    added = skipped = refused = 0
    no_sheet: list[str] = []
    failures: list[tuple[str, str]] = []

    for day in todo:
        # Prefer a workbook already on disk; fall back to PGCB's own ERP copy.
        path = None
        local = src_index.get(day)
        if local and Path(local).exists():
            path = Path(local)
        elif doc_ids.get(day):
            path = download_erp_by_id(int(doc_ids[day]), dest_dir=DOWNLOADS)

        if not path or not Path(path).exists():
            failures.append((day, "no source workbook"))
            continue

        # W: stores many reports twice — the workbook and a pre-converted
        # pipe-table .txt — and the source index names whichever was filed. The
        # .txt form is already the text this parser wants; handing it to
        # pd.ExcelFile raises ValueError, which is what made 13 days that do
        # carry an EWIC sheet look like unreadable sources.
        try:
            text = read_source(Path(path))
        except Exception as exc:
            failures.append((day, f"unreadable: {exc.__class__.__name__}"))
            continue

        ewic = pdr.parse_ewic(text)
        if not ewic:
            # Before the sheet existed this is the expected answer, not a fault.
            no_sheet.append(day)
            skipped += 1
            continue

        target = DAILY / f"{day}.json"
        doc = json.loads(target.read_text(encoding="utf-8"))
        before = others(doc)
        doc["ewicData"] = ewic
        if others(doc) != before:
            print(f"  REFUSED {day}: a section outside ewicData changed")
            refused += 1
            continue

        if args.apply:
            target.write_text(json.dumps(doc, indent=2), encoding="utf-8")
        added += 1
        if added <= 5 or added % 25 == 0:
            print(f"  {day}: rows={len(ewic['rows'])} circuits={len(ewic['circuits'])} "
                  f"export={ewic['totals'].get('export')} checks={len(ewic['checks'])}")

    print()
    print(f"  {added:>4} | ewicData added")
    print(f"  {skipped:>4} | workbook carries no EWIC sheet")
    print(f"  {refused:>4} | refused (other sections moved)")
    print(f"  {len(failures):>4} | no usable source")
    if no_sheet:
        print(f"\nno EWIC sheet: {no_sheet[0]} .. {no_sheet[-1]} ({len(no_sheet)} days)")
    for day, why in failures[:10]:
        print(f"  fail {day}: {why}")

    if not args.apply:
        print("\nDRY RUN — nothing written. Re-run with --apply.")
    else:
        print("\nWritten.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
