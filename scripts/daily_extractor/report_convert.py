"""Turn a PGCB daily report into the pipe-table text the parsers read.

`parse_pgcb_file` does not read files. It reads a flat text rendering of one:
`## Sheet: <name>` markers with one markdown pipe row per spreadsheet row, and
it locates everything by those markers - P1, Forecast, P3, L-Curve, En-Curve,
EWIC, GenLog, Daily Gen, YesterdayGen, P2. The workbook path gets those markers
for free, because a workbook has named sheets.

A Word or PDF copy of the same report does not. It has headings, or a page
header, or nothing at all. So the two readers here do the same three things:

  1. walk the document in order,
  2. turn every table row into `| a | b | c |` - outer pipes included, because
     `parse_pgcb_file` splits on "|" and indexes parts[2..4], which is only
     correct when a leading pipe pushes the columns along by one,
  3. open a new `## Sheet:` block whenever a line names one of the sheets the
     parsers ask for.

Step 3 is the honest weak point and the reason `report_to_md` returns notes
alongside the text. A heading that PGCB styled but did not name, a PDF whose
section titles live in a graphic, a table split across two pages - any of those
put rows in the wrong block or in no block at all, and the parser cannot tell
the difference between "this sheet was empty" and "I never found this sheet".
The notes say which markers were found so the operator can see it in the review
step instead of discovering it on the published day.
"""
from __future__ import annotations

import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from .convert import cell_str

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

# Every sheet name the parsers ask for, plus the spellings the archive actually
# uses. Matched on the reduced key so punctuation and spacing do not matter,
# the same way `parse_daily_reports._sheet_key` does it.
KNOWN_SHEETS: dict[str, str] = {
    "p1": "P1",
    "p2": "P2",
    "p3": "P3",
    "forecast": "Forecast",
    "lcurve": "L-Curve",
    "loadcurve": "L-Curve",
    "encurve": "En-Curve",
    "energycurve": "En-Curve",
    "ewic": "EWIC",
    "genlog": "GenLog",
    "dailygen": "Daily Gen",
    "yesterdaygen": "YesterdayGen",
    # No parser asks for these four, but they are sheets of the same report and
    # they have to be recognised anyway: an unrecognised heading does not close
    # the block above it, so "P4" left unmapped appends the whole of P4 to P3
    # and the P3 parser reads rows that were never in P3.
    "p4": "P4",
    "voltage": "Voltage",
    "cover": "Cover",
    "fgmo": "FGMO",
}

# PGCB's form codes ("QF-LDC-22", "QF_MIS_03") name a sheet each in the older
# workbooks. There are dozens and they are numbered, so they are matched by
# shape rather than listed.
FORM_CODE_RE = re.compile(r"^qf(ldc|mis)\d{1,3}$")


def sheet_key(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(name).lower())


def match_sheet(line: str) -> str | None:
    """The sheet a heading names, or None.

    Deliberately strict: the whole line, once stripped of punctuation, must BE
    a sheet name. A loose `in` test matched "P1" inside "Page 1 of 4" and threw
    every following row into the P1 block.
    """
    key = sheet_key(line)
    if not key or len(key) > 24:
        return None
    if key in KNOWN_SHEETS:
        return KNOWN_SHEETS[key]
    # Echoed back as the operator wrote it. The name only has to be stable
    # enough to close the previous block; nothing looks these up.
    if FORM_CODE_RE.match(key):
        return line.strip()
    return None


