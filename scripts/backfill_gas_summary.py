"""Repair the six-row gas summary in historical grid files.

The text scraper that produced `gasProductionData` silently drops fields — SGFL
is understated on 100% of days (median +41.7 MMCFD) because Kailashtila #2 is
missed. The per-field production table in the gas archive does not have that
defect.

Accuracy is not taken on trust. For every day this writes, it first checks the
archive's grand total against the grand total *printed in the original PDF* on
W:. A day that cannot be authenticated against its source is skipped, not
guessed at. On a full run 1,391 of 1,404 eligible days authenticate; the 13 that
do not are the July-2026 live-synced days whose keying convention differs.

Usage:
  python scripts/backfill_gas_summary.py            # dry run, reports only
  python scripts/backfill_gas_summary.py --apply    # writes the grid files
"""
from __future__ import annotations

import datetime
import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import fitz

from ingest_bridge import derive_gas_production
from pb_rows_extract import GRAND_RE, numbers_in, page_rows, production_bounds

ROOT = Path(__file__).resolve().parents[1]
DAILY = ROOT / "public" / "data" / "daily"
GAS = ROOT / "public" / "data" / "petrobangla" / "daily"
PDF_DIR = Path(os.environ.get("ESB_PB_PDF_DIR", r"W:\Grid-Explorer\Petrobangla\Daily Gas Reports - D"))

NAME_RE = re.compile(r"\((\d{2})\.(\d{2})\.(\d{2})\)")
TOLERANCE = 5.0


def pdf_day(name: str) -> str | None:
    """The archive key for a source PDF.

    Files are named for the report date and the public archive is keyed by that
    same date — the day the 8am-8am window closes. Subtracting a day here is the
    off-by-one that makes every comparison look 6-20 MMCFD wrong, which is simply
    the difference between two adjacent days of national production.
    """
    m = NAME_RE.search(name)
    if not m:
        return None
    d, mo, y = int(m.group(1)), int(m.group(2)), 2000 + int(m.group(3))
    try:
        return datetime.date(y, mo, d).isoformat()
    except ValueError:
        return None


def printed_grand_total(path: Path) -> float | None:
    """The grand total Petrobangla printed on the page — the authentication anchor."""
    try:
        rows = page_rows(fitz.open(str(path))[0])
    except Exception:
        return None
    top, bottom = production_bounds(rows)
    for y, ws in rows:
        if not (top <= y < bottom):
            continue
        if GRAND_RE.search(" ".join(w[4] for w in ws)):
            nums = numbers_in(ws)
            if len(nums) >= 3:
                return nums[2]
    return None


def shift(day: str, n: int) -> str:
    return (datetime.date.fromisoformat(day) + datetime.timedelta(days=n)).isoformat()


def match_archive(day: str, existing: list):
    """Find the archive day that actually backs this grid day, and prove it.

    The archive is keyed by the report END date for ~96% of days (so grid day E
    is backed by key E+1) but by the gas-day START for ~47 recent ones (key E).
    Assuming either convention corrupts the other group — deriving from the wrong
    key writes a neighbouring day's production, which looks plausible because
    consecutive days are similar.

    So the offset is not assumed, it is demonstrated: the correct archive is the
    one whose per-company figures already agree with the grid file on the five
    companies that are *not* broken. SGFL is excluded from the test precisely
    because it is the value being repaired. No agreement, no write.

    Returns (archive, derived, total, offset) or None.
    """
    best = None
    for off in (1, 0, -1):
        path = GAS / f"{shift(day, off)}.json"
        if not path.exists():
            continue
        try:
            arch = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not (arch.get("validation") or {}).get("reconciled"):
            continue
        derived, total = derive_gas_production(arch, existing)
        if not total:
            continue
        hits = sum(
            1
            for i, (e, d) in enumerate(zip(existing, derived))
            if i != 1 and abs(d["gas"] - (e.get("gas") or 0)) <= 1.0
        )
        if best is None or hits > best[0]:
            best = (hits, arch, derived, total, off, shift(day, off))
    # Four of the five unbroken companies must already agree. Below that the
    # archive is not this day's, and the day is left alone.
    if best and best[0] >= 4:
        return best[1], best[2], best[3], best[4], best[5]
    return None


def main() -> None:
    apply = "--apply" in sys.argv

    pdfs = {}
    if PDF_DIR.exists():
        for f in os.listdir(PDF_DIR):
            if f.lower().endswith(".pdf"):
                day = pdf_day(f)
                if day:
                    pdfs[day] = PDF_DIR / f
    print(f"source PDFs available : {len(pdfs)}")

    changed = skipped_no_pdf = skipped_unauth = skipped_norecon = unchanged = 0
    deltas: list[float] = []

    for f in sorted(os.listdir(DAILY)):
        if not f.endswith(".json"):
            continue
        day = f[:10]
        try:
            grid = json.loads((DAILY / f).read_text(encoding="utf-8"))
        except Exception:
            continue

        existing = grid.get("gasProductionData") or []
        if not existing or sum(x.get("gas") or 0 for x in existing) <= 0:
            continue  # no gas attached to this day; nothing to repair

        matched = match_archive(day, existing)
        if not matched:
            skipped_norecon += 1
            continue
        arch, derived, total, _offset, arch_day = matched

        # --- authenticate that archive day against its original PDF -------
        pdf = pdfs.get(arch_day)
        if not pdf:
            skipped_no_pdf += 1
            continue
        printed = printed_grand_total(pdf)
        stored = (arch.get("production") or {}).get("grand_total", {}).get("gas_mmcfd")
        if printed is None or stored is None or abs(float(printed) - float(stored)) > TOLERANCE:
            skipped_unauth += 1
            continue

        before = round(sum(x["gas"] for x in existing), 1)
        if abs(total - before) <= 1.0:
            unchanged += 1
            continue

        deltas.append(round(total - before, 1))
        changed += 1
        if apply:
            grid["gasProductionData"] = derived
            (DAILY / f).write_text(json.dumps(grid, indent=2), encoding="utf-8")

    print(f"\n{'APPLIED' if apply else 'DRY RUN'}")
    print(f"  repaired            : {changed}")
    print(f"  already correct     : {unchanged}")
    print(f"  skipped, no PDF     : {skipped_no_pdf}")
    print(f"  skipped, unverified : {skipped_unauth}")
    print(f"  skipped, archive not reconciled : {skipped_norecon}")
    if deltas:
        deltas.sort()
        print(f"  correction: median {deltas[len(deltas)//2]:+.1f}  min {deltas[0]:+.1f}  max {deltas[-1]:+.1f} MMCFD")


if __name__ == "__main__":
    main()
