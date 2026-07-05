"""Paths and constants for ESB PowerLine daily data ingestion.

Scoped strictly to what the esbpowerline codebase consumes today:

  Pipeline A — PGCB ERP daily  → public/data/daily/{energy-day}.json (GridDailyData)
  Pipeline B — Petrobangla PDF → grid_backlog/petrobangla_json + public/data/petrobangla/daily/

BPDB daily sources are intentionally out of scope until a site loader exists.
"""
from __future__ import annotations

import os
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Pipeline A — GridDailyData (lib/data/grid/types.ts)
GRID_DAILY_OUT = ROOT / "public" / "data" / "daily"
AVAILABLE_DATES = ROOT / "lib" / "available-dates.json"
PARSE_GRID = ROOT / "scripts" / "parse_daily_reports.py"

# Pipeline B — PetrobanglaDaily (lib/data/petrobangla/types.ts)
PETROBANGLA_PUBLIC = ROOT / "public" / "data" / "petrobangla" / "daily"
PETROBANGLA_PUBLIC_ROOT = ROOT / "public" / "data" / "petrobangla"
_GRID_BACKLOG = Path(os.environ.get("ESB_GRID_BACKLOG", str(Path.home() / "Desktop" / "grid_backlog")))
PARSE_PETROBANGLA = Path(os.environ.get("ESB_PARSE_PETROBANGLA", str(_GRID_BACKLOG / "parse_petrobangla.py")))
PETROBANGLA_JSON_STAGING = Path(os.environ.get("ESB_PETROBANGLA_JSON_STAGING", str(_GRID_BACKLOG / "petrobangla_json")))
PETROBANGLA_INDEX_STAGING = PETROBANGLA_JSON_STAGING / "_index.json"
SYNC_PETROBANGLA = ROOT / "scripts" / "sync_petrobangla_live.py"
BUILD_PETROBANGLA_TIMELINE = ROOT / "scripts" / "build_petrobangla_timeline.py"
PETROBANGLA_HOT_FOLDER = Path(os.environ.get("ESB_PETROBANGLA_HOT_FOLDER", str(Path.home() / "Desktop" / "New weeks")))

# Canonical fuel / company labels (lib/data/grid/types.ts)
REQUIRED_GENERATION_FUELS = (
    "Gas",
    "Coal",
    "HFO",
    "Hydro",
    "Solar",
    "Imports",
    "HSD (Diesel)",
)

PETROBANGLA_GAS_PRODUCTION_COMPANIES = (
    "BGFCL (Titas, Habiganj, Bakhrabad)",
    "SGFL (Sylhet, Rashidpur, Kailashtila)",
    "BAPEX (Shahbazpur, Srikail, Begumganj)",
    "Chevron (Bibiyana, Jalalabad, Moulavibazar)",
    "Tullow (Bangora)",
    "RPGCL (R-LNG Import / LNG Terminal)",
)

PETROBANGLA_GAS_DISTRIBUTION_COMPANIES = (
    "TGTDCL (Dhaka & Mymensingh)",
    "BGDCL (Cumilla & Sylhet)",
    "KGDCL (Chattogram)",
    "JGTDSL (Sylhet region)",
    "PGCL (Rajshahi & Rangpur)",
    "SGCL (Barishal & Khulna)",
)

# Organized daily report archive on Desktop
DAILY_REPORTS_ROOT = Path(os.environ.get("ESB_DAILY_REPORTS_ROOT", str(Path.home() / "Desktop" / "Daily Reports")))

# Scratch cache while downloading
SCRATCH_DOWNLOADS = ROOT / "scratch" / "downloads"

# Known ERP attachment IDs (energy_day ISO -> file id)
ERP_BY_ENERGY: dict[str, int] = {
    "2026-06-25": 5046,
    "2026-06-26": 5047,
    "2026-06-27": 5049,
    "2026-06-28": 5050,
    "2026-06-29": 5051,
    "2026-06-30": 5052,
}

SITE_FOLDERS = {
    "pgcb": "PGCB",
    "petrobangla": "Petrobangla",
    "output": "Output",
    "verification": "Verification",
}

# Metrics cross-checked against official re-parse and Google search
VERIFY_METRICS = (
    ("systemStats.eveningPeakGen", "Evening Peak Generation", "MW", 50.0),
    ("systemStats.dayPeakGen", "Day Peak Generation", "MW", 50.0),
    ("systemStats.totalEnergyGen", "Total Energy Generated", "MKWh", 5.0),
    ("systemStats.totalGasSuppliedPower", "Gas to Power Sector", "MMCFD", 20.0),
)


def energy_to_report_date(energy: date) -> date:
    """PGCB report dated D covers energy day D-1."""
    return energy + timedelta(days=1)


def report_folder(energy: date) -> Path:
    return DAILY_REPORTS_ROOT / f"Daily Report {energy.isoformat()}"


def site_dir(energy: date, site: str) -> Path:
    return report_folder(energy) / SITE_FOLDERS[site]