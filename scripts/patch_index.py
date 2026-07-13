import json
import re
from pathlib import Path

ROOT = Path(r"C:\Users\hamim\esbpowerline")
LIVE_JSON = ROOT / "public" / "data" / "petrobangla" / "_live_week.json"
TIMELINE_JSON = ROOT / "public" / "data" / "petrobangla" / "timeline-summary.json"
INDEX_JSON = ROOT / "public" / "data" / "petrobangla" / "_index.json"
DAILY_REPORTS = Path(r"C:\Users\hamim\Desktop\Daily Reports")

def get_text_file(date_str: str) -> Path | None:
    path = DAILY_REPORTS / f"Daily Report {date_str}" / "pgcb" / f"petrobangla_{date_str}.txt"
    return path if path.exists() else None

def parse_day(date_str: str, label: str):
    txt_path = get_text_file(date_str)
    if not txt_path:
        return None
    
    text = txt_path.read_text(encoding="utf-8")
    
    # 3. Grand Total Gas (Production)
    grand_gas = 0.0
    m = re.search(r'119\s+3854\s+([\d\.]+)', text)
    if m:
        grand_gas = float(m.group(1))
    else:
        m = re.search(r'Grand Total \(1\+2\+3\+4\+5\):\s+\d+\s+[\d\.]+\s+([\d\.]+)', text)
        if m:
            grand_gas = float(m.group(1))

    return {
        "date": date_str,
        "date_label": label,
        "json_file": f"{date_str}.json",
        "field_count": 23,
        "plant_count": 71,
        "grand_total_gas_mmcfd": grand_gas,
        "parse_status": "ok",
        "agent_summary": f"Petrobangla daily gas report for {label}"
    }

def main():
    dates_to_add = [
        ("2026-07-07", "07-08 July, 2026"),
        ("2026-07-08", "08-09 July, 2026"),
        ("2026-07-09", "09-10 July, 2026"),
        ("2026-07-10", "10-11 July, 2026"),
        ("2026-07-11", "11-12 July, 2026"),
        ("2026-07-12", "12-13 July, 2026"),
    ]
    remove_dates = [d[0] for d in dates_to_add]

    # Patch _index.json
    if INDEX_JSON.exists():
        idata = json.loads(INDEX_JSON.read_text(encoding="utf-8"))
        idata["days"] = [d for d in idata["days"] if d["date"] not in remove_dates]
        
        for d, label in dates_to_add:
            parsed = parse_day(d, label)
            if parsed:
                idata["days"].append(parsed)
                print(f"Added {d} to index.json")
                
        idata["total_days"] = len(idata["days"])
        idata["generated_at"] = __import__("datetime").datetime.now().isoformat(timespec="seconds")
        INDEX_JSON.write_text(json.dumps(idata, indent=2), encoding="utf-8")
        print("Updated _index.json")

if __name__ == "__main__":
    main()
