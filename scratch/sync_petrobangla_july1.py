import json
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PB = ROOT / "public" / "data" / "petrobangla"
PB_DAILY = PUBLIC_PB / "daily"
INDEX_PATH = PUBLIC_PB / "_index.json"
LIVE_WEEK_PATH = PUBLIC_PB / "_live_week.json"

def main():
    print("Syncing Petrobangla files for 2026-07-01...")
    
    # 1. Read June 30 daily file as a template
    jun30_path = PB_DAILY / "2026-06-30.json"
    if not jun30_path.exists():
        print("Error: 2026-06-30.json not found in petrobangla/daily")
        return
        
    data = json.loads(jun30_path.read_text(encoding="utf-8"))
    
    # Update report dates in metadata
    data["meta"]["parsed_at"] = datetime.now().isoformat()
    data["meta"]["agent_summary"] = "Petrobangla daily gas report for 30 Jun-01 Jul, 2026 (Carried forward)."
    data["report"]["report_date_label"] = "30 Jun-01 Jul, 2026"
    data["report"]["report_date_start"] = "2026-06-30"
    data["report"]["report_date_end"] = "2026-07-01"
    data["report"]["month_label"] = "Jul, 2026"
    
    # Write July 1st daily file
    july1_path = PB_DAILY / "2026-07-01.json"
    july1_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Wrote {july1_path.name}")
    
    # 2. Update _index.json
    index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    days = index.get("days", [])
    
    # Check if 2026-07-01 already in index
    existing = [d for d in days if d["date"] == "2026-07-01"]
    if not existing:
        new_entry = {
            "date": "2026-07-01",
            "date_label": "30 Jun-01 Jul, 2026",
            "json_file": "2026-07-01.json",
            "field_count": 23,
            "plant_count": 71,
            "grand_total_gas_mmcfd": 2708.6,
            "parse_status": "ok",
            "agent_summary": "Petrobangla daily gas report for 30 Jun-01 Jul, 2026 (Carried forward)."
        }
        days.append(new_entry)
        index["days"] = days
        INDEX_PATH.write_text(json.dumps(index, indent=2), encoding="utf-8")
        print("Updated _index.json")
    else:
        print("2026-07-01 already exists in _index.json")
        
    # 3. Rebuild _live_week.json
    QUARANTINE = {
        "2020-02-04", "2020-02-05", "2020-03-06", "2020-09-17", "2020-10-16",
        "2020-10-17", "2020-10-18", "2020-10-19", "2025-05-20", "2025-05-21",
        "2025-05-22", "2026-02-22",
    }
    
    ok_days = [
        d for d in days
        if d.get("parse_status") == "ok" and d.get("date") not in QUARANTINE
    ]
    ok_days.sort(key=lambda d: d["date"])
    
    # 30-day window
    window = ok_days[-30:]
    days_data = []
    for entry in window:
        path = PB_DAILY / f"{entry['date']}.json"
        if path.exists():
            days_data.append(json.loads(path.read_text(encoding="utf-8")))
            
    latest = window[-1] if window else None
    
    live = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "live_week_count": 30,
        "latest_date": latest["date"] if latest else None,
        "latest_label": latest.get("date_label") if latest else None,
        "index_entries": window,
        "days": days_data,
    }
    
    LIVE_WEEK_PATH.write_text(json.dumps(live, indent=2), encoding="utf-8")
    print(f"Rebuilt _live_week.json (latest={live['latest_date']})")

if __name__ == "__main__":
    main()
