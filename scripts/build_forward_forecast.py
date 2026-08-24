"""Publish PGCB's forward forecast for a day that has not been archived yet.

The archive anchors a forecast to the day it DESCRIBES, and reads it out of the
workbook PGCB filed that morning. That rule is right, but it has a consequence:
the projection for *today* only reaches the site tomorrow, when today's energy
day is published. By then it is a historical curiosity — the day it described
is over, and the live NLDC hours it should have been read against are gone.

This writes that forward half out on its own, so today's forecast is on the site
while today is still running:

    public/data/forecast/<targetDay>.json

Nothing here re-implements the extraction. It is the same `extract_forecasts`
parser the archive uses, pointed at the same workbook, so when this day IS
archived tomorrow the figures agree by construction rather than by luck.

    python scripts/build_forward_forecast.py                  # today, Dhaka
    python scripts/build_forward_forecast.py --date 2026-08-24
    python scripts/build_forward_forecast.py --date 2026-08-24 --dry-run

Exit codes: 0 wrote (or would write), 1 nothing to write, 2 the workbook
disagreed about which day it is.
"""

from __future__ import annotations

import argparse
import datetime
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"
OUT_DIR = ROOT / "public" / "data" / "forecast"

# Dhaka is UTC+6 year-round; no DST to get wrong.
DHAKA = datetime.timezone(datetime.timedelta(hours=6))


def today_dhaka() -> datetime.date:
    return datetime.datetime.now(tz=DHAKA).date()


def canonical_name(filed: datetime.date) -> str:
    """PGCB's own name for the report filed on `filed`."""
    return f"Daily Report {filed.day:02d}-{filed.month:02d}-{filed.year}"


def header_date(sheet_text: str) -> datetime.date | None:
    """The publication date printed on P1, which must equal the target day.

    This is the guard against a wrong ERP id. The id is opaque and roughly
    +1/day with skips, so "the download succeeded" is not evidence that the
    workbook is the one asked for — only the date it prints on itself is.
    """
    for match in re.finditer(r"date\s*:?\s*\|?\s*(\d{2})-(\d{2})-(\d{4})", sheet_text, re.I):
        d, m, y = (int(g) for g in match.groups())
        try:
            return datetime.date(y, m, d)
        except ValueError:
            continue
    return None


def build(target: datetime.date, dry_run: bool) -> int:
    sys.path.insert(0, str(SCRIPTS))
    import extract_forecasts as EF  # noqa: PLC0415
    from parse_daily_reports import get_sheet_content  # noqa: PLC0415
    from daily_extractor.download import download_for_energy_day  # noqa: PLC0415

    # download_for_energy_day(E) fetches the report PGCB NAMED E+1 -- the one
    # that reports E's actuals. The forecast for `target` is issued in the
    # report named `target`, so the energy day to ask for is target - 1.
    energy = target - datetime.timedelta(days=1)
    result = download_for_energy_day(energy)
    path = Path(result.pgcb_xlsx) if result and result.pgcb_xlsx else None
    if path is None or not path.is_file():
        print(f"PGCB has not published the report filed {target.isoformat()} yet.", file=sys.stderr)
        return 1

    text = EF.sheet_text(path)
    if not text:
        print(f"{path.name} yielded no readable sheet text.", file=sys.stderr)
        return 1

    printed = header_date(text)
    if printed is not None and printed != target:
        print(
            f"Refusing to publish: {path.name} prints {printed.isoformat()} on P1, "
            f"but a forecast for {target.isoformat()} was asked for. Wrong ERP id.",
            file=sys.stderr,
        )
        return 2

    sheet = get_sheet_content(text, "Forecast")
    if not sheet:
        print(f"{path.name} has no Forecast sheet.", file=sys.stderr)
        return 1

    forecast, layout = EF.extract(sheet)
    if not forecast:
        print(f"{path.name}'s Forecast sheet states no projection.", file=sys.stderr)
        return 1

    forecast["issuedOn"] = (target - datetime.timedelta(days=1)).isoformat()
    forecast["issuedIn"] = canonical_name(target)
    forecast["targetDay"] = target.isoformat()
    forecast["layout"] = layout
    forecast["issuedFrom"] = "erp-mirror"
    # Says out loud that this day is not archived yet, so a reader of the file
    # (or of the panel) is never left guessing why it sits outside the archive.
    forecast["forward"] = True
    forecast["headerDatePrinted"] = printed.isoformat() if printed else None

    hours = forecast.get("hourly") or []
    print(
        f"{target.isoformat()}: {len(hours)} forecast hours from {path.name} "
        f"(layout {layout}, P1 prints {printed.isoformat() if printed else 'nothing'})"
    )
    if dry_run:
        return 0

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{target.isoformat()}.json"
    # Same conventions as every other published JSON in this repo: indent 2,
    # unicode kept, CRLF, no trailing newline.
    body = json.dumps(forecast, indent=2, ensure_ascii=False).replace("\n", "\r\n")
    out.write_text(body, encoding="utf-8", newline="")
    print(f"wrote {out.relative_to(ROOT)}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--date", help="target day (ISO); defaults to today in Dhaka")
    ap.add_argument("--dry-run", action="store_true", help="parse and report, write nothing")
    args = ap.parse_args()

    if args.date:
        try:
            target = datetime.date.fromisoformat(args.date)
        except ValueError:
            print(f"--date must be ISO (YYYY-MM-DD), got {args.date!r}", file=sys.stderr)
            return 2
    else:
        target = today_dhaka()

    return build(target, args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())
