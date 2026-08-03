"""Row-based extraction of the Petrobangla production table.

`parse_petrobangla_archive.py` locates values with fixed coordinate windows
(`rows_in(words, x0, x1, y0, y1)`). That works only while every PDF shares one
layout — on 2026-08-01's report the windows miss the R-LNG row entirely and the
day reconciles 501 MMCFD short.

This groups words into visual rows by their y-position and reads the numbers
positionally within each row, so a shifted table still parses. It is used as an
independent cross-check of the archive parser, not as a replacement: where the
two agree the day is trustworthy, and where they disagree the operator is told.

Usage: python scripts/pb_rows_extract.py <pdf>   -> JSON on stdout
"""
from __future__ import annotations

import json
import re
import sys

import fitz

# Rows that are structural rather than a producing field.
SUBTOTAL_RE = re.compile(r"sub-?total", re.IGNORECASE)
GRAND_RE = re.compile(r"grand\s*total", re.IGNORECASE)
NUM_RE = re.compile(r"^-?\d{1,3}(?:,\d{3})*(?:\.\d+)?$")


def page_rows(page) -> list[tuple[float, list]]:
    """Group a page's words into visual rows keyed by y, left-to-right."""
    buckets: dict[int, list] = {}
    for w in page.get_text("words"):
        buckets.setdefault(round(w[1] / 3.0), []).append(w)
    rows = []
    for k in sorted(buckets):
        ws = sorted(buckets[k], key=lambda x: x[0])
        rows.append((round(ws[0][1], 1), ws))
    return rows


def numbers_in(words: list) -> list[float]:
    out = []
    for w in words:
        tok = w[4].replace(",", "")
        if NUM_RE.match(w[4]) or re.match(r"^-?\d+(?:\.\d+)?$", tok):
            try:
                out.append(float(tok))
            except ValueError:
                pass
    return out


def production_bounds(rows: list[tuple[float, list]]) -> tuple[float, float]:
    """y-range of section I (Production), located by its printed headings.

    Bounding by the headings rather than fixed coordinates is the whole point:
    the table can move down the page and the section still resolves.
    """
    start, end = 0.0, 1e9
    for y, ws in rows:
        text = " ".join(w[4] for w in ws)
        if re.search(r"\bI\.\s*Production", text) and start == 0.0:
            start = y
        # Section II ends production; the SGFL block (III) sits alongside it.
        if re.search(r"\bII\.\s*Distribution", text):
            end = min(end, y)
    return start, end


def extract(pdf_path: str) -> dict:
    doc = fitz.open(pdf_path)
    page = doc[0]
    all_rows = page_rows(page)
    top, bottom = production_bounds(all_rows)
    rows = [(y, ws) for y, ws in all_rows if top <= y < bottom]

    fields: list[dict] = []
    subtotals: list[dict] = []
    grand: float | None = None

    for _y, ws in rows:
        text = " ".join(w[4] for w in ws)
        nums = numbers_in(ws)

        if GRAND_RE.search(text):
            # Grand Total: wells, capacity, gas, condensate, %cap, %prod
            if len(nums) >= 3:
                grand = nums[2]
            continue

        if SUBTOTAL_RE.search(text):
            if len(nums) >= 3:
                subtotals.append({"label": text.strip(), "gas": nums[2]})
            continue

        # A producing-field row: a name followed by >=4 numbers, where the third
        # is the gas figure. Rows with fewer numbers are headers or notes.
        if len(nums) >= 4:
            name = " ".join(w[4] for w in ws if not NUM_RE.match(w[4])).strip()
            name = re.sub(r"^\s*\d+\.\s*", "", name)
            name = re.sub(r"\b(BGFCL|SGFL|BAPEX|CHEVRON|TULLOW|IOCS?)\b\s*", "", name, flags=re.IGNORECASE).strip()
            if name and not re.search(r"pipeline|delivered|remark|company|fields|wells", name, re.IGNORECASE):
                fields.append({"field": name, "wells": nums[0], "capacity": nums[1],
                               "gas": nums[2], "condensate": nums[3]})

    # RPGCL prints on one line without a separate field row on some layouts.
    rlng = next((s for s in subtotals if "rpgcl" in s["label"].lower() or "r-lng" in s["label"].lower()), None)

    field_sum = round(sum(f["gas"] for f in fields), 1)
    return {
        "fields": fields,
        "field_count": len(fields),
        "subtotals": subtotals,
        "grand_total_gas": grand,
        "field_gas_sum": field_sum,
        "rlng_subtotal": rlng["gas"] if rlng else None,
        "variance": None if grand is None else round(abs(field_sum - grand), 1),
    }


