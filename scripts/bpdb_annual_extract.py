"""Extract BPDB's published Key Statistics from its Annual Reports.

BPDB prints, once a year, the two numbers the daily PGCB report cannot give:
the all-in per-unit generation cost and the fuel-only per-unit cost, on the
same page and for the same year. Both are BPDB's own arithmetic, printed in
its own report -- Published, not Derived.

Two engines read every figure and a value ships only where both agree:

  A  PyMuPDF word coordinates. The two year columns and the "% Change" column
     are located by the x of their own header cells, and every numeric token
     is assigned to whichever column it sits under. Geometry only -- it never
     looks at what a number means.

  B  pdfplumber line text, no coordinates at all. BPDB prints a third column,
     "% Change over the previous year", which is the arithmetic of the other
     two. So engine B takes the numbers in a row and searches for the triple
     (prior, current, change) where change reproduces (cur-prior)/prior*100.
     That both identifies the columns and proves the row was read correctly.

They share no code path into the PDF and no notion of where a column is, so
the serial-number column that BPDB prints at the left -- which silently
poisoned a first attempt -- cannot pass both. Only the reports that carry a
text layer can be read; the pre-2016 files are page scans and are skipped
rather than guessed at.
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections import defaultdict

DIR = r"W:\Grid-Explorer\BPDB\Annual Reports"

# label -> (regex matching the printed row, unit, short key)
METRICS = [
    ("generationCostPerUnit", r"Per Unit Generation Cost", "Tk/kWh"),
    ("fuelCostPerUnitThermal", r"Per Unit fuel Cost", "Tk/kWh"),
    ("fuelCostThermalPublic", r"Fuel Cost for Thermal Plants", "MTk"),
    ("bulkSupplyCostPerUnit", r"Bulk Electricity Supply cost", "Tk/kWh"),
    ("bulkTariffPerUnit", r"Average Bulk Tariff", "Tk/kWh"),
    ("bulkSalesUnits", r"Bulk Sales Unit to Utilities", "MkWh"),
    # Net energy generation split by who generated it. These are the
    # denominators a per-source unit cost needs; the matching numerators are
    # the purchase heads in the Comparative Statement of Budget and Achievement.
    ("genPublicSector", r"^\s*a\)\s*i\)\s*Public Sector", "MkWh"),
    ("genJointVenture", r"^\s*ii\)\s*Joint Venture", "MkWh"),
    ("genPrivateSector", r"iii\)\s*Private Sector", "MkWh"),
    ("genPowerImport", r"iv\)\s*Power Import", "MkWh"),
    ("genSingleBuyerTotal", r"Total Generation \( In account of Single Buyer", "MkWh"),
    ("systemTotalGeneration", r"System Total Generation", "MkWh"),
    ("maxPeakGeneration", r"Maximum Peak Generation", "MW"),
    ("installedCapacity", r"System Total Installed Capacity", "MW"),
    ("tdLoss", r"\(T\s*&\s*D\)\s*system Loss", "%"),
    ("netProfitLoss", r"Net profit/\(loss\)", "MTk"),
]

NUM = re.compile(r"^\(?-?[\d,]+(?:\.\d+)?\)?%?$")


def _num(tok: str):
    """Parse a printed figure. Parentheses and a trailing % are BPDB's, not data."""
    t = tok.strip().rstrip("%")
    neg = t.startswith("(") and t.endswith(")")
    t = t.strip("()").replace(",", "")
    if not re.fullmatch(r"-?\d+(?:\.\d+)?", t):
        return None
    v = float(t)
    return -v if neg else v


FY = re.compile(r"20\d\d-\d\d")


def _dp(tokens, value):
    """Decimal places BPDB printed this value to, read off the token itself."""
    for t in tokens:
        if _num(t) == value and "." in t:
            return len(t.split(".")[-1].strip(")%"))
    return 0


def engine_a(path: str):
    """PyMuPDF: assign every number to a column by x, using the table's own header."""
    import fitz

    doc = fitz.open(path)
    page = next((p for p in doc if re.search(r"Per\s*Unit", p.get_text())), None)
    if page is None:
        return None, None
    words = [(x0, y0, w) for x0, y0, _x1, _y1, w, *_ in page.get_text("words")]

    rows = defaultdict(list)
    for x, y, w in words:
        rows[round(y / 3)].append((x, w))

    # The header is the row carrying both fiscal years. The running title
    # "Annual Report 2022-23" carries only one, so it cannot be mistaken for it.
    hdr_key = next(
        (k for k in sorted(rows)
         if len({w for _x, w in rows[k] if FY.fullmatch(w)}) >= 2),
        None,
    )
    if hdr_key is None:
        return None, None
    cells = sorted(((x, w) for x, w in rows[hdr_key] if FY.fullmatch(w)))
    col_x = [cells[0][0], cells[1][0]]
    years = [cells[0][1], cells[1][1]]

    out = {}
    for key, pat, _unit in METRICS:
        rx = re.compile(pat, re.I)
        row = next(
            (rows[k] for k in sorted(rows)
             if k > hdr_key and rx.search(" ".join(w for _x, w in sorted(rows[k])))),
            None,
        )
        if row is None:
            continue
        picked = {}
        for x, w in row:
            if not NUM.match(w) or w.endswith("%"):
                continue
            v = _num(w)
            if v is None:
                continue
            near = min((0, 1), key=lambda c: abs(x - col_x[c]))
            d = abs(x - col_x[near])
            if d > 46:                     # the label and the serial number
                continue
            if near not in picked or d < picked[near][0]:
                picked[near] = (d, v)
        if 0 in picked and 1 in picked:
            out[key] = (picked[0][1], picked[1][1])
    return out, years


