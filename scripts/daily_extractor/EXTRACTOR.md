# EXTRACTOR — Daily Data Ingestion Reference

Saved from design discussion (2026-07-02).  
Scope: **PGCB + Petrobangla only** (BPDB deferred).

---

## What it does

| Pipeline | Source | Output | Site type |
|----------|--------|--------|-----------|
| **A** | PGCB ERP daily XLSX | `public/data/daily/{energy-day}.json` | `GridDailyData` |
| **B** | Petrobangla daily PDF | `public/data/petrobangla/daily/{energy-day}.json` | `PetrobanglaDaily` |

**Not in scope (yet):** BPDB daily generation, BPDB area-wise demand, `grid_backlog` manual merges.

### Entry point

```powershell
cd C:\Users\user\esbpowerline
python scripts\daily_data_extractor.py --date YYYY-MM-DD --skip-google --auto-confirm --deploy
```

Default energy day = **yesterday** (no `--date`).

### Package layout

```
scripts/daily_extractor/
  config.py       — paths, ERP map, fuel/company constants
  download.py     — PGCB ERP + Petrobangla PDF (local hot-folder fallback)
  parse.py        — GridDailyData + PetrobanglaDaily, gas carry-forward
  verify.py       — official re-parse + Google/DuckDuckGo 2FA
  validate_grid.py — mirrors lib/data/grid/validate-daily-report.ts
  export.py       — deploy + sync_petrobangla_live + build_petrobangla_timeline
  organize.py     — Desktop/Daily Reports/Daily Report {date}/
  cli.py          — 6-step interactive flow
```

---

## PGCB date convention (critical)

| Report publication date | Energy day in JSON filename |
|-------------------------|----------------------------|
| 2026-07-02 | `2026-07-01.json` |
| 2026-07-01 | `2026-06-30.json` |

On calendar day **D**, the expected latest energy day is **D − 1** (once PGCB posts report dated **D**).

---

## Local paths

| Purpose | Path |
|---------|------|
| Grid JSON output | `public/data/daily/` |
| Date index | `lib/available-dates.json` |
| Petrobangla staging | `Desktop/grid_backlog/petrobangla_json/` |
| Petrobangla parser | `Desktop/grid_backlog/parse_petrobangla.py` |
| Petrobangla PDF hot folder | `Desktop/New weeks/` |
| Organized downloads | `Desktop/Daily Reports/Daily Report {date}/` |
| Agent paste bundle | `Desktop/latest.txt` |

### Daily Report folder structure

```
Daily Report YYYY-MM-DD/
  PGCB/           erp_*.xlsx, pgcb_*.txt
  Petrobangla/    *.pdf, petrobangla_*.txt
  Output/         grid_daily_*.json, petrobangla_daily_*.json, agent_bundle_*.json
  Verification/   verification_*.json
```

---

## GridDailyData sections (Pipeline A)

- `systemStats` — required
- `generationData` — required (7 fuels)
- `regionalDemandData` — 9 zones (from PGCB P1/P3, **not** BPDB area-wise backlog)
- `hourlyLoadData` — 24 rows from L-Curve TOTAL column (col index 3)
- `dailyOutages`, `borderImportsData`
- `gasProductionData` / `gasDistributionData` — from Petrobangla text (Pipeline A summary)

## PetrobanglaDaily (Pipeline B)

Full archive: field-level production, plant-level gas demand/supply, distribution, entities.  
One PDF often covers a **2-day gas window** (`report_date_start` → `report_date_end`).

---

## Agent deploy (from latest.txt)

Paste `Desktop/latest.txt` and instruct agent to:

1. Write each `pipeline_a[date]` → `public/data/daily/{date}.json`
2. Write each `pipeline_b[date]` → `public/data/petrobangla/daily/{date}.json`
3. Update `lib/available-dates.json` through latest energy day
4. Run `sync_petrobangla_live.py` + `build_petrobangla_timeline.py`
5. Commit + deploy to production

Skip dates listed in `"missing"` (not published yet).

---

## Status snapshot (2026-07-02)

| Energy day | PGCB | Petrobangla | Notes |
|------------|------|-------------|-------|
| 2026-06-29 | ✅ erp_5051 | ✅ | In latest.txt |
| 2026-06-30 | ✅ erp_5052 | ✅ 29–30 Jun report | Latest available |
| 2026-07-01 | ❌ | ❌ | Needs PGCB report dated 2026-07-02 |