# Petrobangla's sub-total rows begin with the company's producing-well count and
# capacity. Those two are structural — they are the same on every report — so
# they identify a row far more reliably than its position on the page.
SUBTOTAL_SIGNATURE = {
    (44.0, 851.0): "BGFCL",
    (17.0, 143.0): "SGFL",
    (15.0, 145.0): "BAPEX",
    (76.0, 1139.0): "DOMESTIC_GROUP",   # Sub-Total (1+2+3)
    (43.0, 1615.0): "CHEVRON",          # includes Tullow's Bangora
    (0.0, 1100.0): "RPGCL",
}


def company_totals(pdf_path: str) -> dict:
    """Per-company gas from the PDF's own printed sub-totals.

    Preferred over summing individual field rows: the sub-totals are printed by
    Petrobangla, survive layout drift, and reconcile against the printed grand
    total. When a sub-total row is missed (SGFL on 2026-08-01) it is recovered
    from the (1+2+3) group total, which is arithmetic rather than guesswork.
    """
    doc = fitz.open(pdf_path)
    rows = page_rows(doc[0])
    top, bottom = production_bounds(rows)
    scoped = [(y, ws) for y, ws in rows if top <= y < bottom]

    by_company: dict[str, float] = {}
    cond_by: dict[str, float] = {}
    grand = None
    bangora = None
    bangora_cond = 0.0

    for _y, ws in scoped:
        text = " ".join(w[4] for w in ws)
        nums = numbers_in(ws)

        if GRAND_RE.search(text) and len(nums) >= 3:
            grand = nums[2]
            continue

        if re.search(r"bangora", text, re.IGNORECASE) and len(nums) >= 3:
            bangora = nums[2]
            bangora_cond = nums[3] if len(nums) > 3 else 0.0
            continue

        if SUBTOTAL_RE.search(text) and len(nums) >= 3:
            who = SUBTOTAL_SIGNATURE.get((nums[0], nums[1]))
            if who:
                by_company[who] = nums[2]
                if len(nums) > 3:
                    cond_by[who] = nums[3]

    # SGFL sits between the group total and its two siblings.
    if "SGFL" not in by_company and {"DOMESTIC_GROUP", "BGFCL", "BAPEX"} <= by_company.keys():
        by_company["SGFL"] = round(
            by_company["DOMESTIC_GROUP"] - by_company["BGFCL"] - by_company["BAPEX"], 1
        )
        if {"DOMESTIC_GROUP", "BGFCL", "BAPEX"} <= cond_by.keys():
            cond_by["SGFL"] = round(
                cond_by["DOMESTIC_GROUP"] - cond_by["BGFCL"] - cond_by["BAPEX"], 1
            )

    # Bangora is printed inside the Chevron block but belongs to Tullow.
    chevron = by_company.get("CHEVRON")
    if chevron is not None and bangora is not None:
        by_company["TULLOW"] = bangora
        by_company["CHEVRON"] = round(chevron - bangora, 1)
        if "CHEVRON" in cond_by:
            cond_by["TULLOW"] = bangora_cond
            cond_by["CHEVRON"] = round(cond_by["CHEVRON"] - bangora_cond, 1)

    parts = [by_company.get(k) for k in ("BGFCL", "SGFL", "BAPEX", "CHEVRON", "TULLOW", "RPGCL")]
    total = round(sum(p for p in parts if p is not None), 1)

    return {
        "companies": by_company,
        "condensate": cond_by,
        "total": total,
        "grand_total_printed": grand,
        "variance": None if grand is None else round(abs(total - grand), 1),
        "reconciled": grand is not None and abs(total - grand) <= 5.0,
        "missing": [k for k, v in zip(("BGFCL", "SGFL", "BAPEX", "CHEVRON", "TULLOW", "RPGCL"), parts) if v is None],
    }


if __name__ == "__main__":
    mode = sys.argv[2] if len(sys.argv) > 2 else "fields"
    print(json.dumps(company_totals(sys.argv[1]) if mode == "companies" else extract(sys.argv[1]), indent=2))
