"""Rebuild `gasProductionData` in the daily grid files from the validated archive.

Why this exists. `parse_daily_reports.extract_production_values` stopped its
number scan at the first token without digits, so a field whose name carries a
qualifier after the matched part — "Kailashtila #1 (Silicagel)",
"Kailashtila #2 (MSTE)" — returned nothing at all. Both SGFL fields read as
zero on every day, publishing SGFL about 45 MMCFD short and leaving the six
company rows unable to reproduce the grand total the same report prints. The
function is fixed, but the days already written still carry the old figures.

Why from the archive rather than by re-parsing the PDFs. `public/data/petrobangla/daily/`
already holds a per-field parse of each report that was checked against the
report's own printed grand total before it was written. Re-parsing 2,287 PDFs
would reintroduce the date-mapping problem this project keeps getting bitten by,
to arrive at figures that are already on disk.

**The archive filename is not the gas day.** Roughly 95% of those files are keyed
by the report's END date — `2020-01-19.json` holds the report headed
"18-19 Jan, 2020", which covers the gas day starting 01-18 — while a handful of
recent days are keyed by its START. Both conventions sit in the same directory.
A first version of this script matched grid day E to `<E>.json` and would have
shifted 1,262 days by one, replacing correct figures with the neighbouring day's:
PGCB's own gas-to-power for day E tracks the report *starting* on E on 1,743 of
2,197 days, against 447 for the other reading. So days are matched on the
`gas_day_start` each file declares, never on its name, and a grid day whose
report cannot be found that way is left alone.

What it will not do:

  * touch any section other than gasProductionData — every other key is compared
    before and after, and the day is skipped if anything else moved
  * write a day whose rebuilt company rows do not reproduce the archive's own
    grand total for that day
  * write a day whose archive parse did not itself reconcile
  * invent a company: a field it cannot attribute is reported, not dropped

Usage:
  python scripts/repair_grid_gas_from_archive.py [--apply] [--from YYYY-MM-DD] [--limit N]
"""
from __future__ import annotations

import argparse
import collections
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DAILY = REPO / "public" / "data" / "daily"
ARCHIVE = REPO / "public" / "data" / "petrobangla" / "daily"

# Same attribution the Gas tab uses (FIELD_OWNER in PetrobanglaSectionDetail.tsx),
# kept in step with it deliberately: the table and this repair must agree on
# which company a field belongs to or the row labels stop matching the figures.
FIELD_OWNER = {
    "titas": "BGFCL", "habiganj": "BGFCL", "bakhrabad": "BGFCL",
    "narsingdi": "BGFCL", "meghna": "BGFCL",
    "sylhet": "SGFL", "kailashtila #1 (silicagel)": "SGFL",
    "kailashtila #2 (mste)": "SGFL", "rashidpur": "SGFL", "beanibazar": "SGFL",
    "salda": "BAPEX", "fenchuganj": "BAPEX", "shahbazpur": "BAPEX",
    "semutung": "BAPEX", "sundalpur": "BAPEX", "srikail": "BAPEX",
    "begumganj": "BAPEX", "begumgonj": "BAPEX", "rupganj": "BAPEX",
    "jalalabad": "CHEVRON", "maulavibazar": "CHEVRON",
    "moulavibazar": "CHEVRON", "bibiyana": "CHEVRON",
    "bangora": "TULLOW",
}

# The row order and labels the grid file uses, so a rebuilt day is
# indistinguishable in shape from a correctly parsed one.
COMPANY_ROWS = [
    ("BGFCL", "BGFCL (Titas, Habiganj, Bakhrabad)", 5),
    ("SGFL", "SGFL (Sylhet, Rashidpur, Kailashtila)", 5),
    ("BAPEX", "BAPEX (Shahbazpur, Srikail, Begumganj)", 9),
    ("CHEVRON", "Chevron (Bibiyana, Jalalabad, Moulavibazar)", 3),
    ("TULLOW", "Tullow (Bangora)", 1),
    ("RPGCL", "RPGCL (R-LNG Import / LNG Terminal)", 0),
]


