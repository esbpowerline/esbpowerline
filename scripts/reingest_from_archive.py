"""Re-ingest a run of days from an archive of source documents already on disk.

The daily extractor collects one day at a time from PGCB's ERP and
Petrobangla's listing. When a fetch fails it does not stop: `parse.py` carries
the previous day's gas sections forward and marks the day ok. Across
2026-07-06..2026-07-21 — the window missing from `ERP_BY_ENERGY` — that
produced nine Petrobangla days built from one 06-07 July PDF, each stamped
`parse_status: "ok"` and `reconciled: true`, and six PGCB days holding a
neighbour's figures. Nothing downstream could tell: the reconciliation checks
compare a document against itself, and a carried-forward document is internally
perfect.

The fix is not a patch to those files but a re-ingest from the documents
themselves, keyed by what each one says it covers. This drives
`scripts/ingest_bridge.py` — the same path the admin panel uses, with the same
guards, including the outer-pipe conversion that the outage parser needs and
the rejection of a gas PDF whose printed window is not this day's.

Source layout, one file per day named by the day it covers:

    <archive>/pgcb/pgcb_<YYYY-MM-DD>.xlsx
    <archive>/petrobangla/petrobangla_<YYYY-MM-DD>.pdf

`--control` additionally checks each rebuilt day against published totals held
outside this repo, in the shape the BPDB daily report prints them. Engine
agreement is not correctness — every defect found in this archive was one every
parser agreed on — so a second, independently produced set of the same figures
is the only check with real force. Days that disagree are reported and skipped.

Usage:
  python scripts/reingest_from_archive.py --archive <dir> --from 2026-06-30 --to 2026-07-31
  python scripts/reingest_from_archive.py --archive <dir> ... --control <bpdb_scenario.csv> --apply
"""
from __future__ import annotations

import argparse
import csv
import datetime
import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SCRIPTS = REPO / "scripts"
DAILY = REPO / "public" / "data" / "daily"
GAS_DAILY = REPO / "public" / "data" / "petrobangla" / "daily"
PLANTS = REPO / "public" / "data" / "plants"
CURVES = REPO / "public" / "data" / "curves"

sys.path.insert(0, str(SCRIPTS))

# What the control file calls each figure, against the systemStats key it should
# reproduce. Left out: production cost and gas supplied, which the control set
# carries at a different precision than P1 prints them.
CONTROL_FIELDS = {
    "Day Peak Generation": "dayPeakGen",
    "Day Peak Demand": "dayPeakDemand",
    "Evening Peak Generation": "eveningPeakGen",
    "Evening Peak Demand": "eveningPeakDemand",
    "Minimum Generation of the Day": "minGen",
    "Maximum Generation of the Day": "maxGen",
}
CONTROL_RIGHT = {
    "Energy Generated": "totalEnergyGen",
    "Energy Unserverd": "totalEnergyUnserved",
    "Energy Demand": "totalEnergyDemand",
    "Maximum Temperature": "maxTemp",
}
# MW figures are printed to two decimals by both sides; energy in MKWh is
# rounded to five, so the gap there is arithmetic, not disagreement.
CONTROL_TOLERANCE = 0.05


def load_control(path: Path) -> dict[str, dict[str, float]]:
    """Published figures per day, keyed by the systemStats field they check."""
    out: dict[str, dict[str, float]] = {}
    with path.open(encoding="utf-8-sig", newline="") as fh:
        for row in csv.DictReader(fh):
            day = out.setdefault(row["day"], {})
            for label, key in CONTROL_FIELDS.items():
                if row.get("left_label") == label:
                    day[key] = float(row["left_value"])
            for label, key in CONTROL_RIGHT.items():
                if row.get("right_label") == label:
                    day[key] = float(row["right_value"])
    return out


def load_gas_control(path: Path) -> dict[str, float]:
    """Independently parsed field-gas total per day, keyed by gas-day start.

    Worth having on its own: the guard in `ingest_bridge` that refuses a gas PDF
    covering the wrong day reads the window printed on the report, and on some
    layouts those digits are drawn in a CID font it cannot decode. When that
    happens the day is accepted on the strength of its filename alone — which is
    exactly the assumption that filed nine copies of one report as nine days.
    A total produced by a different parser from the same PDF costs nothing and
    closes that gap.
    """
    out: dict[str, float] = {}
    with path.open(encoding="utf-8-sig", newline="") as fh:
        for row in csv.DictReader(fh):
            value = row.get("pb_gas_production")
            if value:
                out[row["day"]] = float(value)
    return out


