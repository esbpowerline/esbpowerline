import urllib.request
import ssl
from pathlib import Path

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

def fetch(url: str, dest: Path) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": "ESBPowerLine/1.0"})
    try:
        with urllib.request.urlopen(req, context=CTX, timeout=15) as r:
            data = r.read()
            if len(data) > 20000:
                dest.write_bytes(data)
                print(f"Downloaded {url} to {dest.name} ({len(data)} bytes)")
                return True
            else:
                print(f"Failed {url}: too small ({len(data)} bytes)")
    except Exception as e:
        print(f"Failed {url}: {e}")
    return False

def main():
    dest_dir = Path("downloads")
    dest_dir.mkdir(exist_ok=True)
    
    # Energy day July 1 -> Report July 2
    url_july1 = "https://www.pgcb.gov.bd/reports/Daily_Report_02-07-2026.xlsx"
    fetch(url_july1, dest_dir / "Daily_Report_02-07-2026.xlsx")
    
    # Energy day July 2 -> Report July 3
    url_july2 = "https://www.pgcb.gov.bd/reports/Daily_Report_03-07-2026.xlsx"
    fetch(url_july2, dest_dir / "Daily_Report_03-07-2026.xlsx")

if __name__ == "__main__":
    main()
