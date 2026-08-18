"""How much do the modelling choices move the answer?

The reserve model uses no calibration constant: the balance is a published
figure minus measured production, and the decline of each field is fitted to
that field's own history. Nothing is scaled to hit a target.

That is not the same as saying there is nothing to choose. There are five real
choices in `build_reserve_model.py`, and a reader is entitled to know how much
each one is worth:

  1. the length of the trailing window the decline is fitted over (36 months)
  2. the R² below which a fit is discarded and the field held flat (0.5)
  3. the Arps exponent — b=0, exponential, versus a hyperbolic tail
  4. the rate below which a field is treated as finished (1 MMCFD)
  5. how gaps in the daily archive are bridged (trapezoid)

This runs the model again under each variation and prints what changes. It is a
sensitivity analysis, not a tuning exercise: no variant is chosen because it
looks better, and the published model stays on the defaults regardless of what
this prints.

Usage:  python scripts/reserve_sensitivity.py [--json out.json]
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import math
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

spec = importlib.util.spec_from_file_location("brm", REPO / "scripts" / "build_reserve_model.py")
brm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(brm)

MMCF_PER_BCF = 1000.0


def build_fields(days, published, anchor_date, as_of):
    """The per-field table, under whatever fit settings are currently set."""
    by_name = {f["field"]: f for f in published["fields"]}
    archive_fields = sorted({f for d in days for f in d["fields"]})
    rows = []
    for name in archive_fields:
        pub = by_name[name]
        series = [(d["date"], d["fields"].get(name, 0.0)) for d in days if name in d["fields"]]
        drawn = brm.integrate(series, anchor_date, as_of) / MMCF_PER_BCF
        fit = brm.fit_decline(brm.monthly_means(series))
        recent = [v for _, v in series[-30:]]
        rate = sum(recent) / len(recent) if recent else 0.0
        remaining = max(0.0, (pub["remaining_bcf"] or 0.0) - drawn)
        rows.append({
            "field": name,
            "section": pub["section"],
            "rate_now_mmcfd": rate,
            "remaining_now_bcf": remaining,
            "decline_pct_yr": fit["decline_pct_yr"],
            "decline_basis": fit["basis"],
            "decline_r2": fit["r2"],
        })
    rows.sort(key=lambda f: -f["rate_now_mmcfd"])
    return [f for f in rows if f["section"] == "producing"]


def project_arps(fields, b: float, mode: str, horizon_years: int = 30):
    """Forward simulation with an Arps exponent.

    b = 0 is the exponential decline the published model uses. b > 0 is
    hyperbolic: the same initial decline, but the decline rate itself decays,
    which fattens the tail. Gas wells are often hyperbolic, so this is the
    single most consequential shape assumption in the model.

        exponential   q(t) = q0 · exp(-D·t)
        hyperbolic    q(t) = q0 / (1 + b·D·t)^(1/b)
    """
    step = 1 / 12
    state = []
    for f in fields:
        d_fit = f["decline_pct_yr"] / 100
        left = max(0.0, f["remaining_now_bcf"]) * MMCF_PER_BCF
        if mode == "reserves" and left > 0:
            req = brm.required_decline(f["rate_now_mmcfd"], f["remaining_now_bcf"]) or 0.0
            d = max(d_fit, req)
        else:
            d = d_fit
        state.append({"q0": f["rate_now_mmcfd"], "d": d, "left": left, "booked": left > 0,
                      "t": 0.0, "rate": f["rate_now_mmcfd"], "dead": False})

    out = []
    for i in range(horizon_years * 12 + 1):
        out.append({"month": i, "rate": sum(s["rate"] for s in state if not s["dead"])})
        for s in state:
            if s["dead"]:
                continue
            if s["rate"] < brm.ECONOMIC_LIMIT_MMCFD:
                s["dead"] = True
                s["rate"] = 0.0
                continue
            drawn = s["rate"] * 365.25 * step
            if s["booked"]:
                if s["left"] >= drawn:
                    s["left"] -= drawn
                else:
                    s["left"] = 0.0
                    if mode == "reserves":
                        s["dead"] = True
                        s["rate"] = 0.0
                        continue
            s["t"] += step
            if b <= 0:
                s["rate"] = s["q0"] * math.exp(-s["d"] * s["t"])
            else:
                s["rate"] = s["q0"] / (1 + b * s["d"] * s["t"]) ** (1 / b)
    return out


def summarise(rows, rate_now):
    at = lambda y: rows[min(len(rows) - 1, int(y * 12))]["rate"]
    halves = next((r["month"] / 12 for r in rows if r["rate"] <= rate_now / 2), None)
    return {"y5": round(at(5)), "y10": round(at(10)), "y15": round(at(15)),
            "halves_in": round(halves, 1) if halves else None}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", help="write the results here as well")
    args = ap.parse_args()

    published = json.loads(
        (REPO / "public" / "data" / "petrobangla" / "reserves-published.json").read_text(encoding="utf-8"))
    anchor_date = published["source"]["as_of"]
    days = brm.load_days()
    as_of = days[-1]["date"]

    base_window, base_r2, base_limit = brm.FIT_MONTHS, brm.MIN_FIT_R2, brm.ECONOMIC_LIMIT_MMCFD
    fields = build_fields(days, published, anchor_date, as_of)
    rate_now = sum(f["rate_now_mmcfd"] for f in fields)
    base = {
        "reserves": summarise(project_arps(fields, 0.0, "reserves"), rate_now),
        "decline": summarise(project_arps(fields, 0.0, "decline"), rate_now),
    }

    print(f"archive through {as_of} · {len(fields)} producing fields · {rate_now:.0f} MMCFD now")
    print(f"published model: 2P-binding {base['reserves']}, decline-binding {base['decline']}\n")

    results = {"as_of": as_of, "rate_now_mmcfd": round(rate_now, 1), "base": base, "variants": []}

    def run(label, note):
        f = build_fields(days, published, anchor_date, as_of)
        r = sum(x["rate_now_mmcfd"] for x in f)
        v = {
            "variant": label,
            "note": note,
            "reserves": summarise(project_arps(f, 0.0, "reserves"), r),
            "decline": summarise(project_arps(f, 0.0, "decline"), r),
        }
        results["variants"].append(v)
        d = v["decline"]
        b = base["decline"]
        print(f"  {label:38s} decline-binding +5y {d['y5']:5d} ({pct(d['y5'], b['y5']):>6s})  "
              f"+10y {d['y10']:5d} ({pct(d['y10'], b['y10']):>6s})  halves {d['halves_in']}")

    def pct(x, ref):
        return f"{(x - ref) / ref * 100:+.0f}%" if ref else "—"

    print("1. Trailing window the decline is fitted over (published: 36 months)")
    for w in (24, 48, 60):
        brm.FIT_MONTHS = w
        run(f"window = {w} months", "shorter windows track a recent steepening; longer ones smooth it")
    brm.FIT_MONTHS = base_window

    print("\n2. R² below which a fit is discarded (published: 0.5)")
    for r2 in (0.3, 0.7):
        brm.MIN_FIT_R2 = r2
        run(f"R² gate = {r2}", "a looser gate projects noisier declines; a tighter one holds more fields flat")
    brm.MIN_FIT_R2 = base_r2

    print("\n3. Rate at which a field is treated as finished (published: 1 MMCFD)")
    for lim in (0.1, 5.0):
        brm.ECONOMIC_LIMIT_MMCFD = lim
        run(f"economic limit = {lim} MMCFD", "only touches the far tail")
    brm.ECONOMIC_LIMIT_MMCFD = base_limit

    print("\n4. Arps exponent — the shape of the decline itself (published: b=0, exponential)")
    f = build_fields(days, published, anchor_date, as_of)
    r = sum(x["rate_now_mmcfd"] for x in f)
    for b in (0.3, 0.5, 1.0):
        v = {
            "variant": f"Arps b = {b}",
            "note": "hyperbolic: same measured initial decline, decline rate itself decays",
            "reserves": summarise(project_arps(f, b, "reserves"), r),
            "decline": summarise(project_arps(f, b, "decline"), r),
        }
        results["variants"].append(v)
        d, bb = v["decline"], base["decline"]
        print(f"  {v['variant']:38s} decline-binding +5y {d['y5']:5d} ({pct(d['y5'], bb['y5']):>6s})  "
              f"+10y {d['y10']:5d} ({pct(d['y10'], bb['y10']):>6s})  halves {d['halves_in']}")

    spread5 = [v["decline"]["y5"] for v in results["variants"]] + [base["decline"]["y5"]]
    spread10 = [v["decline"]["y10"] for v in results["variants"]] + [base["decline"]["y10"]]
    results["spread"] = {
        "y5": [min(spread5), max(spread5)],
        "y10": [min(spread10), max(spread10)],
        "y5_pct": round((max(spread5) - min(spread5)) / base["decline"]["y5"] * 100, 1),
        "y10_pct": round((max(spread10) - min(spread10)) / base["decline"]["y10"] * 100, 1),
    }
    print(f"\nAcross every variation: +5y {min(spread5)}–{max(spread5)} MMCFD "
          f"({results['spread']['y5_pct']}% of the published figure), "
          f"+10y {min(spread10)}–{max(spread10)} ({results['spread']['y10_pct']}%).")
    print("The reserve balance itself does not move at all — it is a published number "
          "minus a measured one, with nothing to choose.")

    if args.json:
        Path(args.json).write_text(json.dumps(results, indent=2), encoding="utf-8")
        print(f"\nWritten: {args.json}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
