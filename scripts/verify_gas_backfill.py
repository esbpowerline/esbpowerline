"""Verify every repaired grid file against its original PDF.

Earlier checks authenticated the *archive* (its grand total matches the PDF) and
that the correct archive day was selected. Neither proves the SGFL number that
was actually written. This does, two independent ways:

  1. TOTAL   — the six written companies must sum to the grand total printed on
               the PDF. Since the other five were already shown to agree, this
               pins SGFL by arithmetic.
  2. SGFL    — the second Sub-Total row in the production section is SGFL's own
               printed figure, compared directly against what was written.

Check 2 reads sub-totals by their ORDER in the section rather than by the
wells/capacity signature used elsewhere: those counts change year to year, so a
signature tuned to 2026 silently fails on older reports.

Usage: python scripts/verify_gas_backfill.py [--limit N]
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import fitz

from pb_rows_extract import GRAND_RE, SUBTOTAL_RE, numbers_in, page_rows, production_bounds

ROOT = Path(__file__).resolve().parents[1]
DAILY = ROOT / "public" / "data" / "daily"
GAS = ROOT / "public" / "data" / "petrobangla" / "daily"
PDF_DIR = Path(os.environ.get("ESB_PB_PDF_DIR", r"W:\Petrobangla\Daily Gas Reports - D"))
NAME_RE = re.compile(r"\((\d{2})\.(\d{2})\.(\d{2})\)")
TOL = 5.0


def pdf_index() -> dict[str, Path]:
    out: dict[str, Path] = {}
    if not PDF_DIR.exists():
        return out
    for f in os.listdir(PDF_DIR):
        m = NAME_RE.search(f)
        if not f.lower().endswith(".pdf") or not m:
            continue
        d, mo, y = m.group(1), m.group(2), 2000 + int(m.group(3))
        out[f"{y}-{mo}-{d}"] = PDF_DIR / f
    return out


def read_pdf(path: Path):
    """(printed grand total, ordered production sub-totals) from the source PDF."""
    try:
        rows = page_rows(fitz.open(str(path))[0])
    except Exception:
        return None, []
    top, bottom = production_bounds(rows)
    grand, subs = None, []
    for y, ws in rows:
        if not (top <= y < bottom):
            continue
        text = " ".join(w[4] for w in ws)
        nums = numbers_in(ws)
        if GRAND_RE.search(text) and len(nums) >= 3:
            grand = nums[2]
        elif SUBTOTAL_RE.search(text) and len(nums) >= 3:
            # "(1+2+3)" is a group roll-up, not a company.
            if not re.search(r"\(\s*1\s*\+\s*2\s*\+\s*3\s*\)", text):
                subs.append(nums[2])
    return grand, subs


def main() -> None:
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])

    pdfs = pdf_index()
    print(f"source PDFs indexed: {len(pdfs)}")

    total_ok = total_bad = sgfl_ok = sgfl_bad = no_pdf = no_arch = 0
    worst_total = (0.0, None)
    worst_sgfl = (0.0, None)
    failures = []

    files = sorted(f for f in os.listdir(DAILY) if f.endswith(".json"))
    if limit:
        files = files[::max(1, len(files) // limit)][:limit]

    for f in files:
        day = f[:10]
        try:
            grid = json.loads((DAILY / f).read_text(encoding="utf-8"))
        except Exception:
            continue
        gs = grid.get("gasProductionData") or []
        written_total = round(sum(x.get("gas") or 0 for x in gs), 1)
        if written_total <= 0:
            continue  # zero-filled day, nothing was repaired

        # Which archive day backs it — the same rule the backfill used.
        arch_day = None
        for off in (1, 0, -1):
            import datetime

            cand = (datetime.date.fromisoformat(day) + datetime.timedelta(days=off)).isoformat()
            ap = GAS / f"{cand}.json"
            if not ap.exists():
                continue
            try:
                a = json.loads(ap.read_text(encoding="utf-8"))
            except Exception:
                continue
            gt = (a.get("production") or {}).get("grand_total", {}).get("gas_mmcfd")
            if gt and abs(float(gt) - written_total) <= TOL:
                arch_day = cand
                break
        if not arch_day:
            no_arch += 1
            continue

        pdf = pdfs.get(arch_day)
        if not pdf:
            no_pdf += 1
            continue

        grand, subs = read_pdf(pdf)
        if grand is None:
            no_pdf += 1
            continue

        d1 = round(abs(written_total - grand), 1)
        if d1 <= TOL:
            total_ok += 1
        else:
            total_bad += 1
            failures.append((day, "total", written_total, grand, d1))
            if d1 > worst_total[0]:
                worst_total = (d1, day)

        # SGFL is the second company sub-total printed in the section.
        if len(subs) >= 2:
            d2 = round(abs((gs[1].get("gas") or 0) - subs[1]), 1)
            if d2 <= 1.0:
                sgfl_ok += 1
            else:
                sgfl_bad += 1
                failures.append((day, "sgfl", gs[1].get("gas"), subs[1], d2))
                if d2 > worst_sgfl[0]:
                    worst_sgfl = (d2, day)

    print(f"\nchecked {total_ok + total_bad} days against their original PDF")
    print(f"  TOTAL matches printed grand total : {total_ok} ok, {total_bad} bad (worst {worst_total[0]} on {worst_total[1]})")
    print(f"  SGFL matches printed sub-total    : {sgfl_ok} ok, {sgfl_bad} bad (worst {worst_sgfl[0]} on {worst_sgfl[1]})")
    print(f"  no source PDF: {no_pdf}   no matching archive: {no_arch}")

    if failures:
        print("\nfirst 15 failures:")
        for day, kind, written, printed, diff in failures[:15]:
            print(f"  {day}  {kind:6} written {written}  printed {printed}  diff {diff}")


if __name__ == "__main__":
    main()
