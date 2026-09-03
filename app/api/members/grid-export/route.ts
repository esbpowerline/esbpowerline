import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { resolvePrismaUserId } from '@/lib/resolve-prisma-user-id';
import prisma from '@/lib/prisma';
import { getRuntimeLatestDate, getRuntimeAvailableDates } from '@/lib/data/grid/available-dates.server';
import {
  resolveGridAccessTier,
  parseGridPlanId,
  GRID_TIER_LIMITS,
} from '@/lib/data/grid/grid-tier-access';
import {
  parseDatasetKeys,
  parseColumnSelection,
  isPetrobanglaKey,
  GRID_EXPORT_DATASETS,
  type PetrobanglaIndexDayInput,
} from '@/lib/data/grid/grid-export-datasets';
import {
  resolveExportDates,
  buildExportTables,
  loadPetrobanglaIndexDays,
  tableToCsv,
  tablesToZip,
  tablesToXlsx,
  type ExportMeta,
} from '@/lib/data/grid/grid-export.server';
import { checkGridExportRateLimit, GRID_EXPORT_LIMITS } from '@/lib/data/grid/grid-export-rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Cap runaway compute — a single export can never bill more than this on Vercel.
export const maxDuration = 60;

type ExportFormat = 'csv' | 'xlsx' | 'pdf';

