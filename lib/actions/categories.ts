'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { slugify } from '@/lib/utils';
import { revalidateCategoryContent } from '@/lib/revalidate-tags';
import { CATEGORY_ICON_OPTIONS } from '@/lib/category-icons';
import { verifyAdminPassword } from '@/lib/actions/auth-verify';
import { requireEditorialReader } from '@/lib/server-auth';

async function requireEditor() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'category.manage')) throw new Error('Forbidden');
  return session.user;
}

function revalidateCategoryPaths(...slugs: (string | undefined)[]) {
  revalidatePath('/categories');
  revalidatePath('/admin/categories');
  revalidatePath('/');
  revalidatePath('/articles');
  revalidatePath('/cms/articles');
  for (const slug of slugs) {
    if (slug) revalidatePath(`/categories/${slug}`);
  }
  revalidateCategoryContent();
}

export async function getCategories() {
  await requireEditorialReader();
  return prisma.category.findMany({ orderBy: { order: 'asc' } });
}

export async function getCategoriesWithCounts() {
  await requireEditorialReader();
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
    prisma.article.groupBy({
      by: ['category'],
      _count: { category: true },
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.category, c._count.category]));

  return categories.map((c) => ({
    ...c,
    articleCount: countMap[c.name] ?? 0,
  }));
}

const VALID_ICON_KEYS = new Set(CATEGORY_ICON_OPTIONS.map((o) => o.key));

function normalizeIcon(icon?: string | null) {
  if (!icon?.trim()) return null;
  const key = icon.trim();
  return VALID_ICON_KEYS.has(key) ? key : null;
}

export async function createCategory(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  iconImageUrl?: string | null;
}) {
  await requireEditor();
  const name = data.name.trim();
  if (!name) throw new Error('Name is required');

  const slug = slugify(name);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  if (existing) throw new Error('A category with this name already exists');

  const maxOrder = await prisma.category.aggregate({ _max: { order: true } });
  const cat = await prisma.category.create({
    data: {
      name,
      slug,
      description: data.description?.trim() || null,
      color: data.color || null,
      icon: data.iconImageUrl ? null : normalizeIcon(data.icon),
      iconImageUrl: data.iconImageUrl?.trim() || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidateCategoryPaths(cat.slug);
  return cat;
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    description?: string;
    color?: string | null;
    icon?: string | null;
    iconImageUrl?: string | null;
  }
) {
  await requireEditor();
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new Error('Category not found');

  const updateData: {
    name?: string;
    slug?: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
    iconImageUrl?: string | null;
  } = {};

  if (data.description !== undefined) {
    updateData.description = data.description.trim() || null;
  }
  if (data.color !== undefined) {
    updateData.color = data.color || null;
  }
  if (data.iconImageUrl !== undefined) {
    updateData.iconImageUrl = data.iconImageUrl?.trim() || null;
    if (data.iconImageUrl) updateData.icon = null;
  }
  if (data.icon !== undefined) {
    updateData.icon = normalizeIcon(data.icon);
    if (normalizeIcon(data.icon)) updateData.iconImageUrl = null;
  }

  const oldSlug = existing.slug;
  const oldName = existing.name;

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) throw new Error('Name is required');
    if (name !== existing.name) {
      const slug = slugify(name);
      const conflict = await prisma.category.findFirst({
        where: { OR: [{ name }, { slug }], NOT: { id } },
      });
      if (conflict) throw new Error('Another category already uses this name');

      updateData.name = name;
      updateData.slug = slug;

      await prisma.article.updateMany({
        where: { categoryId: existing.id },
        data: { category: name, categoryId: existing.id },
      });
    }
  }

  const cat = await prisma.category.update({ where: { id }, data: updateData });
  revalidateCategoryPaths(oldSlug, cat.slug);
  return cat;
}

export async function reorderCategories(orderedIds: string[]) {
  await requireEditor();
  if (!orderedIds.length) return;

  const existing = await prisma.category.findMany({ select: { id: true } });
  if (existing.length !== orderedIds.length) {
    throw new Error('Invalid category order');
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.update({ where: { id }, data: { order: index } })
    )
  );

  revalidateCategoryPaths();
}

export async function moveCategory(id: string, direction: 'up' | 'down') {
  await requireEditor();
  const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } });
  const index = categories.findIndex((c) => c.id === id);
  if (index < 0) throw new Error('Category not found');

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= categories.length) return;

  await prisma.$transaction([
    prisma.category.update({ where: { id: categories[index].id }, data: { order: swapIndex } }),
    prisma.category.update({ where: { id: categories[swapIndex].id }, data: { order: index } }),
  ]);

  revalidateCategoryPaths();
}

export async function deleteCategory(
  id: string,
  options?: { reassignToId?: string; password?: string; authorNote?: string }
) {
  const user = await requireEditor();
  await verifyAdminPassword(options?.password ?? '');

  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw new Error('Category not found');

  const affectedArticles = await prisma.article.findMany({
    where: { categoryId: cat.id },
    select: { id: true, title: true, authorId: true },
  });

  if (affectedArticles.length > 0) {
    if (!options?.reassignToId) {
      throw new Error(`This category has ${affectedArticles.length} article(s). Reassign them before deleting.`);
    }
    if (options.reassignToId === id) throw new Error('Choose a different category to reassign articles');

    const target = await prisma.category.findUnique({ where: { id: options.reassignToId } });
    if (!target) throw new Error('Reassign target not found');

    await prisma.article.updateMany({
      where: { categoryId: cat.id },
      data: { category: target.name, categoryId: target.id },
    });

    const note =
      options.authorNote?.trim()
      || `Category "${cat.name}" was removed. Your article was moved to "${target.name}". Please review and update if needed.`;

    await prisma.$transaction(
      affectedArticles.map((article) =>
        prisma.editorialNotice.create({
          data: {
            type: 'CATEGORY_CHANGED',
            message: note,
            recipientId: article.authorId,
            senderId: user.id,
            articleId: article.id,
            metadata: {
              articleTitle: article.title,
              fromCategory: cat.name,
              toCategory: target.name,
            },
          },
        })
      )
    );
  }

  await prisma.category.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      type: 'category.delete',
      message: `Deleted category "${cat.name}"`,
      userId: user.id,
    },
  });

  revalidateCategoryPaths(cat.slug);
  revalidatePath('/cms');
}