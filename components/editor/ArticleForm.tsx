'use client';

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/utils/supabase/auth-context';
import { cmsToast, resolveArticleSaveIntent } from '@/lib/cms-toast';
import dynamic from 'next/dynamic';

const TipTapEditor = dynamic(
  () => import('./TipTapEditor').then((m) => m.TipTapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="tiptap-editor" aria-busy="true" aria-label="Loading editor">
        <div className="tiptap-toolbar tiptap-toolbar--loading" />
        <div className="tiptap-editor__body tiptap-editor__body--loading">
          <div className="h-4 w-3/4 rounded bg-muted/50 animate-pulse" />
          <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-muted/40 animate-pulse" />
        </div>
      </div>
    ),
  },
);
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CmsPlacementIcon } from '@/components/cms/CmsPlacementIcon';
import { CmsPlacementSwitch } from '@/components/cms/CmsPlacementSwitch';
import { PLACEMENT_FLAGS } from '@/lib/article-placement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createArticle, updateArticle, deleteArticle } from '@/lib/actions/articles';

import { submitDraftForAdminReview } from '@/lib/actions/review-workflow';
import { can, type Role } from '@/lib/constants';
import { DELETE_PHRASE, requiresDeletePhrase } from '@/lib/article-delete';
import { canSubmitArticleForReview } from '@/lib/editorial-review';
import type { PublicCategory } from '@/lib/category-types';
import { slugify, cn, autoCalculateCategory } from '@/lib/utils';
import { suggestArticleKeywords } from '@/lib/article-keywords';
import type { MediaItem } from '@/components/cms/MediaPicker';
import { FeaturedImageEditor } from '@/components/cms/FeaturedImageEditor';
import type { HeroImageMeta } from '@/lib/hero-image';
import { ArticlePreviewPanel, type PreviewDevice } from '@/components/editor/ArticlePreviewPanel';
import { PreviewThemeToggle } from '@/components/editor/PreviewThemeToggle';
import { RevisionHistory } from '@/components/cms/RevisionHistory';
import { AdminSecureActionDialog } from '@/components/admin/AdminSecureActionDialog';
import type { SiteTheme } from '@/lib/site-theme';
import { CmsFormSelect } from '@/components/cms/CmsFormSelect';
import { CmsCategorySelect } from '@/components/cms/CmsCategorySelect';
import { CmsDateTimePicker } from '@/components/cms/CmsDateTimePicker';
import { ModernTooltip } from '@/components/shared/ModernTooltip';
import { CharBudgetHint } from '@/components/editor/CharBudgetHint';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { LiveArticleLink } from '@/components/shared/LiveArticleLink';
import { ArticleAuthorSticky } from '@/components/shared/ArticleAuthorSticky';
import { EditorCollaborators } from '@/components/editor/EditorCollaborators';
import { getStaffForCollaboration } from '@/lib/actions/users';
import { HEADLINE_BUDGET, EXCERPT_BUDGET, SLUG_BUDGET, needsShortTitle } from '@/lib/editorial-limits';
import {
  formatPublishBlockerMessage,
  getPublishBlockers,
  requiresPublishValidation,
  stripArticleHtml,
} from '@/lib/validations/article';
import { useCmsArticleEditor } from '@/components/cms/CmsArticleEditorContext';
import { useEditorPreferences } from '@/components/cms/EditorPreferencesProvider';
import { datetimeLocalToISO, toDatetimeLocal } from '@/lib/datetime-local';
import {
  Eye, Save, Send, Clock, History, Sparkles, Tag, Layers, Globe, FileText,
  FolderOpen, Archive, Link2, PenLine, ShieldCheck, Camera, Focus, X,
  Settings, Pin, LayoutGrid, Star, Flame, Facebook, Newspaper, Monitor,
  Tablet, Smartphone, Info,
  Trash2,
} from 'lucide-react';

type ArticleFormPermissions = {
  canPublish?: boolean;
  canFeature?: boolean;
  canBreaking?: boolean;
  canPin?: boolean;
  canTrend?: boolean;
};

interface ArticleFormProps {
  mode: 'create' | 'edit';
  permissions?: ArticleFormPermissions;
  mediaItems?: MediaItem[];
  writeMeta?: {
    title: string;
    subtitle?: string;
    status?: string;
    showLiveLink?: boolean;
    showBackLink?: boolean;
  };
  article?: {
    id: string;
    authorId?: string;
    title: string;
    shortTitle?: string | null;
    slug: string;
    excerpt?: string | null;
    content: string;
    category: string;
    status: string;
    imageUrl?: string | null;
    imageCredit?: string | null;
    tags?: unknown;

    collaboratorIds?: unknown;
    isFeatured: boolean;
    isBreaking: boolean;
    isPinned?: boolean;
    isTrending?: boolean;
    postAsNewsDesk?: boolean;
    publishedAt?: string | Date | null;
    seo?: unknown;
  };
  revisions?: {
    id: string;
    content: string;
    note: string | null;
    createdAt: Date;
  }[];
}

type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
};

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', description: 'Work in progress, not visible' },
  { value: 'IN_REVIEW', label: 'In review', description: 'Awaiting admin approval' },
  { value: 'PUBLISHED', label: 'Published', description: 'Live on the public site' },
  { value: 'SCHEDULED', label: 'Scheduled', description: 'Go live when date passes (cron or manual publish)' },
  { value: 'ARCHIVED', label: 'Archived', description: 'Removed from live site' },
];



