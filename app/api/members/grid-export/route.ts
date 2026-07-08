import { NextResponse } from 'next/server';
import { getMemberSession } from '@/lib/member-session';
import { resolvePrismaUserId } from '@/lib/resolve-prisma-user-id';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
    const safeMetric = s.statName.includes(',') ? `"${s.statName}"` : s.statName;
    const safeUnit = s.unit ? (s.unit.includes(',') ? `"${s.unit}"` : s.unit) : '';
    const safeSource = source.includes(',') ? `"${source}"` : source;
    csvRows.push(`${safeMetric},${val},${safeUnit},${safeSource},${asOf}`);
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