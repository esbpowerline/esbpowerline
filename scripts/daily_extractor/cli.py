"""CLI — PGCB + Petrobangla daily ingest (esbpowerline codebase scope)."""
from __future__ import annotations

import argparse
import json
from datetime import date, timedelta

from .config import DAILY_REPORTS_ROOT, site_dir
from .download import download_for_energy_day
from .export import build_agent_bundle, deploy
from .organize import organize_files
from .parse import parse_all
from .validate_grid import validate_grid_daily, validate_petrobangla_daily
from .verify import (
    apply_google_overrides,
    format_discrepancy_report,
    verify_parsed_data,
)


def _default_energy_day() -> date:
    return date.today() - timedelta(days=1)


def _prompt_choice(report_text: str) -> str:
    print(report_text)
    print("\nOptions:")
    print("  [O] Use official / parsed source data (recommended)")
    print("  [G] Use Google search values for mismatched fields")
    print("  [A] Abort without writing JSON")
    while True:
        choice = input("\nYour choice [O/G/A]: ").strip().upper()
        if choice in ("O", "OFFICIAL", "USE-OFFICIAL", "USE OFFICIAL"):
            return "official"
        if choice in ("G", "GOOGLE", "USE-GOOGLE", "USE GOOGLE"):
            return "google"
        if choice in ("A", "ABORT", "Q", "QUIT"):
            return "abort"
        print("Please enter O, G, or A.")


