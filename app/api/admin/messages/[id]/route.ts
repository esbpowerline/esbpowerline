import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { canAccessAdminPanel } from '@/lib/constants';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.role || !canAccessAdminPanel(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let read: boolean;
  try {
    const body = await request.json();
    if (typeof body?.read !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    read = body.read;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { read: !!read },
    });
    return NextResponse.json({ success: true, message: updated });
  } catch (error) {
    console.error('Failed to update message:', error);
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.role || !canAccessAdminPanel(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.contactMessage.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete message:', error);
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }
}
