import json
from pathlib import Path
from datetime import datetime, timedelta

ROOT = Path(__file__).resolve().parents[1]
AVAILABLE_DATES_PATH = ROOT / "lib" / "available-dates.json"
PB_INDEX_PATH = ROOT / "public" / "data" / "petrobangla" / "_index.json"

QUARANTINE = {
    "2020-02-04", "2020-02-05", "2020-03-06", "2020-09-17", "2020-10-16",
    "2020-10-17", "2020-10-18", "2020-10-19", "2025-05-20", "2025-05-21",
    "2025-05-22", "2026-02-22",
}

def check_gaps(dates_list, label):
    parsed_dates = sorted([datetime.strptime(d, "%Y-%m-%d").date() for d in dates_list])
    # Filter to only look at 2026 dates
    parsed_dates = [d for d in parsed_dates if d.year == 2026]
    if not parsed_dates:
        print(f"{label}: No 2026 dates found.")
        return
        
    start_date = parsed_dates[0]
    end_date = parsed_dates[-1]
    print(f"\nChecking {label} gaps in 2026 from {start_date} to {end_date} ({len(parsed_dates)} total days)...")
    
    current = start_date
    gaps = []
    while current <= end_date:
        iso_str = current.isoformat()
        if current not in parsed_dates and iso_str not in QUARANTINE:
            gaps.append(iso_str)
        current += timedelta(days=1)
        
    if gaps:
        print(f"[!] Found {len(gaps)} missing day(s) (not in quarantine list):")
        # Print first 20 gaps
        for g in gaps[:20]:
            print(f"  - {g}")
        if len(gaps) > 20:
            print(f"  ... and {len(gaps) - 20} more gaps.")
    else:
        print(f"[OK] {label}: Perfect timeline continuity! Zero gaps found between {start_date} and {end_date}.")

def main():
    # 1. Check available-dates.json
    if AVAILABLE_DATES_PATH.exists():
        dates = json.loads(AVAILABLE_DATES_PATH.read_text(encoding="utf-8"))
        check_gaps(dates, "Daily Grid Index (available-dates.json)")
        
    # 2. Check Petrobangla _index.json
    if PB_INDEX_PATH.exists():
        pb_index = json.loads(PB_INDEX_PATH.read_text(encoding="utf-8"))
        pb_dates = [d["date"] for d in pb_index.get("days", []) if d.get("parse_status") == "ok"]
        check_gaps(pb_dates, "Petrobangla Archive Index (_index.json)")

if __name__ == "__main__":
    main()
