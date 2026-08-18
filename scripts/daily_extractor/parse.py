"""Parse downloaded reports into GridDailyData + PetrobanglaDaily."""
from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from .config import (
    GRID_DAILY_OUT,
    PARSE_GRID,
    PARSE_PETROBANGLA,
    PETROBANGLA_GAS_DISTRIBUTION_COMPANIES,
    PETROBANGLA_GAS_PRODUCTION_COMPANIES,
    PETROBANGLA_JSON_STAGING,
    SCRATCH_DOWNLOADS,
)
from .convert import pdf_to_text, xlsx_to_text


@dataclass
class ParseResult:
    energy_day: date
    grid_data: dict | None
    petrobangla_data: dict | None
    pgcb_text_path: Path | None
    petrobangla_text_path: Path | None
    warnings: list[str]


def _load_grid_parser():
    spec = importlib.util.spec_from_file_location("parse_daily", PARSE_GRID)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _zero_gas_sections() -> tuple[list, list]:
    production = [
        {"company": c, "fields": f, "gas": 0.0, "condensate": 0.0, "share": 0.0}
        for c, f in zip(
            PETROBANGLA_GAS_PRODUCTION_COMPANIES,
            (5, 5, 9, 3, 1, 0),
        )
    ]
    distribution = [
        {"company": c, "power": 0.0, "fertilizer": 0.0, "others": 0.0, "total": 0.0}
        for c in PETROBANGLA_GAS_DISTRIBUTION_COMPANIES
    ]
    return production, distribution


def _gas_from_json(path: Path) -> dict | None:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None
    if not data.get("gasProductionData"):
        return None
    return {
        "gasProductionData": data["gasProductionData"],
        "gasDistributionData": data.get("gasDistributionData", []),
    }


def _apply_gas_fallback(grid_data: dict, energy: date, warnings: list[str]) -> None:
    """Keep gas already held for this energy day; otherwise publish nothing.

    Carrying the previous day forward was the old behaviour and it fabricates a
    day: Petrobangla files the window opening on energy day D under D+1, so the
    newest ingested day routinely has no gas yet, and copying D-1's six company
    rows makes the archive assert figures for a window nobody has published.
    2026-08-19 shipped with 2026-08-18's rows byte for byte before this changed.

    Zero is the honest answer and the UI already speaks it: GasTab treats an
    all-zero table as "not published" and falls back, and the Overview KPI
    renders "— MMCFD" rather than 0. The day fills in properly on the next run
    once the PDF appears.
    """
    iso = energy.isoformat()
    preserved = _gas_from_json(GRID_DAILY_OUT / f"{iso}.json")
    if preserved:
        grid_data["gasProductionData"] = preserved["gasProductionData"]
        grid_data["gasDistributionData"] = preserved["gasDistributionData"]
        warnings.append("Petrobangla unavailable — kept existing gas sections for this energy day")
        return
    prod, dist = _zero_gas_sections()
    grid_data["gasProductionData"] = prod
    grid_data["gasDistributionData"] = dist
    warnings.append("Petrobangla unavailable — zero-filled gas sections (Gas tab empty state)")


