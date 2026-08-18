"""The fields a parsed day needs before it is a complete GridDailyData.

`parse_pgcb_file` reads the sheets and stops there. Three things the site now
depends on are added afterwards, and were being added by hand-run backfills
rather than by the ingest — so every new day arrived without them:

  * `sourceFiles`    — the documents the day was built from, named as the
                       publishers name them, so a reader can request them.
  * `observationWindows` — what span of time each publisher's figures cover.
                       PGCB's energy day runs midnight to midnight,
                       Petrobangla's gas day 08:00 to 08:00, and they share
                       only 16 of their 24 hours.
  * `forecast`       — PGCB's projection FOR this day, plus its hourly curve.

The forecast needs care, because it does not come from this day's own workbook.
A workbook filed on F reports energy day F-1 and forecasts F. So:

    the forecast for energy day D is in the workbook filed on D,
    which is the report for energy day D-1 — yesterday's ingest.

That workbook is already in the archive by the time D is ingested, so this
looks it up rather than downloading anything. The workbook being ingested right
now (filed D+1) carries the forecast for D+1, which tomorrow's run will pick up
the same way.

Both entry points call this: `daily_extractor/parse.py` for the CLI collector
and `ingest_bridge.py` for the admin upload route. Anything added here has to
land in both, and putting it in one module is what guarantees that.
"""
from __future__ import annotations

import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / "scripts") not in sys.path:
    sys.path.insert(0, str(ROOT / "scripts"))

BST = "+06:00"


def _iso(d: date) -> str:
    return d.isoformat()


def observation_windows(
    energy: date,
    pgcb_file: str | None,
    petrobangla: dict | None,
) -> dict:
    """The window block written onto every archived day.

    Mirrors what `scripts/repair_daily_windows.py` writes for the backfill, so a
    day ingested today is shaped exactly like a day repaired in bulk.
    """
    out: dict = {
        "timezone": BST,
        "pgcb": {
            "unit": "energy day",
            "start": f"{_iso(energy)}T00:00:00{BST}",
            "end": f"{_iso(energy + timedelta(days=1))}T00:00:00{BST}",
            # PGCB files a workbook under the day AFTER the one it reports.
            "filedAs": _iso(energy + timedelta(days=1)),
            "sourceFile": pgcb_file,
        },
    }
    if petrobangla:
        report = petrobangla.get("report") or {}
        start = report.get("gas_day_start") or _iso(energy)
        end = report.get("gas_day_end") or _iso(energy + timedelta(days=1))
        out["petrobangla"] = {
            "unit": "gas day",
            "start": f"{start}T08:00:00{BST}",
            "end": f"{end}T08:00:00{BST}",
            # Petrobangla names a PDF for the morning its window closes.
            "filedAs": end,
            "publishedLabel": report.get("report_date_label"),
            "period": report.get("period"),
            "sourceFile": (petrobangla.get("meta") or {}).get("source_filename"),
        }
    return out


def forecast_for(energy: date) -> dict | None:
    """PGCB's projection for `energy`, from the workbook filed that day.

    Returns None when no held copy of that workbook carries a projection —
    which is the honest answer for the pre-2014 days and for any day whose
    report is missing, and is why the caller must not invent an empty one.
    """
    try:
        import extract_forecasts as EF
        from parse_daily_reports import get_sheet_content
    except Exception:
        return None

    try:
        candidates = EF.candidates().get(energy) or []
    except Exception:
        return None

    for path in candidates:
        try:
            sheet = get_sheet_content(EF.sheet_text(path), "Forecast")
        except Exception:
            continue
        if not sheet:
            continue
        forecast, layout = EF.extract(sheet)
        if not forecast:
            continue
        forecast["issuedOn"] = _iso(energy - timedelta(days=1))
        forecast["issuedIn"] = path.stem
        forecast["targetDay"] = _iso(energy)
        forecast["layout"] = layout
        forecast["issuedFrom"] = (
            "converted-text"
            if path.suffix.lower() == ".txt"
            else (
                "erp-mirror"
                if any(str(path).startswith(str(d)) for d in EF.ERP_MIRROR_DIRS)
                else "source-copy"
            )
        )
        if path.suffix.lower() == ".txt":
            forecast["issuedFromNote"] = (
                "read from a pre-converted text copy; no workbook is held for this day"
            )
        return forecast
    return None


def plant_forecast_for(energy: date) -> dict | None:
    """The per-station availability projection for `energy`, same source rule."""
    try:
        import extract_forecasts as EF
        import extract_plant_forecasts as PF
        from parse_daily_reports import get_sheet_content
    except Exception:
        return None

    try:
        candidates = EF.candidates().get(energy) or []
    except Exception:
        return None

    for path in candidates:
        # The converted-text store loses this table's structure entirely; it is
        # skipped rather than trusted, as in the backfill.
        if path.suffix.lower() == ".txt":
            continue
        try:
            sheet = get_sheet_content(EF.sheet_text(path), "Forecast")
        except Exception:
            continue
        if not sheet:
            continue
        stations = PF.plant_forecasts(sheet)
        if not stations:
            continue
        constrained = [
            s
            for s in stations
            if s["forecastEveningPeakMw"] is not None
            and s["effectiveEveningPeakMw"] is not None
            and s["forecastEveningPeakMw"] - s["effectiveEveningPeakMw"] > 0.05
        ]
        return {
            "targetDay": _iso(energy),
            "issuedOn": _iso(energy - timedelta(days=1)),
            "issuedIn": path.stem,
            "stations": stations,
            "stationCount": len(stations),
            "forecastAvailableEveningMw": round(
                sum(s["forecastEveningPeakMw"] or 0 for s in stations), 2
            ),
            "effectiveAvailableEveningMw": round(
                sum(s["effectiveEveningPeakMw"] or 0 for s in stations), 2
            ),
            "deratedStations": len(constrained),
            "deratedMwAtEveningPeak": round(
                sum(
                    s["forecastEveningPeakMw"] - s["effectiveEveningPeakMw"]
                    for s in constrained
                ),
                2,
            ),
        }
    return None


def enrich_grid_daily(
    payload: dict,
    energy: date,
    *,
    pgcb_file: str | None = None,
    petrobangla: dict | None = None,
) -> list[str]:
    """Add sourceFiles, observationWindows and forecast in place.

    Returns notes for the caller to surface. Nothing here fails the ingest: a
    day without a forecast is a complete day, and refusing to publish it because
    yesterday's workbook is missing would be the wrong trade.
    """
    notes: list[str] = []

    source_files = dict(payload.get("sourceFiles") or {})
    if pgcb_file:
        source_files["pgcb"] = pgcb_file
    pb_name = (petrobangla or {}).get("meta", {}).get("source_filename")
    # Only credited when the day actually carries gas figures. 833 archived days
    # named a Petrobangla PDF while showing no gas at all.
    has_gas = any(float(r.get("gas") or 0) > 0 for r in payload.get("gasProductionData") or [])
    if pb_name and has_gas:
        source_files["petrobangla"] = pb_name
    elif not has_gas:
        source_files.pop("petrobangla", None)
    if source_files:
        payload["sourceFiles"] = source_files

    payload["observationWindows"] = observation_windows(
        energy, source_files.get("pgcb"), petrobangla if has_gas else None
    )

    forecast = forecast_for(energy)
    if forecast:
        payload["forecast"] = forecast
        notes.append(
            f"forecast for {energy.isoformat()} recovered from {forecast['issuedIn']}"
            f" ({forecast.get('issuedFrom')})"
        )
    else:
        notes.append(
            f"no forecast for {energy.isoformat()} — the workbook filed that day is not held"
        )
    return notes
