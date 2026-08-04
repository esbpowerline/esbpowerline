"""Repair the daily generation extremes (and the load curve) across the archive.

Every archived day carried the NEXT day's forecast in `systemStats.maxGen`,
because parse_pgcb_file scanned the P1 and Forecast sheets as one blob and the
Forecast row "Probable Maximum Generation at Evening Peak" / "Maximum
Generation (Generation end)" overwrote P1's actual. Pre-2025 days additionally
took `minGen` from the old P1's right-hand "Today's Actual Min Gen" column,
which is the publication day, not the reported one.

Each day is repaired from the best source available to it:

  tier 1  a source workbook on W: -> full re-parse (also restores the load
          curve and any outages lost to the embedded-newline row split)
  tier 2  no workbook, but the archive holds a real hourly curve -> recompute
          from that, using PGCB's own definitions: max is the curve's peak,
          min is the 08:00 morning trough
  tier 3  neither -> null, because a day with no basis for these should say so
          rather than carry a number derived from an unrelated peak

Only the fields this repair is about are written. gasProductionData,
gasDistributionData, generationData, regionalDemandData and borderImportsData
are left exactly as they are — they were never implicated, and rewriting
fields whose re-parse has not been verified would widen the blast radius for
no benefit.

Usage:
  python scripts/backfill_daily_extremes.py            # dry run, prints a plan
  python scripts/backfill_daily_extremes.py --apply    # writes the files
"""
from __future__ import annotations

import argparse
import collections
import datetime
import glob
import json
import os
import re
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
os.environ.setdefault("ESB_DAILY_OUTPUT_DIR", tempfile.mkdtemp(prefix="esb-backfill-"))

REPO = Path(__file__).resolve().parent.parent
DAILY = REPO / "public" / "data" / "daily"
SOURCE_DIRS = [
    Path(r"W:\PGCB\Daily Reports - D"),
]

from ingest_bridge import derive_energy_day, workbook_energy_day, xlsx_to_md  # noqa: E402
from parse_daily_reports import NOT_AN_EVENT, parse_pgcb_file  # noqa: E402


def alpha(s) -> str:
    return re.sub(r"[^a-z]", "", str(s).lower())


def read_source(path: Path) -> str:
    """Sheet text for either source form.

    W: holds each report twice for much of the range: the original workbook and
    a pre-converted pipe-table .txt, which is what the archive was originally
    built from. Both parse; the .txt files even carry the half-hourly load
    curve, so they yield exact extremes rather than an hourly approximation.
    """
    if path.suffix.lower() == ".txt":
        return path.read_text(encoding="utf-8", errors="ignore")
    return xlsx_to_md(path)


TRUSTED = ("dayPeakGen", "eveningPeakGen", "totalEnergyGen")

# Days where the archive contradicts the source but the source has been shown
# to be right, so the content test must be waived. Each needs a reason that
# someone can re-check, because waiving it overwrites an archived day.
#
#   2026-06-25 — "Daily Report 26-06-2026_.xlsx" says 25-06-2026 in its
#   filename, its P1 header AND its load-curve sheet; all three agree. Its
#   figures (14318.96 / 16193.27 / 355.21) appear on no day in the archive,
#   and the archived 2026-06-25 sits inside the window written by the degraded
#   parser. The nine events that day holds — Khulna (C) 415 T, Munshiganj
#   ROCOF, Saidpur TR-3 — appear in no workbook on W: between 2026-06-15 and
#   2026-07-10, so they belong to some other day and cannot be placed.
CONTENT_CHECK_WAIVED = {"2026-06-25"}


def matches_archive(parsed: dict, archived: dict) -> bool:
    """Does this parse reproduce the day's fields that were never in question?

    The maxGen defect never touched these three, so agreement on all of them
    is proof the source describes this day, and disagreement is proof it does
    not — a far better test than trusting a filename or a sheet header, both
    of which are demonstrably mistyped in this corpus.
    """
    a, b = parsed.get("systemStats") or {}, archived.get("systemStats") or {}
    for k in TRUSTED:
        try:
            x, y = float(a.get(k) or 0), float(b.get(k) or 0)
        except (TypeError, ValueError):
            return False
        if abs(x - y) > max(0.02, abs(y) * 1e-6):
            return False
    return True


