"""Repair P1's energy unserved and energy demand where PGCB printed them in MWh.

For 2025-01-01..01-18 P1 prints "Energy Unserverd | 268 | MWHr" and "Energy
Demand | 207460.39619 | MWHr"; every other layout prints MKWh. The parser took
the number at face value, so the archive held those days' demand at ~210,000
GWh and 2025-01-04's 0.268 GWh of unserved energy as 268 — which made it the
worst shedding day in the archive, and 2025-01-09 (201) and 01-14 (179) the
next two. `energy_mkwh` in parse_daily_reports.py now reads the unit.

This re-parses each candidate day from its own workbook and writes exactly the
two fields the defect touched. Nothing else in the file moves:

  - A workbook is only trusted for a day when it reproduces that day's
    dayPeakGen, eveningPeakGen and totalEnergyGen — fields the unit bug never
    touched (`matches_archive`, the same test backfill_daily_extremes uses).
    Filenames in this corpus are mistyped often enough that a name is not
    evidence.
  - The repaired demand must equal energy generated plus energy unserved as
    printed, the identity PGCB's own sheet holds on every one of these days
    (207,192.39619 + 268 = 207,460.39619). A day that fails it is reported and
    left alone.
  - Each file must re-serialise to its original bytes before it is touched,
    so the diff is two values and nothing else.

Workbooks are looked for in the order the ingest uses: W: first, then the
local archive copy, then PGCB's ERP downloads.

Usage:
  python scripts/repair_energy_units.py            # dry run
  python scripts/repair_energy_units.py --apply
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
os.environ.setdefault("ESB_DAILY_OUTPUT_DIR", tempfile.mkdtemp(prefix="esb-energy-units-"))

from backfill_daily_extremes import matches_archive, read_source, resolve_key  # noqa: E402
from parse_daily_reports import parse_pgcb_file  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
DAILY = REPO / "public" / "data" / "daily"
STORES = [
    Path(r"W:\Grid-Explorer\PGCB\Daily Reports - D"),
    Path(r"C:\ESB-Grid-Archive\01-pgcb\local-archive\Daily Reports - D"),
    Path(r"C:\ESB-Grid-Archive\01-pgcb\acquired-from-erp\2024"),
    Path(r"C:\ESB-Grid-Archive\01-pgcb\acquired-from-erp\2025"),
]
if os.environ.get("ESB_PGCB_ARCHIVE"):
    STORES = [Path(os.environ["ESB_PGCB_ARCHIVE"])]

# The window the MWHr captions cover, with a margin either side so a day just
# outside it is re-read and shown unchanged rather than assumed.
FROM, TO = "2024-12-24", "2025-01-31"
FIELDS = ("totalEnergyUnserved", "totalEnergyDemand")
REPORT_NAME = re.compile(r"(\d{2})-(\d{2})-(\d{4})")


def serialise(doc: dict, like: bytes) -> bytes:
    body = json.dumps(doc, indent=2)
    if b"\r\n" in like:
        body = body.replace("\n", "\r\n")
    return body.encode("utf-8")


def candidates() -> dict[str, list[Path]]:
    """Workbooks by the energy day their name claims, in store order."""
    out: dict[str, list[Path]] = {}
    for store in STORES:
        if not store.is_dir():
            continue
        for p in sorted(store.glob("*.xls*")):
            if p.name.startswith("~$"):
                continue
            m = REPORT_NAME.search(p.name)
            if not m:
                continue
            try:
                report = datetime.date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
            except ValueError:
                continue
            day = (report - datetime.timedelta(days=1)).isoformat()
            if FROM <= day <= TO:
                out.setdefault(day, []).append(p)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    tmp = Path(tempfile.mkdtemp(prefix="esb-energy-units-src-"))
    found = candidates()
    changed, unchanged, skipped, nullfill = [], [], [], []

    day = datetime.date.fromisoformat(FROM)
    while day.isoformat() <= TO:
        key = day.isoformat()
        day += datetime.timedelta(days=1)
        fp = DAILY / f"{key}.json"
        if not fp.exists():
            continue
        raw = fp.read_bytes()
        doc = json.loads(raw)
        if serialise(doc, raw) != raw:
            skipped.append((key, "file does not re-serialise to its own bytes"))
            continue

        parsed, used = None, None
        for src in found.get(key, []):
            try:
                text = read_source(src)
                if resolve_key(src.name, text) != key:
                    continue
                t = tmp / "p.txt"
                t.write_text(text, encoding="utf-8")
                attempt = parse_pgcb_file(str(t), datetime.date.fromisoformat(key))
            except Exception:  # noqa: BLE001
                continue
            if attempt and matches_archive(attempt, doc):
                parsed, used = attempt, src
                break
        if parsed is None:
            skipped.append((key, "no workbook reproduces this day's untouched figures"))
            continue

        ss, new = doc["systemStats"], parsed["systemStats"]
        want = {k: new.get(k) for k in FIELDS}
        have = {k: ss.get(k) for k in FIELDS}
        if want == have:
            unchanged.append(key)
            continue
        # Only values the archive holds and holds wrongly. A day stored as null
        # that its workbook does print is a different gap, with a different
        # cause, and is reported rather than filled under this repair's name.
        if any(have[k] is None and want[k] is not None for k in FIELDS):
            nullfill.append((key, used.name, want))
            continue

        gen, un, dem = ss.get("totalEnergyGen"), want["totalEnergyUnserved"], want["totalEnergyDemand"]
        if gen is not None and un is not None and dem is not None and abs(gen + un - dem) > 0.01:
            skipped.append((key, f"repaired demand {dem} != generated {gen} + unserved {un}"))
            continue

        changed.append((key, used.name, have, want))
        if args.apply:
            for k in FIELDS:
                ss[k] = want[k]
            body = serialise(doc, raw)
            fp.write_bytes(body)

    for key, name, have, want in changed:
        print(f"{key}  {name}")
        for k in FIELDS:
            print(f"    {k:20s} {have[k]!s:>14} -> {want[k]!s}")
    print(f"\n{len(changed)} day(s) {'repaired' if args.apply else 'to repair'}, "
          f"{len(unchanged)} re-read and already right, {len(skipped)} skipped")
    for key, why in skipped:
        print(f"  skipped {key}: {why}")
    if nullfill:
        print(f"\n{len(nullfill)} day(s) stored as null that the workbook does print — not touched here:")
        for key, name, want in nullfill:
            print(f"  {key}  {name}  {want}")
    if not args.apply:
        print("\nDRY RUN - nothing written. Re-run with --apply.")


if __name__ == "__main__":
    main()