def parse_petrobangla_pdf(pdf_path: Path, energy: date) -> dict | None:
    if not PARSE_PETROBANGLA.exists():
        return _parse_petrobangla_archive(pdf_path, energy)
    PETROBANGLA_JSON_STAGING.mkdir(parents=True, exist_ok=True)
    out_name = f"{energy.isoformat()}.json"
    out_path = PETROBANGLA_JSON_STAGING / out_name
    try:
        subprocess.run(
            [
                sys.executable,
                str(PARSE_PETROBANGLA),
                "--single",
                str(pdf_path),
                "--output",
                str(PETROBANGLA_JSON_STAGING),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        stem_out = PETROBANGLA_JSON_STAGING / f"{pdf_path.stem}.json"
        if stem_out.exists() and stem_out != out_path:
            data = json.loads(stem_out.read_text(encoding="utf-8"))
            out_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
            stem_out.unlink(missing_ok=True)
        if out_path.exists():
            return json.loads(out_path.read_text(encoding="utf-8"))
    except subprocess.CalledProcessError:
        return _parse_petrobangla_archive(pdf_path, energy)
    return _parse_petrobangla_archive(pdf_path, energy)


def _parse_petrobangla_archive(pdf_path: Path, energy: date) -> dict | None:
    """Pipeline B via the in-repo parser.

    `PARSE_PETROBANGLA` names the grid_backlog parser, which does not exist on
    every machine — where it is missing the archive day was simply never written
    and the run only said "Pipeline B failed". `parse_petrobangla_archive.py` is
    self-contained and lives in this repo; it takes the gas-day START, which for
    energy day E is E itself (the PDF collected here is the one whose 8am-8am
    window opens on E).
    """
    parser = PARSE_GRID.parent / "parse_petrobangla_archive.py"
    if not parser.exists():
        return None
    out_path = SCRATCH_DOWNLOADS / f"petrobangla_{energy.isoformat()}.json"
    try:
        subprocess.run(
            [sys.executable, str(parser), str(pdf_path), energy.isoformat(), str(out_path)],
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError:
        return None
    if not out_path.exists():
        return None
    doc = json.loads(out_path.read_text(encoding="utf-8"))

    # The archive parser stops short of the gas-day window fields that the
    # re-parse-direct files carry, and every day published from this path was
    # missing them. They are derived, not read off the page: the report's own
    # 8am-8am period, opening on the energy day.
    report = doc.get("report")
    if isinstance(report, dict):
        report.setdefault("gas_day_start", report.get("report_date_start"))
        report.setdefault("gas_day_end", report.get("report_date_end"))
        report.setdefault("gas_window", "8.00-8.00")
        out_path.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8")
    return doc


def parse_all(
    energy: date,
    pgcb_xlsx: Path | None,
    petrobangla_pdf: Path | None,
    work_dir: Path,
) -> ParseResult:
    work_dir.mkdir(parents=True, exist_ok=True)
    warnings: list[str] = []
    parser = _load_grid_parser()

    pgcb_text_path = None
    grid_data = None
    if pgcb_xlsx and pgcb_xlsx.exists():
        pgcb_text_path = work_dir / f"pgcb_{energy.isoformat()}.txt"
        pgcb_text_path.write_text(xlsx_to_text(pgcb_xlsx), encoding="utf-8")
        grid_data = parser.parse_pgcb_file(str(pgcb_text_path), energy)
        if not grid_data:
            warnings.append("PGCB parser returned no data")

    pb_text_path = None
    petrobangla_data = None
    pb_gas_ok = False
    if petrobangla_pdf and petrobangla_pdf.exists():
        pb_text_path = work_dir / f"petrobangla_{energy.isoformat()}.txt"
        pb_text_path.write_text(pdf_to_text(petrobangla_pdf), encoding="utf-8")
        pb_gas = parser.parse_petrobangla_file(str(pb_text_path))
        if grid_data and pb_gas:
            grid_data["gasProductionData"] = pb_gas["gasProductionData"]
            grid_data["gasDistributionData"] = pb_gas["gasDistributionData"]
            pb_gas_ok = True
        elif not pb_gas:
            warnings.append("Petrobangla text parse failed for Pipeline A gas summary")
        petrobangla_data = parse_petrobangla_pdf(petrobangla_pdf, energy)
        if not petrobangla_data:
            warnings.append("Petrobangla full PDF parser (Pipeline B) failed")

    if grid_data and not pb_gas_ok:
        _apply_gas_fallback(grid_data, energy, warnings)

    # sourceFiles, observationWindows and the day's forecast. Added by the same
    # module the admin upload route uses, so a day collected here and a day
    # uploaded there come out identically shaped — these were previously only
    # ever added by hand-run backfills, so every newly ingested day shipped
    # without a window block or a forecast.
    if grid_data:
        try:
            # `scripts/` is not on the path from inside this package — the grid
            # parser next door is loaded by file location for the same reason.
            # Without this the import raises, the except below swallows it, and
            # every collected day quietly ships with no forecast and no window
            # block while the run reports success.
            import sys as _sys

            if str(PARSE_GRID.parent) not in _sys.path:
                _sys.path.insert(0, str(PARSE_GRID.parent))
            from daily_enrich import enrich_grid_daily

            warnings.extend(
                enrich_grid_daily(
                    grid_data,
                    energy,
                    pgcb_file=pgcb_xlsx.name if pgcb_xlsx else None,
                    petrobangla=petrobangla_data,
                )
            )
        except Exception as exc:  # noqa: BLE001
            # A day is still a complete day without its forecast; failing the
            # whole collection over an enrichment step would be the wrong trade.
            warnings.append(f"enrichment skipped: {exc}")

    return ParseResult(
        energy_day=energy,
        grid_data=grid_data,
        petrobangla_data=petrobangla_data,
        pgcb_text_path=pgcb_text_path,
        petrobangla_text_path=pb_text_path,
        warnings=warnings,
    )