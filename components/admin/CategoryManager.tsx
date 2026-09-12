'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createCategory,
  deleteCategory,
  moveCategory,
  updateCategory,
} from '@/lib/actions/categories';
import {
  Trash2, Plus, FolderOpen, Pencil, ChevronUp, ChevronDown,
  X, Check, ExternalLink, FileText, Upload, ImageIcon,
} from 'lucide-react';
import { AdminCard } from './AdminUI';
import { cn, formatNumber, slugify } from '@/lib/utils';
import { CATEGORY_ICON_OPTIONS } from '@/lib/category-icons';
import { CategoryIconDisplay } from '@/components/category/CategoryIconDisplay';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { AdminSecureActionDialog } from '@/components/admin/AdminSecureActionDialog';
import { resizeCategoryIconFile } from '@/lib/category-image';
import { usePublicSiteOrigin } from '@/hooks/usePublicSiteOrigin';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  iconImageUrl?: string | null;
  order: number;
  articleCount: number;
};

const PRESET_COLORS = [
  '#1e40af', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9',
  '#ef4444', '#14b8a6', '#eab308', '#6366f1', '#ec4899',
];

type IconMode = 'lucide' | 'custom';

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const publicSiteOrigin = usePublicSiteOrigin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('Zap');
  const [editIconMode, setEditIconMode] = useState<IconMode>('lucide');
  const [editIconImageUrl, setEditIconImageUrl] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [movingId, setMovingId] = useState<string | null>(null);
  const [secureDeleteOpen, setSecureDeleteOpen] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createCategory({ name: name.trim() });
      toast.success('Category created');
      setName('');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(cat: CategoryRow) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description ?? '');
    setEditColor(cat.color ?? '');
    setEditIcon(cat.icon ?? 'Zap');
    setEditIconImageUrl(cat.iconImageUrl ?? null);
    setEditIconMode(cat.iconImageUrl ? 'custom' : 'lucide');
    setDeleteTarget(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    setEditColor('');
    setEditIcon('Zap');
    setEditIconMode('lucide');
    setEditIconImageUrl(null);
  }

  async function handleIconUpload(file: File, categoryId: string) {
    setUploadingIcon(true);
    try {
      const resized = await resizeCategoryIconFile(file, 128);
      const form = new FormData();
      form.append('file', new File([resized], 'category-icon.png', { type: 'image/png' }));
      form.append('categoryId', categoryId);
      const res = await fetch('/api/upload/category-icon', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setEditIconImageUrl(data.url);
      setEditIconMode('custom');
      toast.success('Icon resized to 128×128 and uploaded');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingIcon(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) {
      toast.error('Name is required');
      return;
    }
    if (editIconMode === 'custom' && !editIconImageUrl) {
      toast.error('Upload a PNG icon or switch to built-in icons');
      return;
    }
    setLoading(true);
    try {
      await updateCategory(id, {
        name: editName.trim(),
        description: editDescription.trim(),
        color: editColor || null,
        ...(editIconMode === 'custom'
          ? { iconImageUrl: editIconImageUrl, icon: null }
          : { icon: editIcon, iconImageUrl: null }),
      });
      toast.success('Category updated — site navigation and articles synced');
      cancelEdit();
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    setMovingId(id);
    try {
      await moveCategory(id, direction);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to move');
    } finally {
      setMovingId(null);
    }
  }

  async function handleDeleteConfirmed(payload: { password?: string; authorNote?: string }) {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteCategory(deleteTarget.id, {
        reassignToId: reassignTo || undefined,
        password: payload.password,
        authorNote: payload.authorNote,
      });
      toast.success('Category deleted — affected authors notified');
      setDeleteTarget(null);
      setReassignTo('');
      setSecureDeleteOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-category-manager">
      {/* One card holding one list — the shape of the CMS Categories page.
          This was a bare form above a stack of separately bordered row
          panels 0.5rem apart, and shared no layout with the CMS page at all. */}
      <AdminCard
        title={`${formatNumber(categories.length)} ${categories.length === 1 ? 'category' : 'categories'}`}
        icon={FolderOpen}
        action={
          <form onSubmit={handleCreate} className="admin-category-create">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New category name"
              className="h-8 text-[13px]"
            />
            <Button type="submit" disabled={loading} size="sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add
            </Button>
          </form>
        }
      >
        <p className="admin-card-lead text-[12px] text-muted-foreground">
          The order here is the order of the navbar, the footer and the /categories page.
        </p>

      <div className="admin-category-list">
        {categories.map((c, index) => {
          const isEditing = editingId === c.id;
          const isDeleting = deleteTarget?.id === c.id;

          return (
            <div key={c.id} className="admin-category-row">
              <div className={cn('admin-category-row-main', isEditing && 'admin-category-row-main--editing')}>
                <div className="admin-category-move">
                  <ModernTooltip label="Move up" side="top">
                    <button
                      type="button"
                      className="admin-category-move-btn"
                      disabled={index === 0 || movingId === c.id}
                      onClick={() => handleMove(c.id, 'up')}
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                  </ModernTooltip>
                  <ModernTooltip label="Move down" side="top">
                    <button
                      type="button"
                      className="admin-category-move-btn"
                      disabled={index === categories.length - 1 || movingId === c.id}
                      onClick={() => handleMove(c.id, 'down')}
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </ModernTooltip>
                </div>

                <span
                  className="admin-category-icon-preview"
                  style={c.color ? { color: c.color, backgroundColor: `${c.color}18`, borderColor: `${c.color}35` } : undefined}
                >
                  <CategoryIconDisplay
                    icon={c.icon}
                    iconImageUrl={c.iconImageUrl}
                    name={c.name}
                    size={16}
                  />
                </span>

                <div className="admin-category-info min-w-0 flex-1">
                  {isEditing ? (
                    <div className="admin-category-edit-form">
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div>
                          <label className="admin-category-label">Name</label>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-[13px]"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                            Slug: {slugify(editName || c.name)}
                          </p>
                        </div>
                        <div>
                          <label className="admin-category-label">Color</label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                              placeholder="#1e40af"
                              className="h-8 text-[13px] font-mono"
                            />
                            <input
                              type="color"
                              value={editColor || '#1e40af'}
                              onChange={(e) => setEditColor(e.target.value)}
                              className="admin-category-color-input"
                              aria-label="Pick color"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {PRESET_COLORS.map((color) => (
                              <ModernTooltip key={color} label={color} hint="Preset color">
                                <button
                                  type="button"
                                  className="admin-category-preset"
                                  style={{ backgroundColor: color }}
                                  onClick={() => setEditColor(color)}
                                  aria-label={`Use ${color}`}
                                />
                              </ModernTooltip>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="admin-category-label">Icon</label>
                        <div className="admin-category-icon-mode">
                          <button
                            type="button"
                            className={`admin-category-icon-mode-btn ${editIconMode === 'lucide' ? 'admin-category-icon-mode-btn--active' : ''}`}
                            onClick={() => setEditIconMode('lucide')}
                          >
                            Built-in
                          </button>
                          <button
                            type="button"
                            className={`admin-category-icon-mode-btn ${editIconMode === 'custom' ? 'admin-category-icon-mode-btn--active' : ''}`}
                            onClick={() => setEditIconMode('custom')}
                          >
                            Custom PNG
                          </button>
                        </div>

                        {editIconMode === 'lucide' ? (
                          <div className="admin-category-icon-grid">
                            {CATEGORY_ICON_OPTIONS.map(({ key, label, Icon }) => (
                              <ModernTooltip key={key} label={label} hint={key}>
                                <button
                                  type="button"
                                  className={`admin-category-icon-option ${editIcon === key ? 'admin-category-icon-option--active' : ''}`}
                                  onClick={() => {
                                    setEditIcon(key);
                                    setEditIconImageUrl(null);
                                  }}
                                  aria-label={label}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </button>
                              </ModernTooltip>
                            ))}
                          </div>
                        ) : (
                          <div className="admin-category-custom-icon">
                            <div className="admin-category-custom-icon-preview">
                              {editIconImageUrl ? (
                                <img src={editIconImageUrl} alt="" className="admin-category-custom-icon-img" />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="admin-category-custom-icon-meta">
                              <p className="text-[11px] text-muted-foreground">
                                PNG auto-resized to <strong>128×128</strong> for navbar, cards, and mobile.
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleIconUpload(file, c.id);
                                  }}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={uploadingIcon}
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                                  {uploadingIcon ? 'Processing…' : 'Upload PNG'}
                                </Button>
                                {editIconImageUrl && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditIconImageUrl(null)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        <label className="admin-category-label">Description</label>
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Short blurb for the public categories page"
                          className="h-8 text-[13px]"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Color and icon appear on the navbar, /categories, and homepage. Renaming updates all {formatNumber(c.articleCount)} linked article(s).
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold">{c.name}</span>
                        <span className="admin-category-badge">
                          <FileText className="h-3 w-3" />
                          {formatNumber(c.articleCount)}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">/{c.slug}</div>
                      {c.description && (
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{c.description}</div>
                      )}
                    </>
                  )}
                </div>

                <div className="admin-category-actions">
                  {isEditing ? (
                    <>
                      <ModernTooltip label="Save changes">
                        <button type="button" className="admin-category-action-btn admin-category-action-btn--save" disabled={loading} onClick={() => handleSaveEdit(c.id)}>
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </ModernTooltip>
                      <ModernTooltip label="Cancel">
                        <button type="button" className="admin-category-action-btn" onClick={cancelEdit}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </ModernTooltip>
                    </>
                  ) : (
                    <>
                      <ModernTooltip label="View on site">
                        <a
                          href={`${publicSiteOrigin}/categories/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-category-action-btn"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </ModernTooltip>
                      <ModernTooltip label="Edit category">
                        <button type="button" className="admin-category-action-btn" onClick={() => startEdit(c)} aria-label={`Edit ${c.name}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </ModernTooltip>
                      <ModernTooltip label="Delete category">
                        <button
                          type="button"
                          className="admin-category-action-btn admin-category-action-btn--danger"
                          onClick={() => { setDeleteTarget(c); setReassignTo(''); setEditingId(null); }}
                          aria-label={`Delete ${c.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </ModernTooltip>
                    </>
                  )}
                </div>
              </div>

              {isDeleting && (
                <div className="admin-category-delete-panel">
                  <p className="text-[12px]">
                    Delete <strong>{c.name}</strong>?
                    {c.articleCount > 0 && (
                      <> Reassign {formatNumber(c.articleCount)} article(s) to another category first.</>
                    )}
                  </p>
                  {c.articleCount > 0 && (
                    <select
                      value={reassignTo}
                      onChange={(e) => setReassignTo(e.target.value)}
                      className="admin-category-reassign"
                    >
                      <option value="">Select category…</option>
                      {categories.filter((x) => x.id !== c.id).map((x) => (
                        <option key={x.id} value={x.id}>{x.name}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/40 hover:bg-destructive/10"
                      disabled={loading || (c.articleCount > 0 && !reassignTo)}
                      onClick={() => setSecureDeleteOpen(true)}
                    >
                      Delete
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {categories.length === 0 && (
          <p className="text-[13px] text-muted-foreground py-2">No categories yet — add the first one above.</p>
        )}
      </div>
      </AdminCard>

      <AdminSecureActionDialog
        open={secureDeleteOpen && !!deleteTarget}
        title={`Delete “${deleteTarget?.name ?? 'category'}”?`}
        description="This removes the category from the public site. Authors with affected articles will be notified."
        confirmLabel="Delete category"
        requirePassword
        showAuthorNote
        authorNoteLabel="Note for affected authors (optional)"
        authorNotePlaceholder="Explain why the category was removed or what authors should update…"
        loading={loading}
        onClose={() => setSecureDeleteOpen(false)}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}