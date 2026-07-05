import { NextResponse } from 'next/server';
import { getMemberSession } from '@/lib/member-session';
import { resolvePrismaUserId } from '@/lib/resolve-prisma-user-id';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
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

  const downloads = await prisma.memberDownload.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, label: true, fileUrl: true, createdAt: true },
  });

  return NextResponse.json(downloads);
}