class _Builder:
    """Collects `## Sheet:` blocks in document order."""

    def __init__(self) -> None:
        self.parts: list[str] = []
        self.found: list[str] = []
        self.counts: dict[str, int] = {}
        self._open: str | None = None

    def open_sheet(self, name: str) -> None:
        # A repeated heading is a continuation - a table broken across pages
        # reprints its title - so it keeps writing into the block it already
        # opened rather than starting a second one the parser would never see.
        if self._open == name:
            return
        self._open = name
        if name not in self.found:
            self.found.append(name)
            self.counts.setdefault(name, 0)
        self.parts.append(f"## Sheet: {name}")

    def row(self, cells: list[str]) -> None:
        cells = [cell_str(c) for c in cells]
        while cells and cells[-1] == "":
            cells.pop()
        if not any(cells):
            return
        # Rows that arrive before any heading still belong to the report. P1 is
        # the sheet that carries the day's headline figures and is the one a
        # single-table document is overwhelmingly likely to be, so they open it
        # rather than being dropped - and `report_to_md` says so in a note.
        if self._open is None:
            self.open_sheet("P1")
        self.counts[self._open] = self.counts.get(self._open, 0) + 1
        self.parts.append("| " + " | ".join(cells) + " |")

    def text_line(self, line: str) -> None:
        """A non-table line: a heading if it names a sheet, otherwise a row.

        Loose text is kept as a one-cell row rather than discarded. The date
        header the energy day is read from is a bare paragraph in a Word copy,
        and `workbook_energy_day` scans the whole text for it.
        """
        line = line.strip()
        if not line:
            return
        name = match_sheet(line)
        if name:
            self.open_sheet(name)
            return
        self.row([line])

    def build(self) -> str:
        return "\n".join(self.parts)


def _docx_cell_text(tc: ET.Element) -> str:
    """One table cell, with hard breaks folded the way `cell_str` folds them."""
    out: list[str] = []
    for para in tc.iter(f"{W}p"):
        runs = [t.text or "" for t in para.iter(f"{W}t")]
        # <w:br/> inside a run is the Word equivalent of Excel's in-cell line
        # break, and PGCB uses it inside outage descriptions.
        out.append("".join(runs))
    return " <br> ".join(p for p in (s.strip() for s in out) if p)


def docx_to_md(path: Path) -> tuple[str, list[str]]:
    with zipfile.ZipFile(path) as zf:
        try:
            xml = zf.read("word/document.xml")
        except KeyError:
            raise ValueError(
                "This .docx has no word/document.xml - it is not a Word document."
            ) from None

    body = ET.fromstring(xml).find(f"{W}body")
    if body is None:
        raise ValueError("This .docx has no document body.")

    b = _Builder()
    # Top-level children only: iterating every <w:p> in the tree would also
    # yield the paragraphs INSIDE table cells and print each cell twice, once
    # as part of its row and once as a loose line.
    for node in body:
        if node.tag == f"{W}p":
            runs = [t.text or "" for t in node.iter(f"{W}t")]
            b.text_line("".join(runs))
        elif node.tag == f"{W}tbl":
            for tr in node.findall(f"{W}tr"):
                b.row([_docx_cell_text(tc) for tc in tr.findall(f"{W}tc")])

    return b.build(), _notes(b, "Word document")


def pdf_to_md(path: Path) -> tuple[str, list[str]]:
    import pdfplumber

    b = _Builder()
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            tables = page.find_tables()
            # Everything the tables cover is read as rows; the rest of the page
            # is read as loose lines, so a section title sitting above a table
            # still opens its block. Without the subtraction every table cell
            # would also arrive a second time as page text.
            outside = page
            for t in tables:
                try:
                    outside = outside.outside_bbox(t.bbox)
                except Exception:  # noqa: BLE001 - a degenerate bbox is not fatal
                    pass

            # Headings and tables are interleaved by vertical position, not
            # emitted text-first. A page carrying two sections - "L-Curve" and
            # its table, then "En-Curve" and its table - has both headings in
            # its text layer, so reading all the text and then all the tables
            # filed BOTH tables under whichever heading came last. L-Curve came
            # out with a heading and no rows, En-Curve with 114 rows that were
            # not all its own, and the day published with no load curve.
            items: list[tuple[float, int, object]] = []
            for line in outside.extract_text_lines() or []:
                items.append((float(line.get("top", 0.0)), 0, line.get("text", "")))
            for t in tables:
                items.append((float(t.bbox[1]), 1, t))
            # Kind is the tiebreak, so a heading level with its table's top edge
            # still opens the block before the rows arrive.
            items.sort(key=lambda it: (it[0], it[1]))

            for _, kind, payload in items:
                if kind == 0:
                    b.text_line(str(payload))
                    continue
                for row in payload.extract() or []:  # type: ignore[union-attr]
                    # Newlines inside a PDF cell are almost always the text
                    # wrapping to the cell's width, not a break the author
                    # typed. `cell_str` folds newlines to " <br> ", which is
                    # right for Excel — where a break IS deliberate, and the
                    # archive already stores it that way — and wrong here: it
                    # wrote "33 kv bus <br> maintanence" into five outage
                    # reasons that read as one line in the workbook. A PDF has
                    # no way to tell the two apart, and wrapping is by far the
                    # commoner one, so it collapses to a space.
                    b.row(
                        [
                            "" if c is None else re.sub(r"\s*\n\s*", " ", str(c))
                            for c in row
                        ]
                    )

    return b.build(), _notes(b, "PDF")


