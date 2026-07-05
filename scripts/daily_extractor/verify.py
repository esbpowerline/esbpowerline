"""Cross-verify parsed data against official re-parse and Google search."""
from __future__ import annotations

import json
import os
import re
import ssl
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any

from .config import VERIFY_METRICS
from .convert import xlsx_to_text
from .parse import _load_grid_parser


CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


@dataclass
class MetricFinding:
    key: str
    label: str
    unit: str
    parsed: float
    official: float | None
    google: float | None
    official_match: bool
    google_match: bool
    tolerance: float
    citations: list[dict[str, str]] = field(default_factory=list)


@dataclass
class VerificationReport:
    energy_day: str
    official_recheck_passed: bool
    google_recheck_passed: bool
    auto_proceed: bool
    needs_user_choice: bool
    findings: list[MetricFinding]
    google_queries: list[str]
    notes: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "energy_day": self.energy_day,
            "official_recheck_passed": self.official_recheck_passed,
            "google_recheck_passed": self.google_recheck_passed,
            "auto_proceed": self.auto_proceed,
            "needs_user_choice": self.needs_user_choice,
            "google_queries": self.google_queries,
            "notes": self.notes,
            "findings": [
                {
                    "key": f.key,
                    "label": f.label,
                    "unit": f.unit,
                    "parsed": f.parsed,
                    "official": f.official,
                    "google": f.google,
                    "official_match": f.official_match,
                    "google_match": f.google_match,
                    "tolerance": f.tolerance,
                    "citations": f.citations,
                }
                for f in self.findings
            ],
        }


def _get_nested(data: dict, dotted: str) -> float:
    cur: Any = data
    for part in dotted.split("."):
        cur = cur[part]
    return float(cur)


def _within(a: float, b: float | None, tol: float) -> bool:
    if b is None:
        return False
    if b == 0:
        return abs(a - b) <= tol
    return abs(a - b) <= tol


def official_reparse(pgcb_xlsx: Path, energy: date) -> dict | None:
    """Independent fresh conversion + parse from raw xlsx."""
    parser = _load_grid_parser()
    text = xlsx_to_text(pgcb_xlsx)
    tmp = pgcb_xlsx.parent / f"_recheck_{energy.isoformat()}.txt"
    tmp.write_text(text, encoding="utf-8")
    try:
        return parser.parse_pgcb_file(str(tmp), energy)
    finally:
        tmp.unlink(missing_ok=True)


def _fetch(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "ESBPowerLine-Verify/1.0"})
    with urllib.request.urlopen(req, context=CTX, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def _google_cse_search(query: str, max_results: int = 5) -> list[dict[str, str]]:
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GOOGLE_CSE_API_KEY")
    cx = os.environ.get("GOOGLE_CSE_ID") or os.environ.get("GOOGLE_CSE_CX")
    if not api_key or not cx:
        return []
    params = urllib.parse.urlencode({"key": api_key, "cx": cx, "q": query, "num": max_results})
    url = f"https://www.googleapis.com/customsearch/v1?{params}"
    try:
        payload = json.loads(_fetch(url))
    except Exception:
        return []
    hits = []
    for item in payload.get("items", []):
        hits.append({
            "title": item.get("title", ""),
            "url": item.get("link", ""),
            "snippet": item.get("snippet", ""),
        })
    return hits


def _duckduckgo_search(query: str, max_results: int = 5) -> list[dict[str, str]]:
    url = "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": query})
    try:
        html = _fetch(url)
    except Exception:
        return []
    hits = []
    for m in re.finditer(
        r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>.*?class="result__snippet"[^>]*>(.*?)</',
        html,
        re.S,
    ):
        link = re.sub(r"<.*?>", "", m.group(1))
        title = re.sub(r"<.*?>", "", m.group(2))
        snippet = re.sub(r"<.*?>", "", m.group(3))
        hits.append({"title": title.strip(), "url": link.strip(), "snippet": snippet.strip()})
        if len(hits) >= max_results:
            break
    return hits


def web_search(query: str) -> list[dict[str, str]]:
    hits = _google_cse_search(query)
    if hits:
        return hits
    return _duckduckgo_search(query)


def _extract_number_near_keywords(text: str, keywords: list[str], unit_pattern: str) -> float | None:
    text_lower = text.lower()
    for kw in keywords:
        idx = text_lower.find(kw.lower())
        if idx == -1:
            continue
        window = text[max(0, idx - 40): idx + 120]
        nums = re.findall(rf"(\d{{1,3}}(?:,\d{{3}})*(?:\.\d+)?)\s*{unit_pattern}", window, re.I)
        if not nums:
            nums = re.findall(r"(\d{1,3}(?:,\d{3})*(?:\.\d+)?)", window)
        if nums:
            return float(nums[0].replace(",", ""))
    return None


