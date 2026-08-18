"""Make every archived day name a document a reader can actually request.

Two defects, both surfaced by `verify:data` once the gas citations were
repaired:

  1. 44 Petrobangla archive records name the Oracle object they were downloaded
     as — "a627934c-a98a-4f72-bc9a-c9fc4fbd767f.pdf" — or an internal name this
     pipeline invented, "petrobangla_2026-07-01.pdf". Neither is a name
     Petrobangla answers to. The daily reports now cite the properly-named copy
     held on W:, so the two disagreed and verify:data reported 44 ERRORs.

     The object name is not discarded: it is the provenance of the download and
     moves to `meta.source_object`, while `meta.source_filename` becomes the
     name the publisher uses.

  2. Days whose PGCB workbook was never named at all. 2025-06-09 carried a
     Petrobangla citation and no PGCB one; removing the stale gas citation left
     it naming no source whatsoever, which is the correct reading of a day
     whose sources were never recorded and a defect worth closing rather than
     hiding.

Usage:
    python scripts/repair_source_filenames.py            # dry run
    python scripts/repair_source_filenames.py --apply
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
DAILY = ROOT / "public" / "data" / "daily"
PB_DAILY = ROOT / "public" / "data" / "petrobangla" / "daily"
PB_PDF_DIR = Path(r"W:\Petrobangla\Daily Gas Reports - D")
# Source precedence, and it is not negotiable: the publisher's own file wins.
#
# PGCB's ERP portal is a VERIFICATION tool, not a source. It republishes the
# same workbook, so a figure taken from it is a figure taken second-hand, and
# the citation this archive prints would name an ERP copy rather than the
# document PGCB actually issued. The mirror is read only where no source copy
# is held — which is often, and is why it stays in the list at all: 2,357 days
# exist only as an ERP copy, against 643 that exist only as a source copy.
#
# Checked before reordering: on the 535 days held in both stores the files are
# byte-identical, so this changes provenance and not a single figure.
PGCB_DIRS = [
    Path(r"W:\PGCB\Daily Reports - D"),
    Path(r"C:\ESB-Grid-Archive\01-pgcb\local-archive\Daily Reports - D"),
    Path(r"C:\ESB-Grid-Archive\01-pgcb\acquired-from-erp"),
]
NAME_DATE = re.compile(r"\((\d{1,2})[.\s]+(\d{1,2})[.\s]+(\d{2,4})\)")
PGCB_WORKBOOK = re.compile(r"\.(xlsx|xlsm|xls)$", re.I)


def iso_shift(iso: str, days: int) -> str:
    y, m, d = map(int, iso.split("-"))
    return (date(y, m, d) + timedelta(days=days)).isoformat()


def index_pb_pdfs() -> dict[str, str]:
    """Window-END date -> the name Petrobangla files the PDF under."""
    out: dict[str, str] = {}
    if not PB_PDF_DIR.is_dir():
        return out
    for name in os.listdir(PB_PDF_DIR):
        if not name.lower().endswith(".pdf"):
            continue
        m = NAME_DATE.search(name)
        if not m:
            continue
        dd, mm, yy = m.groups()
        yy = int(yy)
        yy = yy + 2000 if yy < 100 else yy
        try:
            key = date(yy, int(mm), int(dd)).isoformat()
        except ValueError:
            continue
        if key not in out or "_1" in out[key]:
            out[key] = name
    return out


def index_pgcb_workbooks() -> dict[str, str]:
    """Filing date -> workbook name. A workbook filed on F reports day F-1."""
    sys.path.insert(0, str(ROOT / "scripts"))
    from parse_daily_reports import parse_date_from_filename  # noqa: E402

    out: dict[str, str] = {}
    for root in PGCB_DIRS:
        if not root.is_dir():
            continue
        for path in root.rglob("*"):
            if not PGCB_WORKBOOK.search(path.name) or path.name.startswith("~$"):
                continue
            filed = parse_date_from_filename(path.name)
            if filed:
                out.setdefault(filed.isoformat(), path.name)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    pb_pdfs = index_pb_pdfs()
    tally = Counter()
    samples: list[str] = []

    # ---- 1. Petrobangla records naming an object rather than a document -----
    for path in sorted(PB_DAILY.glob("20*.json")):
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        meta = doc.get("meta") or {}
        current = meta.get("source_filename") or ""
        if NAME_DATE.search(current):
            continue
        end = (doc.get("report") or {}).get("gas_day_end")
        if not end:
            tally["unnamed and no window to resolve it"] += 1
            continue
        proper = pb_pdfs.get(end)
        if not proper:
            tally["unnamed and no held PDF for the window"] += 1
            continue
        if len(samples) < 4:
            samples.append(f"  {path.stem}: {current}  ->  {proper}")
        meta.setdefault("source_object", current)
        meta["source_filename"] = proper
        doc["meta"] = meta
        tally["petrobangla record renamed"] += 1
        if args.apply:
            with path.open("w", encoding="utf-8") as fh:
                json.dump(doc, fh, ensure_ascii=False, indent=2)

    # ---- 2. Daily reports naming no PGCB workbook --------------------------
    missing_pgcb = []
    for path in sorted(DAILY.glob("20*.json")):
        stem = path.stem
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", stem):
            continue
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if (doc.get("sourceFiles") or {}).get("pgcb"):
            continue
        missing_pgcb.append((stem, path, doc))

    workbooks = index_pgcb_workbooks() if missing_pgcb else {}
    for stem, path, doc in missing_pgcb:
        name = workbooks.get(iso_shift(stem, 1))
        if not name:
            tally["no PGCB citation and no workbook held"] += 1
            continue
        source_files = doc.get("sourceFiles") or {}
        source_files["pgcb"] = name
        doc["sourceFiles"] = source_files
        windows = doc.get("observationWindows") or {}
        if isinstance(windows.get("pgcb"), dict):
            windows["pgcb"]["sourceFile"] = name
            doc["observationWindows"] = windows
        tally["PGCB citation recovered"] += 1
        if len(samples) < 8:
            samples.append(f"  {stem}: PGCB workbook -> {name}")
        if args.apply:
            with path.open("w", encoding="utf-8") as fh:
                json.dump(doc, fh, ensure_ascii=False, indent=2)

    print("=== source filename repair ===")
    for k, v in sorted(tally.items(), key=lambda kv: -kv[1]):
        print(f"  {v:6d}  {k}")
    if samples:
        print("\nsamples:")
        print("\n".join(samples))
    if not args.apply:
        print("\n(dry run - re-run with --apply to write)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
