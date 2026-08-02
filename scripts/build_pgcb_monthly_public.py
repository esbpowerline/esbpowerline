"""Publish the PGCB monthly archive as static JSON under public/data/pgcb-monthly/.

`lib/pgcb-monthly-data.json` stays the source of truth that the ingest appends to;
this script derives the files the browser actually fetches. Run it after every
monthly ingest.

Two shapes, because the UI has two very different needs:

  _series.json      Every month, but only the fields the trend charts, KPI tiles,
                    fuel mix and period pickers read. No regional_supply. This is
                    fetched once when the Macro Trends tab is opened.

  {YYYY-MM}.json    The complete record for one month, fetched only for the month
                    being viewed. Per-month detail (regional supply today, and the
                    other QF-LDC sheets later) belongs here so it never enters the
                    series or the JS bundle.

Previously the whole archive was a static import compiled into the client chunk,
so every visitor downloaded 13 years of data whether or not they opened the tab.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "lib" / "pgcb-monthly-data.json"
OUT = ROOT / "public" / "data" / "pgcb-monthly"

# Fields the charts/KPIs/pickers need. Anything not listed stays per-month only.
SERIES_FIELDS = (
    "date_key",
    "month",
    "year",
    "max_evening_peak_gen",
    "max_evening_peak_demand",
    "total_net_generation",
    "generation_by_fuel",
)


def main() -> None:
    records = json.loads(SRC.read_text(encoding="utf-8"))
    records.sort(key=lambda r: r["date_key"])

    keys = [r["date_key"] for r in records]
    if len(set(keys)) != len(keys):
        dupes = sorted({k for k in keys if keys.count(k) > 1})
        raise SystemExit(f"duplicate date_key(s) in {SRC.name}: {dupes}")

    # Rebuild from scratch so months deleted upstream don't linger as stale files.
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    series = [{f: r[f] for f in SERIES_FIELDS if f in r} for r in records]
    series_path = OUT / "_series.json"
    series_path.write_text(json.dumps(series, separators=(",", ":")), encoding="utf-8")

    for r in records:
        (OUT / f"{r['date_key']}.json").write_text(
            json.dumps(r, separators=(",", ":")), encoding="utf-8"
        )

    src_kb = SRC.stat().st_size / 1024
    series_kb = series_path.stat().st_size / 1024
    print(f"months           : {len(records)} ({keys[0]} -> {keys[-1]})")
    print(f"_series.json     : {series_kb:.1f} KB (was {src_kb:.1f} KB bundled as JS)")
    print(f"per-month files  : {len(records)} written to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
