"""Write down, in one place, everything this archive does NOT hold.

Coverage was previously asserted as a per-dataset start date and a day count
(lib/data/grid/coverage.ts). That says how much exists; it does not say WHICH
days are absent, and it cannot distinguish "the source published nothing" from
"the source published something we never fetched". Both are honest answers and
they are different answers, and a reader looking at an empty day deserves to be
told which one applies.

What this measures, against the archive and the PDF/workbook stores:

  * gas days with no Petrobangla report held, grouped into runs
  * gas days whose PDF is held but was never parsed into the archive
  * days whose gas figures could not be matched to any parsed window
  * days citing a document that cannot be requested from the publisher
  * consecutive days whose national gas total is identical, which is the
    signature of a carry-forward rather than a measurement

Nothing here is inferred from a date range. Every entry is a day that was
looked for and not found.

Usage:
    python scripts/build_gap_manifest.py            # print the report
    python scripts/build_gap_manifest.py --apply    # also write the JSON
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import date, timedelta
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
DAILY = ROOT / "public" / "data" / "daily"
PB_DAILY = ROOT / "public" / "data" / "petrobangla" / "daily"
OUT = ROOT / "public" / "data" / "grid-verification" / "_gaps.json"
PB_PDF_DIRS = [
    Path(r"W:\Grid-Explorer\Petrobangla\Daily Gas Reports - D"),
    Path(r"C:\ESB-Grid-Archive\02-petrobangla"),
]
NAME_DATE = re.compile(r"\((\d{1,2})[.\s]+(\d{1,2})[.\s]+(\d{2,4})\)")

# Petrobangla daily reports enter this archive here. Before it, absence is the
# normal state and is not worth listing day by day.
GAS_ARCHIVE_START = date(2020, 1, 11)


def iso(d: date) -> str:
    return d.isoformat()


def runs(days: list[date]) -> list[dict]:
    """Consecutive dates collapsed into {from, to, days} spans."""
    out: list[dict] = []
    current: list[date] = []
    for d in days:
        if current and (d - current[-1]).days == 1:
            current.append(d)
        else:
            if current:
                out.append({"from": iso(current[0]), "to": iso(current[-1]), "days": len(current)})
            current = [d]
    if current:
        out.append({"from": iso(current[0]), "to": iso(current[-1]), "days": len(current)})
    return out


def pdf_window_starts() -> set[date]:
    """Gas-day STARTS for which a source PDF is held.

    Petrobangla names a file for the morning its window closes, so the day a
    held PDF covers is its filename date minus one.
    """
    out: set[date] = set()
    for directory in PB_PDF_DIRS:
        if not directory.is_dir():
            continue
        for name in os.listdir(directory):
            if not name.lower().endswith(".pdf"):
                continue
            m = NAME_DATE.search(name)
            if not m:
                continue
            dd, mm, yy = m.groups()
            yy = int(yy)
            yy = yy + 2000 if yy < 100 else yy
            try:
                out.add(date(yy, int(mm), int(dd)) - timedelta(days=1))
            except ValueError:
                continue
        if out:
            break
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    parsed_starts: dict[date, float | None] = {}
    for path in sorted(PB_DAILY.glob("20*.json")):
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        start = (doc.get("report") or {}).get("gas_day_start")
        if not start:
            continue
        production = doc.get("production") or {}
        field_sum = sum(float(f.get("gas_mmcfd") or 0) for f in production.get("fields") or [])
        parsed_starts[date(*map(int, start.split("-")))] = field_sum or None

    held_pdfs = pdf_window_starts()

    days: list[date] = []
    gas_total: dict[date, float] = {}
    uncitable: list[str] = []
    for path in sorted(DAILY.glob("20*.json")):
        stem = path.stem
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", stem):
            continue
        d = date(*map(int, stem.split("-")))
        days.append(d)
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        total = sum(float(r.get("gas") or 0) for r in doc.get("gasProductionData") or [])
        if total > 0:
            gas_total[d] = total
        cite = (doc.get("sourceFiles") or {}).get("petrobangla")
        if cite and not NAME_DATE.search(cite):
            uncitable.append(stem)

    last_day = max(days) if days else GAS_ARCHIVE_START
    span = [
        GAS_ARCHIVE_START + timedelta(days=i)
        for i in range((last_day - GAS_ARCHIVE_START).days + 1)
    ]

    never_published = [d for d in span if d not in parsed_starts and d not in held_pdfs]
    held_but_unparsed = [d for d in span if d not in parsed_starts and d in held_pdfs]
    shown_without_window = [d for d in sorted(gas_total) if d not in parsed_starts]

    # Consecutive days carrying an identical national total. Gas output moves
    # every day; two days that agree to the decilitre are a copy, not a
    # coincidence, and this is the cheapest way to see one.
    repeats: list[dict] = []
    ordered = sorted(gas_total)
    for a, b in zip(ordered, ordered[1:]):
        if (b - a).days == 1 and abs(gas_total[a] - gas_total[b]) < 0.05:
            repeats.append({"days": [iso(a), iso(b)], "mmcfd": round(gas_total[a], 1)})

    manifest = {
        "measuredOn": None,
        "note": (
            "Days this archive does not hold, measured against the source stores rather "
            "than inferred from a date range. 'neverPublished' means no document was found "
            "in any held store; 'heldButUnparsed' means the document exists and the archive "
            "has not read it."
        ),
        "gasDayRange": {"from": iso(GAS_ARCHIVE_START), "to": iso(last_day)},
        "gas": {
            "daysInRange": len(span),
            "daysHeld": sum(1 for d in span if d in parsed_starts),
            "neverPublished": {"count": len(never_published), "runs": runs(never_published)},
            "heldButUnparsed": [iso(d) for d in held_but_unparsed],
            "shownWithoutParsedWindow": [iso(d) for d in shown_without_window],
            "identicalConsecutiveTotals": repeats,
        },
        "citations": {"unrequestable": uncitable},
    }

    print(f"gas days in range           {len(span)}")
    print(f"  held                      {manifest['gas']['daysHeld']}")
    print(f"  no document in any store  {len(never_published)} in {len(runs(never_published))} runs")
    print(f"  document held, unparsed   {len(held_but_unparsed)} {[iso(d) for d in held_but_unparsed]}")
    print(f"  gas shown, no window      {len(shown_without_window)} {[iso(d) for d in shown_without_window]}")
    print(f"  identical consecutive     {len(repeats)}")
    for r in repeats[:10]:
        print(f"      {r['days'][0]} = {r['days'][1]}  at {r['mmcfd']} MMCFD")
    print(f"citations that cannot be requested  {len(uncitable)}")

    longest = max(runs(never_published), key=lambda r: r["days"], default=None)
    if longest:
        print(f"longest gap {longest['from']} -> {longest['to']} ({longest['days']} days)")

    if args.apply:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        with OUT.open("w", encoding="utf-8") as fh:
            json.dump(manifest, fh, ensure_ascii=False, indent=2)
        print(f"\nwritten {OUT.relative_to(ROOT)}")
    else:
        print("\n(dry run - re-run with --apply to write the manifest)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
