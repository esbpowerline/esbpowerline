"""Extract Petrobangla's field-wise gas reserve statement from an Annual Report.

The table is titled "NATURAL GAS RESERVE IN BANGLADESH" / "Natural Gas Reserve
of Bangladesh" and carries, for every discovered field: GIIP, recoverable 2P
reserve, cumulative production to the fiscal year end, and the remaining 2P
reserve on the first day of the new fiscal year. It is the only published
statement that says how much gas is left, field by field, and it is what the
depletion model has to be anchored on — a chart that projects a run-out date
from anything else is projecting from a number nobody published.

Output: public/data/petrobangla/reserves-published.json

Every row keeps the document, page and as-of date it came from. Three checks run
before anything is written, and any failure aborts:

  1. each section's rows must sum to the section subtotal it is printed under
  2. the section subtotals must sum to the printed grand total
  3. the BCF grand total must match the printed TCF grand total

The 2024-25 report's table extracts as clean text. The 2023-24 report renders
the same table in a CID-mapped font whose digits extract as spaces (the trap
recorded for Petrobangla's daily PDFs), so only its printed subtotal rows are
recoverable; pass --subtotals-only for those years.

Usage:
  python scripts/extract_gas_reserves.py "W:/Petrobangla/Annual Reports/Annual Report 2024-25.pdf"
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import fitz  # pymupdf

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "public" / "data" / "petrobangla" / "reserves-published.json"

SECTION_RE = re.compile(r"^([ABC])\.\s*(Producing|Non-Producing|Production Suspended)", re.I)
SUBTOTAL_RE = re.compile(r"^Sub-total\s*([ABC])", re.I)
GRAND_BCF_RE = re.compile(r"^Grand Total .*BCF", re.I)
GRAND_TCF_RE = re.compile(r"^Grand Total .*TCF", re.I)
NUM_RE = re.compile(r"^-?[\d,]+(?:\.\d+)?$")
YEAR_RE = re.compile(r"^(19|20)\d{2}$")

SECTION_KEY = {"A": "producing", "B": "non_producing", "C": "production_suspended"}


def num(tok: str) -> float | None:
    """A printed cell as a number. A bare dash is 'nil', not zero-by-assumption."""
    tok = tok.strip()
    if tok in {"-", "–", "—", ""}:
        return None
    if not NUM_RE.match(tok):
        return None
    return float(tok.replace(",", ""))


def find_pages(doc: fitz.Document) -> list[int]:
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        if re.search(r"Natural Gas Reserve", text, re.I) and "Cumulative" in text:
            pages.append(i)
        elif "Sub-total" in text and "Cumulative" in text and pages:
            pages.append(i)
    return pages


def as_of(doc: fitz.Document, pages: list[int]) -> str | None:
    """The date the remaining-reserve column is stated for, read off the table."""
    for i in pages:
        text = doc[i].get_text()
        m = re.search(r"\(1st\s*July,?\s*(\d{4})\)", text)
        if m:
            return f"{m.group(1)}-07-01"
        m = re.search(r"As of 30 June,?\s*(\d{4})", text)
        if m:
            return f"{int(m.group(1))}-07-01"
    return None


def parse(doc: fitz.Document, pages: list[int]) -> tuple[list[dict], dict, dict]:
    rows: list[dict] = []
    subtotals: dict[str, dict] = {}
    grand: dict = {}
    section = None
    buf: list[str] = []

    for i in pages:
        buf.extend(line.strip() for line in doc[i].get_text().splitlines())

    n = 0
    while n < len(buf):
        line = buf[n]

        m = SECTION_RE.match(line)
        if m:
            section = m.group(1).upper()
            n += 1
            continue

        m = SUBTOTAL_RE.match(line)
        if m:
            vals = [num(v) for v in buf[n + 1:n + 5]]
            subtotals[m.group(1).upper()] = dict(
                zip(("giip_bcf", "recoverable_2p_bcf", "cumulative_bcf", "remaining_bcf"), vals)
            )
            n += 5
            continue

        if GRAND_BCF_RE.match(line):
            vals = [num(v) for v in buf[n + 1:n + 5]]
            grand["bcf"] = dict(
                zip(("giip_bcf", "recoverable_2p_bcf", "cumulative_bcf", "remaining_bcf"), vals)
            )
            n += 5
            continue

        if GRAND_TCF_RE.match(line):
            vals = [num(v) for v in buf[n + 1:n + 5]]
            grand["tcf"] = dict(
                zip(("giip_tcf", "recoverable_2p_tcf", "cumulative_tcf", "remaining_tcf"), vals)
            )
            n += 5
            continue

        # A field row: serial, name, discovery year, estimator, estimate year,
        # then the four figures.
        if section and re.match(r"^\d{1,2}$", line) and n + 8 < len(buf):
            name = buf[n + 1]
            disc, est_co, est_yr = buf[n + 2], buf[n + 3], buf[n + 4]
            if YEAR_RE.match(disc) and YEAR_RE.match(est_yr):
                figures = [num(v) for v in buf[n + 5:n + 9]]
                rows.append({
                    "serial": int(line),
                    "section": SECTION_KEY[section],
                    # The asterisks are footnote markers, kept in `footnote_marker`
                    # so the name matches the daily report's spelling.
                    "field": name.rstrip("*").strip(),
                    "footnote_marker": name[len(name.rstrip("*")):] or None,
                    "discovery_year": int(disc),
                    "estimated_by": est_co,
                    "estimate_year": int(est_yr),
                    "giip_bcf": figures[0],
                    "recoverable_2p_bcf": figures[1],
                    "cumulative_bcf": figures[2],
                    "remaining_bcf": figures[3],
                })
                n += 9
                continue
        n += 1

    return rows, subtotals, grand


def check(rows: list[dict], subtotals: dict, grand: dict, tol: float = 0.6) -> list[str]:
    """Reproduce every printed total from the rows above it."""
    problems: list[str] = []
    cols = ("giip_bcf", "recoverable_2p_bcf", "cumulative_bcf", "remaining_bcf")

    for letter, key in SECTION_KEY.items():
        printed = subtotals.get(letter)
        if not printed:
            problems.append(f"section {letter}: no printed subtotal found")
            continue
        section_rows = [r for r in rows if r["section"] == key]
        if not section_rows:
            problems.append(f"section {letter}: no rows parsed")
            continue
        for col in cols:
            ours = sum(r[col] or 0 for r in section_rows)
            theirs = printed.get(col)
            if theirs is None:
                continue
            if abs(ours - theirs) > tol:
                problems.append(
                    f"section {letter} {col}: rows sum to {ours:.2f}, printed {theirs:.2f}"
                )

    if grand.get("bcf"):
        for col in cols:
            ours = sum((subtotals.get(l) or {}).get(col) or 0 for l in SECTION_KEY)
            theirs = grand["bcf"].get(col)
            if theirs is not None and abs(ours - theirs) > tol:
                problems.append(f"grand {col}: subtotals sum to {ours:.2f}, printed {theirs:.2f}")

    if grand.get("bcf") and grand.get("tcf"):
        pairs = (
            ("giip_bcf", "giip_tcf"),
            ("recoverable_2p_bcf", "recoverable_2p_tcf"),
            ("cumulative_bcf", "cumulative_tcf"),
            ("remaining_bcf", "remaining_tcf"),
        )
        for bcf_key, tcf_key in pairs:
            b, t = grand["bcf"].get(bcf_key), grand["tcf"].get(tcf_key)
            if b is not None and t is not None and abs(b / 1000 - t) > 0.01:
                problems.append(f"grand {bcf_key}: {b} BCF vs printed {t} TCF")

    return problems


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--apply", action="store_true", help="write the JSON artifact")
    args = ap.parse_args()

    path = Path(args.pdf)
    doc = fitz.open(path)
    pages = find_pages(doc)
    if not pages:
        print("no reserve table found in this document")
        return 2

    rows, subtotals, grand = parse(doc, pages)
    stated = as_of(doc, pages)
    print(f"{path.name}: reserve table on pages {[p + 1 for p in pages]}, as of {stated}")
    print(f"  {len(rows)} field rows, {len(subtotals)} subtotals, grand total {'yes' if grand else 'no'}")

    problems = check(rows, subtotals, grand)
    for p in problems:
        print(f"  CHECK FAILED  {p}")
    if problems:
        print("\nRefusing to write: the table does not reproduce its own totals.")
        return 1

    for letter, key in SECTION_KEY.items():
        s = subtotals[letter]
        print(f"  {key:20s} remaining {s['remaining_bcf']:9.2f} BCF   "
              f"cumulative {s['cumulative_bcf']:9.2f}   2P {s['recoverable_2p_bcf']:9.2f}")

    payload = {
        "source": {
            "publisher": "Petrobangla",
            "document": path.name,
            "table": "Natural Gas Reserve of Bangladesh",
            "pages": [p + 1 for p in pages],
            "as_of": stated,
            "unit": "BCF",
        },
        "checks_passed": [
            "section rows sum to printed subtotals",
            "subtotals sum to printed grand total",
            "BCF grand total matches printed TCF grand total",
        ],
        "subtotals": {SECTION_KEY[k]: v for k, v in subtotals.items()},
        "grand_total": grand,
        "fields": rows,
    }

    if args.apply:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"\nWritten: {OUT.relative_to(REPO)}")
    else:
        print("\nAll checks passed. Re-run with --apply to write the artifact.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
