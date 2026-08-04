"""Convert downloaded Excel/PDF to parser-ready text."""
from __future__ import annotations

import re
from pathlib import Path

import pandas as pd


def cell_str(val) -> str:
    if val is None:
        return ""
    # Covers NaN and NaT alike. NaT has strftime but raises on it, so the
    # missing-value check has to run before the date branch below.
    try:
        if pd.isna(val):
            return ""
    except (TypeError, ValueError):
        pass
    if hasattr(val, "strftime"):
        # Clock times reach us as datetime.time, or as a Timestamp pinned to
        # Excel's 1900-01-01 serial epoch. Rendering those as a date turned
        # every row of the older L-Curve sheets into "1900-01-01", which cost
        # the whole load curve: the hourly parser keys on an HH:MM first
        # column and matched nothing.
        if not hasattr(val, "year"):
            return val.strftime("%H:%M")
        if (val.year, val.month, val.day) == (1900, 1, 1):
            return val.strftime("%H:%M")
        return val.strftime("%Y-%m-%d")
    # A cell may hold a hard line break — PGCB uses them inside outage
    # descriptions ("...86.1 Trip Relay OPTD\n86.2 Trip Relay"). Emitted raw
    # into a pipe table it splits one row across two lines and the row stops
    # parsing, silently losing the event: two of the 24 outages on 2024-10-01.
    # "<br>" is the separator the existing archive already uses for these.
    return re.sub(r"\s*[\r\n]+\s*", " <br> ", str(val).strip()).strip("'")


def xlsx_to_text(path: Path) -> str:
    xl = pd.ExcelFile(path)
    parts: list[str] = []
    for sheet in xl.sheet_names:
        df = xl.parse(sheet, header=None)
        parts.append(f"## Sheet: {sheet}")
        for _, row in df.iterrows():
            cells = [cell_str(v) for v in row.tolist()]
            while cells and cells[-1] == "":
                cells.pop()
            if any(cells):
                parts.append(" | ".join(cells))
    return "\n".join(parts)


def pdf_to_text(path: Path) -> str:
    import pypdf

    return "\n".join((page.extract_text() or "") for page in pypdf.PdfReader(str(path)).pages)