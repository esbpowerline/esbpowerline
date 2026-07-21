import { NextResponse } from 'next/server';
import { getMemberSession } from '@/lib/member-session';
import { resolvePrismaUserId } from '@/lib/resolve-prisma-user-id';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * RFC-4180 CSV field escaping, plus spreadsheet formula-injection neutralization:
 * a leading =, +, -, @, tab or CR is prefixed with a quote so Excel/Sheets treats
 * the cell as text rather than a formula.
 */
function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const sinceParam = searchParams.get('since');
  
  const take = limitParam ? Math.min(parseInt(limitParam, 10), 1000) : 500;
  
  let dateFilter = {};
  if (sinceParam) {
    const sinceDate = new Date(sinceParam);
    if (!isNaN(sinceDate.getTime())) {
      dateFilter = { updatedAt: { gte: sinceDate } };
    }
  }
  const memberSession = await getMemberSession();
  if (!memberSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId: string;
  try {
    userId = await resolvePrismaUserId(memberSession.user.id, memberSession.user.email);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.memberDownload.create({
    data: {
      userId,
      label: 'Grid snapshot (CSV)',
      fileUrl: '/api/members/grid-export',
    },
  });

  const stats = await prisma.dashboardStat.findMany({
    where: dateFilter,
    orderBy: { statName: 'asc' },
    take,
  });

  const csvRows = ['metric,value,unit,source,as_of'];

  for (const s of stats) {
    const val = s.calculatedValue !== null && s.calculatedValue !== undefined ? s.calculatedValue : s.value;
    const asOf = s.lastVerified || s.updatedAt.toISOString().split('T')[0];
    const source = s.source || 'BPDB/NLDC';
    csvRows.push(
      [s.statName, val, s.unit, source, asOf].map(csvField).join(','),
    );
  }

  if (stats.length === 0) {
    return new NextResponse('metric,value,unit,source,as_of\n', {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="esb-grid-snapshot.csv"',
      },
    });
  }

  const csv = csvRows.join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="esb-grid-snapshot.csv"',
    },
  });
}