export function ArticleForm({
  mode,
  article,
  categories = [],
  mediaItems = [],
  permissions = {},
  writeMeta,
  revisions = [],
}: ArticleFormProps & { categories?: Pick<PublicCategory, 'name' | 'color' | 'icon' | 'iconImageUrl'>[] }) {
  const {
    canPublish = true,
    canFeature = true,
    canBreaking = true,
    canPin = true,
    canTrend = true,
  } = permissions;
  const categoryOptions = categories.map((c) => c.name);
  const hasCategories = categoryOptions.length > 0;
  const router = useRouter();
  const { data: session } = useSession();
  const editorCtx = useCmsArticleEditor();
  const { showGuidanceHints } = useEditorPreferences();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [focusMode, setFocusMode] = useState(false);
  const [previewPlacement, setPreviewPlacement] = useState<'article' | 'carousel' | 'card' | 'coverage-hero' | 'trending' | 'facebook'>('article');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [previewTheme, setPreviewTheme] = useState<SiteTheme>('midnight');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [slugTouched, setSlugTouched] = useState(mode === 'edit');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    setLoadingStaff(true);
    getStaffForCollaboration()
      .then((data) => setStaff(data))
      .catch(() => setStaff([]))
      .finally(() => setLoadingStaff(false));
  }, []);


  const [title, setTitle] = useState(article?.title ?? '');
  const [shortTitle, setShortTitle] = useState(article?.shortTitle ?? '');
  const [slug, setSlug] = useState(article?.slug ?? '');
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '');
  const [content, setContent] = useState(article?.content ?? '<p></p>');
  const [category, setCategory] = useState(() => {
    const initial = article?.category;
    if (initial && categoryOptions.includes(initial)) return initial;
    return categoryOptions[0] ?? '';
  });
  const [status, setStatus] = useState(article?.status ?? 'DRAFT');
  const [imageUrl, setImageUrl] = useState(article?.imageUrl ?? '');
  const [imageCredit, setImageCredit] = useState(article?.imageCredit ?? '');
  const [tagsList, setTagsList] = useState<string[]>(
    Array.isArray(article?.tags)
      ? (article.tags as string[])
      : []
  );
  const [tagInput, setTagInput] = useState('');
  const [postAsNewsDesk, setPostAsNewsDesk] = useState(article?.postAsNewsDesk ?? false);

  const [collaboratorIds, setCollaboratorIds] = useState<string[]>(
    Array.isArray(article?.collaboratorIds)
      ? (article.collaboratorIds as string[])
      : [],
  );
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(article?.isFeatured ?? false);
  const [isBreaking, setIsBreaking] = useState(article?.isBreaking ?? false);
  const [isPinned, setIsPinned] = useState(article?.isPinned ?? false);
  const [isTrending, setIsTrending] = useState(article?.isTrending ?? false);

  useEffect(() => {
    if (isFeatured || isBreaking) {
      setPreviewPlacement('carousel');
    } else if (isPinned) {
      setPreviewPlacement('coverage-hero');
    } else if (isTrending) {
      setPreviewPlacement('trending');
    } else {
      setPreviewPlacement('article');
    }
  }, [isFeatured, isBreaking, isPinned, isTrending]);

  const [publishedAt, setPublishedAt] = useState(() => toDatetimeLocal(article?.publishedAt));
  const articleSeo = (article?.seo ?? {}) as {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
    heroImage?: HeroImageMeta;
  };
  const [metaTitle, setMetaTitle] = useState(articleSeo.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(articleSeo.metaDescription ?? '');
  const [focusKeyword, setFocusKeyword] = useState(articleSeo.focusKeyword ?? '');
  const [heroMeta, setHeroMeta] = useState<HeroImageMeta>(articleSeo.heroImage ?? {});

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const defaultPublishedAtRef = useRef('');
  if (!publishedAt && isClient && !defaultPublishedAtRef.current) {
    defaultPublishedAtRef.current = toDatetimeLocal(new Date());
  }
  const resolvedPublishedAt = publishedAt || defaultPublishedAtRef.current;
  const authorName = session?.user?.name ?? 'ESB Staff';
  /**
   * Words in the body, as a reader would count them.
   *
   * The headline, deck and slug all carry a character budget, and the body —
   * the thing being written — had only a derived read time. Tags are stripped
   * first so markup is not counted as prose.
   */
  const bodyWordCount = useMemo(() => {
    const text = (content ?? '')
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&(?:#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, ' ')
      .trim();
    return text ? text.split(/\s+/).length : 0;
  }, [content]);

  const readTime = useMemo(
    () => Math.max(1, Math.ceil(stripArticleHtml(content).length / 1000)),
    [content],
  );

  const role = session?.user?.role as Role | undefined;
  const canSubmitForReview = canSubmitArticleForReview({
    role,
    userId: session?.user?.id,
    authorId: article?.authorId ?? '',
    collaboratorIds,
    status,
  });

  /* Mirrors `deleteArticle`: your own article needs `article.delete_own`,
     someone else's needs `article.delete_any`. The server decides; this only
     decides whether to offer the button, so the two must agree or an editor
     is shown an action that throws. */
  const isOwnArticle = Boolean(session?.user?.id && article?.authorId === session.user.id);
  const canDelete =
    mode === 'edit' &&
    Boolean(article?.id) &&
    status !== 'TRASH' &&
    can(role, isOwnArticle ? 'article.delete_own' : 'article.delete_any');
  const deleteNeedsPhrase = requiresDeletePhrase(status);

  const statusSelectOptions = useMemo(() => {
    return STATUS_OPTIONS.filter((opt) => {
      if (opt.value === 'PUBLISHED' || opt.value === 'SCHEDULED') return canPublish;
      if (opt.value === 'IN_REVIEW') {
        return status === 'IN_REVIEW' || can(role, 'admin.access');
      }
      return true;
    });
  }, [canPublish, role, status]);

  const buildSavePayload = useCallback(
    (saveStatus: string) => ({
      title,
      shortTitle: needsShortTitle(title) ? (shortTitle || undefined) : undefined,
      slug: slug || slugify(title),
      excerpt,
      content,
      category,
      status: saveStatus as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED' | 'TRASH' | 'IN_REVIEW',
      imageUrl: imageUrl || undefined,
      imageCredit: imageCredit || null,
      tags: tagsList.length > 0
        ? tagsList
        : suggestArticleKeywords(title, content),
      collaboratorIds,
      isFeatured,
      isBreaking,
      isPinned,
      isTrending,
      postAsNewsDesk,
      publishedAt: resolvedPublishedAt ? datetimeLocalToISO(resolvedPublishedAt) : null,
      seo: { metaTitle, metaDescription, focusKeyword, heroImage: heroMeta },
    }),
    [
      title, shortTitle, slug, excerpt, content, category, imageUrl, imageCredit, tagsList, collaboratorIds,
      isFeatured, isBreaking, isPinned, isTrending, postAsNewsDesk, resolvedPublishedAt, metaTitle, metaDescription,
      focusKeyword, heroMeta,
    ],
  );


  const handleDelete = useCallback(
    async (confirmation?: string) => {
      if (!article?.id) return;
      setLoading(true);
      try {
        await deleteArticle(article.id, { confirmation });
        setDeleteDialogOpen(false);
        cmsToast.success('Moved to trash', 'You can restore it from Editorial → Trash.');
        router.push('/cms/articles');
        router.refresh();
      } catch (error) {
        // The server's message names the reason — a missing phrase, a
        // permission, a row already gone — and is worth more than 'failed'.
        cmsToast.error('Could not delete', error instanceof Error ? error.message : 'Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [article?.id, router],
  );

  const handleSubmitForReview = useCallback(async () => {
    if (!article) return;
    setLoading(true);
    try {
      await updateArticle(article.id, buildSavePayload('DRAFT'));
      await submitDraftForAdminReview(article.id, reviewNote.trim() || undefined);
      setStatus('IN_REVIEW');
      setReviewDialogOpen(false);
      setReviewNote('');
      cmsToast.success(
        'Sent for admin review',
        'Your draft was saved and submitted to the editorial desk.',
      );
      router.refresh();
    } catch (e: unknown) {
      cmsToast.error(
        'Could not submit for review',
        e instanceof Error ? e.message : undefined,
      );
    } finally {
      setLoading(false);
    }
  }, [article, buildSavePayload, reviewNote, router]);

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }, [slugTouched]);

  const handleSlugChange = useCallback((value: string) => {
    setSlugTouched(true);
    setSlug(slugify(value));
  }, []);

  const handleSubmit = useCallback(async (publishStatus?: string) => {
    const previousStatus = status;
    const finalStatus = (publishStatus ?? status) as string;
    const intent = resolveArticleSaveIntent(publishStatus, previousStatus);

    if (!hasCategories || !category.trim()) {
      cmsToast.error(
        'Category required',
        'Choose a category from the admin list before saving.',
      );
      return;
    }

    if (requiresPublishValidation(finalStatus)) {
      const blockers = getPublishBlockers({ title, excerpt, content });
      if (blockers.length > 0) {
        cmsToast.error(formatPublishBlockerMessage(blockers), {
          description: 'Add a headline, deck, and story body before publishing or scheduling.',
        });
        return;
      }
    }

    setLoading(true);
    editorCtx?.setLoading(true);
    try {
      const data = buildSavePayload(finalStatus);

      const toastIntent = mode === 'create' && intent === 'save' ? 'create' : intent;

      if (mode === 'create') {
        const created = await createArticle(data);
        setStatus(finalStatus);
        cmsToast.articleSaved(toastIntent, 'create', finalStatus, previousStatus);
        router.push(`/cms/articles/${created.id}/edit`);
      } else if (article) {
        await updateArticle(article.id, data);
        setStatus(finalStatus);
        cmsToast.articleSaved(intent, 'edit', finalStatus, previousStatus);
        router.refresh();
      }
    } catch (e: unknown) {
      cmsToast.error(
        'Could not save article',
        e instanceof Error ? e.message : undefined,
      );
    } finally {
      setLoading(false);
      editorCtx?.setLoading(false);
    }
  }, [
    article, buildSavePayload, content, editorCtx, excerpt, hasCategories, category, mode, router, status, title,
  ]);

  useEffect(() => {
    editorCtx?.registerSave(() => handleSubmit());
    return () => editorCtx?.registerSave(null);
  }, [editorCtx, handleSubmit]);

  useEffect(() => {
    if (mode === 'edit' && status === 'DRAFT' && article) {
      // Autosave every 30s (was 5s) — skip entirely when tab is in the background
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        updateArticle(article.id, buildSavePayload('DRAFT'))
          .then(() => setAutosaveError(null))
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Autosave failed';
            setAutosaveError(message);
          });
      }, 30_000);
      return () => clearInterval(interval);
    }
  }, [mode, status, article, buildSavePayload]);


  // 1. Auto-calculate category & tags when title/content changes
  useEffect(() => {
    if (categories.length > 0) {
      const computedCat = autoCalculateCategory(title, content, categories.map((c) => c.name));
      if (computedCat && (!category || category === 'General' || category === '')) {
        setCategory(computedCat);
      }
    }
    if (tagsList.length === 0 && (title || content)) {
      const computedTags = suggestArticleKeywords(title, content);
      setTagsList(computedTags);
    }
  }, [title, content, categories, category, tagsList.length]);

  // 2. Auto-generate focus keyword & meta description when empty
  useEffect(() => {
    // Auto-generate focus keyword from title (first 1-2 words longer than 4 chars)
    if (!focusKeyword && title) {
      const words = title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 4 && !['about', 'after', 'again', 'would', 'their', 'there', 'these', 'under', 'while', 'which'].includes(w));
      if (words.length > 0) {
        setFocusKeyword(words.slice(0, 2).join(' '));
      }
    }

    // Auto-generate meta description from body content plain text
    if (!metaDescription && content) {
      const plainText = content.replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (plainText.length > 0) {
        const truncated = plainText.length > 155 ? plainText.slice(0, 152) + '...' : plainText;
        setMetaDescription(truncated);
      }
    }
  }, [title, content, focusKeyword, metaDescription]);

  const heroTitle = writeMeta?.title ?? (mode === 'create' ? 'New story' : 'Edit story');
  const heroSubtitle = writeMeta?.subtitle
    ?? (mode === 'create'
      ? 'Headline, body, media, SEO, and publish settings — one editorial flow.'
      : 'Update copy, placement, and publish settings.');

  return (
    <div className="cms-article-editor">
      {!focusMode && (
        <section className="cms-editor-panel cms-write-hero">
          <div className="cms-write-hero__inner">
            <div className="cms-write-hero__icon">
              <PenLine className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="cms-write-hero__copy min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="cms-write-hero__title">{heroTitle}</h1>
                {writeMeta?.status ? (
                  <StatusBadge status={writeMeta.status} />
                ) : (
                  <span className="cms-write-page__badge">
                    <Sparkles className="h-3 w-3" /> Editorial Suite
                  </span>
                )}
              </div>
              <p className="cms-write-hero__desc">{heroSubtitle}</p>
              {(writeMeta?.showLiveLink || writeMeta?.showBackLink) && (
                <div className="cms-write-hero__extras">
                  {writeMeta.showLiveLink && article?.slug ? (
                    <LiveArticleLink slug={article.slug} className="cms-write-hero__link" />
                  ) : null}
                  {writeMeta.showBackLink ? (
                    <Link href="/cms/articles" className="cms-write-hero__link">
                      ← All articles
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <div className={cn(
        "cms-article-editor__workspace",
        focusMode && "cms-article-editor__workspace--focus",
        focusMode && activeTab === 'preview' && "cms-article-editor__workspace--preview-active"
      )}>
        <div className="cms-article-editor__main">
        {!focusMode && (
          <section className="cms-editor-panel cms-article-editor__headline">
          <div className="cms-editor-panel__head">
            <FileText className="h-4 w-4 text-sky-500" />
            <div>
              <h2 className="cms-editor-panel__title">Headline &amp; deck</h2>
              <p className="cms-editor-panel__desc">
                Hero: 4 lines · ideal ≤{HEADLINE_BUDGET.ideal} chars · max {HEADLINE_BUDGET.max}
              </p>
            </div>
          </div>
          <div className="cms-editor-panel__body cms-editor-panel__body--stack">
            {(canFeature || canBreaking || canPin || canTrend) && (
              <div className="cms-placement-strip">
                <div className="cms-placement-strip__head">
                  <Sparkles className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <span className="cms-placement-strip__title">Placement</span>
                  <span className="cms-placement-strip__desc">Hero (breaking) or Homepage placements</span>
                </div>
                <div className="cms-placement-strip__grid">
                  {canFeature && (
                    <div className="cms-placement-row cms-placement-row--strip">
                      <div className="cms-placement-row__copy">
                        <CmsPlacementIcon type="featured" />
                        <div className="min-w-0">
                          <span className="cms-placement-row__label">{PLACEMENT_FLAGS.featured.label}</span>
                          <span className="cms-placement-row__hint">{PLACEMENT_FLAGS.featured.hint}</span>
                        </div>
                      </div>
                      <CmsPlacementSwitch
                        checked={isFeatured}
                        onCheckedChange={(v) => {
                          setIsFeatured(v);
                          if (v) {
                            setIsPinned(false);
                            setIsBreaking(false);
                            setIsTrending(false);
                          }
                        }}
                        accent="amber"
                        aria-label={PLACEMENT_FLAGS.featured.label}
                      />
                    </div>
                  )}
                  {canBreaking && (
                    <div className="cms-placement-row cms-placement-row--strip">
                      <div className="cms-placement-row__copy">
                        <CmsPlacementIcon type="breaking" />
                        <div className="min-w-0">
                          <span className="cms-placement-row__label">{PLACEMENT_FLAGS.breaking.label}</span>
                          <span className="cms-placement-row__hint">{PLACEMENT_FLAGS.breaking.hint}</span>
                        </div>
                      </div>
                      <CmsPlacementSwitch
                        checked={isBreaking}
                        onCheckedChange={(v) => {
                          setIsBreaking(v);
                          if (v) {
                            setIsFeatured(false);
                            setIsPinned(false);
                            setIsTrending(false);
                          }
                        }}
                        accent="red"
                        aria-label={PLACEMENT_FLAGS.breaking.label}
                      />
                    </div>
                  )}
                  {canPin && (
                    <div className="cms-placement-row cms-placement-row--strip">
                      <div className="cms-placement-row__copy">
                        <CmsPlacementIcon type="pin" />
                        <div className="min-w-0">
                          <span className="cms-placement-row__label">{PLACEMENT_FLAGS.pin.label}</span>
                          <span className="cms-placement-row__hint">{PLACEMENT_FLAGS.pin.hint}</span>
                        </div>
                      </div>
                      <CmsPlacementSwitch
                        checked={isPinned}
                        onCheckedChange={(v) => {
                          setIsPinned(v);
                          if (v) {
                            setIsFeatured(false);
                            setIsBreaking(false);
                            setIsTrending(false);
                          }
                        }}
                        accent="violet"
                        aria-label={PLACEMENT_FLAGS.pin.label}
                      />
                    </div>
                  )}
                  {canTrend && (
                    <div className="cms-placement-row cms-placement-row--strip">
                      <div className="cms-placement-row__copy">
                        <CmsPlacementIcon type="trending" />
                        <div className="min-w-0">
                          <span className="cms-placement-row__label">{PLACEMENT_FLAGS.trending.label}</span>
                          <span className="cms-placement-row__hint">{PLACEMENT_FLAGS.trending.hint}</span>
                        </div>
                      </div>
                      <CmsPlacementSwitch
                        checked={isTrending}
                        onCheckedChange={(v) => {
                          setIsTrending(v);
                          if (v) {
                            setIsFeatured(false);
                            setIsBreaking(false);
                            setIsPinned(false);
                          }
                        }}
                        accent="sky"
                        aria-label={PLACEMENT_FLAGS.trending.label}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="cms-field">
              <div className="cms-field__label-row">
                <label htmlFor="title" className="cms-field__label">Headline</label>
                <CharBudgetHint length={title.length} budget={HEADLINE_BUDGET} />
              </div>
              <Textarea
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="cms-field__input cms-field__input--headline"
                placeholder={!showGuidanceHints ? "Headline" : "Write a compelling headline…"}
                rows={4}
              />
              <span className="cms-field__hint">
                Ideal ≤{HEADLINE_BUDGET.ideal} chars · hero clamps at 4 lines (max {HEADLINE_BUDGET.max} before overflow)
              </span>
            </div>

            {needsShortTitle(title) && (
              <div className="cms-field border-l-4 border-amber-500 pl-4 bg-amber-500/5 py-3 pr-3 rounded-r-xl space-y-2">
                <div className="cms-field__label-row">
                  <label htmlFor="shortTitle" className="cms-field__label text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                    <Info className="h-4 w-4 shrink-0" />
                    Headline exceeds {HEADLINE_BUDGET.max}-char hero limit ({title.length} chars)
                  </label>
                  <CharBudgetHint length={shortTitle.length} budget={HEADLINE_BUDGET} />
                </div>
                <Input
                  id="shortTitle"
                  value={shortTitle}
                  onChange={(e) => setShortTitle(e.target.value)}
                  className="cms-field__input border-amber-300 dark:border-amber-700 focus-visible:ring-amber-500 font-medium"
                  placeholder="Short headline for cards, trending, and grids…"
                  maxLength={HEADLINE_BUDGET.max}
                />
                <span className="cms-field__hint text-amber-600/80 dark:text-amber-400/80 leading-normal block">
                  The hero carousel still shows the full headline (4-line clamp). Cards and trending use this shortened version when provided.
                </span>
              </div>
            )}
            <div className="cms-field">
              <div className="cms-field__label-row">
                <label htmlFor="excerpt" className="cms-field__label">Deck / excerpt</label>
                <CharBudgetHint length={excerpt.length} budget={EXCERPT_BUDGET} />
              </div>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="cms-field__input cms-field__input--deck resize-y min-h-[4.5rem]"
                rows={3}
                placeholder={!showGuidanceHints ? "Deck / excerpt" : "Summary for hero carousel, homepage cards, and social"}
                maxLength={EXCERPT_BUDGET.max + 30}
              />
            </div>
          </div>
        </section>
        )}

        <section className="cms-editor-panel cms-editor-panel--body cms-article-editor__story">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="cms-editor-tabs cms-editor-tabs--fill">
            <div className="cms-editor-panel__head cms-editor-panel__head--tabs">
              {!(focusMode && activeTab === 'preview') ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="h-4 w-4 text-sky-500 shrink-0" />
                  <div className="min-w-0">
                    <h2 className="cms-editor-panel__title">Story content</h2>
                    <p className="cms-editor-panel__desc hidden sm:block">
                      {/* The body is the one field that had no measure of
                          itself: headline, deck and slug all show a budget.
                          Words, not characters — a budget would imply a limit
                          the desk does not set. */}
                      {bodyWordCount > 0
                        ? `${bodyWordCount.toLocaleString('en-US')} ${bodyWordCount === 1 ? 'word' : 'words'} · ${readTime} min read`
                        : 'Grows automatically as you write and paste'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Placement Icons */}
                  <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/20">
                    {([
                      ['carousel', Pin, 'Carousel'],
                      ['coverage-hero', LayoutGrid, 'Coverage'],
                      ['card', Star, 'Home cards'],
                      ['trending', Flame, 'Trending'],
                      ['article', Newspaper, 'Article'],
                      ['facebook', Facebook, 'Facebook'],
                    ] as const).map(([id, Icon, label]) => {
                      const disabled =
                        (id === 'carousel' && !isFeatured && !isBreaking) ||
                        (id === 'coverage-hero' && !isFeatured && !isBreaking && !isPinned) ||
                        (id === 'trending' && !isTrending);
                      
                      return (
                        <ModernTooltip key={id} label={label} hint={disabled ? 'Enable flag to preview' : `Show ${label} view`} variant="editor" fast side="bottom">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setPreviewPlacement(id)}
                            className={cn(
                              'h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground transition-all hover:bg-muted/65 hover:text-foreground',
                              previewPlacement === id && 'bg-sky-500/10 text-sky-500 border border-sky-500/20 shadow-sm',
                              disabled && 'opacity-25 grayscale cursor-not-allowed'
                            )}
                            aria-label={label}
                          >
                            <Icon className="icon-sm" />
                          </button>
                        </ModernTooltip>
                      );
                    })}
                  </div>

                  {/* Device Icons */}
                  <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/20">
                    {([
                      ['desktop', Monitor, 'Desktop'],
                      ['tablet', Tablet, 'Tablet'],
                      ['mobile', Smartphone, 'Mobile'],
                    ] as const).map(([id, Icon, label]) => (
                      <ModernTooltip key={id} label={label} hint={`Simulate ${label} view`} variant="editor" fast side="bottom">
                        <button
                          type="button"
                          onClick={() => setPreviewDevice(id)}
                          className={cn(
                            'h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground transition-all hover:bg-muted/65 hover:text-foreground',
                            previewDevice === id && 'bg-sky-500/10 text-sky-500 border border-sky-500/20 shadow-sm',
                          )}
                          aria-label={label}
                        >
                          <Icon className="h-3 w-3" />
                        </button>
                      </ModernTooltip>
                    ))}
                  </div>

                  {/* Theme Toggle */}
                  <PreviewThemeToggle theme={previewTheme} onChange={setPreviewTheme} />
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <TabsList className="cms-story-tabs h-9">
                  {mode === 'edit' && revisions.length > 0 && (
                    <TabsTrigger value="history" className="cms-story-tabs__btn cms-story-tabs__btn--history text-xs gap-1.5 px-3">
                      <History className="h-3.5 w-3.5" />
                      <span className="cms-tab-label">History</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="editor" className="cms-story-tabs__btn cms-story-tabs__btn--body text-xs gap-1.5 px-3">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="cms-tab-label">Body</span>
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="cms-story-tabs__btn cms-story-tabs__btn--seo text-xs gap-1.5 px-3">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="cms-tab-label">SEO</span>
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="cms-story-tabs__btn cms-story-tabs__btn--preview text-xs gap-1.5 px-3">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="cms-tab-label">Preview</span>
                  </TabsTrigger>
                </TabsList>

                <ModernTooltip label={focusMode ? "Exit Focus" : "Focus Mode"} hint={focusMode ? "Show all panels" : "Hide distraction panels"} variant="editor" fast side="top">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFocusMode(!focusMode)} 
                    className={cn(
                      "cms-focus-btn h-8 rounded-full text-xs font-semibold shrink-0 gap-1.5 px-3 transition-all",
                      focusMode 
                        ? "text-sky-500 bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                    )}
                  >
                    <Focus className="h-3.5 w-3.5" />
                    <span className="cms-focus-label">{focusMode ? "Focused" : "Focus"}</span>
                  </Button>
                </ModernTooltip>
              </div>
            </div>

            <TabsContent value="editor" className="cms-editor-panel__body cms-editor-panel__body--fill mt-0">
              <EditorCollaborators 
                authorName={authorName} 
                collaboratorIds={collaboratorIds} 
                onChange={setCollaboratorIds} 
                postAsNewsDesk={postAsNewsDesk}
                onPostAsNewsDeskChange={setPostAsNewsDesk}
                staff={staff}
                loading={loadingStaff}
              />
              <div className="cms-editor-surface cms-editor-surface--resizable cms-editor-surface--aligned mt-2">
                <TipTapEditor content={content} onChange={setContent} minBodyHeight={320} />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="cms-editor-panel__body cms-editor-panel__body--stack mt-0">
              <div className="cms-field">
                <label className="cms-field__label">Meta title</label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="cms-field__input" placeholder={title || 'Defaults to headline'} />
              </div>
              <div className="cms-field">
                <label className="cms-field__label">Meta description</label>
                <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="cms-field__input resize-y min-h-[5rem]" rows={3} placeholder="~155 characters for search snippets" />
                <span className="cms-field__hint cms-field__hint--keep">{metaDescription.length} characters</span>
              </div>
              <div className="cms-field">
                <label className="cms-field__label">Focus keyword</label>
                <Input value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} className="cms-field__input" placeholder="e.g. solar policy Bangladesh" />
              </div>
              <div className="cms-field">
                <div className="cms-field__label-row">
                  <label htmlFor="slug" className="cms-field__label flex items-center gap-1.5">
                    <Link2 className="h-3 w-3" /> URL slug
                  </label>
                  <CharBudgetHint length={slug.length} budget={SLUG_BUDGET} />
                </div>
                <div className="cms-slug-field">
                  <span className="cms-slug-field__prefix">/articles/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="cms-field__input cms-slug-field__input font-mono text-sm"
                    placeholder="auto-from-headline"
                    maxLength={SLUG_BUDGET.max}
                  />
                </div>
                {!slugTouched && title && (
                  <span className="cms-field__hint">Auto-generated from headline — edit to customize</span>
                )}
              </div>
            </TabsContent>
            <TabsContent value="preview" className="cms-editor-panel__body cms-editor-panel__body--fill mt-0">
              <ArticlePreviewPanel
                active={activeTab === 'preview'}
                focusMode={focusMode}
                placement={previewPlacement}
                onPlacementChange={setPreviewPlacement}
                device={previewDevice}
                onDeviceChange={setPreviewDevice}
                theme={previewTheme}
                onThemeChange={setPreviewTheme}
                title={title}
                shortTitle={shortTitle}
                excerpt={excerpt}
                content={content}
                imageUrl={imageUrl}
                imageCredit={imageCredit}
                category={category}
                authorName={postAsNewsDesk ? 'ESB News Desk' : authorName}
                readTime={readTime}
                publishedAt={resolvedPublishedAt}
                slug={slug || 'preview'}
                heroMeta={heroMeta}
                isFeatured={isFeatured}
                isPinned={isPinned}
                isBreaking={isBreaking}
                isTrending={isTrending}
                tags={tagsList}
                collaborators={staff.filter(s => collaboratorIds.includes(s.id)).map(c => ({ id: c.id, name: c.name }))}
              />
            </TabsContent>
            {mode === 'edit' && revisions.length > 0 && (
              <TabsContent value="history" className="cms-editor-panel__body cms-editor-panel__body--stack mt-0">
                <RevisionHistory
                  articleId={article?.id ?? ''}
                  revisions={revisions}
                />
              </TabsContent>
            )}
          </Tabs>
        </section>
        </div>

        {!focusMode && (
          <aside className="cms-article-editor__sidebar hidden md:flex">
        <section className="cms-sidebar-card cms-article-editor__publish">
          <div className="cms-sidebar-card__head">
            <Send className="h-4 w-4" />
            <h3>Publish</h3>
          </div>
          <div className="cms-sidebar-card__body">
            <div className="cms-field">
              <label className="cms-field__label">Status</label>
              <CmsFormSelect
                value={status}
                onChange={setStatus}
                options={statusSelectOptions}
                placeholder="Status"
                menuTitle="Article status"
              />
            </div>
            {canPublish && (
              <div className="cms-field cms-field--datetime">
                <label className="cms-field__label flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {status === 'SCHEDULED'
                    ? 'Go live at'
                    : status === 'PUBLISHED'
                      ? 'Publish date'
                      : 'Go-live date'}
                </label>
                <CmsDateTimePicker value={resolvedPublishedAt} onChange={setPublishedAt} />
              </div>
            )}
            <div className="cms-publish-actions cms-publish-actions--sidebar">
              <Button onClick={() => handleSubmit()} disabled={loading || !hasCategories} className="cms-publish-btn w-full">
                <Save className="h-4 w-4" />
                {loading ? 'Saving…' : 'Save changes'}
              </Button>
              {canPublish && (
                <>
                  <Button variant="secondary" onClick={() => handleSubmit('PUBLISHED')} disabled={loading} className="cms-publish-btn cms-publish-btn--publish w-full">
                    <Send className="h-4 w-4" /> Publish now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit('SCHEDULED')}
                    disabled={loading}
                    className="cms-publish-btn cms-publish-btn--schedule w-full"
                  >
                    <Clock className="h-4 w-4" /> Schedule
                  </Button>
                </>
              )}
              {mode === 'edit' && status === 'PUBLISHED' && (
                <Button
                  variant="ghost"
                  onClick={() => handleSubmit('DRAFT')}
                  disabled={loading}
                  className="cms-publish-btn cms-publish-btn--draft w-full text-muted-foreground"
                >
                  <Archive className="h-4 w-4" /> Move to Draft
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                  className="cms-publish-btn cms-publish-btn--delete w-full text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteNeedsPhrase ? 'Delete live article' : 'Delete article'}
                </Button>
              )}
              {canSubmitForReview && status !== 'IN_REVIEW' && (
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(true)}
                  disabled={loading}
                  className="cms-publish-btn cms-publish-btn--review w-full"
                >
                  <ShieldCheck className="h-4 w-4" /> Send to admin for review
                </Button>
              )}
              {status === 'IN_REVIEW' && (
                <p className="cms-field__hint text-center">
                  Awaiting admin sign-off. You will be notified in Editorial when approved or returned.
                </p>
              )}
              {autosaveError && status === 'DRAFT' && (
                <p className="cms-field__hint text-center text-destructive">
                  Autosave failed: {autosaveError}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="cms-sidebar-card cms-article-editor__organize">
          <div className="cms-sidebar-card__head">
            <FolderOpen className="h-4 w-4" />
            <h3>Organize</h3>
          </div>
          <div className="cms-sidebar-card__body">
            <div className="cms-field">
              <label className="cms-field__label">Category</label>
              <CmsCategorySelect
                value={category}
                onChange={setCategory}
                categories={categories}
              />
            </div>
            <div className="cms-field">
              <div className="cms-field__label-row">
                <label className="cms-field__label flex items-center gap-1.5">
                  <Tag className="h-3 w-3" /> Tags
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const picked = suggestArticleKeywords(title, content);
                    setTagsList(picked);
                  }}
                  className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 hover:underline transition-all"
                >
                  Auto-pick from story
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-md border border-input bg-background/50 focus-within:ring-1 focus-within:ring-ring focus-within:border-ring min-h-[40px] items-center">
                {tagsList.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTagsList(prev => prev.filter(t => t !== tag))}
                      className="text-sky-400/60 hover:text-sky-300 transition-colors ml-0.5"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.endsWith(',')) {
                      const newTag = val.slice(0, -1).trim();
                      if (newTag && !tagsList.includes(newTag)) {
                        setTagsList(prev => [...prev, newTag]);
                      }
                      setTagInput('');
                    } else {
                      setTagInput(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const newTag = tagInput.trim();
                      if (newTag && !tagsList.includes(newTag)) {
                        setTagsList(prev => [...prev, newTag]);
                      }
                      setTagInput('');
                    } else if (e.key === 'Backspace' && !tagInput && tagsList.length > 0) {
                      setTagsList(prev => prev.slice(0, -1));
                    }
                  }}
                  placeholder={tagsList.length === 0 ? "Type and comma-separate..." : ""}
                  className="flex-1 bg-transparent border-0 p-0 text-xs focus:ring-0 focus:outline-none placeholder:text-muted-foreground/50 min-w-[120px]"
                />
              </div>
              <span className="cms-field__hint">Type word and press comma (,) or Enter to add a tag pill</span>
            </div>
            <FeaturedImageEditor
              items={mediaItems}
              value={imageUrl}
              onChange={setImageUrl}
              meta={heroMeta}
              onMetaChange={setHeroMeta}
            />
            {imageUrl && (
              <div className="cms-field mt-3">
                <label className="cms-field__label flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" /> Image Credit
                </label>
                <Input
                  value={imageCredit}
                  onChange={(e) => setImageCredit(e.target.value)}
                  className="cms-field__input"
                  placeholder="e.g., Reuters / Jane Doe"
                />
                <span className="cms-field__hint">Credit for the featured image (visible on live story)</span>
              </div>
            )}

          </div>
        </section>
        </aside>
        )}
      </div>

      {deleteDialogOpen && (
        <AdminSecureActionDialog
          open
          title={deleteNeedsPhrase ? 'Delete a live article' : 'Delete this article'}
          description={
            deleteNeedsPhrase
              ? `"${title || 'This article'}" is live. Deleting it removes it from the site for anyone who has it open, linked or bookmarked. It goes to Editorial → Trash, where it can be restored until the retention window clears it.`
              : 'It goes to Editorial → Trash, where you can restore it until the retention window clears it.'
          }
          confirmLabel="Move to trash"
          variant="destructive"
          requirePassword={false}
          requirePhrase={deleteNeedsPhrase ? DELETE_PHRASE : undefined}
          loading={loading}
          onClose={() => !loading && setDeleteDialogOpen(false)}
          onConfirm={({ phrase }) => handleDelete(phrase)}
        />
      )}

      {reviewDialogOpen && (
        <div className="cms-review-submit-backdrop" onClick={() => !loading && setReviewDialogOpen(false)}>
          <div
            className="cms-review-submit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cms-review-submit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="cms-review-submit-title" className="cms-review-submit-dialog__title">Send to admin for review</h3>
            <p className="cms-review-submit-dialog__desc">
              Admins receive this in Platform desk. They can approve, publish, or return with notes via Editorial notices.
            </p>
            <label htmlFor="review-submit-note" className="cms-field__label">Note for reviewers (optional)</label>
            <textarea
              id="review-submit-note"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={4}
              className="cms-review-submit-dialog__input"
              placeholder="Deadline, legal sensitivity, sources to verify…"
            />
            <div className="cms-review-submit-dialog__actions">
              <Button type="button" variant="outline" disabled={loading} onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={loading} onClick={handleSubmitForReview}>
                <ShieldCheck className="h-4 w-4" />
                {loading ? 'Sending…' : 'Submit for review'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}