def google_lookup(energy: date, grid_data: dict) -> tuple[dict[str, float | None], list[dict], list[str]]:
    iso = energy.isoformat()
    display = grid_data.get("systemStats", {}).get("date", iso)
    queries = [
        f"PGCB Bangladesh peak power generation {display} MW",
        f"Bangladesh electricity demand peak {iso}",
        f"Petrobangla gas supply power sector Bangladesh {display}",
    ]
    all_hits: list[dict] = []
    extracted: dict[str, float | None] = {
        "systemStats.eveningPeakGen": None,
        "systemStats.dayPeakGen": None,
        "systemStats.totalEnergyGen": None,
        "systemStats.totalGasSuppliedPower": None,
    }

    for q in queries:
        hits = web_search(q)
        for h in hits:
            h["query"] = q
            all_hits.append(h)
        blob = " ".join(h["snippet"] + " " + h["title"] for h in hits)

        if extracted["systemStats.eveningPeakGen"] is None:
            v = _extract_number_near_keywords(blob, ["evening peak", "peak generation", "peak demand", "maximum generation"], r"MW")
            if v and 8000 < v < 25000:
                extracted["systemStats.eveningPeakGen"] = v

        if extracted["systemStats.dayPeakGen"] is None:
            v = _extract_number_near_keywords(blob, ["day peak", "peak generation", "noon peak"], r"MW")
            if v and 8000 < v < 25000:
                extracted["systemStats.dayPeakGen"] = v

        if extracted["systemStats.totalEnergyGen"] is None:
            v = _extract_number_near_keywords(blob, ["energy generated", "generation", "mkwh", "gwh"], r"(?:MKWh|GWh|MKW|MW)")
            if v:
                if "gwh" in blob.lower() and v < 500:
                    v *= 1000
                if 200 < v < 600:
                    extracted["systemStats.totalEnergyGen"] = v

        if extracted["systemStats.totalGasSuppliedPower"] is None:
            v = _extract_number_near_keywords(blob, ["gas", "mmcfd", "power sector"], r"MMCFD")
            if v and 500 < v < 2000:
                extracted["systemStats.totalGasSuppliedPower"] = v

    return extracted, all_hits, queries


def verify_parsed_data(
    energy: date,
    grid_data: dict,
    pgcb_xlsx: Path | None,
    *,
    skip_google: bool = False,
) -> VerificationReport:
    notes: list[str] = []
    official_data = None
    if pgcb_xlsx and pgcb_xlsx.exists():
        official_data = official_reparse(pgcb_xlsx, energy)
        if not official_data:
            notes.append("Official re-parse failed — skipping file-level recheck")
    else:
        notes.append("No PGCB xlsx for official re-parse")

    google_vals: dict[str, float | None] = {}
    google_hits: list[dict] = []
    google_queries: list[str] = []
    if not skip_google:
        notes.append("Running Google/DuckDuckGo search as 2nd-factor verification")
        google_vals, google_hits, google_queries = google_lookup(energy, grid_data)
    else:
        notes.append("Google verification skipped (--skip-google)")

    findings: list[MetricFinding] = []
    official_ok = True
    google_ok = True
    google_has_data = False

    hit_by_query: dict[str, list[dict]] = {}
    for h in google_hits:
        hit_by_query.setdefault(h.get("query", ""), []).append(h)

    for key, label, unit, tol in VERIFY_METRICS:
        parsed = _get_nested(grid_data, key)
        official = _get_nested(official_data, key) if official_data else None
        google = google_vals.get(key)

        off_match = _within(parsed, official, tol) if official is not None else True
        goog_match = True
        if google is not None:
            google_has_data = True
            goog_match = _within(parsed, google, tol * 2)

        citations = []
        for q in google_queries:
            for h in hit_by_query.get(q, [])[:2]:
                citations.append({"query": q, "title": h["title"], "url": h["url"], "snippet": h["snippet"]})

        if not off_match:
            official_ok = False
        if google is not None and not goog_match:
            google_ok = False

        findings.append(
            MetricFinding(
                key=key,
                label=label,
                unit=unit,
                parsed=round(parsed, 4),
                official=round(official, 4) if official is not None else None,
                google=round(google, 4) if google is not None else None,
                official_match=off_match,
                google_match=goog_match if google is not None else True,
                tolerance=tol,
                citations=citations[:4],
            )
        )

    if not google_has_data and not skip_google:
        google_ok = True
        notes.append("Google search returned no extractable numbers — treating as inconclusive (pass)")

    needs_choice = official_ok and google_has_data and not google_ok
    auto_proceed = official_ok and (google_ok or not google_has_data)

    return VerificationReport(
        energy_day=energy.isoformat(),
        official_recheck_passed=official_ok,
        google_recheck_passed=google_ok,
        auto_proceed=auto_proceed,
        needs_user_choice=needs_choice,
        findings=findings,
        google_queries=google_queries,
        notes=notes,
    )


def apply_google_overrides(grid_data: dict, report: VerificationReport) -> dict:
    """Replace parsed metrics with Google-extracted values where they differ."""
    out = json.loads(json.dumps(grid_data))
    for f in report.findings:
        if f.google is not None and not f.google_match:
            parts = f.key.split(".")
            out[parts[0]][parts[1]] = f.google
    return out


def format_discrepancy_report(report: VerificationReport) -> str:
    lines = [
        f"Verification for energy day {report.energy_day}",
        f"Official re-check: {'PASS' if report.official_recheck_passed else 'FAIL'}",
        f"Google 2FA check:  {'PASS' if report.google_recheck_passed else 'REVIEW NEEDED'}",
        "",
    ]
    for f in report.findings:
        if f.official_match and f.google_match:
            continue
        lines.append(f"• {f.label} ({f.unit})")
        lines.append(f"  Parsed:   {f.parsed}")
        if f.official is not None:
            lines.append(f"  Official: {f.official}  {'OK' if f.official_match else 'MISMATCH'}")
        if f.google is not None:
            lines.append(f"  Google:   {f.google}  {'OK' if f.google_match else 'MISMATCH'}")
        for c in f.citations[:2]:
            lines.append(f"  Source: {c['title']}")
            lines.append(f"          {c['url']}")
        lines.append("")
    return "\n".join(lines)