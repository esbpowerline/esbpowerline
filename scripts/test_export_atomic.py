"""The published-archive writer must never leave an empty or torn file.

Regression for the 2026-09-15 incident: a zero-byte
`public/data/petrobangla/daily/2026-09-15.json` reached git (33bd6124f) and
every reserve-model build since died on it, which silently froze the gas
reserve model and marked two otherwise-good days as failed.

Run: python scripts/test_export_atomic.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.daily_extractor.export import write_json_atomic  # noqa: E402

FAILURES: list[str] = []


def check(name: str, cond: bool, detail: str = "") -> None:
    print(f"  {'ok  ' if cond else 'FAIL'} {name}{'' if cond else ' — ' + detail}")
    if not cond:
        FAILURES.append(name)


def main() -> int:
    import tempfile

    with tempfile.TemporaryDirectory() as td:
        d = Path(td)

        # A real document round-trips, with the archive's serialisation.
        target = d / "day.json"
        payload = {"$schema": "petrobangla-daily/v1", "production": {"fields": [{"field": "Bibiyana", "gas_mmcfd": 1.5}]}}
        write_json_atomic(target, payload)
        raw = target.read_text(encoding="utf-8")
        check("writes a real document", json.loads(raw) == payload)
        check("two-space indent", '\n  "$schema"' in raw, repr(raw[:40]))
        check("no CRLF", "\r\n" not in raw)
        check("no trailing newline", not raw.endswith("\n"))

        # The incident itself: nothing may publish an empty document.
        for name, empty in (("empty dict", {}), ("empty list", []), ("null", None)):
            try:
                write_json_atomic(d / f"empty-{name}.json", empty)
                check(f"refuses {name}", False, "it wrote the file")
            except ValueError:
                check(f"refuses {name}", True)

        # A failed serialisation must leave the previous good file untouched,
        # not a truncated one.
        good = d / "keeps.json"
        write_json_atomic(good, {"a": 1})
        before = good.read_text(encoding="utf-8")
        try:
            write_json_atomic(good, {"bad": {1, 2, 3}})  # a set is not JSON
        except TypeError:
            pass
        check("keeps the old file when serialisation fails", good.read_text(encoding="utf-8") == before)

        # No temp files left behind in the published directory.
        leftovers = [p.name for p in d.iterdir() if p.name.endswith(".tmp")]
        check("leaves no .tmp files", not leftovers, str(leftovers))

    print()
    if FAILURES:
        print(f"{len(FAILURES)} failed: {', '.join(FAILURES)}")
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
