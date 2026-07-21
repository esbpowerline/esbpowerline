'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { revalidateMagazineContent } from '@/lib/revalidate-tags';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'settings.edit')) throw new Error('Forbidden');
  return session.user;
}

export async function getMagazineIssues() {
  await requireAdmin();
  return prisma.magazineIssue.findMany({ orderBy: { issueDate: 'desc' } });
}

export async function createMagazineIssue(data: {
  title: string;
  issueDate: string;
  coverUrl?: string;
  pdfUrl?: string;
  summary?: string;
  status?: string;
}) {
  await requireAdmin();
  const issue = await prisma.magazineIssue.create({
    data: {
      title: data.title,
      issueDate: new Date(data.issueDate),
      coverUrl: data.coverUrl,
      pdfUrl: data.pdfUrl,
      summary: data.summary,
      status: data.status ?? 'published',
    },
  });
  revalidatePath('/admin/magazine');
  revalidatePath('/');
  revalidatePath('/magazine');
  revalidateMagazineContent();
  return issue;
}

export async function updateMagazineIssue(id: string, data: Partial<{
  title: string; issueDate: string; coverUrl: string; pdfUrl: string; summary: string; status: string;
}>) {
  await requireAdmin();
  const issue = await prisma.magazineIssue.update({
    where: { id },
    data: {
      ...data,
      ...(data.issueDate ? { issueDate: new Date(data.issueDate) } : {}),
    },
  });
  revalidatePath('/admin/magazine');
  revalidatePath('/');
  revalidatePath('/magazine');
  revalidateMagazineContent();
  return issue;
}

export async function deleteMagazineIssue(id: string) {
  await requireAdmin();
  await prisma.magazineIssue.delete({ where: { id } });
  revalidatePath('/admin/magazine');
  revalidatePath('/');
  revalidatePath('/magazine');
  revalidateMagazineContent();
}