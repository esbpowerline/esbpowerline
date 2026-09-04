"""Re-derive every archived outage's asset and cause from the description PGCB filed.

`split_event_text` chose its split marker by the order the markers were listed —
[' due to ', ' for ', ' Due to '] — rather than by where they appear in the
sentence. PGCB states the cause and then qualifies it, so a lower-cased
' due to ' or any ' for ' later in the line beat a ' Due to ' that came first,
and the cause was thrown away:

    "… Scheduled S/D Due to Maintenance Work for High Temperature"
         reason published as → "for High Temperature"
    "… TR-2 HT Project Work S/D Due to Replacement of poles for PBS 33kV …"
         reason published as → "for PBS 33kV double circuit line."

That is not truncation. The archive named high temperature as the cause of an
outage PGCB attributed to maintenance work — a claim in words that no source
made, which is the one thing this archive must never publish. The parser was
corrected on 2026-09-04; this repairs the days already published with it.

No refetch and no reparse: every row carries `full_desc`, the description
exactly as PGCB filed it, so the corrected fields are a pure function of what
is already on disk. That makes this reproducible and auditable — run it twice
and the second run reports nothing.

What it will NOT touch, on purpose:
  * `full_desc` itself, which is the source text and the evidence.
  * `time` and `load`, which come from other cells this cannot see.
  * Any row whose `full_desc` is missing or does not end with the stored
    `reason`. That combination means the row was not produced by the parser
    this repairs, and rewriting it would be guessing. Those are counted and
    listed under --verbose rather than silently skipped.

Usage:
    python scripts/repair_outage_cause.py                 # dry run, prints a report
    python scripts/repair_outage_cause.py --verbose       # every changed row
    python scripts/repair_outage_cause.py --apply         # write the changes
    python scripts/repair_outage_cause.py --apply --from 2026-08-01
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
DAILY = ROOT / "public" / "data" / "daily"
sys.path.insert(0, str(ROOT / "scripts"))

from parse_daily_reports import split_event_text  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--apply", action="store_true", help="write the changes")
    ap.add_argument("--verbose", action="store_true", help="print every changed row")
    ap.add_argument("--from", dest="since", help="only days on or after this ISO date")
    ap.add_argument("--to", dest="until", help="only days on or before this ISO date")
    args = ap.parse_args()

    files = sorted(DAILY.glob("????-??-??.json"))
    if args.since:
        files = [f for f in files if f.stem >= args.since]
    if args.until:
        files = [f for f in files if f.stem <= args.until]
    if not files:
        print("no day files in range")
        return 1

    tally = Counter()
    changed_days: list[tuple[str, int]] = []
    unrepairable: list[str] = []

    for path in files:
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
            original = json.dumps(doc, ensure_ascii=False, indent=2)
        except Exception as e:  # noqa: BLE001
            print(f"  ! {path.name}: unreadable ({e})")
            tally["unreadable"] += 1
            continue

        outages = doc.get("dailyOutages")
        if not isinstance(outages, list) or not outages:
            continue

        day_changed = 0
        for i, row in enumerate(outages):
            if not isinstance(row, dict):
                continue
            tally["rows"] += 1
            desc = (row.get("full_desc") or "").strip()
            reason = (row.get("reason") or "").strip()
            plant = (row.get("plant") or "").strip()

            # The evidence has to be present and has to be the text the stored
            # reason was cut from. Anything else is a row this cannot vouch for.
            if not desc or not reason:
                tally["no_full_desc"] += 1
                unrepairable.append(f"{path.stem}[{i}] no full_desc/reason")
                continue
            if not desc.endswith(reason) and reason != desc:
                tally["reason_not_from_desc"] += 1
                unrepairable.append(f"{path.stem}[{i}] reason is not a tail of full_desc")
                continue

            new_plant, new_reason, _ = split_event_text(desc)
            if new_reason == reason and new_plant == plant:
                tally["already_correct"] += 1
                continue

            if new_reason != reason:
                tally["reason_fixed"] += 1
            if new_plant != plant:
                tally["plant_fixed"] += 1
            day_changed += 1

            if args.verbose:
                print(f"  {path.stem}[{i}]")
                if new_reason != reason:
                    print(f"      reason: {reason!r}")
                    print(f"          ->: {new_reason!r}")
                if new_plant != plant:
                    print(f"      plant : {plant!r}")
                    print(f"          ->: {new_plant!r}")

            row["reason"] = new_reason
            row["plant"] = new_plant

        if day_changed:
            changed_days.append((path.stem, day_changed))
            if args.apply:
                # Byte-for-byte the archive's own formatting: indent 2,
                # ensure_ascii off, no trailing newline, LF. Verified against 12
                # sampled days before this was written — build_forward_forecast
                # rewrote a whole file once with no figure changed because its
                # writer disagreed about line endings, and .gitattributes pins
                # public/data/**/*.json to LF for exactly that reason. Anything
                # off here turns a 1,700-row correction into a 4,500-file diff.
                text = json.dumps(doc, ensure_ascii=False, indent=2)
                assert text != original, f"{path.name}: marked changed but serialises identically"
                path.write_text(text, encoding="utf-8", newline="\n")

    print()
    print(f"  days scanned          {len(files)}")
    print(f"  outage rows           {tally['rows']}")
    print(f"  already correct       {tally['already_correct']}")
    print(f"  reason corrected      {tally['reason_fixed']}")
    print(f"  plant corrected       {tally['plant_fixed']}")
    print(f"  days affected         {len(changed_days)}")
    skipped = tally["no_full_desc"] + tally["reason_not_from_desc"]
    if skipped:
        print(f"  left alone            {skipped} "
              f"(no full_desc: {tally['no_full_desc']}, "
              f"reason not from desc: {tally['reason_not_from_desc']})")
        if args.verbose:
            for line in unrepairable[:40]:
                print(f"      · {line}")
            if len(unrepairable) > 40:
                print(f"      … {len(unrepairable) - 40} more")

    if not args.apply:
        print("\n  DRY RUN — nothing written. Re-run with --apply.")
    else:
        print(f"\n  written: {len(changed_days)} day file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