def collapse_doubled_glyphs(s):
    """"SSyyllhheett" -> "Sylhet", for rows where overlapping text doubled every glyph.

    Only collapses when the *whole* string is pairwise doubled. The blunt
    `(.)\\1 -> \\1` used elsewhere would also rewrite any legitimate name that
    happens to contain a double letter; none of Petrobangla's field names do
    today, but this cannot damage one that arrives tomorrow.
    """
    if len(s) < 2 or len(s) % 2:
        return s
    if all(s[i] == s[i + 1] for i in range(0, len(s), 2)):
        return s[::2]
    return s


def collapse_doubled_words(s):
    """"Sylhet Sylhet" -> "Sylhet". A separate artifact from the glyph doubling."""
    parts = s.split()
    if len(parts) == 2 and parts[0].lower() == parts[1].lower():
        return parts[0]
    return s


def clean_field_name(raw):
    """Strip leaked "N. COMPANY" prefixes so "1. BGFCL Bakhrabad" reads "Bakhrabad"."""
    s = collapse_doubled_glyphs((raw or "").strip())
    s = re.sub(r"^\s*\d+\.\s*", "", s)
    s = re.sub(r"\b(BGFCL|SGFL|BAPEX|CHEVRON|TULLOW|IOCS?)\b\s*", "", s, flags=re.I)
    return collapse_doubled_words(s.strip())


def field_owner(f):
    name = clean_field_name(f.get("field")).lower()
    if name in FIELD_OWNER:
        return FIELD_OWNER[name]
    if name.startswith("r-lng"):
        return "RPGCL"
    operator = (f.get("operator") or "").upper()
    if "CHEVRON" in operator:
        return "CHEVRON"
    if "TULLOW" in operator:
        return "TULLOW"
    code = f.get("company_code")
    return code if code and code != "IOC" else None


def is_real_field_row(f):
    """A production line, not a subtotal or the grand total.

    The record_type alone is not enough: on 242 days a "Sub-Total" row arrives
    typed as a field, with its glyphs doubled ("SSuubb--TToottaall"), so the name
    has to be normalised before it can be recognised and dropped.
    """
    if f.get("record_type") not in (None, "field"):
        return False
    name = clean_field_name(f.get("field"))
    if not name:
        return False
    return not re.search(r"sub.?total|grand.?total", name, re.I)


