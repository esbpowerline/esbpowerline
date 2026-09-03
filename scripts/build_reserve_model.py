"""Build the gas-reserve depletion model from published reserves + measured production.

WHAT THIS REPLACES
------------------
The chart used to run on three hardcoded editorial scenarios (exhaustion in
2033 / 2038 / 2040) drawn as straight lines from a single national figure, with
the daily archive scaled by one fudge factor `k` so its integral would land on
that figure. Straight-line depletion of a national aggregate is not how a gas
province empties: fields decline, they decline at different rates, and each one
stops when its own reserve is gone.

WHAT IT DOES INSTEAD
--------------------
Two inputs, both published, joined field by field:

  1. Petrobangla's own field-wise reserve statement — GIIP, 2P recoverable,
     cumulative production and remaining reserve for all 29 discovered fields,
     stated for 1 July 2025 (`reserves-published.json`, extracted and
     totals-checked by extract_gas_reserves.py).

  2. Every field's daily production, from Petrobangla's daily reports, as held
     in this archive — ~2,280 days from 2020.

The join is what makes the projection defensible: the reserve statement says
how much is left in each field, and the daily archive says how fast each field
is emptying, measured rather than assumed.

THE BACK-TEST THAT REMOVED THE FUDGE FACTOR
-------------------------------------------
Petrobangla's reserve statements for consecutive years give the cumulative
production it books against reserves. Integrating our daily archive over the
same fiscal years reproduces those bookings to within a third of a percent
(see `validation` in the output). Two independent routes — an annual reserve
audit and a day-by-day integration of daily reports — agreeing that closely is
what licenses integrating the archive forward from the anchor with no
calibration constant at all.

THE PROJECTION
--------------
Per field, an exponential (Arps b=0) decline fitted by least squares to the log
of monthly production over a trailing window, then integrated forward in
monthly steps until that field's own remaining reserve is exhausted. National
production is the sum of the surviving fields. Reported with the fit's R² and
the window it was fitted over, per field, so a reader can see which projections
rest on a clean decline and which do not.

Fields whose production is flat or rising are held flat rather than
extrapolated upward: a field being brought on stream tells you nothing about
its decline, and projecting growth from a ramp is how forecasts embarrass
themselves.

Two things are deliberately NOT modelled, because nothing published supports
putting a number on them: undiscovered resource, and reserve revisions. The
second is not a rounding error — between July 2023 and July 2024 Petrobangla
revised 2P up by ~944 BCF, more than that year's production, so remaining
reserves ROSE while the country burned gas. The output carries that history so
the chart can say it rather than imply a certainty the data does not have.

Output: public/data/petrobangla/reserve-model.json

Usage:
  python scripts/build_reserve_model.py [--apply]
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Explicit, because `reserve_sensitivity.py` loads this module by file path
# through importlib, where the script directory is not guaranteed on sys.path.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _artifact_io import write_if_changed  # noqa: E402

DAILY = REPO / "public" / "data" / "petrobangla" / "daily"
PUBLISHED = REPO / "public" / "data" / "petrobangla" / "reserves-published.json"
OUT = REPO / "public" / "data" / "petrobangla" / "reserve-model.json"

BCF_PER_TCF = 1000.0
MMCF_PER_BCF = 1000.0

# The daily report and the reserve statement spell several fields differently,
# and the daily report meters Kailashtila as two processing trains against one
# reserve line. Nothing is guessed here: every archive name maps to a field that
# exists in the published statement, and the build fails if one does not.
FIELD_ALIASES = {
    "Narsingdi": "Narshingdi",
    "Sylhet": "Sylhet/Haripur",
    "Kailashtila #1 (Silicagel)": "Kailashtilla",
    "Kailashtila #2 (MSTE)": "Kailashtilla",
    "Beanibazar": "Beani Bazar",
    "Salda": "Shaldanadi",
    "Semutung": "Semutang",
    "Maulavibazar": "Moulavi Bazar",
    "Bangora": "Bangura",
    # Twelve rows across the whole archive carry a doubled name from the v1 hot
    # parser ("Sylhet Sylhet", "Meghna Meghna"). The field is unambiguous.
    "Sylhet Sylhet": "Sylhet/Haripur",
    "Meghna Meghna": "Meghna",
}
NON_FIELD_ROWS = {"R-LNG Terminal"}

# One 2020 row merged two field names into one cell. It is carried at zero, and
# the build asserts that below rather than dropping volume on trust.
MERGED_ROWS = {"Rupganj * Bhola M"}

# Published subtotals for the producing section from the two earlier Annual
# Reports. Their per-field cells render in a CID-mapped font whose digits
# extract as spaces, so only these printed subtotal rows are recoverable — which
# is all the back-test needs. Cited, not inferred.
EARLIER_ANCHORS = [
    {
        "as_of": "2023-07-01",
        "document": "Petrobangla Annual Report 2022-23",
        "page": 70,
        "producing": {"giip_bcf": 37288.0, "recoverable_2p_bcf": 26860.0,
                      "cumulative_bcf": 19735.0, "remaining_bcf": 7125.0},
    },
    {
        "as_of": "2024-07-01",
        "document": "Petrobangla Annual Report 2023-24",
        "page": 71,
        "producing": {"giip_bcf": 35021.5, "recoverable_2p_bcf": 27803.73,
                      "cumulative_bcf": 20483.46, "remaining_bcf": 7320.26},
    },
]

# Trailing window for the decline fit. Three years is long enough to average out
# maintenance shut-ins and short curtailments and short enough that a field
# whose decline steepened recently is not held to its older, gentler slope.
FIT_MONTHS = 36
# A field producing below this is treated as off rather than asymptotically
# trickling for decades — the integral of an exponential is otherwise infinite
# in time and the tail is not a forecast anyone should read.
ECONOMIC_LIMIT_MMCFD = 1.0
# Below this the trailing window is a cloud, not a trend. See fit_decline.
MIN_FIT_R2 = 0.5


def load_days() -> list[dict]:
    """Every usable archive day, as {date, fields: {field: mmcfd}}."""
    out = []
    for path in sorted(DAILY.glob("[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].json")):
        doc = json.loads(path.read_text(encoding="utf-8"))
        meta = doc.get("meta") or {}
        if meta.get("parse_status") not in (None, "ok") or meta.get("quarantined"):
            continue
        prod = doc.get("production") or {}
        rows = prod.get("fields") or []
        if not rows:
            continue
        fields: dict[str, float] = defaultdict(float)
        rlng = 0.0
        for row in rows:
            name = (row.get("field") or "").strip()
            if not name:
                continue
            # Regasified LNG is not a field and has no reserve behind it, so it
            # never enters the depletion arithmetic. It is kept here anyway,
            # because the question every reader asks next — what replaces the
            # gas — is answered by the same daily reports.
            if name in NON_FIELD_ROWS:
                gas = row.get("gas_mmcfd")
                if isinstance(gas, (int, float)):
                    rlng += float(gas)
                continue
            gas = row.get("gas_mmcfd")
            if not isinstance(gas, (int, float)):
                continue
            if name in MERGED_ROWS:
                if float(gas) != 0.0:
                    raise SystemExit(
                        f"{path.stem}: merged row {name!r} carries {gas} MMCFD — "
                        "it can no longer be dropped as empty")
                continue
            fields[FIELD_ALIASES.get(name, name)] += float(gas)
        if fields:
            out.append({"date": path.stem, "fields": dict(fields), "rlng_mmcfd": rlng})
    return out


def integrate(series: list[tuple[str, float]], start: str, end: str) -> float:
    """Trapezoid integral in MMCF over [start, end], across the gaps in reporting.

    The archive misses days — a report goes unpublished, a parse is quarantined.
    Joining the observations either side of a gap and taking the area under that
    line is the same rule the fiscal-year back-test is scored on, so the forward
    integral inherits an error that has been measured rather than assumed.
    """
    obs = [(d, v) for d, v in series if start <= d <= end]
    if len(obs) < 2:
        return 0.0
    total = 0.0
    for (d1, v1), (d2, v2) in zip(obs, obs[1:]):
        gap = (date.fromisoformat(d2) - date.fromisoformat(d1)).days
        total += (v1 + v2) / 2 * gap
    return total


def monthly_means(series: list[tuple[str, float]]) -> list[tuple[str, float, int]]:
    """(YYYY-MM, mean MMCFD, days observed), months with < 10 observations dropped."""
    buckets: dict[str, list[float]] = defaultdict(list)
    for d, v in series:
        buckets[d[:7]].append(v)
    out = []
    for month in sorted(buckets):
        vals = buckets[month]
        if len(vals) >= 10:
            out.append((month, sum(vals) / len(vals), len(vals)))
    return out


def fit_decline(months: list[tuple[str, float, int]]) -> dict:
    """Least-squares exponential decline on the trailing window.

    ln q = ln qi - D t, with t in years. Returns the nominal annual decline D,
    the fitted current rate, R², and the window actually used. A field with too
    few months, or one that is flat or rising, gets D = 0 and says so.
    """
    window = [m for m in months if m[1] > 0][-FIT_MONTHS:]
    if len(window) < 12:
        rate = window[-1][1] if window else 0.0
        return {"decline_pct_yr": 0.0, "fitted_rate_mmcfd": rate, "r2": None,
                "months_fitted": len(window), "basis": "insufficient-history"}

    t0 = date.fromisoformat(window[0][0] + "-01")
    xs, ys = [], []
    for month, mean, _ in window:
        t = (date.fromisoformat(month + "-01") - t0).days / 365.25
        xs.append(t)
        ys.append(math.log(mean))
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    slope = sxy / sxx if sxx else 0.0
    intercept = my - slope * mx
    ss_res = sum((y - (intercept + slope * x)) ** 2 for x, y in zip(xs, ys))
    ss_tot = sum((y - my) ** 2 for y in ys)
    r2 = 1 - ss_res / ss_tot if ss_tot > 0 else None

    fitted_now = math.exp(intercept + slope * xs[-1])
    if slope >= 0:
        # Flat or rising: held flat. See the module docstring.
        return {"decline_pct_yr": 0.0, "fitted_rate_mmcfd": window[-1][1], "r2": r2,
                "months_fitted": n, "basis": "flat-or-rising-held-flat"}
    if r2 is None or r2 < MIN_FIT_R2:
        # A slope through a cloud. Several small fields swing on maintenance and
        # curtailment rather than depletion, and a decline you cannot fit is not
        # a decline worth projecting — they are held flat and labelled, instead
        # of lending a noise-derived rate the authority of a forecast.
        return {"decline_pct_yr": 0.0, "fitted_rate_mmcfd": window[-1][1], "r2": r2,
                "months_fitted": n, "basis": "fit-too-weak-held-flat"}
    return {"decline_pct_yr": -slope * 100, "fitted_rate_mmcfd": fitted_now, "r2": r2,
            "months_fitted": n, "basis": "exponential-fit"}


def required_decline(rate_mmcfd: float, remaining_bcf: float) -> float | None:
    """The decline a field must follow for its remaining 2P to be exactly what
    it produces.

    An exponential decline from q0 delivers q0/D in total. Set that equal to the
    booked remaining reserve and D falls out. It is the arithmetic that turns a
    reserve figure into a rate forecast, and comparing it with the decline the
    field has actually been following is the single most informative number in
    this model: where the required decline is far steeper than the measured one,
    either the reserve is understated or the fall is still to come.
    """
    if rate_mmcfd <= 0 or remaining_bcf <= 0:
        return None
    return (rate_mmcfd * 365.25) / (remaining_bcf * MMCF_PER_BCF)


def project(fields: list[dict], mode: str, horizon_years: int = 60) -> list[dict]:
    """Monthly forward simulation, field by field, under one of two bindings.

    `reserves`  — every field declines at least as fast as its booked remaining
                  reserve requires. Production tapers smoothly and the 2P
                  statement is taken at face value.
    `decline`   — every field keeps declining at the rate it has measurably been
                  declining at, and the reserve balance is allowed to go
                  negative. Where it does, the model is saying the booked
                  reserve cannot support the observed production: the gas is
                  there, or the decline is about to steepen.

    Fields producing beyond a booked reserve of nil (Habiganj, Shaldanadi) keep
    their measured rate in both modes and are excluded from the reserve balance
    in both — the production is real and metered, the reserve figure behind it
    is not something this model can invent.
    """
    step = 1 / 12
    state = []
    for f in fields:
        d_fit = f["decline_pct_yr"] / 100
        left = max(0.0, f["remaining_now_bcf"]) * MMCF_PER_BCF
        if mode == "reserves" and left > 0:
            d_req = required_decline(f["rate_now_mmcfd"], f["remaining_now_bcf"]) or 0.0
            d = max(d_fit, d_req)
        else:
            d = d_fit
        state.append({
            "rate": f["rate_now_mmcfd"], "d": d, "left_mmcf": left,
            "booked": left > 0, "overdrawn_mmcf": 0.0,
        })

    rows = []
    for i in range(horizon_years * 12 + 1):
        rate = sum(s["rate"] for s in state)
        left = sum(s["left_mmcf"] for s in state)
        over = sum(s["overdrawn_mmcf"] for s in state)
        rows.append({"month": i, "rate_mmcfd": rate,
                     "remaining_bcf": left / MMCF_PER_BCF,
                     "overdrawn_bcf": over / MMCF_PER_BCF,
                     "by_field": {f["field"]: s["rate"] for f, s in zip(fields, state)}})
        for s in state:
            if s["rate"] < ECONOMIC_LIMIT_MMCFD:
                s["rate"] = 0.0
                continue
            drawn = s["rate"] * 365.25 * step
            if s["booked"]:
                if s["left_mmcf"] >= drawn:
                    s["left_mmcf"] -= drawn
                else:
                    s["overdrawn_mmcf"] += drawn - s["left_mmcf"]
                    s["left_mmcf"] = 0.0
                    if mode == "reserves":
                        # Reserve exhausted under the binding that respects it.
                        s["rate"] = 0.0
                        continue
            s["rate"] *= math.exp(-s["d"] * step)
    return rows


def project_flat(fields: list[dict], horizon_years: int = 60) -> list[dict]:
    """The naive comparison: today's rate held until the reserve is gone.

    This is what a straight line on a depletion chart means, and it is worth
    drawing precisely because it is the number everyone quotes. It assumes every
    field can hold its current rate to the last cubic foot, which no gas field
    has ever done.
    """
    rate = sum(f["rate_now_mmcfd"] for f in fields)
    left = sum(max(0.0, f["remaining_now_bcf"]) for f in fields) * MMCF_PER_BCF
    rows = []
    for i in range(horizon_years * 12 + 1):
        rows.append({"month": i, "rate_mmcfd": rate if left > 0 else 0.0,
                     "remaining_bcf": left / MMCF_PER_BCF, "overdrawn_bcf": 0.0})
        left = max(0.0, left - rate * 365.25 / 12)
    return rows


def first_month(rows: list[dict], predicate) -> float | None:
    for r in rows:
        if predicate(r):
            return r["month"] / 12
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    published = json.loads(PUBLISHED.read_text(encoding="utf-8"))
    anchor_date = published["source"]["as_of"]
    by_name = {f["field"]: f for f in published["fields"]}

    days = load_days()
    if len(days) < 365:
        print(f"only {len(days)} archive days — refusing to model")
        return 1
    as_of = days[-1]["date"]
    print(f"archive: {len(days)} days, {days[0]['date']} → {as_of}")
    print(f"reserve anchor: {anchor_date} ({published['source']['document']})")

    # Every archive field must exist in the published statement, or the join is
    # silently dropping production.
    archive_fields = sorted({f for d in days for f in d["fields"]})
    unknown = [f for f in archive_fields if f not in by_name]
    if unknown:
        print(f"  UNMAPPED archive fields (not in the reserve statement): {unknown}")
        return 1

    national = [(d["date"], sum(d["fields"].values())) for d in days]

    # ---- back-test: our integral vs Petrobangla's own cumulative bookings ----
    validation = []
    anchors = EARLIER_ANCHORS + [{
        "as_of": anchor_date,
        "document": published["source"]["document"],
        "page": published["source"]["pages"][0],
        "producing": published["subtotals"]["producing"],
    }]
    for prev, cur in zip(anchors, anchors[1:]):
        published_delta = cur["producing"]["cumulative_bcf"] - prev["producing"]["cumulative_bcf"]
        start = prev["as_of"]
        end = (date.fromisoformat(cur["as_of"]) - timedelta(days=1)).isoformat()
        measured = integrate(national, start, end) / MMCF_PER_BCF
        diff = measured - published_delta
        validation.append({
            "fiscal_year": f"FY{start[:4]}-{cur['as_of'][2:4]}",
            "window": [start, end],
            "published_production_bcf": round(published_delta, 2),
            "measured_production_bcf": round(measured, 2),
            "difference_bcf": round(diff, 2),
            "difference_pct": round(diff / published_delta * 100, 3),
            "published_source": f"{prev['document']} → {cur['document']}",
        })
        print(f"  back-test {validation[-1]['fiscal_year']}: published {published_delta:.2f} BCF, "
              f"measured {measured:.2f} BCF  ({validation[-1]['difference_pct']:+.2f}%)")

    # ---- reserve revisions between statements, stated rather than smoothed ----
    revisions = []
    for prev, cur in zip(anchors, anchors[1:]):
        rev = cur["producing"]["recoverable_2p_bcf"] - prev["producing"]["recoverable_2p_bcf"]
        produced = cur["producing"]["cumulative_bcf"] - prev["producing"]["cumulative_bcf"]
        revisions.append({
            "from": prev["as_of"], "to": cur["as_of"],
            "reserve_revision_bcf": round(rev, 2),
            "production_bcf": round(produced, 2),
            "net_change_in_remaining_bcf": round(
                cur["producing"]["remaining_bcf"] - prev["producing"]["remaining_bcf"], 2),
            # Reserve replacement ratio: what was added against what was taken
            # out. The number an upstream analyst asks for first, and one these
            # statements answer directly. Below 100% the country is living off
            # its balance sheet; sustained near zero, the decline is arithmetic.
            "reserve_replacement_pct": round(rev / produced * 100, 1) if produced else None,
        })

    # ---- per field: published reserve, measured drawdown, decline ----
    field_rows = []
    for name in archive_fields:
        pub = by_name[name]
        series = [(d["date"], d["fields"].get(name, 0.0)) for d in days if name in d["fields"]]
        drawn_bcf = integrate(series, anchor_date, as_of) / MMCF_PER_BCF
        published_remaining = pub["remaining_bcf"]
        months = monthly_means(series)
        fit = fit_decline(months)
        recent = [v for _, v in series[-30:]]
        rate_now = sum(recent) / len(recent) if recent else 0.0

        # A field can be producing from reserves the statement no longer credits
        # it with: Habiganj is booked at nil remaining (its cumulative is shown
        # as equal to its 2P, and Petrobangla's own footnote asks for a
        # re-evaluation), Shaldanadi is booked at minus half a BCF. Flagged, not
        # quietly zeroed or quietly topped up.
        over_booked = published_remaining is None or published_remaining <= 0 or drawn_bcf > published_remaining
        remaining_now = max(0.0, (published_remaining or 0.0) - drawn_bcf)

        field_rows.append({
            "field": name,
            "section": pub["section"],
            "discovery_year": pub["discovery_year"],
            "estimated_by": pub["estimated_by"],
            "estimate_year": pub["estimate_year"],
            "recoverable_2p_bcf": pub["recoverable_2p_bcf"],
            "published_cumulative_bcf": pub["cumulative_bcf"],
            "published_remaining_bcf": published_remaining,
            "measured_drawn_since_anchor_bcf": round(drawn_bcf, 3),
            "remaining_now_bcf": round(remaining_now, 3),
            "rate_now_mmcfd": round(rate_now, 2),
            "share_of_national_pct": None,  # filled below
            "decline_pct_yr": round(fit["decline_pct_yr"], 2),
            "decline_r2": round(fit["r2"], 3) if fit["r2"] is not None else None,
            "decline_basis": fit["basis"],
            "months_fitted": fit["months_fitted"],
            "beyond_published_reserve": over_booked,
            "years_left_at_current_rate": (
                round(remaining_now * MMCF_PER_BCF / (rate_now * 365.25), 1)
                if rate_now > 0 and remaining_now > 0 else None),
        })

    national_rate_now = sum(f["rate_now_mmcfd"] for f in field_rows)
    for f in field_rows:
        f["share_of_national_pct"] = round(f["rate_now_mmcfd"] / national_rate_now * 100, 2) if national_rate_now else 0
    field_rows.sort(key=lambda f: -f["rate_now_mmcfd"])

    # Rupganj is metered in the daily report at zero and is booked under
    # "production suspended", so it stays in that pool rather than inflating the
    # producing one.
    producing_rows = [f for f in field_rows if f["section"] == "producing"]
    producing_remaining_now = sum(f["remaining_now_bcf"] for f in producing_rows)
    clamped_at_nil = sum(
        f["measured_drawn_since_anchor_bcf"] - (f["published_remaining_bcf"] or 0.0)
        for f in producing_rows if f["beyond_published_reserve"])
    stranded = published["subtotals"]["non_producing"]["remaining_bcf"]
    suspended = published["subtotals"]["production_suspended"]["remaining_bcf"]
    orphan_rate = sum(f["rate_now_mmcfd"] for f in field_rows if f["beyond_published_reserve"])

    print(f"  producing fields: {producing_remaining_now:.0f} BCF left, "
          f"{national_rate_now:.0f} MMCFD now")
    print(f"  not producing: {stranded:.0f} BCF discovered-undeveloped, "
          f"{suspended:.0f} BCF in suspended fields")
    if orphan_rate:
        print(f"  {orphan_rate:.0f} MMCFD is coming from fields booked at nil remaining")

    # ---- per-field reconciliation: measured decline vs the decline 2P requires ----
    for f in field_rows:
        req = required_decline(f["rate_now_mmcfd"], f["remaining_now_bcf"])
        f["decline_required_by_2p_pct_yr"] = round(req * 100, 2) if req is not None else None
        # What the field would produce in total if it simply kept declining the
        # way it has been. Above its booked remaining reserve, that is a claim
        # on gas nobody has booked yet.
        if f["decline_pct_yr"] >= 2.0 and f["rate_now_mmcfd"] > 0:
            eur = f["rate_now_mmcfd"] * 365.25 / (f["decline_pct_yr"] / 100) / MMCF_PER_BCF
            f["implied_recovery_at_measured_decline_bcf"] = round(eur, 1)
            f["implied_revision_bcf"] = round(eur - f["remaining_now_bcf"], 1)
        else:
            f["implied_recovery_at_measured_decline_bcf"] = None
            f["implied_revision_bcf"] = None

    # ---- trajectories ----
    reserves_bound = project(producing_rows, "reserves")
    decline_bound = project(producing_rows, "decline")
    flat = project_flat(producing_rows)
    flat_years = first_month(flat, lambda r: r["remaining_bcf"] <= 0)

    def at(rows, years):
        i = int(years * 12)
        return rows[i] if i < len(rows) else rows[-1]

    def thin(rows, keys):
        """Monthly for the first five years, annual after — the chart cannot
        resolve more and the payload is served to every reader."""
        out = []
        for r in rows:
            m = r["month"]
            if m <= 60 or m % 12 == 0:
                if m > 30 * 12:
                    break
                out.append({"m": m, **{k: round(r[v], 2) for k, v in keys.items()}})
        return out

    national_monthly = monthly_means(national)

    # ---- what is already replacing it ------------------------------------
    # Domestic output against regasified LNG, year by year, from the same daily
    # reports. No prices: a cargo price is a claim this archive cannot support,
    # and the volumes are the part that follows from the depletion.
    by_year: dict[str, list[tuple[float, float]]] = defaultdict(list)
    for d in days:
        by_year[d["date"][:4]].append((sum(d["fields"].values()), d.get("rlng_mmcfd", 0.0)))
    supply_mix = []
    for year in sorted(by_year):
        rows_y = by_year[year]
        dom = sum(r[0] for r in rows_y) / len(rows_y)
        lng = sum(r[1] for r in rows_y) / len(rows_y)
        total = dom + lng
        supply_mix.append({
            "year": year,
            "days": len(rows_y),
            "domestic_mmcfd": round(dom, 1),
            "rlng_mmcfd": round(lng, 1),
            "import_share_pct": round(lng / total * 100, 1) if total else None,
        })

    # ---- one-off collapses in the history, found rather than annotated ----
    # A month that falls away and comes straight back is demand, not geology.
    # The chart should say so where it happens, so the dip is detected here
    # instead of being labelled by hand from memory.
    anomalies = []
    months = national_monthly
    for i in range(3, len(months) - 2):
        prior = sorted(m[1] for m in months[i - 3:i])[1]
        cur = months[i][1]
        after = max(m[1] for m in months[i + 1:i + 3])
        if cur < prior * 0.8 and after > prior * 0.95:
            anomalies.append({
                "month": months[i][0],
                "mmcfd": round(cur, 1),
                "baseline_mmcfd": round(prior, 1),
                "drop_pct": round((1 - cur / prior) * 100, 1),
                "recovered_by": months[i + 1][0] if months[i + 1][1] > prior * 0.95 else months[i + 2][0],
                "reading": "a one-month fall that comes straight back is demand or an outage, not depletion",
            })

    # ---- the production profile ------------------------------------------
    # The traditional way this is drawn: every field's output stacked, history
    # and forecast on one axis, so the shape of the country's supply is the
    # shape of its biggest fields. Six named wedges and one aggregate keeps the
    # stack readable; the named six are 89% of today's output.
    PROFILE_N = 6
    named = [f["field"] for f in producing_rows[:PROFILE_N]]
    profile_fields = named + ["Other fields"]

    def split(values: dict[str, float]) -> list[float]:
        row = [round(values.get(n, 0.0), 1) for n in named]
        row.append(round(sum(v for k, v in values.items() if k not in named), 1))
        return row

    months_seen: dict[str, dict[str, float]] = defaultdict(dict)
    for name in archive_fields:
        series = [(d["date"], d["fields"].get(name, 0.0)) for d in days if name in d["fields"]]
        for month, mean, _ in monthly_means(series):
            months_seen[month][name] = mean

    profile_history = [{"month": m, "v": split(months_seen[m])} for m in sorted(months_seen)]
    profile_forecast = [
        {"m": r["month"], "v": split(r["by_field"])}
        for r in reserves_bound
        if (r["month"] <= 60 or r["month"] % 12 == 0) and r["month"] <= 30 * 12
    ]
    profile_share = round(
        sum(f["rate_now_mmcfd"] for f in producing_rows[:PROFILE_N]) / national_rate_now * 100, 1
    ) if national_rate_now else 0

    def gap_at(rows, years):
        i = min(len(rows) - 1, int(years * 12))
        return round(national_rate_now - rows[i]["rate_mmcfd"], 1)

    replacement = {
        "today_domestic_mmcfd": round(national_rate_now, 1),
        "today_rlng_mmcfd": supply_mix[-1]["rlng_mmcfd"] if supply_mix else None,
        "today_import_share_pct": supply_mix[-1]["import_share_pct"] if supply_mix else None,
        "gap_5y_mmcfd": {
            "reserves_binding": gap_at(reserves_bound, 5),
            "decline_binding": gap_at(decline_bound, 5),
        },
        "gap_10y_mmcfd": {
            "reserves_binding": gap_at(reserves_bound, 10),
            "decline_binding": gap_at(decline_bound, 10),
        },
        "note": "the shortfall against today's domestic output, which imports or new gas must cover",
    }

    model = {
        "generated_at": None,  # stamped by the caller; scripts here stay deterministic
        "as_of": as_of,
        "archive_days": len(days),
        "anchor": {
            "as_of": anchor_date,
            "document": published["source"]["document"],
            "table": published["source"]["table"],
            "pages": published["source"]["pages"],
            "producing_remaining_bcf": published["subtotals"]["producing"]["remaining_bcf"],
            "non_producing_remaining_bcf": stranded,
            "suspended_remaining_bcf": suspended,
            "grand_total_remaining_bcf": published["grand_total"]["bcf"]["remaining_bcf"],
            "initial_recoverable_2p_bcf": published["grand_total"]["bcf"]["recoverable_2p_bcf"],
            "cumulative_produced_bcf": published["grand_total"]["bcf"]["cumulative_bcf"],
        },
        "validation": validation,
        "revisions": revisions,
        "now": {
            "national_rate_mmcfd": round(national_rate_now, 1),
            "producing_remaining_bcf": round(producing_remaining_now, 1),
            "producing_remaining_tcf": round(producing_remaining_now / BCF_PER_TCF, 3),
            "drawn_since_anchor_bcf": round(
                sum(f["measured_drawn_since_anchor_bcf"] for f in field_rows), 2),
            "rate_from_fields_beyond_published_reserve_mmcfd": round(orphan_rate, 1),
            "produced_beyond_published_reserve_bcf": round(clamped_at_nil, 2),
        },
        "profile": {
            "fields": profile_fields,
            "named_share_pct": profile_share,
            "history": profile_history,
            "forecast": profile_forecast,
            "basis": "forecast is the 2P-binding path, field by field",
        },
        "supply_mix": supply_mix,
        "anomalies": anomalies,
        "replacement": replacement,
        "history": {
            "monthly_rate": [{"month": m, "mmcfd": round(v, 1), "days": n}
                             for m, v, n in national_monthly],
            "anchors": [
                {"as_of": a["as_of"], "document": a["document"],
                 "producing_remaining_bcf": a["producing"]["remaining_bcf"],
                 "producing_cumulative_bcf": a["producing"]["cumulative_bcf"],
                 "recoverable_2p_bcf": a["producing"]["recoverable_2p_bcf"]}
                for a in anchors
            ],
        },
        "fields": field_rows,
        "reserve_pools_bcf": {
            "producing_now": round(producing_remaining_now, 1),
            "discovered_undeveloped": stranded,
            "production_suspended": suspended,
        },
        "trajectory": {
            "step": "monthly",
            "reserves_binding": thin(reserves_bound, {"rate": "rate_mmcfd", "left": "remaining_bcf"}),
            "decline_binding": thin(decline_bound, {"rate": "rate_mmcfd", "left": "remaining_bcf",
                                                    "over": "overdrawn_bcf"}),
            "flat": thin(flat, {"rate": "rate_mmcfd", "left": "remaining_bcf"}),
        },
        "headline": {
            "years_at_current_rate_no_decline": round(flat_years, 1) if flat_years else None,
            "years_until_rate_halves": first_month(
                reserves_bound, lambda r: r["rate_mmcfd"] <= national_rate_now / 2),
            "years_until_rate_is_a_tenth": first_month(
                reserves_bound, lambda r: r["rate_mmcfd"] <= national_rate_now / 10),
            "years_until_half_the_reserve_is_gone": first_month(
                reserves_bound, lambda r: r["remaining_bcf"] <= producing_remaining_now / 2),
            "rate_in_5_years_mmcfd": round(at(reserves_bound, 5)["rate_mmcfd"], 1),
            "rate_in_10_years_mmcfd": round(at(reserves_bound, 10)["rate_mmcfd"], 1),
            "recovered_in_10_years_bcf": round(
                producing_remaining_now - at(reserves_bound, 10)["remaining_bcf"], 1),
            "rate_in_5_years_at_measured_decline_mmcfd": round(at(decline_bound, 5)["rate_mmcfd"], 1),
            "rate_in_10_years_at_measured_decline_mmcfd": round(at(decline_bound, 10)["rate_mmcfd"], 1),
            "unbooked_gas_needed_by_10_years_bcf": round(at(decline_bound, 10)["overdrawn_bcf"], 1),
            "reserve_replacement_pct_latest": revisions[-1]["reserve_replacement_pct"] if revisions else None,
            "reserve_replacement_window": f"{revisions[-1]['from']} to {revisions[-1]['to']}" if revisions else None,
            # What would have to be found to hold today's output flat for a
            # decade: the gap between ten years at today's rate and what the
            # booked reserve can actually deliver over that decade.
            "new_gas_needed_to_hold_flat_10y_bcf": round(
                max(0.0, national_rate_now * 365.25 * 10 / MMCF_PER_BCF
                    - (producing_remaining_now - at(reserves_bound, 10)["remaining_bcf"])), 1),
        },
        "method": {
            "decline": f"Arps b=0 (exponential), least squares on log monthly rate, "
                       f"trailing {FIT_MONTHS} months, per field",
            "flat_or_rising": "held flat, never extrapolated upward",
            "economic_limit_mmcfd": ECONOMIC_LIMIT_MMCFD,
            "not_modelled": [
                "undiscovered resource",
                "future reserve revisions",
                "redevelopment of suspended fields",
            ],
        },
    }

    h = model["headline"]
    print(f"  flat-rate run-out (the straight-line answer): "
          f"{h['years_at_current_rate_no_decline']} yr")
    print(f"  2P-binding: rate halves in {h['years_until_rate_halves']:.1f} yr, "
          f"{h['rate_in_5_years_mmcfd']} MMCFD at +5yr, {h['rate_in_10_years_mmcfd']} at +10yr")
    print(f"  measured-decline: {h['rate_in_5_years_at_measured_decline_mmcfd']} MMCFD at +5yr, "
          f"{h['rate_in_10_years_at_measured_decline_mmcfd']} at +10yr, needing "
          f"{h['unbooked_gas_needed_by_10_years_bcf']} BCF nobody has booked")

    if args.apply:
        # The poll rebuilds this on every run that sees a gas day, and the
        # payload is deterministic — so an unchanged rebuild was rewriting
        # 80 KB to the Pi's SD card several times a day for no gain.
        size = OUT.stat().st_size / 1024 if OUT.exists() else 0
        if write_if_changed(OUT, model):
            size = OUT.stat().st_size / 1024
            print(f"\nWritten: {OUT.relative_to(REPO)} ({size:.0f} KB)")
        else:
            print(f"\nUnchanged: {OUT.relative_to(REPO)} ({size:.0f} KB) already current")
    else:
        print("\nRe-run with --apply to write the artifact.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
