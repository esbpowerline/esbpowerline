#!/usr/bin/env python3
"""
ESB PowerLine Daily Data Extractor
==================================
Strictly scoped to what esbpowerline consumes today:

  Pipeline A — PGCB ERP daily report
    → public/data/daily/{energy-day}.json  (GridDailyData)
    → lib/available-dates.json
    Parser: scripts/parse_daily_reports.py
    Consumer: PowerGridExplorer, home snapshot, member export

  Pipeline B — Petrobangla daily gas PDF
    → Desktop/grid_backlog/petrobangla_json/{energy-day}.json
    → public/data/petrobangla/daily/ via sync_petrobangla_live.py
    Parser: Desktop/grid_backlog/parse_petrobangla.py
    Consumer: Gas tab, Field Evidence, _live_week.json

BPDB daily generation / area-wise demand are NOT in scope.

Usage:
  python scripts/daily_data_extractor.py
  python scripts/daily_data_extractor.py --date 2026-06-29 --deploy
  python scripts/daily_data_extractor.py --date 2026-06-29 --skip-google --auto-confirm --deploy
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from daily_extractor.cli import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())