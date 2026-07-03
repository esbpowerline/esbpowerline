"""
Ingest official PGCB (ERP) + Petrobangla data into public/data/daily/*.json

PGCB convention: report dated D contains energy statistics for day D-1.
"""
import importlib.util
import io
import json
import re
import ssl
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DL = ROOT / "scratch" / "downloads"
DAILY = ROOT / "public" / "data" / "daily"
DATES = ROOT / "lib" / "available-dates.json"

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
DATE_RE = re.compile(r"\b(\d{2})-(\d{2})-(\d{4})\b")

# Known ERP attachment IDs (sequential ~1 per calendar day in 2026)
ERP_BY_ENERGY: dict[str, int] = {
    "2026-06-25": 5046,
    "2026-06-26": 5047,
    "2026-06-27": 5049,
    "2026-06-28": 5050,
    "2026-06-29": 5051,
    "2026-06-30": 5052,
    "2026-07-01": 5053,
}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "ESBPowerLine/1.0"})
    with urllib.request.urlopen(req, context=CTX, timeout=30) as r:
        return r.read()


def download_erp(fid: int) -> Path | None:
    for ext in ("xlsx", "xlsm", "xls"):
        dest = DL / f"erp_{fid}.{ext}"
        if dest.exists() and dest.stat().st_size > 20000:
            return dest
        loc = urllib.parse.quote(f"erp/web/report_docs/{fid}.{ext}", safe="")
        url = f"https://erp.powergrid.gov.bd/web/files/download?location={loc}&title=Daily"
        try:
            data = fetch(url)
            if data[:2] != b"PK" or len(data) < 20000:
                continue
            dest.write_bytes(data)
            return dest
        except Exception:
            continue
    return None


def cell_str(val) -> str:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return ""
    if hasattr(val, "strftime"):
        return val.strftime("%Y-%m-%d")
    return str(val).strip().strip("'")


def xlsx_to_text(path: Path) -> str:
    xl = pd.ExcelFile(path)
    parts = []
    for sheet in xl.sheet_names:
        if sheet != "P1" and sheet not in ("Forecast", "P3", "L-Curve", "YesterdayGen", "GenLog"):
            # include all sheets for outages/hourly
            pass
        df = xl.parse(sheet, header=None)
        parts.append(f"## Sheet: {sheet}")
        for _, row in df.iterrows():
            cells = [cell_str(v) for v in row.tolist()]
            while cells and cells[-1] == "":
                cells.pop()
            if any(cells):
                parts.append(" | ".join(cells))
    return "\n".join(parts)


def report_energy_dates(path: Path) -> tuple[date | None, date | None]:
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


def _petrobangla_pdf_urls() -> list[str]:
    base = "https://www.petrobangla.org.bd"
    urls: list[str] = []
    try:
        html = fetch(base).decode("utf-8", errors="ignore")
        for path in re.findall(r'(/uploads/[^"\'\s>]+\.pdf)', html, re.I):
            urls.append(path if path.startswith("http") else f"{base}{path}")
    except Exception as e:
        print(f"[pb] homepage scrape failed: {e}")
    for name in (
        "Daily_Report.pdf",
        "Daily%20Report.pdf",
        "Daily_Report_01-07-2026.pdf",
        "Daily_Report_30-06-2026.pdf",
    ):
        url = f"{base}/uploads/editor/files/{name}"
        if url not in urls:
            urls.append(url)
    return urls


def scrape_petrobangla() -> tuple[Path | None, Path | None]:
    cached_txt = DL / "petrobangla_latest.txt"
    cached_pdf = DL / "Petrobangla_latest.pdf"
    if cached_txt.exists() and cached_txt.stat().st_size > 500:
        return cached_pdf if cached_pdf.exists() else None, cached_txt

    for url in _petrobangla_pdf_urls():
        try:
            data = fetch(url)
        except Exception:
            continue
        if data[:4] != b"%PDF" or len(data) < 5000:
            continue
        cached_pdf.write_bytes(data)
        try:
            import pypdf

            text = "\n".join((page.extract_text() or "") for page in pypdf.PdfReader(str(cached_pdf)).pages)
            if "II. Distribution" not in text:
                continue
            cached_txt.write_text(text, encoding="utf-8")
            return cached_pdf, cached_txt
        except Exception as e:
            print(f"[pb] text extract failed for {url}: {e}")
    return None, None


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


