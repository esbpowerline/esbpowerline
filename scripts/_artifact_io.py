"""Shared artifact writer for the ingest chain.

Every builder in the scheduled poll rewrites its output whether or not the
content moved. That was harmless while the poll ran four times a day, and it
stops being harmless as the schedule tightens: the Pi runs from an SD card
that also hosts Jellyfin, and the card is the one component in that box with a
finite write budget.

The guard below was written three times — `build_aggregates.py`,
`build_petrobangla_timeline.py`, and then nearly a fourth time for the reserve
model — before being pulled out here. It compares content while ignoring the
generation stamp, so `generated_at` keeps meaning "when the figures last
changed" rather than "when the poll last ran". That distinction matters beyond
disk wear: a stamp that moves on every poll makes the archive look edited on
days when no publisher filed anything, which is exactly the kind of unearned
claim the data doctrine exists to prevent.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def write_if_changed(path: Path, doc: Any, stamp: str = "generated_at", indent: int = 2) -> bool:
    """Write `doc` to `path` unless the file already holds it, bar the stamp.

    Returns True if the file was written. Non-dict payloads (a bare list, say)
    are compared whole, since there is no stamp key to exclude.

    An unreadable or malformed existing file is treated as absent and
    overwritten — a torn write from a power cut must not be preserved just
    because it fails to parse.
    """
    if path.exists():
        try:
            current = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            current = None
        if current is not None and _same_but_for_stamp(current, doc, stamp):
            return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, indent=indent), encoding="utf-8")
    return True


def _same_but_for_stamp(current: Any, doc: Any, stamp: str) -> bool:
    if isinstance(current, dict) and isinstance(doc, dict):
        return {k: v for k, v in current.items() if k != stamp} == {
            k: v for k, v in doc.items() if k != stamp
        }
    return current == doc
