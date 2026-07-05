"""Convert downloaded Excel/PDF to parser-ready text."""
from __future__ import annotations

from pathlib import Path

import pandas as pd


def cell_str(val) -> str:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return ""
    if hasattr(val, "strftime"):
        return val.strftime("%Y-%m-%d")
    return str(val).strip().strip("'")


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