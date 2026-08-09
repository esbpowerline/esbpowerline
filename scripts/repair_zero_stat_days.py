"""Rewrite archive days whose headline figures are published as zero.

Two causes, both found by auditing rather than by anything failing:

  * 2014-04-11 names its sheets "P 1" and "En curve", with spaces, so nothing
    matched and the day published a zero day peak, evening peak and energy.
    Fixed in `get_sheet_content`, which now matches on alphanumerics.

  * 65 days of early 2018 have P1's "Total Gen. (MKWH)" cell left empty — the
    unit sits where the number should be. That zeroed the day's energy and, with
    it, the average production cost that divides by it. Recovered from P2's
    National Grid Total, which is the same measurement and agrees with P1 to the
    digit wherever P1 prints one.

A day is only written when the re-parse produces a peak AND an energy figure,
and when its fuel mix still sums to what the archive already holds — the mix was
never affected by either fault, so a change there would mean this reached
further than intended.

Usage:
  python scripts/repair_zero_stat_days.py [--apply]
"""
from __future__ import annotations

import argparse
import datetime
import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from backfill_daily_extremes import DAILY, index_sources, read_source  # noqa: E402
from parse_daily_reports import parse_pgcb_file  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
# The fuel mix is read from a block neither fault touched, so it must survive.
MIX_TOLERANCE_MKWH = 0.01


def zero_stat_days() -> list[str]:
    out = []
    for path in sorted(DAILY.glob("*.json")):
        if len(path.stem) != 10:
            continue
        stats = json.loads(path.read_text(encoding="utf-8")).get("systemStats") or {}
        no_peak = not stats.get("dayPeakGen") and not stats.get("eveningPeakGen")
        if no_peak or not stats.get("totalEnergyGen"):
            out.append(path.stem)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--index-cache", default=str(REPO / "scratch" / "backfill-source-index.json"))
    args = ap.parse_args()

    sources = index_sources(Path(args.index_cache))
    days = zero_stat_days()
    print(f"{len(days)} day(s) published with a zero headline figure; "
          f"{sum(1 for d in days if d in sources)} have a source workbook")

    tmp = Path(tempfile.mkdtemp(prefix="esb-zero-"))
    repaired, skipped, no_source = [], [], []

    for day in days:
        if day not in sources:
            no_source.append(day)
            continue
        try:
            text = read_source(Path(sources[day]))
        except Exception:  # noqa: BLE001
            skipped.append(f"{day}: source unreadable")
            continue
        scratch = tmp / "d.txt"
        scratch.write_text(text, encoding="utf-8")
        parsed = parse_pgcb_file(str(scratch), datetime.date.fromisoformat(day))
        stats = (parsed or {}).get("systemStats") or {}
        if not stats.get("totalEnergyGen") or not (stats.get("dayPeakGen") or stats.get("eveningPeakGen")):
            skipped.append(f"{day}: still zero after re-parse")
            continue

        target = DAILY / f"{day}.json"
        existing = json.loads(target.read_text(encoding="utf-8"))
        old_mix = sum(g.get("gen") or 0 for g in existing.get("generationData") or [])
        new_mix = sum(g.get("gen") or 0 for g in parsed.get("generationData") or [])
        if old_mix and abs(old_mix - new_mix) > MIX_TOLERANCE_MKWH:
            skipped.append(f"{day}: fuel mix moved {old_mix:.2f} -> {new_mix:.2f}")
            continue

        # Keep what this repair has no business touching. The gas sections come
        # from Petrobangla, not from the workbook being re-read, and the curve
        # is published beside the day rather than inside it.
        for key in ("gasProductionData", "gasDistributionData"):
            if existing.get(key):
                parsed[key] = existing[key]
        parsed.pop("energyCurveData", None)
        if existing.get("borderImportsData") and not parsed.get("borderImportsData"):
            parsed["borderImportsData"] = existing["borderImportsData"]

        repaired.append(
            f"{day}  peak {stats.get('dayPeakGen')}/{stats.get('eveningPeakGen')} MW  "
            f"energy {stats.get('totalEnergyGen'):.2f} MKWh  cost {stats.get('avgProductionCost'):.3f}"
        )
        if args.apply:
            target.write_text(json.dumps(parsed, indent=2), encoding="utf-8")

    print(f"\n{len(repaired)} repaired:")
    for r in repaired:
        print("   ", r)
    if skipped:
        print(f"\n{len(skipped)} skipped:")
        for s in skipped:
            print("   ", s)
    if no_source:
        print(f"\n{len(no_source)} have no source workbook and cannot be repaired from here:")
        for i in range(0, len(no_source), 8):
            print("    " + " ".join(no_source[i:i + 8]))
    print("\nDRY RUN — nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