def control_problems(stats: dict, published: dict[str, float]) -> list[str]:
    problems = []
    for key, want in published.items():
        got = stats.get(key)
        if got is None:
            problems.append(f"{key} is null against a published {want}")
        elif abs(float(got) - want) > CONTROL_TOLERANCE:
            problems.append(f"{key} is {got} against a published {want}")
    return problems


def run_bridge(pgcb: Path, pb: Path | None, day: str, expect_window: str | None = None) -> dict:
    cmd = [sys.executable, str(SCRIPTS / "ingest_bridge.py"), "--pgcb", str(pgcb), "--date", day]
    if pb:
        cmd += ["--pb", str(pb)]
    if expect_window:
        cmd += ["--expect-gas-window", expect_window]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600, cwd=str(REPO))
    if proc.returncode != 0:
        return {"ok": False, "error": (proc.stderr or proc.stdout or "").strip()[-400:]}
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError:
        return {"ok": False, "error": f"bridge produced no JSON: {proc.stdout[:200]}"}


def build_plants(pgcb: Path, day: str, stats: dict) -> tuple[dict | None, list[str]]:
    """Per-station detail for the day, and anything that did not reconcile.

    Same reconciliation as build_daily_plants: the station figures must
    reproduce the peaks P1 publishes, and GenLog's roll-up columns must track
    the load curve. A roll-up the report itself got wrong is dropped rather
    than costing the day its 160 station series.
    """
    from build_daily_plants import apply_reconciliation, plants_from_p2, reconcile, reconcile_p2
    from ingest_bridge import xlsx_to_md
    from parse_daily_reports import lcurve_total_series, parse_genlog, parse_yesterday_gen

    text = xlsx_to_md(pgcb)
    # Same selection as build_daily_plants, so a day collected here and a day
    # rebuilt from the archive carry the same fields — including the per-station
    # day energy, which only P2 states and which this path used to drop.
    plants, p2_totals = plants_from_p2(text, day, stats)
    genlog = parse_genlog(text) or parse_yesterday_gen(text)
    if not plants and not genlog:
        return None, []

    doc: dict = {"date": day}
    if plants:
        doc["plants"] = plants
    if genlog:
        doc["genlog"] = genlog

    problems = reconcile(plants, genlog, stats, lcurve_total_series(text))
    if plants and plants[0].get("dayPeakMw") is None:
        problems = [p for p in problems if not p[1].startswith("station sum at")]
        problems += reconcile_p2(plants, p2_totals, stats)
    return apply_reconciliation(doc, problems)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", required=True, help="directory holding pgcb/ and petrobangla/")
    ap.add_argument("--from", dest="start", required=True)
    ap.add_argument("--to", dest="end", required=True)
    ap.add_argument("--control", help="CSV of independently published totals to check against")
    ap.add_argument("--gas-control", help="CSV with day,pb_gas_production from a second parser")
    ap.add_argument(
        "--adjudicated",
        action="append",
        default=[],
        metavar="DAY=PRINTED",
        help=(
            "A day whose gas report carries a misprinted letterhead, as gas-day=printed-date. "
            "2026-07-10's report is headed 11 Jul; without this the window guard rejects it."
        ),
    )
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--skip-plants", action="store_true")
    args = ap.parse_args()

    archive = Path(args.archive)
    start = datetime.date.fromisoformat(args.start)
    end = datetime.date.fromisoformat(args.end)
    control = load_control(Path(args.control)) if args.control else {}
    gas_control = load_gas_control(Path(args.gas_control)) if args.gas_control else {}
    adjudicated = dict(pair.split("=", 1) for pair in args.adjudicated)

    written, skipped, notes_seen = [], [], []
    plants_written, gas_written = 0, 0

    day = start
    while day <= end:
        iso = day.isoformat()
        day += datetime.timedelta(days=1)

        pgcb = archive / "pgcb" / f"pgcb_{iso}.xlsx"
        pb = archive / "petrobangla" / f"petrobangla_{iso}.pdf"
        if not pgcb.exists():
            skipped.append(f"{iso}: no source workbook")
            continue

        result = run_bridge(pgcb, pb if pb.exists() else None, iso, adjudicated.get(iso))
        if not result.get("ok"):
            skipped.append(f"{iso}: {result.get('error', 'bridge failed')}")
            continue

        payload = result["payload"]
        stats = payload.get("systemStats") or {}
        notes = result.get("validation", {}).get("notes") or []

        # Re-ingesting a day whose gas report is not in the archive would
        # replace its gas sections with the zero rows the bridge substitutes
        # when no PDF is supplied — turning a published figure into a blank
        # because a *different* source was missing. Keep what the day already
        # has. This is the same "keep same-day gas" rule the extractor applies.
        if not pb.exists():
            existing = DAILY / f"{iso}.json"
            if existing.exists():
                prior = json.loads(existing.read_text(encoding="utf-8"))
                had_gas = any(float(r.get("gas") or 0) > 0 for r in prior.get("gasProductionData") or [])
                if had_gas:
                    payload["gasProductionData"] = prior["gasProductionData"]
                    payload["gasDistributionData"] = prior.get("gasDistributionData", [])
                    notes_seen.append(f"{iso}: no gas report in the archive — kept the gas sections already published")

        blocking = [n["message"] for n in notes if n["level"] == "blocking"]
        if blocking:
            skipped.append(f"{iso}: {blocking[0][:150]}")
            continue

        if iso in control:
            problems = control_problems(stats, control[iso])
            if problems:
                skipped.append(f"{iso}: control check — {problems[0]}")
                continue

        gas_archive = result.get("gasArchive")
        if iso in gas_control and gas_archive:
            got = (gas_archive.get("validation") or {}).get("field_gas_sum_mmcfd")
            want = gas_control[iso]
            # A whole MMCFD of slack: the two parsers round per field before
            # summing 23 of them. A wrong day is out by tens.
            if got is None or abs(float(got) - want) > 1.0:
                skipped.append(f"{iso}: gas control — field sum {got} against a published {want}")
                continue
        elif gas_control and not gas_archive:
            notes_seen.append(f"{iso}: no gas archive, so the gas control could not be applied")

        notes_seen += [f"{iso}: {n['message'][:130]}" for n in notes if n["level"] == "caution"]

        # The fuel curve is published beside the day, not inside it — see
        # scripts/split_energy_curve.py for why it cannot live in the daily
        # payload without pulling 14MB into every function that traces it.
        curve = payload.pop("energyCurveData", None)

        if args.apply:
            DAILY.mkdir(parents=True, exist_ok=True)
            (DAILY / f"{iso}.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
            if curve:
                CURVES.mkdir(parents=True, exist_ok=True)
                (CURVES / f"{iso}.json").write_text(
                    json.dumps({"date": iso, **curve}, separators=(",", ":")), encoding="utf-8"
                )
            if gas_archive:
                GAS_DAILY.mkdir(parents=True, exist_ok=True)
                (GAS_DAILY / f"{iso}.json").write_text(
                    json.dumps(gas_archive, indent=2, ensure_ascii=False), encoding="utf-8"
                )
        if gas_archive:
            gas_written += 1

        if not args.skip_plants:
            doc, plant_notes = build_plants(pgcb, iso, stats)
            notes_seen += [f"{iso}: {n[:150]}" for n in plant_notes]
            if doc:
                plants_written += 1
                if args.apply:
                    PLANTS.mkdir(parents=True, exist_ok=True)
                    # Compact: fetched by the browser, never hand-edited, and
                    # pretty-printing 160 stations x 24 hours doubles the file.
                    (PLANTS / f"{iso}.json").write_text(
                        json.dumps(doc, separators=(",", ":")), encoding="utf-8"
                    )

        written.append(
            f"{iso}  outages {len(payload.get('dailyOutages') or []):3d}  "
            f"hourly {len(payload.get('hourlyLoadData') or []):3d}  "
            f"curve {len(curve['rows']) if curve else 0:3d}  "
            f"fuels {len(payload.get('generationData') or []):2d}"
        )

        print(f"  {written[-1]}", flush=True)

    print(f"\n{len(written)} day(s) rebuilt, {gas_written} with a gas archive, "
          f"{plants_written} with station detail")
    if notes_seen:
        print(f"\n{len(notes_seen)} note(s) worth a look:")
        for n in notes_seen[:20]:
            print("   ", n)
    if skipped:
        print(f"\n{len(skipped)} day(s) skipped:")
        for s in skipped:
            print("   ", s)
    print("\nDRY RUN — nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