def run(
    energy: date,
    *,
    deploy_files: bool = False,
    skip_google: bool = False,
    auto_confirm: bool = False,
    choice: str | None = None,
    force: bool = False,
) -> int:
    iso = energy.isoformat()
    print(f"\n=== ESB PowerLine Daily Extractor — {iso} ===")
    print("Scope: Pipeline A (PGCB GridDailyData) + Pipeline B (PetrobanglaDaily)\n")

    print("[1/6] Downloading PGCB ERP + Petrobangla PDF...")
    dl = download_for_energy_day(energy)
    for err in dl.errors:
        print(f"  WARN: {err}")
    if not dl.pgcb_xlsx:
        print("ERROR: Pipeline A requires PGCB daily report.")
        return 1
    print(f"  PGCB: {dl.pgcb_xlsx.name} (ERP id {dl.pgcb_erp_id})")
    if dl.petrobangla_pdf:
        print(f"  Petrobangla: {dl.petrobangla_pdf.name}")
    else:
        print("  Petrobangla: unavailable (gas sections use carry-forward or zero-fill)")

    work_dir = site_dir(energy, "pgcb")

    print("\n[2/6] Parsing → GridDailyData + PetrobanglaDaily...")
    parsed = parse_all(energy, dl.pgcb_xlsx, dl.petrobangla_pdf, work_dir)
    for w in parsed.warnings:
        print(f"  WARN: {w}")
    if not parsed.grid_data:
        print("ERROR: PGCB parse failed.")
        return 1

    stats = parsed.grid_data["systemStats"]
    hourly_n = len(parsed.grid_data.get("hourlyLoadData") or [])
    print(
        f"  Pipeline A OK — epg={stats['eveningPeakGen']} MW, "
        f"energy={stats['totalEnergyGen']} MKWh, hourly={hourly_n}"
    )
    if parsed.petrobangla_data:
        pb_status = parsed.petrobangla_data.get("meta", {}).get("parse_status")
        fields = parsed.petrobangla_data.get("production", {}).get("field_count", "?")
        print(f"  Pipeline B OK — status={pb_status}, fields={fields}")
    else:
        print("  Pipeline B skipped")

    print("\n[3/6] Schema validation (validate-daily-report.ts rules)...")
    grid_val = validate_grid_daily(parsed.grid_data, iso)
    pb_val = validate_petrobangla_daily(parsed.petrobangla_data)
    for e in grid_val.errors:
        print(f"  ERROR: {e}")
    for w in grid_val.warnings:
        print(f"  warn: {w}")
    for e in pb_val.errors:
        print(f"  ERROR [Pipeline B]: {e}")
    for w in pb_val.warnings:
        print(f"  warn [Pipeline B]: {w}")
    if not grid_val.ok and not force:
        print("ERROR: GridDailyData validation failed. Fix parser or use --force.")
        return 1
    if parsed.petrobangla_data and not pb_val.ok and not force:
        print("ERROR: PetrobanglaDaily validation failed. Fix parser or use --force.")
        return 1

    print("\n[4/6] Official re-parse + Google 2FA...")
    verification = verify_parsed_data(energy, parsed.grid_data, dl.pgcb_xlsx, skip_google=skip_google)
    print(format_discrepancy_report(verification))

    grid_final = parsed.grid_data
    if verification.needs_user_choice and not auto_confirm:
        picked = choice or _prompt_choice(format_discrepancy_report(verification))
        if picked == "abort":
            print("Aborted.")
            return 2
        if picked == "google":
            grid_final = apply_google_overrides(parsed.grid_data, verification)
    elif verification.auto_proceed:
        print("  Verification passed — proceeding.")

    print("\n[5/6] Building agent bundle...")
    sources = {
        "pgcb_erp": str(dl.pgcb_xlsx),
        "petrobangla_pdf": str(dl.petrobangla_pdf) if dl.petrobangla_pdf else "",
        "petrobangla_url": dl.petrobangla_url or "",
    }
    bundle = build_agent_bundle(
        energy,
        grid_final,
        parsed.petrobangla_data,
        verification.to_dict(),
        sources,
        {"ok": grid_val.ok, "errors": grid_val.errors, "warnings": grid_val.warnings},
        {"ok": pb_val.ok, "errors": pb_val.errors, "warnings": pb_val.warnings},
    )

    out_dir = site_dir(energy, "output")
    out_dir.mkdir(parents=True, exist_ok=True)
    bundle_path = out_dir / f"agent_bundle_{iso}.json"
    grid_path = out_dir / f"grid_daily_{iso}.json"
    pb_path = out_dir / f"petrobangla_daily_{iso}.json"
    verify_path = site_dir(energy, "verification") / f"verification_{iso}.json"

    bundle_path.write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")
    grid_path.write_text(json.dumps(grid_final, indent=2), encoding="utf-8")
    if parsed.petrobangla_data:
        pb_path.write_text(json.dumps(parsed.petrobangla_data, indent=2, ensure_ascii=False), encoding="utf-8")
    verify_path.parent.mkdir(parents=True, exist_ok=True)
    verify_path.write_text(json.dumps(verification.to_dict(), indent=2), encoding="utf-8")

    print("\n[6/6] Deploy + organize...")
    if deploy_files:
        written = deploy(energy, grid_final, parsed.petrobangla_data)
        for key, path in written.items():
            print(f"  {key}: {path}")
    else:
        print("  Skipped deploy (use --deploy for public/data/ + sync scripts)")

    report_root = organize_files(
        energy,
        pgcb_xlsx=dl.pgcb_xlsx,
        pgcb_text=parsed.pgcb_text_path,
        petrobangla_pdf=dl.petrobangla_pdf,
        petrobangla_text=parsed.petrobangla_text_path,
        grid_json=grid_path,
        petrobangla_json=pb_path if parsed.petrobangla_data else None,
        agent_bundle=bundle_path,
        verification_report=verify_path,
    )
    print(f"\nOrganized: {report_root}")
    print(f"Agent bundle: {bundle_path}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="ESB PowerLine daily ingest — PGCB GridDailyData + PetrobanglaDaily"
    )
    parser.add_argument("--date", "-d", type=str, default=None, help="Energy day YYYY-MM-DD")
    parser.add_argument(
        "--deploy",
        action="store_true",
        help="Write to public/data/, update indexes, run sync_petrobangla_live + timeline",
    )
    parser.add_argument("--skip-google", action="store_true", help="Skip Google 2FA verification")
    parser.add_argument("--auto-confirm", action="store_true", help="Non-interactive; use official on conflict")
    parser.add_argument("--use-google", action="store_true", help="Prefer Google values on conflict")
    parser.add_argument("--use-official", action="store_true", help="Prefer official values on conflict")
    parser.add_argument("--force", action="store_true", help="Deploy despite schema validation errors")
    args = parser.parse_args(argv)

    energy = date(*map(int, args.date.split("-"))) if args.date else _default_energy_day()
    DAILY_REPORTS_ROOT.mkdir(parents=True, exist_ok=True)

    choice = "google" if args.use_google else ("official" if args.use_official else None)
    return run(
        energy,
        deploy_files=args.deploy,
        skip_google=args.skip_google,
        auto_confirm=args.auto_confirm or choice is not None,
        choice=choice,
        force=args.force,
    )


if __name__ == "__main__":
    raise SystemExit(main())