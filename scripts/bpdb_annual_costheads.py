"""Extract BPDB's operating cost heads from its Annual Reports.

Every annual report carries a "COMPARATIVE STATEMENT OF BUDGET AND
ACHIVEMENT" (BPDB's spelling). Its Achievement column is what BPDB actually
spent, split into the heads that matter for a unit cost: the three fuels it
burns itself, the four kinds of electricity it buys, and the fixed costs.

Only the Achievement column is taken. The Budget column is a plan, not an
outcome, and the two right-hand columns are BPDB's own arithmetic on the
first two -- which is exactly what makes them useful as a check.

Two engines, as with the Key Statistics:
  A  PyMuPDF word coordinates, columns located by their own header cells
  B  pdfplumber line text with no coordinates, which instead requires that
     Achievement - Budget reproduce the printed "Performance Over Budget"

UNITS CHANGE BETWEEN YEARS. The older reports print "Amount in Lac Taka" and
the 2022-23 report prints "Figures are in Crore BDT" -- a factor of 100. The
unit is read off each page rather than assumed, and everything is normalised
to Crore BDT.
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections import defaultdict

DIR = r"W:\Grid-Explorer\BPDB\Annual Reports"

HEADS = [
    ("energySales", r"^ENERGY SALES", "revenue"),
    ("otherOperatingIncome", r"OTHER OPERATING INCOME", "revenue"),
    ("fuelGas", r"FUEL COST\s*-\s*GAS", "own-fuel"),
    ("fuelOil", r"DIESEL/FURNACE OIL USED", "own-fuel"),
    ("fuelCoal", r"COAL USED FOR ELECTRICITY", "own-fuel"),
    ("purchaseIpp", r"ELECTRICITY PURCHASE FROM IPP", "purchase"),
    ("purchaseRental", r"ELECTRICITY PURCHASE FROM RENTAL", "purchase"),
    ("purchaseIndia", r"ELECTRICITY PURCHASE FROM INDIA", "purchase"),
    ("purchasePublic", r"ELECTRICITY PURCHASE FROM PUBLIC", "purchase"),
    ("depreciation", r"^DEPRECIATION", "fixed"),
    ("repairMaintenance", r"REPAIR & MAINTENANCE", "fixed"),
    ("personnel", r"PERSONNEL EXPENSES", "fixed"),
    ("officeAdmin", r"OFFICE & ADMINISTRATIVE", "fixed"),
    ("wheelingCharge", r"TRANSMISSION EXPENSES FOR WHEELING", "network"),
    ("totalOperatingExpenses", r"TOTAL OPERATING EXPENSES", "total"),
    ("subsidy", r"SUBSIDY FROM GOVT", "subsidy"),
]

COMPONENTS = {"own-fuel", "purchase", "fixed", "network"}

NUM = re.compile(r"^\(?-?[\d,]+(?:\.\d+)?\)?$")
UNIT = re.compile(r"(?:Figures are in|Amount in)\s*(Lac|Crore)", re.I)


def _num(tok: str):
    t = tok.strip()
    neg = t.startswith("(") and t.endswith(")")
    t = t.strip("()").replace(",", "")
    if not re.fullmatch(r"-?\d+(?:\.\d+)?", t):
        return None
    v = float(t)
    return -v if neg else v


HEADING = re.compile(r"COMPARATIVE\s+STATEMENT\s+OF\s+BUDGET", re.I)


def _scale(token: str):
    """Crore per printed unit. 1 Crore = 100 Lac."""
    return 0.01 if token.lower() == "lac" else 1.0


def _page(doc_pages, get_text):
    """The statement page. Several reports print this table on the same page as
    Table-C, which is captioned in Crore while the statement below it is in Lac
    -- so the page is found by the statement's own heading, and everything is
    then read below that heading only."""
    for i, p in enumerate(doc_pages):
        t = get_text(p)
        # The table of contents names the statement too, so the page must also
        # carry the table's own furniture: its unit caption, its Achievement
        # column header, and one of its cost heads.
        if (
            HEADING.search(t)
            and UNIT.search(t)
            and re.search(r"\bAchievement\b", t, re.I)
            and re.search(r"ELECTRICITY PURCHASE FROM IPP", t, re.I)
        ):
            return i, t
    return None, None


def engine_a(path: str):
    import fitz

    doc = fitz.open(path)
    idx, text = _page(list(doc), lambda p: p.get_text())
    if idx is None:
        return None, None
    page = doc[idx]

    rows = defaultdict(list)
    for x0, y0, x1, _y1, w, *_ in page.get_text("words"):
        rows[round(y0 / 3)].append(((x0 + x1) / 2, w))     # centre, not left edge:
    keys = sorted(rows)                                    # headers are left-aligned
    #                                                        and figures right-aligned
    line = lambda k: " ".join(w for _x, w in sorted(rows[k]))

    head_k = next((k for k in keys if HEADING.search(line(k))), None)
    if head_k is None:
        return None, None
    # The unit caption belonging to this statement is the first one below its
    # heading -- not the first on the page, which captions the table above it.
    cap = next((UNIT.search(line(k)) for k in keys
                if k > head_k and UNIT.search(line(k))), None)
    if cap is None:
        return None, None
    scale = _scale(cap.group(1))

    hdr_key = next(
        (k for k in keys if k > head_k and re.search(r"\bAchievement\b", line(k), re.I)),
        None,
    )
    if hdr_key is None:
        return None, None

    # The column is found from the figures rather than from the header cell.
    # Header text is left-aligned and figures are right-aligned, so the two do
    # not share an x -- in one report they missed by 30.1 points and four cost
    # heads silently vanished. The figures themselves cluster cleanly into
    # columns, and Budget then Achievement is the printed order in every year.
    xs = sorted(x for k in keys if k > hdr_key
                for x, w in rows[k] if NUM.match(w) and _num(w) is not None)
    if len(xs) < 8:
        return None, None
    cols, cur = [], [xs[0]]
    for x in xs[1:]:
        if x - cur[-1] > 18:
            cols.append(cur)
            cur = []
        cur.append(x)
    cols.append(cur)
    cols = [c for c in cols if len(c) >= 4]          # ignore stray marks
    if len(cols) < 2:
        return None, None
    ach = cols[1]
    ach_x = sum(ach) / len(ach)
    tol = max(12.0, (ach[-1] - ach[0]) / 2 + 6)

    out = {}
    for key, pat, _grp in HEADS:
        rx = re.compile(pat, re.I)
        idx_k = next((i for i, k in enumerate(keys)
                      if k > hdr_key and rx.search(line(k))), None)
        if idx_k is None:
            continue
        def under(k):
            """Numbers sitting in the Achievement column on row k."""
            return [(abs(x - ach_x), _num(w)) for x, w in rows[k]
                    if NUM.match(w) and _num(w) is not None
                    and abs(x - ach_x) <= tol]

        # BPDB wraps a long label onto a line of its own and leaves that row's
        # figures on the line above. Only then is the line above read -- taking
        # it unconditionally would hand every ordinary row its predecessor's
        # number, which is what a first attempt did.
        cand = under(keys[idx_k])
        if not cand and idx_k:
            cand = under(keys[idx_k - 1])
        if cand:
            out[key] = round(min(cand)[1] * scale, 2)
    return out, scale


def engine_b(path: str):
    import pdfplumber

    with pdfplumber.open(path) as pdf:
        idx, text = _page(pdf.pages, lambda p: p.extract_text() or "")
        if idx is None:
            return None, None
        raw = [ln for ln in text.split("\n") if ln.strip()]

    # Same hazard as engine A, handled in reading order rather than geometry:
    # drop everything above the statement's heading so Table-C above it -- a
    # different table, in a different unit -- cannot be read by mistake.
    start = next((j for j, ln in enumerate(raw) if HEADING.search(ln)), None)
    if start is None:
        return None, None
    raw = raw[start:]
    cap = next((UNIT.search(ln) for ln in raw if UNIT.search(ln)), None)
    if cap is None:
        return None, None
    scale = _scale(cap.group(1))
    lines = [ln.split() for ln in raw]

    out = {}
    for key, pat, _grp in HEADS:
        rx = re.compile(pat, re.I)
        i = next((j for j, ln in enumerate(lines) if rx.search(" ".join(ln))), None)
        if i is None:
            continue
        # The label can sit on its own line with the figures above it, so read
        # the label's line and, failing that, the line before.
        for src in (lines[i], lines[i - 1] if i else []):
            nums = [_num(t) for t in src if NUM.match(t)]
            nums = [n for n in nums if n is not None]
            if len(nums) < 3:
                continue
            budget, ach, perf = nums[:3]
            # BPDB prints Performance Over Budget = Budget - Achievement for
            # costs and Achievement - Budget for revenue; accept either, since
            # what is being proved is that these three numbers are one row.
            if min(abs(perf - (budget - ach)), abs(perf - (ach - budget))) <= 0.02:
                out[key] = round(ach * scale, 2)
                break
    return out, scale


def main():
    man = json.load(open(os.path.join(DIR, "manifest.json"), encoding="utf-8"))
    years = {}
    log = []

    for title, meta in man.items():
        path = os.path.join(DIR, meta["file"])
        try:
            a, sa = engine_a(path)
            b, sb = engine_b(path)
        except Exception as exc:
            log.append(f"{title:22s} SKIP  {exc}")
            continue
        if not a or not b:
            log.append(f"{title:22s} SKIP  no budget statement in a text layer")
            continue
        if sa != sb:
            log.append(f"{title:22s} REJECT unit disagreement {sa} vs {sb}")
            continue

        # The statement is for the report's own fiscal year alone.
        fy = re.search(r"(20\d\d)-(20\d\d|\d\d)", title)
        fy = f"{fy.group(1)}-{fy.group(2)[-2:]}" if fy else title

        rec, disputed = {}, []
        for key, _pat, grp in HEADS:
            if key not in a or key not in b:
                continue
            if abs(a[key] - b[key]) > 0.011:
                disputed.append((key, grp))
                continue
            rec[key] = {"value": a[key], "group": grp}
        if not rec:
            continue

        # Where the engines disagree, BPDB's own printed total is a third
        # witness that neither engine had a hand in: the twelve cost heads must
        # sum to Total Operating Expenses. Whichever reading closes that gap is
        # the one the report actually prints. A dispute no residual can settle
        # is left out rather than guessed.
        for key, grp in list(disputed):
            others = sum(v["value"] for k, v in rec.items() if v["group"] in COMPONENTS)
            total = rec.get("totalOperatingExpenses", {}).get("value")
            if key == "totalOperatingExpenses":
                target, have = others, [a[key], b[key]]
            elif total is not None and grp in COMPONENTS:
                target, have = total - others, [a[key], b[key]]
            else:
                continue
            win = [v for v in have if abs(v - target) <= 0.05]
            if len(win) == 1:
                rec[key] = {"value": win[0], "group": grp, "resolvedBy": "printed total"}
                disputed.remove((key, grp))
                log.append(
                    f"{title:22s} RESOLVED {key}={win[0]} by residual "
                    f"({target:.2f}); rejected {[v for v in have if v not in win]}"
                )
        prev = years.get(fy)
        if prev and len(prev["heads"]) >= len(rec):
            log.append(f"{title:22s} DUP   {fy} already held from {prev['source']}")
            continue
        years[fy] = {
            "fy": fy,
            "unit": "Crore BDT",
            "printedUnit": "Lac Taka" if sa == 0.01 else "Crore BDT",
            "source": meta["file"],
            "sourceUrl": meta["url"],
            "statement": "Comparative Statement of Budget and Achievement (Achievement column)",
            "heads": rec,
        }
        log.append(
            f"{title:22s} OK    fy={fy} heads={len(rec)} unit={'Lac' if sa==0.01 else 'Crore'}"
            + (f" UNRESOLVED={[k for k, _g in disputed]}" if disputed else "")
        )

    print("\n".join(log))
    out = os.path.join(DIR, "cost-heads.json")
    json.dump(dict(sorted(years.items())), open(out, "w", encoding="utf-8"), indent=1)
    print(f"\nyears: {sorted(years)}\nwrote {out}")


if __name__ == "__main__":
    sys.exit(main())
