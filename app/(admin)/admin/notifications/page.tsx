import { BellRing } from 'lucide-react';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { can } from '@/lib/constants';
import { SITE_URL } from '@/lib/seo';
import { AdminCard, AdminPageHeader, AdminSectionStack, AdminStatCard, AdminStatGrid } from '@/components/admin/AdminUI';
import { AdminForbidden } from '@/components/admin/AdminForbidden';
import { NotificationControls, type ControlsConfig } from '@/components/admin/notifications/NotificationControls';
import { NotificationDeliveries, type DeliveryRow } from '@/components/admin/notifications/NotificationDeliveries';
import { isEnglishTitle } from '@/lib/notifications/articles';
import { readNewestHour } from '@/lib/notifications/grid/snapshot';
import { getNotificationStatus } from '@/lib/notifications/status';
import { renderArticle, renderGridHourly } from '@/lib/notifications/telegram/format';
import { dhakaDateTime } from '@/lib/notifications/time';

/**
 * Telegram / notifications: is it working, what went out, what failed, and
 * the switches. Operational state first; the controls below it.
 */

export const dynamic = 'force-dynamic';

const STATUS_COPY: Record<string, string> = {
  ok: 'Working',
  degraded: 'Needs attention',
  down: 'Not working',
  disabled: 'Switched off',
};

function ago(seconds: number) {
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} min ago`;
}

/** A t.me link only exists for a public channel with a username. */
function messageLink(channelId: string | null, chatId: string | null, messageId: string | null): string | null {
  if (!channelId?.startsWith('@') || !messageId || !chatId) return null;
  return `https://t.me/${channelId.slice(1)}/${messageId}`;
}

async function loadRows(channelId: string | null): Promise<DeliveryRow[]> {
  const deliveries = await prisma.notificationDelivery.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      destination: true,
      status: true,
      attemptCount: true,
      lastErrorCode: true,
      lastError: true,
      createdAt: true,
      sentAt: true,
      externalChatId: true,
      externalMessageId: true,
      event: { select: { type: true, entityId: true, payload: true } },
    },
  });
  const articleIds = deliveries.filter((d) => d.event.type.startsWith('ARTICLE_') && d.event.entityId).map((d) => d.event.entityId as string);
  const titles = new Map(
    (await prisma.article.findMany({ where: { id: { in: articleIds } }, select: { id: true, title: true } })).map((a) => [a.id, a.title]),
  );
  return deliveries.map((d) => {
    const payload = (d.event.payload ?? {}) as Record<string, unknown>;
    let subject: string;
    if (d.event.type.startsWith('ARTICLE_')) subject = titles.get(d.event.entityId ?? '') ?? (typeof payload.title === 'string' ? payload.title : 'Article');
    else if (d.event.type === 'DAILY_GRID_SUMMARY') subject = `Daily summary, ${String(payload.energyDay ?? '')}`;
    else if (typeof payload.observedAt === 'string') subject = `${d.event.type === 'GRID_ALERT' ? `Alert: ${String(payload.rule)}` : 'Grid update'} — ${dhakaDateTime(new Date(payload.observedAt))} BST`;
    else subject = 'Test message';
    return {
      id: d.id,
      type: d.event.type,
      subject,
      destination: d.destination,
      status: d.status,
      attemptCount: d.attemptCount,
      lastErrorCode: d.lastErrorCode,
      lastError: d.lastError,
      createdAt: d.createdAt.toISOString(),
      sentAt: d.sentAt?.toISOString() ?? null,
      link: d.destination === 'public' ? messageLink(channelId, d.externalChatId, d.externalMessageId) : null,
    };
  });
}

async function loadPreviews() {
  const now = new Date();
  const [articles, hour] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'PUBLISHED', editorTrash: false },
      orderBy: { publishedAt: 'desc' },
      take: 8,
      select: { slug: true, title: true, excerpt: true, category: true, isBreaking: true, publishedAt: true },
    }),
    readNewestHour().catch(() => null),
  ]);
  const article = articles.find((a) => isEnglishTitle(a.title) && a.publishedAt);
  return {
    news: article ? renderArticle({ ...article, publishedAt: article.publishedAt as Date }, { siteUrl: SITE_URL, asCaption: false, now }) : null,
    grid: hour ? renderGridHourly(hour, { siteUrl: SITE_URL }) : null,
  };
}

