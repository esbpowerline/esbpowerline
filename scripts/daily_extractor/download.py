"""Download official PGCB (ERP/pgcb.gov.bd) and Petrobangla daily reports."""
from __future__ import annotations

import re
import ssl
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

from .config import ERP_BY_ENERGY, SCRATCH_DOWNLOADS, energy_to_report_date

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
DATE_RE = re.compile(r"\b(\d{2})-(\d{2})-(\d{4})\b")


@dataclass
class DownloadResult:
    pgcb_xlsx: Path | None
    pgcb_erp_id: int | None
    report_date: date | None
    petrobangla_pdf: Path | None
    petrobangla_url: str | None
    errors: list[str]


def fetch(url: str, timeout: int = 45) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "ESBPowerLine-DailyExtractor/1.0"})
    with urllib.request.urlopen(req, context=CTX, timeout=timeout) as resp:
        return resp.read()


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


def download_erp_by_id(fid: int, dest_dir: Path | None = None) -> Path | None:
    dest_dir = dest_dir or SCRATCH_DOWNLOADS
    dest_dir.mkdir(parents=True, exist_ok=True)
    for ext in ("xlsx", "xlsm", "xls"):
        dest = dest_dir / f"erp_{fid}.{ext}"
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


def probe_erp_for_energy(energy: date, start_id: int | None = None) -> tuple[Path | None, int | None]:
    """Scan sequential ERP IDs near the last known map entry."""
    iso = energy.isoformat()
    if iso in ERP_BY_ENERGY:
        path = download_erp_by_id(ERP_BY_ENERGY[iso])
        if path:
            _, found_energy = report_energy_dates(path)
            if found_energy == energy:
                return path, ERP_BY_ENERGY[iso]

    base = start_id or (max(ERP_BY_ENERGY.values()) if ERP_BY_ENERGY else 5000)
    for fid in range(base, base + 20):
        path = download_erp_by_id(fid)
        if not path:
            continue
        _, found_energy = report_energy_dates(path)
        if found_energy == energy:
            return path, fid
    return None, None


def try_pgcb_legacy(report_date: date, dest_dir: Path | None = None) -> Path | None:
    dest_dir = dest_dir or SCRATCH_DOWNLOADS
    dest_dir.mkdir(parents=True, exist_ok=True)
    dd = f"{report_date.day:02d}-{report_date.month:02d}-{report_date.year}"
    for ext in (".xlsx", ".xlsm"):
        url = f"https://www.pgcb.gov.bd/reports/Daily_Report_{dd}{ext}"
        dest = dest_dir / f"Daily_Report_{dd}{ext}"
        try:
            data = fetch(url)
            if len(data) < 5000 or data[:2] != b"PK":
                continue
            dest.write_bytes(data)
            return dest
        except Exception:
            continue
    return None


def _petrobangla_pdf_urls() -> list[str]:
    base = "https://petrobangla.org.bd"
    urls: list[str] = []
    try:
        html = fetch(base).decode("utf-8", errors="ignore")
        for path in re.findall(r'(/uploads/[^"\'\s>]+\.pdf)', html, re.I):
            full = path if path.startswith("http") else f"{base}{path}"
            if full not in urls:
                urls.append(full)
    except Exception:
        pass
    for name in ("Daily_Report.pdf", "Daily%20Report.pdf"):
        url = f"{base}/uploads/editor/files/{name}"
        if url not in urls:
            urls.append(url)
    return urls


def _local_petrobangla_pdf() -> Path | None:
    """Fallback: newest PDF from operator hot folders when live site is down."""
    candidates: list[Path] = []
    for folder in (
        Path(r"C:\Users\user\Desktop\New weeks"),
        Path(r"C:\Users\user\Desktop\Daily Gas Reports ALL - Petrobangla"),
    ):
        if folder.is_dir():
            candidates.extend(folder.rglob("*.pdf"))
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def download_petrobangla(dest_dir: Path | None = None) -> tuple[Path | None, str | None]:
    dest_dir = dest_dir or SCRATCH_DOWNLOADS
    dest_dir.mkdir(parents=True, exist_ok=True)

    local = _local_petrobangla_pdf()
    if local:
        dest = dest_dir / f"Petrobangla_{local.name}"
        if not dest.exists() or dest.stat().st_size != local.stat().st_size:
            dest.write_bytes(local.read_bytes())
        try:
            import pypdf

            text = "\n".join((page.extract_text() or "") for page in pypdf.PdfReader(str(dest)).pages)
            if "II. Distribution" in text:
                (dest_dir / "petrobangla_latest.txt").write_text(text, encoding="utf-8")
                return dest, f"local:{local}"
        except Exception:
            pass

    for url in _petrobangla_pdf_urls():
        try:
            data = fetch(url)
        except Exception:
            continue
        if data[:4] != b"%PDF" or len(data) < 5000:
            continue
        dest = dest_dir / "Petrobangla_latest.pdf"
        dest.write_bytes(data)
        try:
            import pypdf

            text = "\n".join((page.extract_text() or "") for page in pypdf.PdfReader(str(dest)).pages)
            if "II. Distribution" not in text:
                continue
            (dest_dir / "petrobangla_latest.txt").write_text(text, encoding="utf-8")
            return dest, url
        except Exception:
            continue
    return None, None


def download_for_energy_day(energy: date) -> DownloadResult:
    SCRATCH_DOWNLOADS.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []
    report_date = energy_to_report_date(energy)

    pgcb_path, erp_id = probe_erp_for_energy(energy)
    if not pgcb_path:
        pgcb_path = try_pgcb_legacy(report_date)
        if pgcb_path:
            _, found = report_energy_dates(pgcb_path)
            if found != energy:
                errors.append(f"Legacy PGCB report covers {found}, wanted {energy}")
                pgcb_path = None

    if not pgcb_path:
        errors.append(f"No PGCB report found for energy day {energy} (report date {report_date})")

    pb_pdf, pb_url = download_petrobangla()
    if not pb_pdf:
        errors.append("Petrobangla daily PDF not available (gas sections will be zero-filled or carried forward)")

    found_report = None
    if pgcb_path:
        found_report, found_energy = report_energy_dates(pgcb_path)
        if found_energy != energy:
            errors.append(f"PGCB file energy day {found_energy} != requested {energy}")

    return DownloadResult(
        pgcb_xlsx=pgcb_path,
        pgcb_erp_id=erp_id,
        report_date=found_report or report_date,
        petrobangla_pdf=pb_pdf,
        petrobangla_url=pb_url,
        errors=errors,
    )