Live site may lag local until `public/data/` is deployed to Vercel.

---

## Planned: dynamic gap-fill

**Yes — possible.**

1. Read latest from `lib/available-dates.json` or `public/data/daily/`
2. Target = yesterday’s energy day
3. Ingest only `latest + 1` … `target`, one day at a time
4. Per day: smart retry — skip components already `ok`

---

## Planned: smart incremental ingest (6 AM + 30 min)

**Yes — possible.**

Start **6:00 AM BDT**, then every **30 minutes** until all components for the target energy day are `ok`.  
Each tick runs **only unfound/unparsed steps** (e.g. Petrobangla found, PGCB not → next tick only PGCB).

### Per-day component checklist

| Component | Required |
|-----------|----------|
| `pgcb_download` | ✅ |
| `pgcb_parse` → GridDailyData | ✅ |
| `petrobangla_pdf` | ✅ |
| `petrobangla_pipeline_a` (gas in grid JSON) | ✅ |
| `petrobangla_pipeline_b` (full archive) | ✅ |
| `deploy_grid_json` | ✅ |
| `deploy_petrobangla_json` | ✅ |
| `sync_live_week` + `timeline-summary` | ✅ |
| `available-dates` update | ✅ |

When all `ok` → mark `complete`, stop intervals until next day 6 AM.

### Vercel cron (UTC)

Bangladesh = UTC+6. Six AM BDT = midnight UTC.

```json
{ "path": "/api/cron/daily-ingest", "schedule": "0,30 0-6 * * *" }
```

---

## Planned: admin/editor Refresh in Grid Explorer

**Yes — possible.**

- Button visible to **admin/editor** only
- Calls Vercel API → starts dynamic ingest (read latest → fill gap)
- Worker runs parse; API returns progress/status
- **Cannot** run full Python Petrobangla parse inside browser or short serverless function

---

## Vercel + Supabase — what they allow

| Piece | Vercel | Supabase |
|-------|--------|----------|
| Admin Refresh API | ✅ | — |
| 6 AM cron + 30 min retries | ✅ (Cron on Pro) | — |
| Ingest state (done/missing) | — | ✅ Postgres |
| Store daily JSON | ⚠️ git redeploy only | ✅ Storage |
| Python + heavy PDF parse | ❌ timeout / no Python | ❌ use external worker |

### Recommended production flow

```
Admin Refresh OR Vercel Cron
  → API reads/writes daily_ingest_state (Supabase Postgres)
  → triggers worker (GitHub Actions / Railway / scheduled PC)
  → worker: daily_data_extractor.py --smart-tick
  → uploads JSON to Supabase Storage
  → optional: git commit + Vercel redeploy OR loaders read Storage directly
```

### Supabase artifacts (to build)

- **Table:** `daily_ingest_state` — per energy_day component flags
- **Storage:** `grid-daily/`, `petrobangla-daily/`, optional `ingest-raw/`
- **SiteSetting:** homepage ticker from latest `systemStats` (existing pattern)

---

## Existing cron (separate system — do not confuse)

| Route | Schedule | Writes |
|-------|----------|--------|
| `/api/cron/ingest` | `0 6 * * *` | Supabase `SiteSetting` only (homepage ticker) |
| `daily_data_extractor.py` | manual | `public/data/daily/` (Power Grid Explorer) |

**Unify** these in the planned architecture so one pipeline feeds both JSON files and homepage settings.

---

## BPDB (deferred)

User will incorporate later. Not in extractor v1.  
Site today: static annual financials in `lib/data/companies/bpdb.ts` only.

---

## Build queue (when implementing)

1. [ ] `daily_ingest_state` Prisma + Supabase migration
2. [ ] `--smart-tick` + dynamic gap-fill on `daily_data_extractor.py`
3. [ ] `/api/cron/daily-ingest` + `/api/grid/refresh` (admin/editor)
4. [ ] GitHub Actions or Railway worker
5. [ ] Supabase Storage upload + loader fallback
6. [ ] Grid Explorer Refresh button + progress UI

---

## Quick commands

```powershell
# Latest available day
python scripts\daily_data_extractor.py --date 2026-06-30 --skip-google --auto-confirm --deploy

# Regenerate Desktop paste bundle
python scratch\write_latest_txt.py

# After deploy
python scripts\sync_petrobangla_live.py
python scripts\build_petrobangla_timeline.py
```

---

*End of EXTRACTOR reference.*