function sanitizeFilename(part: string): string {
  return part.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formatParam = (searchParams.get('format') ?? 'csv').toLowerCase();
  if (formatParam !== 'csv' && formatParam !== 'xlsx' && formatParam !== 'pdf') {
    return NextResponse.json(
      { error: 'Unsupported format. Choose CSV, Excel or PDF.' },
      { status: 400 },
    );
  }
  const format = formatParam as ExportFormat;

  const latestDate = await getRuntimeLatestDate();
  if (!latestDate) {
    return NextResponse.json({ error: 'No grid data is available yet.' }, { status: 503 });
  }

  // Resolve the member's grid entitlement (role + purchased plan).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const gridPlan = parseGridPlanId(user?.app_metadata?.grid_plan);
  const tier = resolveGridAccessTier({
    isAuthenticated: true,
    role: session.user.role,
    gridPlan,
  });

  // Resolve the member's Prisma id — needed for both the rate limiter and the log.
  let userId: string;
  try {
    userId = await resolvePrismaUserId(session.user.id, session.user.email);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cost safety net: throttle expensive exports per user BEFORE reading any files
  // or rendering, so a blocked (spam) request costs next to nothing on Vercel.
  // Fail-open on a transient DB error — the middleware IP limiter and the client
  // cooldown remain as backstops, and we'd rather not 500 a legitimate download.
  const rate = await checkGridExportRateLimit(userId).catch(() => null);
  if (rate && !rate.allowed) {
    const message =
      rate.scope === 'day'
        ? `Daily download limit reached (${GRID_EXPORT_LIMITS.perDay} per day). Please try again later.`
        : "You're downloading too quickly — please wait a moment and try again.";
    return NextResponse.json(
      { error: message, retryAfter: rate.retryAfterSeconds, scope: rate.scope },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': String(rate.retryAfterSeconds),
        },
      },
    );
  }

  const datasetKeys = parseDatasetKeys(searchParams.get('datasets'));
  const columnSelection = parseColumnSelection(searchParams, datasetKeys);
  // The runtime catalog, not the bundled one: `latestDate` above is already
  // runtime, but without the matching catalog the resolver fell back to the
  // build-time list and silently dropped every day published since the last
  // deploy from a paid export. The Petrobangla branch below always passed its
  // own catalog; this one did not.
  const scope = resolveExportDates(
    { from: searchParams.get('from'), to: searchParams.get('to') },
    tier,
    latestDate,
    await getRuntimeAvailableDates(),
  );

  // Petrobangla datasets are read from a separate archive with its own catalog.
  let pbDates: string[] = [];
  let pbIndexDays: PetrobanglaIndexDayInput[] = [];
  if (datasetKeys.some(isPetrobanglaKey)) {
    pbIndexDays = await loadPetrobanglaIndexDays();
    const pbCatalog = pbIndexDays
      .map((d) => d.date)
      .filter((d): d is string => Boolean(d))
      .sort();
    const pbLatest = pbCatalog[pbCatalog.length - 1];
    if (pbLatest) {
      pbDates = resolveExportDates(
        { from: searchParams.get('from'), to: searchParams.get('to') },
        tier,
        pbLatest,
        pbCatalog,
      ).dates;
    }
  }

  const tables = await buildExportTables({
    keys: datasetKeys,
    gridDates: scope.dates,
    pbDates,
    pbIndexDays,
    columnSelection,
    tier,
  });

  // Note when full-history financial series were trimmed for the member's tier.
  const staticClamped = tables.some((t) => {
    const def = GRID_EXPORT_DATASETS[t.key];
    return def.kind === 'static' && t.rows.length < def.rows().length;
  });

  // Log the download (best-effort — never block the file on a logging failure).
  // This row is also what the rate limiter counts, so it must land on success.
  try {
    await prisma.memberDownload.create({
      data: {
        userId,
        label: `Grid export (${format.toUpperCase()} · ${scope.from}→${scope.to})`,
        fileUrl: '/api/members/grid-export',
      },
    });
  } catch {
    // ignore
  }

  const tierLimits = GRID_TIER_LIMITS[tier];
  const rangeNote = scope.clamped
    ? scope.clampReason === 'tier'
      ? `Range was capped to your ${tierLimits.label} access window (${tierLimits.shortLabel}). Upgrade for deeper history.`
      : scope.clampReason === 'cap'
        ? `Range was limited to the ${scope.dates.length} most recent report days.`
        : 'Range was limited to the dates available in the archive.'
    : null;
  const staticNote = staticClamped
    ? 'Financial series show recent history only on your plan — upgrade for the full archive.'
    : null;
  const clampNote = [rangeNote, staticNote].filter(Boolean).join(' ') || null;

  // HTTP header values must be Latin-1 — an em dash (U+2014) in a note crashes
  // NextResponse. ASCII-fold for the header; the PDF/Excel keep full typography.
  const headerSafe = (s: string) => s.replace(/[–—]/g, '-').replace(/[^\x20-\x7E]/g, '');

  const baseHeaders: Record<string, string> = {
    'Cache-Control': 'no-store',
    'X-Export-From': scope.from,
    'X-Export-To': scope.to,
    'X-Export-Days': String(scope.dates.length),
    'X-Export-Clamped': scope.clamped ? '1' : '0',
    ...(clampNote ? { 'X-Export-Note': headerSafe(clampNote) } : {}),
  };

  const rangeTag = `${sanitizeFilename(scope.from)}_${sanitizeFilename(scope.to)}`;

  const meta: ExportMeta = {
    memberName: session.user.name ?? 'Member',
    tierLabel: tierLimits.label,
    from: scope.from,
    to: scope.to,
    generatedAt: new Date().toISOString(),
    clampNote,
  };

  if (format === 'csv') {
    // Single dataset → one CSV; multiple → a ZIP of per-dataset CSVs + summary digest.
    if (tables.length === 1) {
      return new NextResponse(tableToCsv(tables[0]), {
        headers: {
          ...baseHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="esb-grid-${tables[0].key}-${rangeTag}.csv"`,
        },
      });
    }
    const zip = await tablesToZip(tables, meta);
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        ...baseHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="esb-grid-export-${rangeTag}.zip"`,
      },
    });
  }

  if (format === 'pdf') {
    const { renderGridPdf } = await import('@/lib/data/grid/grid-export-pdf.server');
    const pdf = await renderGridPdf(tables, meta);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        ...baseHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="esb-grid-report-${rangeTag}.pdf"`,
      },
    });
  }

  const xlsx = await tablesToXlsx(tables, meta);
  return new NextResponse(new Uint8Array(xlsx), {
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="esb-grid-export-${rangeTag}.xlsx"`,
    },
  });
}