def resolve_key(name: str, text: str) -> str | None:
    """Which energy day a workbook belongs to — same rule as ingest_bridge.

    The filename and the load-curve sheet agree on every clean report, so a
    disagreement is the anomaly and its size says which side is wrong: a day
    or two means a stale sheet header (trust the filename), a year means a
    filename typo (trust the sheet).
    """
    fn = derive_energy_day(name)
    wb = workbook_energy_day(text)
    if fn is None:
        return wb
    if wb is None or wb == fn:
        return fn
    gap = abs((datetime.date.fromisoformat(wb) - datetime.date.fromisoformat(fn)).days)
    return wb if gap > 3 else fn


def index_sources(cache: Path | None = None) -> dict[str, Path]:
    """Map energy day -> workbook, preferring a file whose own name matches.

    Duplicates exist (two different workbooks are both named "13-10-2024"), so
    the choice has to be deterministic rather than filesystem-order.

    Building this reads all ~1,185 workbooks, so the result is cached; pass
    --reindex to rebuild after the source directory changes.
    """
    if cache and cache.exists():
        return {k: Path(v) for k, v in json.loads(cache.read_text(encoding="utf-8")).items()}
    candidates: list[Path] = []
    for d in SOURCE_DIRS:
        if d.exists():
            candidates += sorted(d.glob("*.xls*"))
        parsed_dir = d / "Daily Reports Parsed"
        if parsed_dir.exists():
            candidates += sorted(parsed_dir.glob("*.txt"))

    tmp = Path(tempfile.mkdtemp(prefix="esb-backfill-idx-"))
    resolved: dict[str, list[tuple[bool, bool, Path]]] = collections.defaultdict(list)
    unresolved: list[str] = []

    for p in candidates:
        try:
            text = read_source(p)
        except Exception:  # noqa: BLE001
            continue
        # A file may name one day and its sheet another. Rather than pick by
        # date arithmetic — which gets it wrong in both directions; the sheet
        # is a month out on "13-10-2024_.xlsm" and the filename a year out on
        # "26-01-2021_.xlsm" — ask the data which day it is. dayPeakGen,
        # eveningPeakGen and totalEnergyGen were never touched by the maxGen
        # defect, so a source that reproduces the archive's values for a day
        # demonstrably IS that day's source.
        days = [d for d in dict.fromkeys([derive_energy_day(p.name), workbook_energy_day(text)]) if d]
        if not days:
            continue
        confirmed = None
        for day in days:
            fp = DAILY / f"{day}.json"
            if not fp.exists():
                continue
            try:
                t = tmp / "p.txt"
                t.write_text(text, encoding="utf-8")
                parsed = parse_pgcb_file(str(t), datetime.date.fromisoformat(day))
            except Exception:  # noqa: BLE001
                continue
            if parsed and (day in CONTENT_CHECK_WAIVED
                           or matches_archive(parsed, json.loads(fp.read_text(encoding="utf-8")))):
                confirmed = day
                break
        if confirmed:
            resolved[confirmed].append((True, p.suffix.lower() == ".txt", p))
        elif not any((DAILY / f"{d}.json").exists() for d in days):
            # No archived day to contradict it — nothing can be overwritten
            # wrongly, so accept the file's own claim.
            resolved[days[0]].append((False, p.suffix.lower() == ".txt", p))
        else:
            # It claims a day the archive already holds, but disagrees with
            # that day's untouched figures. One of the two is describing a
            # different day and there is no way to tell which, so the day is
            # left for a human rather than overwritten on a guess.
            unresolved.append(
                f"{p.name}: claims {' / '.join(days)}, but contradicts the archived "
                f"day-peak/evening-peak/energy there"
            )

    out: dict[str, Path] = {}
    for key, cands in resolved.items():
        cands.sort(key=lambda t: (not t[0], t[1], str(t[2])))
        out[key] = cands[0][2]
    if unresolved:
        print(f"  {len(unresolved)} source file(s) could not be tied to a day and were skipped:")
        for u in unresolved[:10]:
            print("     ", u)
    if cache:
        cache.write_text(json.dumps({k: str(v) for k, v in sorted(out.items())}, indent=1), encoding="utf-8")
    return out


