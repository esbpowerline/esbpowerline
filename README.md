# ⚡ ESB PowerLine — Bangladesh Energy & Power Sector Portal

A premium, state-of-the-art news portal, content management system (CMS), and interactive analytics dashboard covering Bangladesh's energy and power sector. 

This codebase is a modern **Next.js 16 + TypeScript + Prisma + Supabase** implementation designed with rich aesthetics, strict database models, robust role isolation, and real-time data integration.

---

## 🚀 Reorganization & Shelf Architecture

The codebase is organized in a clean, modular structure that Next.js loves:

```
esbpowerline/
├── app/                  # Next.js App Router (unified routing)
│   ├── (admin)/          # Dedicated Admin Portal routes & logs
│   ├── (cms)/            # Editorial CMS Platform & draft review workflow
│   ├── (public)/         # Public news portal, categories, & interactive data
│   ├── api/              # Ingestion pipelines & telemetry API endpoints
│   ├── auth/             # Supabase & custom token auth handlers
│   └── members/          # Paid subscriber panels & account download libraries
├── components/           # Reusable UI/UX component library
│   ├── members/          # Subscription controls & export triggers
│   ├── news/             # Power grid explorer, stock tickers, & Recharts visualization
│   └── shared/           # Navigation, media uploaders, & generic UI cards
├── hooks/                # Custom React hooks (viewport, telemetry, theme)
├── lib/                  # Backend utilities & server logic
│   ├── actions/          # Prisma database transactional server actions
│   ├── cron/             # Auto-ingestion pipelines & publishing schedulers
│   ├── data/             # Historical seed logs & longitudinal studies
│   └── supabase/         # Supabase client configurations & health gates
├── prisma/               # Schema specifications, migrations, & production seeds
├── public/               # Static assets, OPGW PDF maps, and macro-charts
├── scripts/              # Utility scripts for bootstrap & diagnostics
└── supabase/             # Local SQL configurations & Row Level Security (RLS)
```

---

## 🎨 Professional UI & UX Features

- **Dynamic Theme Architecture**: Dark, Light, and System preference synchronization using CSS custom properties with smooth transitions.
- **Glassmorphism & High-end Aesthetics**: Sleek interfaces leveraging backdrop filters, border glows, custom loading skeletons, and Outfit/Space Grotesk typography.
- **Micro-Animations**: Ease-in-out hover actions on category tags, grid paths, cards, and interactive counters using `easeOutCubic` easing.
- **Print Optimization**: A4 print-optimized styling stylesheets to convert data views into clean, professional PDF reports on click.

---

## 📊 Live Energy Dashboard & Database Reports

All data reports are mapped to their designated placeholders in the database (`DashboardStat` and `SiteSetting` tables) and served in dynamic formats:

1. **Power Grid Explorer (`/grid-explorer`)**: Real-time rendering of generation capacity, peak demand, fuel cost averages, and unserved energy.
2. **Interactive Visualizations**: Dynamic charts powered by Recharts showing historical capacity vs. demand growth.
3. **Macro-Economic Studies**: Decoupling metrics and tariff analysis indexing parameters relative to **FY2011 = 100** for structural grid diagnostics.
4. **Offline Export Formats**:
   - **CSV Snapshots**: Instantly downloadable grid datasets for further analysis.
   - **Audit Reports**: Visual exports of statistics, transmission lengths, and financial summaries.

---

## ⚙️ Core Ingestion Pipeline

The platform runs a scheduled ingestion pipeline (`/api/cron/ingest`) configured to:
1. Scrape **PGCB** for daily generation Excel spreadsheets and parse them via helper Python scripts.
2. Scrape **Petrobangla** for daily gas production and LNG distribution PDF reports.
3. Fetch daily renewable metrics and update local data libraries via **SREDA** endpoints.
4. Sync parsed outputs directly to the local database, immediately updating homepage tickers and dashboard counters.

---

## 🔒 Security & Role Isolation

The platform enforces strict safety and access levels:
- **Prisma Schema Constraints**: Database structure backed by strict enum roles (`Role: SUPER_ADMIN, ADMIN, EDITOR, AUTHOR, SUBSCRIBER`).
- **Supabase Authentication**: Secure session control mapped to Next.js middleware and token verification routes.
- **Row Level Security (RLS)**: Fine-grained access control on database tables to keep member details, comments, and drafts isolated.

---

## 🔬 Compatibility & Health Verification

All configurations have been checked and validated for complete safety and compatibility:

### Vercel Deployment Check
- **Output File Tracing**: Configured in `next.config.ts` to exclude bulky local datasets from serverless deployment bundles to maintain fast cold start times.
- **Turbopack Build**: Runs fully-optimized production builds with type safety constraints.
- **Build Status**: **`✓ Compiled successfully`** (All 87 routes generated on compile).

### Supabase Connectivity Check
- **GoTrue API Auth & Service Role**: Verified healthy and responsive.
- **Auth User Syncing**: Handled seamlessly by `/api/auth/handoff` to map database users to auth records.
- **Health Status**: **`✓ ok`** (Checks validated successfully).

### Linting & Tests
- **Unit & Integration Suite**: All 95 tests pass successfully (covering role isolation, credentials, and seed data).
- **Linter Status**: Fully ESLint 9 Flat Config compliant (0 errors).

---

## 🛠️ Local Development

Install the package dependencies:
```bash
npm install
```

Start the local development server:
```bash
npm run dev
```

Run linter checks:
```bash
npm run lint
```

Execute tests:
```bash
npm test
```

---
© 2026 ESB PowerLine. All rights reserved.