/**
 * The preview renders the formatter's own output. Safe to inject: every value
 * in it that did not originate in format.ts has passed through `esc`, so the
 * only markup is the formatter's b/i/s/pre tags.
 */
function Preview({ title, html, button }: { title: string; html: string | undefined; button: string | undefined }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
      {html ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div
            className="whitespace-pre-wrap text-[13px] leading-6 text-foreground [&_pre]:my-1 [&_pre]:whitespace-pre [&_pre]:font-mono [&_pre]:text-[12px] [&_i]:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {button && <p className="mt-3 rounded-md border border-border py-1.5 text-center text-xs font-semibold text-primary">{button}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing to preview.</p>
      )}
    </div>
  );
}

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, 'notifications.manage')) {
    return <AdminForbidden title="Notifications restricted" description="Only Admins and Super Admins can manage the Telegram channel." />;
  }

  const status = await getNotificationStatus();
  const [rows, previews] = await Promise.all([loadRows(status.configured.channelId), loadPreviews()]);
  const c = status.config;
  const controls: ControlsConfig = {
    paused: c.paused,
    news: c.news,
    gridHourly: c.gridHourly,
    gridAlerts: c.gridAlerts,
    dailySummary: c.dailySummary,
    commands: c.commands,
    loadShedAlertMw: c.loadShedAlertMw,
    loadShedClearMw: c.loadShedClearMw,
    loadShedEscalationMw: c.loadShedEscalationMw,
    loadShedRealertHours: c.loadShedRealertHours,
    generationDropAlertMw: c.generationDropAlertMw,
    gridMaxAgeHours: c.gridMaxAgeHours,
    hourlyMinIntervalMinutes: c.hourlyMinIntervalMinutes,
    articleMaxAgeHours: c.articleMaxAgeHours,
  };
  const q = status.queue.byStatus;

  return (
    <AdminSectionStack>
      <AdminPageHeader
        icon={BellRing}
        title="Notifications"
        description="The Telegram channel: what went out, what failed, and the switches."
      />

      <AdminCard title={`Status: ${STATUS_COPY[status.status]}`}>
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Sending</dt><dd>{status.configured.enabled ? (status.configured.dryRun ? 'On — dry run' : 'On') : 'Off (TELEGRAM_ENABLED)'}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Channel</dt><dd className="font-mono text-xs">{status.configured.channelId ?? 'not set'}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Test destination</dt><dd className="font-mono text-xs">{status.configured.testChatId ?? 'not set'}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Bot token</dt><dd>{status.configured.botToken ? 'set' : 'not set'}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Webhook secret</dt><dd>{status.configured.webhookSecret ? 'set' : 'not set'}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Admins</dt><dd>{status.configured.adminCount}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Last cron run</dt><dd>{status.heartbeat ? ago(status.heartbeat.ageSeconds) : 'never'}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Announcing articles since</dt><dd>{c.newsSince ? `${dhakaDateTime(new Date(c.newsSince))} BST` : 'first cron run'}</dd></div>
        </dl>
        {status.reasons.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            {status.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}
      </AdminCard>

      <AdminStatGrid>
        <AdminStatCard title="Pending" value={q.PENDING} />
        <AdminStatCard title="Sent" value={q.SENT} change={status.queue.lastSentAt ? `last ${dhakaDateTime(status.queue.lastSentAt)} BST` : undefined} />
        <AdminStatCard title="Uncertain" value={q.UNCERTAIN} accent={q.UNCERTAIN ? 'rose' : 'sky'} change="check the channel" />
        <AdminStatCard title="Failed" value={q.DEAD} accent={q.DEAD ? 'rose' : 'sky'} />
      </AdminStatGrid>

      <NotificationControls config={controls} canTest={Boolean(status.configured.testChatId)} />

      <AdminCard title="Preview">
        <div className="grid gap-6 lg:grid-cols-2">
          <Preview title="Next news post looks like" html={previews.news?.html} button={previews.news?.buttons[0]?.text} />
          <Preview title="Grid update looks like" html={previews.grid?.html} button={previews.grid?.buttons[0]?.text} />
        </div>
      </AdminCard>

      <NotificationDeliveries rows={rows} />
    </AdminSectionStack>
  );
}