# The sheets that carry something no other sheet does. A report that reaches the
# parser without one of these does not fail — it publishes a day with a hole in
# it, which is why each is named individually below rather than counted.
LOAD_BEARING = ("P1", "Forecast", "P3", "L-Curve", "En-Curve", "EWIC")


def _notes(b: _Builder, kind: str) -> list[str]:
    notes: list[str] = []
    if not b.found:
        notes.append(
            f"No table or text was read out of this {kind} at all. Check it is the PGCB daily report."
        )
        return notes

    inventory = ", ".join(f"{n} ({b.counts.get(n, 0)} rows)" for n in b.found)
    notes.append(
        f"Read from a {kind}, not the Excel workbook. A {kind} carries no sheet names, so the "
        f"report's sections were inferred from its headings: {inventory}. Check the figures below "
        "against the source before publishing."
    )

    missing = [s for s in LOAD_BEARING if s not in b.found]
    if missing:
        notes.append(
            f"No heading named {', '.join(missing)} was found, so nothing was filed under "
            f"{'it' if len(missing) == 1 else 'them'}."
        )

    # A heading with no rows under it is the failure this reader is most likely
    # to produce and the hardest to notice: the section is present, so nothing
    # downstream complains, and the day publishes with that half of the report
    # blank. Reported separately from the missing headings, because the fix is
    # different — the table is there and did not come out.
    empty = [n for n in LOAD_BEARING if n in b.found and not b.counts.get(n)]
    if empty:
        notes.append(
            f"{', '.join(empty)} {'has' if len(empty) == 1 else 'have'} a heading but no rows under "
            f"{'it' if len(empty) == 1 else 'them'} — the table did not come out of the "
            f"{kind}. Whatever {'that section' if len(empty) == 1 else 'those sections'} carries "
            "(the load curve, the energy curve and the cross-border corridors live there) will be "
            "missing from the day, not wrong. Publish from the workbook instead if you need it."
        )
    return notes


def xlsx_to_md(path: Path) -> tuple[str, list[str]]:
    """Workbook to markdown pipe-table text, with outer pipes on every row.

    `daily_extractor.convert.xlsx_to_text` joins cells with " | " and no leading
    or trailing pipe. `parse_pgcb_file` splits on "|" and indexes parts[2..4],
    which is only correct when a leading pipe pushes everything along by one.
    Without it every column shifts: outage rows come back with the description
    in the time field and empty plant/reason, and any row without trailing blank
    cells fails the `len(parts) >= 5` guard and is dropped entirely - 24 of 26
    outages on 2026-07-31.

    The same off-by-one is documented for the monthly report parser, which is
    why that pipeline converts to markdown first rather than using xlsx_to_text.
    """
    import pandas as pd

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
                parts.append("| " + " | ".join(cells) + " |")
    return "\n".join(parts), []


SUPPORTED = (".xlsx", ".xls", ".xlsm", ".docx", ".pdf")


def report_to_md(path: Path, original_name: str = "") -> tuple[str, list[str]]:
    """Dispatch on the extension of the name the operator actually chose.

    The admin route renames the upload to a temp file, so `path` alone cannot be
    trusted to carry the real extension.
    """
    ext = Path(original_name or path.name).suffix.lower()
    if ext in (".xlsx", ".xls", ".xlsm"):
        return xlsx_to_md(path)
    if ext == ".docx":
        return docx_to_md(path)
    if ext == ".pdf":
        return pdf_to_md(path)
    raise ValueError(
        f"Cannot read '{ext or 'a file with no extension'}'. The daily report must be "
        f"one of: {', '.join(SUPPORTED)}."
    )
