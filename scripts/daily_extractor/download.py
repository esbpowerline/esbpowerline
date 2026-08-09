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


def fetch(url: str, timeout: int = 3) -> bytes:
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
    # The date in P1's corner is the day the sheet reports on, not its publication
    # date: every workbook's Forecast header reads "Actual Generation on <that same
    # date>". Subtracting a day here labelled each report as the day before, which is
    # how erp_5090 ("Actual Generation on 05-08-2026") was nearly filed as 08-04.
    # Checked against the archive's confirmed days: 5077->07-24, 5078->07-25,
    # 5079->07-26, 5080->07-27, each matching totalEnergyGen exactly.
    return report + timedelta(days=1), report


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

    # The window has to cover the gap between the newest mapped day and the one
    # being asked for: PGCB issues roughly one id per day, so a fixed +20 silently
    # stops finding reports once the map is three weeks stale — which is how the
    # archive came to stop at 2026-07-27 while ids ran on to 5090. Scale the scan
    # to that distance (plus slack for the ids PGCB skips) instead of guessing.
    newest_mapped = max(ERP_BY_ENERGY) if ERP_BY_ENERGY else None
    day_gap = (energy - date.fromisoformat(newest_mapped)).days if newest_mapped else 0
    span = max(20, day_gap + 20)

    for fid in range(base, base + span):
        path = download_erp_by_id(fid)
        if not path:
            continue
        try:
            _, found_energy = report_energy_dates(path)
        except Exception:
            # A published id that pandas cannot open (5082 is one) must not abort
            # the scan — the wanted report may sit further along.
            continue
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


# Petrobangla's "দৈনিক গ্যাস প্রতিবেদন" listing. The site moved to the gov.bd portal:
# the PDFs are no longer under petrobangla.org.bd/uploads at all, they sit on Oracle
# object storage under opaque UUID names, so the publication date exists only in this
# listing and has to be read from it rather than built into a URL.
PETROBANGLA_DAILY_REPORTS_TYPE = "6922d2b181fc96cef9e99f16"
PETROBANGLA_LISTING = (
    "https://petrobangla.org.bd/pages/reports?filters="
    + urllib.parse.quote('{"reports_type": "%s"}' % PETROBANGLA_DAILY_REPORTS_TYPE)
)
# The portal renders the page in Bengali, digits included.
_BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")


def petrobangla_report_index() -> dict[str, str]:
    """Map ISO report date -> PDF url, parsed from the daily-gas listing.

    Parsed per <tr>, not by scanning outward from a date: the rows sit close enough
    together that a windowed search pairs a date with the *next* row's attachment,
    which silently yields the wrong day's report.
    """
    try:
        doc = fetch(PETROBANGLA_LISTING, timeout=25).decode("utf-8", errors="ignore")
    except Exception:
        return {}
    doc = doc.translate(_BN_DIGITS)
    index: dict[str, str] = {}
    for row in re.findall(r"<tr\b.*?</tr>", doc, re.S):
        pdf = re.search(r"https://objectstorage\S+?\.pdf", row)
        stamp = re.search(r"(\d{2})-(\d{2})-(\d{4})", row)
        if not pdf or not stamp:
            continue
        d, m, y = stamp.groups()
        index.setdefault(f"{y}-{m}-{d}", pdf.group(0))
    return index


def _petrobangla_pdf_urls() -> list[str]:
    return list(petrobangla_report_index().values())


def _local_petrobangla_pdf(energy: date = None) -> Path | None:
    """Fallback: match PDF from operator hot folders for the given energy date."""
    candidates: list[Path] = []
    for folder in (
        Path(r"C:\Users\user\Desktop\New weeks"),
        Path(r"C:\Users\user\Desktop\Daily Gas Reports ALL - Petrobangla"),
        Path(r"C:\Users\hamim\Desktop\PB"),
    ):
        if folder.is_dir():
            candidates.extend(folder.rglob("*.pdf"))
    if not candidates:
        return None
    
    if energy:
        # PGCB's energy day is the report day - 1, but Petrobangla's PDF is usually dated the same as report date
        # Let's try report_date (energy + 1 day) or energy date itself
        report_date = energy + timedelta(days=1)
        
        target_names = [
            f"{report_date.day}-{report_date.month}-{str(report_date.year)[-2:]}.pdf",
            f"{report_date.day}-{report_date.month:02d}-{str(report_date.year)[-2:]}.pdf",
            f"{report_date.day:02d}-{report_date.month:02d}-{str(report_date.year)[-2:]}.pdf",
            f"{energy.day}-{energy.month}-{str(energy.year)[-2:]}.pdf",
        ]
        
        for p in candidates:
            if any(name in p.name for name in target_names):
                return p

    return max(candidates, key=lambda p: p.stat().st_mtime)


def download_petrobangla(energy: date, dest_dir: Path | None = None) -> tuple[Path | None, str | None]:
    dest_dir = dest_dir or SCRATCH_DOWNLOADS
    dest_dir.mkdir(parents=True, exist_ok=True)

    local = _local_petrobangla_pdf(energy)
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

    # The listing labels each report by the END of its 8am-8am gas day, while the
    # archive keys it by the START: the PDF headed "31 Jul - 01 Aug" is listed under
    # 01-08 and stored as 2026-07-31. Ask for energy+1 so the requested day is the
    # one actually downloaded — taking whichever report is newest silently files the
    # wrong day's gas against the grid data.
    index = petrobangla_report_index()
    listing_key = (energy + timedelta(days=1)).isoformat()
    urls = [index[listing_key]] if listing_key in index else []

    for url in urls:
        try:
            data = fetch(url, timeout=30)
        except Exception:
            continue
        if data[:4] != b"%PDF" or len(data) < 5000:
            continue
        dest = dest_dir / f"Petrobangla_{energy.isoformat()}.pdf"
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

    pgcb_path = None
    erp_id = None
    dd, mm, yy = f"{report_date.day:02d}", f"{report_date.month:02d}", str(report_date.year)
    local_path1 = Path(rf"C:\Users\user\Downloads\Daily Report {dd}-{mm}-{yy}.xlsx")
    local_path2 = Path(rf"C:\Users\user\Downloads\Daily Report  {dd}-{mm}-{yy}.xlsx")
    local_path3 = Path(rf"C:\Users\hamim\Desktop\PGCB\Daily Report {dd}-{mm}-{yy}.xlsx")
    local_path4 = Path(rf"C:\Users\hamim\Desktop\PGCB\Daily Report  {dd}-{mm}-{yy}.xlsx")
    
    if local_path1.exists():
        pgcb_path = local_path1
    elif local_path2.exists():
        pgcb_path = local_path2
    elif local_path3.exists():
        pgcb_path = local_path3
    elif local_path4.exists():
        pgcb_path = local_path4

    if not pgcb_path:
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

    pb_pdf, pb_url = download_petrobangla(energy)
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