def _nearest_gas_before(energy: date) -> dict | None:
    for path in sorted(DAILY.glob("*.json"), reverse=True):
        try:
            file_date = date.fromisoformat(path.stem)
        except ValueError:
            continue
        if file_date >= energy:
            continue
        gas = _gas_from_json(path)
        if gas:
            return gas
    return None


def load_parser():
    spec = importlib.util.spec_from_file_location("parse_daily", ROOT / "scripts" / "parse_daily_reports.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def merge_record(parser, energy: date, pgcb_path: Path, pb_text: Path | None) -> dict | None:
    iso = energy.isoformat()
    text_path = DL / f"pgcb_{iso}.txt"
    text_path.write_text(xlsx_to_text(pgcb_path), encoding="utf-8")
    pgcb = parser.parse_pgcb_file(str(text_path), energy)
    if not pgcb:
        return None

    preserved = _gas_from_json(DAILY / f"{iso}.json")
    if pb_text and pb_text.exists():
        pb = parser.parse_petrobangla_file(str(pb_text))
        if pb:
            pgcb["gasProductionData"] = pb["gasProductionData"]
            pgcb["gasDistributionData"] = pb["gasDistributionData"]
            return pgcb

    if preserved:
        pgcb["gasProductionData"] = preserved["gasProductionData"]
        pgcb["gasDistributionData"] = preserved["gasDistributionData"]
        print(f"[pb] {iso}: kept existing Petrobangla gas (live PDF unavailable)")
        return pgcb

    fallback = _nearest_gas_before(energy)
    if fallback:
        pgcb["gasProductionData"] = fallback["gasProductionData"]
        pgcb["gasDistributionData"] = fallback["gasDistributionData"]
        print(f"[pb] {iso}: carried forward gas from prior day (Petrobangla unavailable)")
    return pgcb


def update_dates_index(iso_list: list[str]):
    dates = json.loads(DATES.read_text(encoding="utf-8"))
    changed = False
    for iso in iso_list:
        if iso not in dates:
            dates.append(iso)
            changed = True
    if changed:
        dates.sort()
        DATES.write_text(json.dumps(dates, indent=2), encoding="utf-8")


def main():
    parser = load_parser()
    _, pb_text = scrape_petrobangla()
    if pb_text:
        print(f"[pb] gas text extracted ({pb_text.stat().st_size} bytes)")

    # Backlog catch-up: Jun 29 (report 2026-06-30) + Jun 30 (report 2026-07-01) + Jul 1 (report 2026-07-02).
    targets = ["2026-06-29", "2026-06-30", "2026-07-01"]

    written = []
    missing = []

    for iso in targets:
        fid = ERP_BY_ENERGY.get(iso)
        if not fid:
            missing.append(iso)
            continue
        path = download_erp(fid)
        if not path:
            print(f"[skip] {iso}: ERP id {fid} not published yet")
            missing.append(iso)
            continue
        report, energy = report_energy_dates(path)
        if energy and energy.isoformat() != iso:
            print(f"[warn] {iso}: erp_{fid} has energy={energy}, expected {iso}")
        y, m, d = map(int, iso.split("-"))
        merged = merge_record(parser, date(y, m, d), path, pb_text)
        if not merged:
            print(f"[fail] {iso}: parser returned None")
            missing.append(iso)
            continue
        out = DAILY / f"{iso}.json"
        out.write_text(json.dumps(merged, indent=2), encoding="utf-8")
        s = merged["systemStats"]
        print(f"[ok] {iso} <- erp_{fid} report={report} epg={s['eveningPeakGen']} gen={s['totalEnergyGen']}")
        written.append(iso)

    if written:
        update_dates_index(written)

    if "2026-07-01" in missing:
        print("\nJul 1 energy day requires PGCB report dated 2026-07-02 (ERP ~5053), not yet on erp.powergrid.gov.bd.")
        if written:
            latest = max(written)
            print(f"Latest ingested energy day: {latest}.")

    return 0 if "2026-07-01" in written else 2


if __name__ == "__main__":
    raise SystemExit(main())