"""Re-parse the archive days whose stored parse never reconciled.

129 files in `public/data/petrobangla/daily/` were written by parser 1.0.0 and
their per-field gas does not reproduce the grand total printed on the same page
— by 8 MMCFD on the mild days and by 1,660 on the worst, where only 19 of 24
field rows were read at all. `parse_petrobangla_archive.py` (2.0.0) reads the
same PDFs with PyMuPDF word geometry and refuses to emit a day it cannot
reconcile, so it is the right reader; these days simply predate it.

**No date is re-derived here, deliberately.** The 2.0.0 CLI builds its
report label from the gas-day argument rather than reading it off the page, so
it offers no independent check, and the printed title is unreadable through text
extraction on many of these files (CID font). Instead each file is re-parsed for
the window it already declares, from the PDF it already names — the document and
the day both stay fixed, and only the quality of the reading changes.

Two guards decide whether a re-parse replaces the stored day:

  * the new grand total must match the stored one. Both readers take it from the
    same printed line, so a mismatch means the wrong PDF, and the day is left
    alone rather than re-dated.
  * the new field sum must reconcile with that grand total. A parse that still
    cannot reconcile is no improvement and is not written.

Usage:
  python scripts/reparse_unreconciled_gas_days.py [--apply] [--limit N]
"""
from __future__ import annotations

import argparse
import collections
import json
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ARCHIVE = REPO / "public" / "data" / "petrobangla" / "daily"
PARSER = REPO / "scripts" / "parse_petrobangla_archive.py"
PDF_DIRS = [
    Path(r"W:\Petrobangla\Daily Gas Reports - D"),
    Path(r"W:\Petrobangla\Daily Gas Reports - D\Parsed-Structured"),
]
TOLERANCE = 5.0


def real_fields(prod):
    return [f for f in (prod.get("fields") or []) if f.get("record_type") in (None, "field")]


def reconciles(prod):
    grand = (prod.get("grand_total") or {}).get("gas_mmcfd")
    fields = real_fields(prod)
    if grand is None or not fields:
        return None, None, False
    total = round(sum(f.get("gas_mmcfd") or 0 for f in fields), 1)
    return total, grand, abs(total - grand) <= TOLERANCE


def find_pdf(name):
    for d in PDF_DIRS:
        p = d / name
        if p.exists():
            return p
    stem = Path(name).name
    for d in PDF_DIRS:
        if d.is_dir():
            for p in d.glob("*.pdf"):
                if p.name == stem:
                    return p
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    targets = []
    for path in sorted(ARCHIVE.glob("*.json")):
        if len(path.stem) != 10:
            continue
        doc = json.loads(path.read_text(encoding="utf-8"))
        _, _, ok = reconciles(doc.get("production") or {})
        if ok:
            continue
        targets.append((path, doc))
    if args.limit:
        targets = targets[: args.limit]
    print("%d day(s) whose stored parse does not reconcile\n" % len(targets))

    stats = collections.Counter()
    fixed, examples = 0, []
    tmp = Path(tempfile.mkdtemp(prefix="pb-reparse-"))

    for path, doc in targets:
        report = doc.get("report") or {}
        start = report.get("gas_day_start") or report.get("report_date_start")
        source = (doc.get("meta") or {}).get("source_filename")
        old_sum, old_grand, _ = reconciles(doc.get("production") or {})
        if not start or not source:
            stats["file declares no window or no source PDF"] += 1
            continue
        pdf = find_pdf(source)
        if pdf is None:
            stats["source PDF not found on W:"] += 1
            continue

        out = tmp / "d.json"
        try:
            subprocess.run(
                [sys.executable, str(PARSER), str(pdf), start, str(out)],
                check=True, capture_output=True, timeout=180,
            )
            fresh = json.loads(out.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            stats["re-parse failed"] += 1
            continue

        new_sum, new_grand, new_ok = reconciles(fresh.get("production") or {})
        if new_grand is None:
            stats["re-parse produced no grand total"] += 1
            continue
        # Same printed line, both readers: a different grand total means a
        # different document, so stop rather than re-date the day.
        if old_grand is not None and abs(new_grand - old_grand) > 0.5:
            stats["grand total differs — wrong PDF, left alone"] += 1
            continue
        if not new_ok:
            stats["re-parse still does not reconcile"] += 1
            continue

        # Carry forward the provenance the archive already recorded for this day.
        for key in ("gas_day_start", "gas_day_end", "gas_window", "gas_day_source", "window_status"):
            if key in report:
                fresh.setdefault("report", {})[key] = report[key]
        fresh["meta"]["source_filename"] = source
        fresh["meta"]["source_pdf"] = str(pdf)

        stats["re-parsed and now reconciles"] += 1
        fixed += 1
        if len(examples) < 10:
            examples.append(
                "%s  field sum %8.1f -> %8.1f  (grand total %.1f, unchanged)"
                % (path.stem, old_sum or 0, new_sum, new_grand)
            )
        if args.apply:
            path.write_text(json.dumps(fresh, indent=2, ensure_ascii=False), encoding="utf-8")

    for key, count in sorted(stats.items(), key=lambda kv: -kv[1]):
        print("%6d | %s" % (count, key))
    if examples:
        print("\nexamples:")
        for e in examples:
            print("   " + e)
    print("\nDRY RUN — nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