def others(doc):
    """Every section except the one being rewritten, as a stable string."""
    return json.dumps({k: v for k, v in doc.items() if k != "gasProductionData"}, sort_keys=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--from", dest="start", default="")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    # gas_day_start -> archive file, because the filename means different things
    # in different eras. A start claimed by two files is dropped rather than
    # guessed between.
    by_start: dict[str, Path] = {}
    clashes: set[str] = set()
    for p in sorted(ARCHIVE.glob("*.json")):
        if len(p.stem) != 10:
            continue
        try:
            report = json.loads(p.read_text(encoding="utf-8")).get("report") or {}
        except Exception:  # noqa: BLE001
            continue
        start = report.get("gas_day_start") or report.get("report_date_start")
        if not start:
            continue
        if start in by_start:
            clashes.add(start)
            continue
        by_start[start] = p
    for c in clashes:
        by_start.pop(c, None)
    print("%d archive report(s) indexed by their own gas_day_start" % len(by_start))
    if clashes:
        print("%d gas day(s) claimed by more than one file — skipped\n" % len(clashes))

    days = sorted(p.stem for p in DAILY.glob("*.json") if len(p.stem) == 10)
    if args.start:
        days = [d for d in days if d >= args.start]
    if args.limit:
        days = days[: args.limit]

    stats = collections.Counter()
    unattributed = collections.Counter()
    repaired, examples = 0, []

    for day in days:
        target = DAILY / f"{day}.json"
        # The report covering this energy day is the one whose 8am-8am window
        # STARTS on it, matched on the window each file declares.
        arch_path = by_start.get(day)
        if arch_path is None:
            stats["no report declares a gas day starting on this date"] += 1
            continue

        arch = json.loads(arch_path.read_text(encoding="utf-8"))
        prod = arch.get("production") or {}
        grand = (prod.get("grand_total") or {}).get("gas_mmcfd")
        fields = [f for f in (prod.get("fields") or []) if is_real_field_row(f)]
        if grand is None or not fields:
            stats["archive day carries no usable production table"] += 1
            continue

        # The archive parse must itself reconcile before it can repair anything.
        field_sum = sum(f.get("gas_mmcfd") or 0 for f in fields)
        if abs(field_sum - grand) > 5.0:
            stats["archive parse does not reconcile — left alone"] += 1
            continue

        gas = collections.defaultdict(float)
        cond = collections.defaultdict(float)
        missed = False
        for f in fields:
            owner = field_owner(f)
            if owner not in gas.keys() | {c for c, _, _ in COMPANY_ROWS}:
                unattributed[clean_field_name(f.get("field"))] += 1
                missed = True
                continue
            gas[owner] += f.get("gas_mmcfd") or 0
            cond[owner] += f.get("condensate_bbld") or 0
        if missed:
            stats["a field could not be attributed — skipped"] += 1
            continue

        rebuilt_total = sum(gas.values())
        if abs(rebuilt_total - grand) > 0.5:
            stats["rebuilt rows do not reproduce the archive grand total"] += 1
            continue

        rows = [
            {
                "company": label,
                "fields": nfields,
                "gas": round(gas[code], 1),
                "condensate": round(cond[code], 1),
                "share": round(gas[code] / grand * 100.0, 1) if grand > 0 else 0.0,
            }
            for code, label, nfields in COMPANY_ROWS
        ]

        doc = json.loads(target.read_text(encoding="utf-8"))
        current = doc.get("gasProductionData") or []
        # A day whose gas was never populated is not this bug; leave the
        # "not published yet" shape alone.
        if not current or all(not (r.get("gas") or 0) for r in current):
            stats["day carries no gas figures (not published) — left alone"] += 1
            continue
        # Numeric comparison, not string. Comparing serialised JSON called a day
        # changed when a stored 441 met a rebuilt 441.0 — the same figure typed
        # differently — which reported 81 repairs that would have rewritten 81
        # files without altering a single value.
        # `share` is deliberately not compared. The stored value divides by the
        # day's own row sum and the rebuild by the archive's grand total, which
        # differ in the last printed digit — and on 2020-03-22 it is the STORED
        # figure that matches Petrobangla's published pct_of_total_production
        # (RPGCL 18.6, not the rebuilt 18.7). Treating that flicker as a defect
        # reported 81 repairs that would each have introduced a 0.1pp error.
        # Only the substantive figures decide whether a day is wrong.
        def same(a, b):
            if len(a) != len(b):
                return False
            for x, y in zip(a, b):
                if x.get("company") != y.get("company"):
                    return False
                for key in ("fields", "gas", "condensate"):
                    if abs(float(x.get(key) or 0) - float(y.get(key) or 0)) > 0.05:
                        return False
            return True

        if same(current, rows):
            stats["already correct"] += 1
            continue

        before = others(doc)
        doc["gasProductionData"] = rows
        if others(doc) != before:
            stats["ABORTED — another section moved"] += 1
            continue

        old_total = sum(r.get("gas") or 0 for r in current)
        stats["repaired"] += 1
        repaired += 1
        if len(examples) < 8:
            examples.append(
                "%s  %8.1f -> %8.1f   (archive grand total %.1f)"
                % (day, old_total, rebuilt_total, grand)
            )
        if args.apply:
            target.write_text(json.dumps(doc, indent=2), encoding="utf-8")

    print("%d day file(s) considered\n" % len(days))
    for key, count in sorted(stats.items(), key=lambda kv: -kv[1]):
        print("%6d | %s" % (count, key))
    if examples:
        print("\nexamples (company-row total before -> after):")
        for e in examples:
            print("   " + e)
    if unattributed:
        print("\nfields that could not be attributed to a company:")
        for name, n in unattributed.most_common(12):
            print("   %-34s on %d day(s)" % (name[:34], n))
    print("\nDRY RUN — nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
