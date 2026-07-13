import urllib.request
import urllib.parse
import ssl
import re
import pandas as pd
from datetime import date, timedelta
from pathlib import Path

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

DATE_RE = re.compile(r"\b(\d{2})-(\d{2})-(\d{4})\b")

def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "ESBPowerLine/1.0"})
    with urllib.request.urlopen(req, context=CTX, timeout=10) as r:
        return r.read()

def download_erp(fid: int) -> Path | None:
    for ext in ("xlsx", "xlsm", "xls"):
        loc = urllib.parse.quote(f"erp/web/report_docs/{fid}.{ext}", safe="")
        url = f"https://erp.powergrid.gov.bd/web/files/download?location={loc}&title=Daily"
        try:
            data = fetch(url)
            if data[:2] == b"PK" and len(data) > 20000:
                dest = Path(f"downloads/erp_{fid}.{ext}")
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
                return dest
        except Exception:
            continue
    return None

def report_energy_dates(path: Path) -> tuple[date | None, date | None]:
    try:
        df = pd.read_excel(path, sheet_name="P1", header=None)
        report = None
        for i in range(min(12, df.shape[0])):
            for j in range(min(12, df.shape[1])):
                cell = df.iloc[i, j]
                if isinstance(cell, str):
                    m = DATE_RE.search(cell)
                    if m:
                        d, mo, y = m.groups()
                        report = date(int(y), int(mo), int(d))
                        break
            if report:
                break
        if not report:
            return None, None
        return report, report - timedelta(days=1)
    except Exception as e:
        print(f"Error reading {path}: {e}")
        return None, None

def main():
    print("Probing PGCB ERP attachment IDs...")
    for fid in range(5052, 5066):
        path = download_erp(fid)
        if path:
            report, energy = report_energy_dates(path)
            if energy:
                print(f"ID {fid}: file={path.name} report_date={report} energy_date={energy}")
            else:
                print(f"ID {fid}: file={path.name} (dates not parsed)")
        else:
            print(f"ID {fid}: not found")

if __name__ == "__main__":
    main()