def engine_b(path: str):
    """pdfplumber: no coordinates -- find the triple whose % change reconciles."""
    import pdfplumber

    with pdfplumber.open(path) as pdf:
        page = next(
            (p for p in pdf.pages if re.search(r"Per\s*Unit", p.extract_text() or "")),
            None,
        )
        if page is None:
            return None, None
        raw = [ln for ln in (page.extract_text() or "").split("\n") if ln.strip()]

    # Column order comes from the header line that carries both fiscal years,
    # left to right as printed -- the running title carries only one, so it
    # cannot be confused for the header.
    years = next((FY.findall(ln) for ln in raw if len(set(FY.findall(ln))) >= 2), None)
    if not years:
        return None, None
    years = list(dict.fromkeys(years))[:2]

    lines = [ln.split() for ln in raw]
    out = {}
    for key, pat, _unit in METRICS:
        rx = re.compile(pat, re.I)
        idx = next((i for i, ln in enumerate(lines) if rx.search(" ".join(ln))), None)
        if idx is None:
            continue
        toks = lines[idx]
        # Everything before the label is BPDB's serial-number column, which is
        # a number too. Start reading only after the last word of the label.
        tail = " ".join(toks)
        m = rx.search(tail)
        after = tail[m.start():].split()
        nums = [_num(t) for t in after if NUM.match(t)]
        nums = [n for n in nums if n is not None]
        if len(nums) < 3:
            continue
        # The row ends: prior, current, % change over the previous year. Accept
        # it only where the printed change reproduces the pair -- that is what
        # proves the right three numbers were read.
        prior, cur, chg = nums[-3:]
        if prior == 0:
            continue
        want = (cur - prior) / abs(prior) * 100
        # BPDB computes the change from figures it then rounds for printing, so
        # the printed change will not reproduce exactly from the printed pair.
        # Allow for half a unit in the last printed place of each of the two,
        # carried through the division -- not a blanket fudge factor.
        half_prior = 0.5 * 10 ** -_dp(after, prior)
        half_cur = 0.5 * 10 ** -_dp(after, cur)
        tol = 100 * (half_cur / abs(prior) + abs(cur) * half_prior / prior**2) + 0.02
        if abs(chg - want) <= tol:
            out[key] = (prior, cur)
    return out, years


def main():
    man = json.load(open(os.path.join(DIR, "manifest.json"), encoding="utf-8"))
    series = defaultdict(dict)   # fy -> metric -> {value, source}
    report = []

    for title, meta in man.items():
        path = os.path.join(DIR, meta["file"])
        try:
            a, ya = engine_a(path)
            b, yb = engine_b(path)
        except Exception as exc:                     # scanned file, no text layer
            report.append(f"{title:22s} SKIP  {exc}")
            continue
        if not a or not b:
            report.append(f"{title:22s} SKIP  no Key Statistics text layer")
            continue
        if ya != yb or not ya:
            report.append(f"{title:22s} REJECT year header disagreement {ya} vs {yb}")
            continue

        agreed = disputed = 0
        for key, _pat, unit in METRICS:
            if key not in a or key not in b:
                continue
            if a[key] != b[key]:
                report.append(f"{title:22s} DISPUTE {key}: A={a[key]} B={b[key]}")
                disputed += 1
                continue
            agreed += 1
            for fy, val in zip(ya, a[key]):
                prev = series[fy].get(key)
                entry = {
                    "value": val,
                    "unit": unit,
                    "source": meta["file"],
                    "sourceFy": ya[1],
                    "page": "Key Statistics",
                }
                if prev is None:
                    series[fy][key] = entry
                    continue
                if abs(prev["value"] - val) <= 1e-9:
                    continue
                # BPDB restates. Where two of its own reports print different
                # figures for the same year, the report FOR that year is taken
                # and the other is kept beside it -- neither is discarded,
                # because both are published, and a reader is owed the
                # disagreement rather than a silent pick.
                own, other = (entry, prev) if ya[1] == fy else (prev, entry)
                own = dict(own)
                own["restatedAs"] = {
                    "value": other["value"],
                    "source": other["source"],
                    "sourceFy": other["sourceFy"],
                }
                series[fy][key] = own
                report.append(
                    f"{title:22s} RESTATED {fy} {key}: {own['value']} "
                    f"({own['source']}) vs {other['value']} ({other['source']})"
                )
        report.append(f"{title:22s} OK    years={ya} agreed={agreed} disputed={disputed}")

    print("\n".join(report))
    print(f"\nfiscal years covered: {sorted(series)}")
    out = os.path.join(DIR, "key-statistics.json")
    json.dump(dict(sorted(series.items())), open(out, "w", encoding="utf-8"), indent=1)
    print(f"wrote {out}")


if __name__ == "__main__":
    sys.exit(main())
