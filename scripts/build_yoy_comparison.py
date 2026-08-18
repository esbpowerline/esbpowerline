"""Build the year-on-year comparison sheet for any energy day.

Generalised from the one-off that produced 17 August. The layout, column widths,
Bengali numerals and footer are unchanged — this only replaces the hardcoded
date with an argument so the sheet can be produced every day.

Two rules the one-off encoded, kept here because both are easy to get wrong:

1. **Grid and gas must come from the same energy day.** Petrobangla files the
   08:00-to-08:00 window that OPENS on energy day D under D+1, so reading "the
   report filed that morning" pairs one day's gas with the next day's
   electricity. Both columns read `public/data/daily/{day}.json`, whose gas
   sections were already resolved to that day's own window by the ingest.

2. **Cost is stored in taka.** A crore is 1e7; dividing by anything else puts
   the row out by an order of magnitude.

Usage:
    python scripts/build_yoy_comparison.py --date 2026-08-18
    python scripts/build_yoy_comparison.py --date 2026-08-18 --out some/where.txt
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
DAILY = ROOT / "public" / "data" / "daily"

BN_DIGITS = str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯")
BN_MONTHS = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
]

ROWS = [
    ("সন্ধ্যার সর্বোচ্চ চাহিদা", "মেগাওয়াট", "evD"),
    ("সন্ধ্যার সর্বোচ্চ উৎপাদন", "মেগাওয়াট", "evG"),
    ("লোডশেডিং", "মেগাওয়াট", "shed"),
    ("বিদ্যুৎ খাতে গ্যাস সরবরাহ", "মিলিয়ন ঘনফুট", "gasPwr"),
    ("দেশীয় গ্যাস উৎপাদন", "মিলিয়ন ঘনফুট", "dom"),
    ("এলএনজি সরবরাহ", "মিলিয়ন ঘনফুট", "lng"),
    ("মোট গ্যাস উৎপাদন", "মিলিয়ন ঘনফুট", "tot"),
    ("দিনভর মোট উৎপাদন", "মিলিয়ন ইউনিট", "energy"),
    ("বিদ্যুৎ উৎপাদন খরচ", "কোটি টাকা", "cost"),
]


def bn(n: float, decimals: int = 0) -> str:
    return f"{n:,.{decimals}f}".translate(BN_DIGITS)


def bn_date(d: date) -> str:
    return f"{str(d.day).translate(BN_DIGITS)} {BN_MONTHS[d.month - 1]} {str(d.year).translate(BN_DIGITS)}"


class MissingDay(Exception):
    pass


def figures(day: date) -> dict:
    path = DAILY / f"{day.isoformat()}.json"
    if not path.exists():
        raise MissingDay(f"no archive day at {path}")
    j = json.loads(path.read_text(encoding="utf-8"))
    s = j["systemStats"]
    gas = j.get("gasProductionData") or []
    total = sum(r["gas"] for r in gas)
    lng = sum(r["gas"] for r in gas if "RPGCL" in r["company"])
    if total == 0:
        # Every gas row zero is how the archive says "Petrobangla has not
        # published this window yet" — publishing that as a real 100% fall
        # would be a fabricated headline.
        raise MissingDay(
            f"{day} carries no gas figures yet (Petrobangla files this window under "
            f"{day + timedelta(days=1)}); the sheet would report a false collapse"
        )
    return {
        "evD": s["eveningPeakDemand"],
        "evG": s["eveningPeakGen"],
        "shed": sum(r.get("loadShed", 0) for r in (j.get("regionalDemandData") or [])),
        "gasPwr": s["totalGasSuppliedPower"],
        "dom": total - lng,
        "lng": lng,
        "tot": total,
        "energy": s["totalEnergyGen"],
        "cost": s["totalDailyCost"] / 1e7,
    }


def prior_year(day: date) -> date:
    """Same calendar day one year earlier; 29 February falls back to the 28th.

    `date.replace(year=...)` raises on a leap day, which would crash the sheet
    once every four years rather than degrade.
    """
    try:
        return day.replace(year=day.year - 1)
    except ValueError:
        return day.replace(year=day.year - 1, day=28)


def build(day: date) -> str:
    prior = prior_year(day)
    a, b = figures(prior), figures(day)

    lines = [
        "ESB POWER LINE — এক বছরে কতটা বদলাল",
        f"{bn_date(prior)} বনাম {bn_date(day)}",
        "=" * 49,
        "",
        f"{'বিবরণ':<28}{'একক':<17}{str(prior.year).translate(BN_DIGITS):>10}"
        f"{str(day.year).translate(BN_DIGITS):>11}{'পরিবর্তন':>12}",
        "-" * 77,
    ]

    for label, unit, key in ROWS:
        x, y = a[key], b[key]
        change = (y - x) / x * 100 if x else 0.0
        arrow = "▲" if change >= 0 else "▼"
        # A sub-1% move rounds to "0%", which reads as "no change" when the
        # figure did move. One decimal only where the integer would be zero.
        pct = bn(abs(change), 1 if abs(change) < 1 else 0)
        lines.append(
            f"{label:<28}{unit:<17}{bn(x):>10}{bn(y):>11}"
            f"{'   ' + arrow + ' ' + pct + '%':>12}"
        )

    day_bn = f"{str(day.day).translate(BN_DIGITS)} {BN_MONTHS[day.month - 1]}"
    lines += [
        "-" * 77,
        "",
        "সূত্র: পিজিসিবি দৈনিক প্রতিবেদন ও পেট্রোবাংলা দৈনিক গ্যাস প্রতিবেদন।",
        f"গ্রিড ও গ্যাস — দুটিই একই এনার্জি ডে ({day_bn}) থেকে নেওয়া;",
        "পেট্রোবাংলার ৮টা–৮টা গ্যাস-ডে ওই দিন সকাল ৮টায় শুরু হয়।",
    ]
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True, help="energy day, YYYY-MM-DD")
    ap.add_argument("--out", default=None, help="write here instead of stdout only")
    args = ap.parse_args()

    day = date.fromisoformat(args.date)
    try:
        text = build(day)
    except MissingDay as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    print(text, end="")
    if args.out:
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text, encoding="utf-8")
        print(f"\nwritten: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