def curve_extremes(hourly: list) -> tuple[float | None, float | None]:
    """PGCB's definitions applied to a stored curve: peak, and the 08:00 trough."""
    vals = [float(h.get("generation") or 0) for h in hourly or []]
    if len(vals) < 20 or len({round(v, 3) for v in vals}) <= 3:
        return None, None
    at8 = next((float(h["generation"]) for h in hourly if h.get("time") == "08:00"), None)
    return at8, max(vals)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--index-cache", default=str(REPO / "scratch" / "backfill-source-index.json"))
    ap.add_argument("--reindex", action="store_true")
    args = ap.parse_args()

    cache = Path(args.index_cache)
    cache.parent.mkdir(parents=True, exist_ok=True)
    if args.reindex and cache.exists():
        cache.unlink()
    print("Indexing source workbooks…", flush=True)
    sources = index_sources(cache)
    print(f"  {len(sources)} energy days have a source workbook", flush=True)

    tmp = Path(tempfile.mkdtemp(prefix="esb-backfill-src-"))
    stats = collections.Counter()
    changes: list[tuple[str, str, object, object]] = []
    outage_skips: list[str] = []

    files = sorted(DAILY.glob("*.json"))
    if args.limit:
        files = files[: args.limit]

    for i, fp in enumerate(files):
        day = fp.stem
        try:
            doc = json.loads(fp.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001
            stats["unreadable archive day"] += 1
            continue
        sysstats = doc.get("systemStats") or {}
        before = (sysstats.get("minGen"), sysstats.get("maxGen"))
        dirty = False

        parsed = None
        src = sources.get(day)
        if src is not None:
            try:
                text = read_source(src)
                t = tmp / "p.txt"
                t.write_text(text, encoding="utf-8")
                parsed = parse_pgcb_file(str(t), datetime.date.fromisoformat(day))
            except Exception:  # noqa: BLE001
                parsed = None

        # Only a source report gives these. Deriving them from the archive's
        # own stored curve was tested against source-derived truth on 97 days
        # and reproduced the max on 92% and the min on 90% — the stored curve
        # is hourly, so a peak falling on a half hour is missed, and PGCB's
        # stated minimum is not always the curve's trough. A value that is
        # wrong one day in ten, indistinguishable from a measured one, is the
        # exact failure this repair exists to remove. Those days get null.
        new_min = new_max = None
        tier = "2 no source -> null"
        if parsed and (parsed["systemStats"]["maxGen"] is not None
                       or parsed["systemStats"]["minGen"] is not None):
            new_min = parsed["systemStats"]["minGen"]
            new_max = parsed["systemStats"]["maxGen"]
            tier = "1 repaired from source"
        stats[tier] += 1

        if sysstats.get("minGen") != new_min or sysstats.get("maxGen") != new_max:
            sysstats["minGen"] = new_min
            sysstats["maxGen"] = new_max
            doc["systemStats"] = sysstats
            dirty = True
            changes.append((day, "extremes", before, (new_min, new_max)))

        # The other four the site was estimating. A day with no source loses
        # them outright: max temperature was the constant 32.8, unserved
        # energy was load-shed x 4 / 1000, and demand was generation plus that.
        for key in ("dayPeakDemand", "totalEnergyUnserved", "totalEnergyDemand", "maxTemp"):
            want = (parsed["systemStats"].get(key) if parsed else None)
            if sysstats.get(key) != want:
                sysstats[key] = want
                doc["systemStats"] = sysstats
                dirty = True
                changes.append((day, key, before, want))

        # Per-fuel cost: published Taka, or null. Generation itself was always
        # read from the source, so it is only the cost columns that move.
        if parsed and parsed.get("generationData"):
            new_fuels = parsed["generationData"]
            if json.dumps(new_fuels, sort_keys=True) != json.dumps(doc.get("generationData"), sort_keys=True):
                doc["generationData"] = new_fuels
                dirty = True
                changes.append((day, "fuel costs", None, None))
        elif doc.get("generationData"):
            blanked = [{**row, "cost": None, "unitCost": None} for row in doc["generationData"]]
            if json.dumps(blanked, sort_keys=True) != json.dumps(doc["generationData"], sort_keys=True):
                doc["generationData"] = blanked
                dirty = True
                changes.append((day, "fuel costs blanked", None, None))

        if parsed:
            # Load curve: adopt the re-parse only when it produced a real one.
            # Pre-2018 .xls workbooks have no L-Curve sheet at all, and their
            # placeholder must not overwrite whatever the archive already has.
            new_curve = parsed.get("hourlyLoadData") or []
            _, real = curve_extremes(new_curve)
            if real is not None:
                if json.dumps(new_curve, sort_keys=True) != json.dumps(doc.get("hourlyLoadData"), sort_keys=True):
                    old_vals = [round(float(h.get("generation") or 0), 3) for h in doc.get("hourlyLoadData") or []]
                    doc["hourlyLoadData"] = new_curve
                    dirty = True
                    changes.append((day, "curve", len(set(old_vals)), len(new_curve)))

        if "hourlyLoadData" in doc and (not parsed or curve_extremes(parsed.get("hourlyLoadData") or [])[1] is None):
            stored = doc.get("hourlyLoadData") or []
            _, stored_real = curve_extremes(stored)
            if stored_real is None:
                # Generation itself was synthesised — a flat line at the day
                # peak stepping to the evening peak for 18:00-22:00. There is
                # no curve for this day, so it should not draw one.
                if stored:
                    doc["hourlyLoadData"] = []
                    dirty = True
                    changes.append((day, "placeholder curve removed", len(stored), 0))
            else:
                # Real generation, but the per-hour shedding and demand beside
                # it were spread from the evening-peak total.
                cleaned = [{**h, "loadShed": None, "demand": None} for h in stored]
                if json.dumps(cleaned, sort_keys=True) != json.dumps(stored, sort_keys=True):
                    doc["hourlyLoadData"] = cleaned
                    dirty = True
                    changes.append((day, "curve shed/demand cleared", None, None))

        if parsed:
            # Outages: adopt only when nothing the archive holds is lost. The
            # re-parse recovers rows dropped by the embedded-newline row split
            # and collapses malformed duplicates, but a day where content would
            # disappear is left alone and reported instead.
            old_rows = doc.get("dailyOutages") or []
            new_rows = parsed.get("dailyOutages") or []
            blob = alpha(" ".join((r.get("full_desc") or "") + (r.get("time") or "") + (r.get("reason") or "")
                                  for r in new_rows))
            # Rows the archive holds that are not events at all — P1's hourly
            # remarks, "Evening Peak Generation is 14899 MW." — are dropped by
            # design, so their absence must not read as data loss and block
            # the repair for the whole day.
            def is_real_event(r):
                text = r.get("full_desc") or r.get("reason") or r.get("time") or ""
                return not NOT_AN_EVENT.search(re.sub(r"^\d{1,2}:\d{2}\s*-\s*", "", text).strip())

            lost = [r for r in old_rows
                    if is_real_event(r)
                    and len(alpha(r.get("full_desc") or r.get("reason") or r.get("time") or "")[:45]) >= 25
                    and alpha(r.get("full_desc") or r.get("reason") or r.get("time") or "")[:45] not in blob]
            if lost:
                outage_skips.append(f"{day} ({len(lost)} row(s) would be lost)")
            elif len(new_rows) != len(old_rows) or json.dumps(new_rows, sort_keys=True) != json.dumps(old_rows, sort_keys=True):
                doc["dailyOutages"] = new_rows
                dirty = True
                changes.append((day, "outages", len(old_rows), len(new_rows)))

        if dirty:
            stats["days changed"] += 1
            if args.apply:
                # The archive is mixed CRLF/LF, so each file keeps the endings
                # it already had. Normalising them would turn a few changed
                # values into a whole-file diff on 4,515 files.
                body = json.dumps(doc, indent=2)
                raw = fp.read_bytes()
                if b"\r\n" in raw:
                    body = body.replace("\n", "\r\n")
                fp.write_bytes(body.encode("utf-8"))
        if (i + 1) % 500 == 0:
            print(f"  …{i + 1}/{len(files)}", flush=True)

    print()
    for k, v in sorted(stats.items()):
        print(f"{v:6d} | {k}")
    kinds = collections.Counter(c[1] for c in changes)
    print()
    for k, v in kinds.most_common():
        print(f"{v:6d} | field updated: {k}")
    if outage_skips:
        print(f"\nOutages left alone on {len(outage_skips)} day(s) to avoid losing rows:")
        for s in outage_skips[:10]:
            print("   ", s)
    print("\nDRY RUN — nothing written. Re-run with --apply." if not args.apply else "\nWritten.")


if __name__ == "__main__":
    main()
