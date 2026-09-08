"""Ask each publisher, cheaply, whether it has posted something we do not hold.

The four scheduled polls are a timetable, and a timetable is the wrong shape for
this problem. PGCB filed energy day 2026-09-03 between the 09:30 and the 12:30
poll, so the site carried a stale newest day for three hours for no reason other
than the clock; overnight the same gap is twelve hours. Nothing was blocking —
the chain has never waited for Petrobangla, and on 2026-09-04 the site served
grid data for the 3rd while the newest gas window it held was the 1st — it was
simply not looking.

This looks, and it looks per source. Each publisher is asked about its own
newest document against what this archive holds for that publisher, so PGCB
posting does not wait on Petrobangla, and Petrobangla filing a window four days
late is still picked up — the trailing three-day window in
`ingest_recent_days.py` cannot see that, because by the time the gas is filed
the window has moved past the day it belongs to.

Cost, which is what makes a 15-minute tick defensible:

  * Petrobangla — one fetch of the daily-gas listing, which names every report
    it has published. Always paid.
  * PGCB — nothing at all while the newest energy day is already held. Only
    once a day is missing does this reach out, and then it asks in order of
    cost: the held workbook store, pgcb.gov.bd's own predictable URL, then a
    handful of ERP ids around the estimate. Not `probe_erp_for_energy`, which
    widens its slack with distance and will pull dozens of workbooks — right
    for a backfill, indefensible every quarter hour.

Whatever it downloads while asking is filed into the workbook store, so the
chain that runs next reads it from disk instead of fetching it again.

A day is emitted only once the publisher is confirmed to have it, so a run is
never spent on a day that does not exist yet. If a day is confirmed available
and the chain still fails to produce it, the attempt counter backs that day off
after MAX_ATTEMPTS and leaves it to the scheduled polls — otherwise a day the
parser refuses (the zero-gas triage backlog is full of them) would be retried
sixty times a day, forever.

    python scripts/watch_sources.py            # one energy day per line
    python scripts/watch_sources.py --json
    python scripts/watch_sources.py --dry-run  # ask, but count no attempts
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):  # the notes carry em-dashes; cp1252 mangles them
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
PUBLIC = ROOT / "public" / "data"
sys.path.insert(0, str(SCRIPTS))

DHAKA = timezone(timedelta(hours=6))  # BST, UTC+06:00, no DST — observation-window.ts

# How far back each source is chased. PGCB files energy day D on the morning of
# D+1 and is rarely more than a day late, so four days is generous. Petrobangla
# is routinely two days behind and has been more; fourteen covers a late filing
# without turning a tick into a crawl of the whole archive.
LOOKBACK_GRID = 4
LOOKBACK_GAS = 14

# Firing the chain for a day the publisher demonstrably has, and still not
# getting the artifact, means something other than availability is wrong. Stop
# after this many and let the scheduled poll carry it.
MAX_ATTEMPTS = 4

STATE = Path(os.environ.get("ESB_WATCH_STATE", str(ROOT / "scratch" / "watch-state.json")))


def held(subdir: str) -> set[str]:
    """The energy days this archive holds for one feed."""
    d = PUBLIC / subdir
    if not d.is_dir():
        return set()
    return {p.stem for p in d.glob("????-??-??.json")}


def held_gas_documents() -> set[str]:
    """The Petrobangla PDFs the gas archive already cites, by listing key.

    Asked because a listing slot is not an energy day. `gas_slot_candidates()`
    offers a slot's two plausible days, because Petrobangla does not file every
    slot: it skipped 06.09.26, so the report under 07.09.26 is the 05->06 Sep
    window and belongs to energy day 2026-09-05. Keyed on days alone the
    watcher asks forever for a 2026-09-06 that the listing cannot produce,
    spending MAX_ATTEMPTS chain runs on it before backing off.

    Each gas day records the document it was parsed from, and Petrobangla's own
    filename carries the slot ("...Report (07.09.26).pdf"). So the honest
    question is not "do we hold day K-1" but "have we already taken the document
    served under slot K", and that is answerable from files the caller is
    reading anyway — no fetch, which is the property that lets this run every
    fifteen minutes.
    """
    d = PUBLIC / "petrobangla" / "daily"
    if not d.is_dir():
        return set()
    seen: set[str] = set()
    for p in d.glob("????-??-??.json"):
        try:
            meta = json.loads(p.read_text(encoding="utf-8")).get("meta", {})
        except Exception:  # noqa: BLE001 — an unreadable day simply says nothing here
            continue
        name = str(meta.get("source_filename") or "")
        m = re.search(r"\((\d{2})\.(\d{2})\.(\d{2})\)", name)
        if m:
            dd, mm, yy = m.groups()
            seen.add(f"20{yy}-{mm}-{dd}")
    return seen


def load_state() -> dict:
    try:
        return json.loads(STATE.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001 — a missing or corrupt state file is a fresh start
        return {}


def save_state(state: dict, horizon: date) -> None:
    # Only days still inside either lookback can ever be emitted again, so
    # anything older is dead weight that would otherwise grow without bound.
    cutoff = (horizon - timedelta(days=LOOKBACK_GAS + 7)).isoformat()
    state["attempts"] = {
        k: v for k, v in state.get("attempts", {}).items() if k.split(":", 1)[0] >= cutoff
    }
    state["checked_at"] = datetime.now(DHAKA).isoformat(timespec="seconds")
    try:
        STATE.parent.mkdir(parents=True, exist_ok=True)
        STATE.write_text(json.dumps(state, indent=2), encoding="utf-8")
    except Exception as e:  # noqa: BLE001 — losing the counter is not worth failing a tick
        print(f"! could not write {STATE}: {e}", file=sys.stderr)


def pgcb_has(day: date) -> str | None:
    """Cheapest-first: does PGCB have this energy day, and where did we find it?

    Anything fetched here is filed into the workbook store, so confirming
    availability doubles as fetching the input the chain is about to need.
    """
    from daily_extractor.config import energy_to_report_date
    from daily_extractor.download import (
        archive_workbook,
        find_archived_workbook,
        report_energy_dates,
        try_pgcb_legacy,
    )

    report_date = energy_to_report_date(day)

    book = find_archived_workbook(report_date)
    if book is not None:
        return f"workbook already held ({book.name})"

    legacy = try_pgcb_legacy(report_date)
    if legacy is not None:
        try:
            if report_energy_dates(legacy)[1] == day:
                archive_workbook(legacy, report_date)
                return "posted on pgcb.gov.bd"
        except Exception:  # noqa: BLE001 — an unreadable file is not a published day
            pass

    return _erp_has(day, report_date)


def _erp_has(day: date, report_date: date, span: int = 2) -> str | None:
    """A bounded look at the ERP mirror — the estimate and its neighbours only.

    The full walk belongs to a backfill. Here the day is either where the id
    map says it should be or it is not yet posted, and searching further would
    cost more than waiting fifteen minutes for the next tick.
    """
    from daily_extractor.config import ERP_BY_ENERGY
    from daily_extractor.download import archive_workbook, download_erp_by_id, report_energy_dates

    if not ERP_BY_ENERGY:
        return None
    iso = day.isoformat()
    if iso in ERP_BY_ENERGY:
        estimate = ERP_BY_ENERGY[iso]
    else:
        nearest = min(ERP_BY_ENERGY, key=lambda k: abs((day - date.fromisoformat(k)).days))
        estimate = ERP_BY_ENERGY[nearest] + (day - date.fromisoformat(nearest)).days

    order = [estimate]
    for step in range(1, span + 1):
        order.extend((estimate + step, estimate - step))

    for fid in order:
        if fid < 1:
            continue
        path = download_erp_by_id(fid)
        if path is None:
            continue
        try:
            if report_energy_dates(path)[1] == day:
                archive_workbook(path, report_date)
                return f"posted on the ERP (id {fid})"
        except Exception:  # noqa: BLE001 — 5082 is published and unopenable; keep looking
            continue
    return None


def gas_slot_candidates() -> list[tuple[str, str]]:
    """(energy day, listing key) pairs a slot could be holding, newest slot last.

    The listing labels a report by the END of its 08:00→08:00 window and the
    archive keys it by the START, so the obvious rule is "energy day = listed
    date minus one" — and that rule is right only while Petrobangla files every
    slot. It does not. It skipped 06.09.26, and on 2026-09-08 it was serving
    slot 07.09.26 holding the 04→05 window and slot 08.09.26 holding 05→06:
    every slot one day further behind than its label implies.

    Under minus-one the watcher then asked, every fifteen minutes, for energy
    day 2026-09-07 — which no document in the listing states — burnt its four
    attempts on it and backed off, while the gas for the 6th sat in that same
    listing and was never once requested. Two slots therefore, K-1 and K-2, and
    the day nobody holds is the one worth handing to the chain.

    This deliberately does NOT fetch the PDFs to find out which is true. The
    watcher's whole economy is one listing fetch per tick, and it does not need
    to know: `download_petrobangla` reads each candidate document's own header
    and accepts it only if it states the day asked for. A slot is a hint about
    where to look; the document is the only thing that says what it holds.
    """
    from daily_extractor.download import petrobangla_report_index

    out: list[tuple[str, str]] = []
    for key in sorted(petrobangla_report_index()):
        try:
            listed = date.fromisoformat(key)
        except ValueError:
            continue
        for back in (1, 2):
            out.append(((listed - timedelta(days=back)).isoformat(), key))
    return out


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--json", action="store_true", help="emit the full finding, not just the days")
    ap.add_argument("--dry-run", action="store_true", help="ask the publishers but count no attempts")
    ap.add_argument("--today", help="override today in Dhaka (testing)")
    args = ap.parse_args()

    today = date.fromisoformat(args.today) if args.today else datetime.now(DHAKA).date()
    newest_possible = today - timedelta(days=1)  # PGCB files energy day D on D+1

    held_grid, held_gas = held("daily"), held("petrobangla/daily")
    state = load_state()
    attempts: dict[str, dict] = state.setdefault("attempts", {})
    findings: list[dict] = []
    notes: list[str] = []

    def consider(day: str, source: str, why: str) -> None:
        rec = attempts.get(f"{day}:{source}", {})
        if rec.get("n", 0) >= MAX_ATTEMPTS:
            notes.append(
                f"{day} {source}: {why}, but {rec['n']} attempts have not produced it "
                "— left to the scheduled poll"
            )
            return
        findings.append({"day": day, "source": source, "why": why, "attempts": rec.get("n", 0)})

    # PGCB. Nothing leaves this machine while the newest day is already held.
    #
    # `queued_grid` is what the gas pass below actually needs to know, and the
    # distinction it draws is the whole bug it replaces. A day can be missing
    # from the grid archive for two very different reasons: PGCB has filed it
    # and we have not fetched it yet (queued here), or PGCB has not filed it at
    # all (noted here and queued by nobody).
    queued_grid: set[str] = set()
    for i in range(LOOKBACK_GRID, 0, -1):
        day = newest_possible - timedelta(days=i - 1)
        if day.isoformat() in held_grid:
            continue
        where = pgcb_has(day)
        if where:
            consider(day.isoformat(), "pgcb", where)
            queued_grid.add(day.isoformat())
        else:
            notes.append(f"{day}: PGCB has not posted it yet")

    # Petrobangla, asked independently: a window filed late still belongs to the
    # day it opened on, however far back that day now is.
    published_gas = gas_slot_candidates()
    if not published_gas:
        notes.append("Petrobangla listing unreadable — gas unchecked this tick")
    # Slots whose document the archive already cites, whatever day it landed on.
    taken = held_gas_documents()
    seen_days: set[str] = set()
    for day, key in published_gas:
        if key in taken:
            continue
        # A day reachable from two slots is asked for once, under the earlier
        # slot — the one whose document is more likely to state it.
        if day in seen_days:
            continue
        seen_days.add(day)
        d = date.fromisoformat(day)
        if not (newest_possible - timedelta(days=LOOKBACK_GAS - 1) <= d <= newest_possible):
            continue
        if day in held_gas:
            continue
        # A day the PGCB pass just queued is already going to the chain, and one
        # run of it does both halves — do not ask for it twice.
        if day in queued_grid:
            continue
        # Otherwise the day is one Petrobangla has filed and PGCB has not, and
        # until 2026-09-07 it was dropped here in silence.
        #
        # The guard used to read `if day not in held_grid: continue`, on the
        # stated assumption that such a day was "already queued above". It is
        # not: the PGCB pass only queues a day `pgcb_has()` confirms, and when
        # PGCB is late it appends a note and queues nothing. So a day where
        # Petrobangla is early and PGCB is late fell through BOTH passes,
        # emitting neither a finding nor a note — the watcher's log said only
        # that PGCB had not posted, and never mentioned the gas sitting there.
        #
        # Found on 2026-09-07: Petrobangla was serving the window filed
        # 07.09.26 (energy day 2026-09-06) while PGCB had not filed the 6th.
        # The archive's newest gas was the 4th and nothing on the Pi was going
        # to fetch the 6th, at any cadence, until PGCB caught up.
        #
        # It is worse than one late day. LOOKBACK_GAS is 14 and LOOKBACK_GRID
        # is 4, so gas for any day PGCB is more than four days late on could
        # never be queued at all, and the log would never say so.
        consider(day, "petrobangla", f"window filed as {key}")

    days = sorted({f["day"] for f in findings})
    if not args.dry_run:
        now = datetime.now(DHAKA).isoformat(timespec="seconds")
        for f in findings:
            rec = attempts.setdefault(f"{f['day']}:{f['source']}", {"n": 0})
            rec["n"] = rec.get("n", 0) + 1
            rec["last"] = now
        save_state(state, newest_possible)

    if args.json:
        print(json.dumps({"days": days, "findings": findings, "notes": notes}, indent=2))
    else:
        # The days go to stdout and nothing else does, so the caller can read
        # the work list straight off the pipe.
        for note in notes:
            print(f"  . {note}", file=sys.stderr)
        for f in findings:
            print(f"  > {f['day']} {f['source']}: {f['why']}", file=sys.stderr)
        print("\n".join(days))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
