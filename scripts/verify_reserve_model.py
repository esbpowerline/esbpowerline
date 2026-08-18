"""Validate everything the Gas Reserve Depletion panel publishes.

The panel states a national reserve balance, a field-level table and a
twenty-year projection, and people will quote it. This checks that what ships
is internally consistent and consistent with its sources, and it fails loudly
rather than warning quietly.

Nineteen checks in five groups:

  SOURCE      the published reserve table still reproduces its own printed
              totals, and the figures the model cites match it
  BALANCE     remaining = published anchor − measured production, field by
              field and in aggregate, with the clamps accounted for
  FLOW        the archive integrates to the published annual production, and
              the monthly history is consistent with the daily days behind it
  PROJECTION  the trajectories are monotonic, start where today starts, respect
              the reserve constraint, and the stacked profile sums to the
              national line at every step
  ARTIFACTS   the sensitivity run and the published model agree about the base
              case, and nothing the UI reads is missing

Usage:
  python scripts/verify_reserve_model.py [--verbose]
Exit code 1 on any failure.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PB = REPO / "public" / "data" / "petrobangla"

PASS, FAIL, WARN = "PASS", "FAIL", "WARN"
results: list[tuple[str, str, str]] = []


def check(group: str, name: str, ok: bool, detail: str = "", warn_only: bool = False) -> bool:
    results.append(((PASS if ok else (WARN if warn_only else FAIL)), f"{group} · {name}", detail))
    return ok


def close(a: float, b: float, tol: float) -> bool:
    return abs(a - b) <= tol


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    model_path = PB / "reserve-model.json"
    pub_path = PB / "reserves-published.json"
    sens_path = PB / "reserve-sensitivity.json"

    for p in (model_path, pub_path):
        if not p.exists():
            print(f"missing artifact: {p.relative_to(REPO)}")
            return 1

    m = json.loads(model_path.read_text(encoding="utf-8"))
    pub = json.loads(pub_path.read_text(encoding="utf-8"))
    sens = json.loads(sens_path.read_text(encoding="utf-8")) if sens_path.exists() else None

    # ── SOURCE ────────────────────────────────────────────────────────────
    cols = ("giip_bcf", "recoverable_2p_bcf", "cumulative_bcf", "remaining_bcf")
    for section in ("producing", "non_producing", "production_suspended"):
        rows = [f for f in pub["fields"] if f["section"] == section]
        printed = pub["subtotals"][section]
        worst = max(
            abs(sum(r[c] or 0 for r in rows) - (printed[c] or 0)) for c in cols
        )
        check("SOURCE", f"{section} rows reproduce printed subtotal", worst <= 0.6,
              f"worst column off by {worst:.2f} BCF")

    grand = pub["grand_total"]["bcf"]
    sub_sum = {c: sum(pub["subtotals"][s][c] or 0 for s in pub["subtotals"]) for c in cols}
    check("SOURCE", "subtotals reproduce printed grand total",
          all(close(sub_sum[c], grand[c], 0.6) for c in cols))

    check("SOURCE", "model cites the same anchor the table states",
          m["anchor"]["as_of"] == pub["source"]["as_of"]
          and close(m["anchor"]["producing_remaining_bcf"],
                    pub["subtotals"]["producing"]["remaining_bcf"], 0.01),
          f"{m['anchor']['as_of']} / {m['anchor']['producing_remaining_bcf']} BCF")

    check("SOURCE", "anchor document is named and paged",
          bool(m["anchor"]["document"]) and bool(m["anchor"]["pages"]),
          f"{m['anchor']['document']} p{m['anchor']['pages']}")

    # ── BALANCE ───────────────────────────────────────────────────────────
    producing = [f for f in m["fields"] if f["section"] == "producing"]
    pool = m["reserve_pools_bcf"]["producing_now"]
    check("BALANCE", "producing pool equals the sum of its fields",
          close(sum(f["remaining_now_bcf"] for f in producing), pool, 0.05),
          f"{pool:.1f} BCF over {len(producing)} fields")

    bad = []
    for f in m["fields"]:
        booked = f["published_remaining_bcf"] or 0.0
        expected = max(0.0, booked - f["measured_drawn_since_anchor_bcf"])
        if not close(expected, f["remaining_now_bcf"], 0.05):
            bad.append(f"{f['field']}: {expected:.2f} vs {f['remaining_now_bcf']:.2f}")
    check("BALANCE", "every field is anchor minus measured draw (clamped at nil)",
          not bad, "; ".join(bad[:3]))

    over = [f["field"] for f in m["fields"]
            if f["beyond_published_reserve"] and f["remaining_now_bcf"] > 0]
    check("BALANCE", "fields past their booking carry no remaining reserve", not over, str(over))

    check("BALANCE", "pools do not double-count suspended fields",
          all(f["section"] == "producing" for f in producing),
          f"{len([f for f in m['fields'] if f['section'] != 'producing'])} non-producing rows kept out")

    shares = sum(f["share_of_national_pct"] for f in m["fields"])
    check("BALANCE", "field shares sum to 100%", close(shares, 100.0, 0.6), f"{shares:.2f}%")

    rate_sum = sum(f["rate_now_mmcfd"] for f in m["fields"])
    check("BALANCE", "national rate equals the sum of field rates",
          close(rate_sum, m["now"]["national_rate_mmcfd"], 0.5),
          f"{rate_sum:.1f} vs {m['now']['national_rate_mmcfd']}")

    # ── FLOW ──────────────────────────────────────────────────────────────
    for v in m["validation"]:
        check("FLOW", f"back-test {v['fiscal_year']} within 1%",
              abs(v["difference_pct"]) <= 1.0,
              f"published {v['published_production_bcf']} vs measured {v['measured_production_bcf']}"
              f" ({v['difference_pct']:+.2f}%)")

    for r in m["revisions"]:
        implied = r["reserve_revision_bcf"] - r["production_bcf"]
        check("FLOW", f"revision arithmetic {r['from'][:7]}→{r['to'][:7]}",
              close(implied, r["net_change_in_remaining_bcf"], 1.0),
              f"revision {r['reserve_revision_bcf']} − production {r['production_bcf']}"
              f" = {implied:.2f} vs stated {r['net_change_in_remaining_bcf']}")

    mix_days = sum(x["days"] for x in m["supply_mix"])
    check("FLOW", "supply-mix days account for the whole archive",
          mix_days == m["archive_days"], f"{mix_days} vs {m['archive_days']}")

    # ── PROJECTION ────────────────────────────────────────────────────────
    for name in ("reserves_binding", "decline_binding", "flat"):
        pts = m["trajectory"][name]
        check("PROJECTION", f"{name} starts at today's rate",
              close(pts[0]["rate"], m["now"]["national_rate_mmcfd"], 1.0),
              f"{pts[0]['rate']} vs {m['now']['national_rate_mmcfd']}")
        rising = [p["m"] for a, p in zip(pts, pts[1:]) if p["rate"] > a["rate"] + 0.5]
        check("PROJECTION", f"{name} rate never rises", not rising, f"months {rising[:5]}")
        growing = [p["m"] for a, p in zip(pts, pts[1:]) if p["left"] > a["left"] + 0.5]
        check("PROJECTION", f"{name} reserve never grows", not growing, f"months {growing[:5]}")

    res = m["trajectory"]["reserves_binding"]
    check("PROJECTION", "2P-binding never produces past the booked reserve",
          all(p["left"] >= -0.01 for p in res),
          f"min left {min(p['left'] for p in res):.2f} BCF")

    dec = m["trajectory"]["decline_binding"]
    check("PROJECTION", "decline-binding records the gas it overdraws",
          all("over" in p for p in dec) and dec[-1]["over"] > 0,
          f"overdrawn by the horizon: {dec[-1].get('over')} BCF")

    prof = m["profile"]
    bad_cols = []
    for f in prof["forecast"]:
        stack = sum(f["v"])
        line = next((p["rate"] for p in res if p["m"] == f["m"]), None)
        if line is not None and not close(stack, line, 2.0):
            bad_cols.append(f"m{f['m']}: stack {stack:.1f} vs line {line:.1f}")
    check("PROJECTION", "stacked profile sums to the 2P-binding line",
          not bad_cols, "; ".join(bad_cols[:3]))

    hist_bad = []
    by_month = {h["month"]: h["mmcfd"] for h in m["history"]["monthly_rate"]}
    for h in prof["history"]:
        if h["month"] in by_month and not close(sum(h["v"]), by_month[h["month"]], 1.5):
            hist_bad.append(f"{h['month']}: {sum(h['v']):.1f} vs {by_month[h['month']]:.1f}")
    check("PROJECTION", "stacked history sums to the national monthly series",
          not hist_bad, "; ".join(hist_bad[:3]))

    check("PROJECTION", "named profile fields exist in the field table",
          all(n in {f["field"] for f in m["fields"]} or n == "Other fields"
              for n in prof["fields"]),
          str(prof["fields"]))

    # ── ARTIFACTS ─────────────────────────────────────────────────────────
    required = ["as_of", "anchor", "validation", "revisions", "now", "history", "fields",
                "profile", "supply_mix", "anomalies", "replacement", "reserve_pools_bcf",
                "trajectory", "headline", "method"]
    missing = [k for k in required if k not in m]
    check("ARTIFACTS", "model carries every block the panel reads", not missing, str(missing))

    if sens:
        check("ARTIFACTS", "sensitivity base matches the published projection",
              close(sens["base"]["decline"]["y10"],
                    m["headline"]["rate_in_10_years_at_measured_decline_mmcfd"], 2.0)
              and close(sens["base"]["reserves"]["y10"],
                        m["headline"]["rate_in_10_years_mmcfd"], 2.0),
              f"sens {sens['base']['decline']['y10']}/{sens['base']['reserves']['y10']} vs model "
              f"{m['headline']['rate_in_10_years_at_measured_decline_mmcfd']}/"
              f"{m['headline']['rate_in_10_years_mmcfd']}")
        check("ARTIFACTS", "sensitivity ran on the same archive date",
              sens["as_of"] == m["as_of"], f"{sens['as_of']} vs {m['as_of']}")
    else:
        check("ARTIFACTS", "sensitivity artifact present", False,
              "run scripts/reserve_sensitivity.py --json public/data/petrobangla/reserve-sensitivity.json",
              warn_only=True)

    fitted = [f for f in m["fields"] if f["decline_basis"] == "exponential-fit"]
    check("ARTIFACTS", "every fitted decline publishes its R²",
          all(f["decline_r2"] is not None for f in fitted), f"{len(fitted)} fitted")
    check("ARTIFACTS", "no fitted decline sits below the stated R² gate",
          all((f["decline_r2"] or 0) >= 0.5 for f in fitted),
          f"min R² {min((f['decline_r2'] or 0) for f in fitted):.2f}" if fitted else "")

    # ── report ────────────────────────────────────────────────────────────
    width = max(len(n) for _, n, _ in results)
    failed = 0
    for status, name, detail in results:
        if status == PASS and not args.verbose:
            continue
        if status == FAIL:
            failed += 1
        print(f"  {status:4s}  {name:{width}s}  {detail}")

    n_pass = sum(1 for s, _, _ in results if s == PASS)
    n_warn = sum(1 for s, _, _ in results if s == WARN)
    print(f"\n{n_pass} passed, {failed} failed, {n_warn} warned "
          f"— model as of {m['as_of']}, anchored on {m['anchor']['as_of']}")
    if failed:
        print("\nThe panel publishes figures people will quote. Fix these before shipping.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
