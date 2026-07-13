import json
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PB = ROOT / "public" / "data" / "petrobangla"
PB_DAILY = PUBLIC_PB / "daily"
INDEX_PATH = PUBLIC_PB / "_index.json"
LIVE_WEEK_PATH = PUBLIC_PB / "_live_week.json"

def main():
    print("Rebuilding Petrobangla _index.json from daily JSON files...")
    
    days = []
    
    # Loop over all daily JSON files
    for path in sorted(PB_DAILY.glob("20*.json")):
        if path.name.startswith("_"):
            continue
        try:
            datetime.strptime(path.stem, "%Y-%m-%d")
        except ValueError:
            print(f"Skipping corrupt filename: {path.name}")
            continue
            
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"Failed to read {path.name}: {e}")
            continue
            
        meta = data.get("meta", {})
        report = data.get("report", {})
        prod = data.get("production", {})
        dist = data.get("distribution", {})
        
        date = path.stem
        date_label = report.get("report_date_label") or date
        
        # Calculate fields and plants counts
        fields = prod.get("fields", [])
        field_count = len(fields)
        
        companies = dist.get("companies", [])
        plant_count = sum(len(c.get("power_plants", [])) for c in companies)
        
        grand_total_gas = prod.get("grand_total", {}).get("gas_mmcfd")
        if grand_total_gas is not None:
            grand_total_gas = float(grand_total_gas)
        else:
            grand_total_gas = 0.0
            
        parse_status = meta.get("parse_status", "ok")
        agent_summary = meta.get("agent_summary") or f"Petrobangla daily gas report for {date_label}."
        
        days.append({
            "date": date,
            "date_label": date_label,
            "json_file": path.name,
            "field_count": field_count,
            "plant_count": plant_count,
            "grand_total_gas_mmcfd": grand_total_gas,
            "parse_status": parse_status,
            "agent_summary": agent_summary
        })
        
    days.sort(key=lambda x: x["date"])
    
    # Save rebuilt _index.json
    index_data = {
        "generated_at": datetime.now().isoformat(),
        "total_days": len(days),
        "days": days
    }
    
    INDEX_PATH.write_text(json.dumps(index_data, indent=2), encoding="utf-8")
    print(f"Successfully rebuilt _index.json: indexed {len(days)} days.")
    
    # Rebuild _live_week.json using the new index
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
    
    window = ok_days[-30:]
    days_data = []
    for entry in window:
        dpath = PB_DAILY / entry["json_file"]
        if dpath.exists():
            try:
                days_data.append(json.loads(dpath.read_text(encoding="utf-8")))
            except Exception as e:
                print(f"Failed to read live day {entry['json_file']}: {e}")
                
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
