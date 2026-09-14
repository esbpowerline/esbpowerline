'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminCard, AdminTableShell } from '@/components/admin/AdminUI';
import { cancelNotificationDelivery, retryNotificationDelivery } from '@/lib/actions/notifications';

export interface DeliveryRow {
  id: string;
  type: string;
  subject: string;
  destination: string;
  status: string;
  attemptCount: number;
  lastErrorCode: string | null;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
  link: string | null;
}

// Restrained: only states that need a person are coloured.
const STATUS_TONE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SENT: 'secondary',
  PENDING: 'outline',
  SENDING: 'outline',
  UNCERTAIN: 'destructive',
  DEAD: 'destructive',
  CANCELLED: 'outline',
  SKIPPED: 'outline',
};

const RETRYABLE = new Set(['DEAD', 'UNCERTAIN', 'CANCELLED', 'SKIPPED']);
const CANCELLABLE = new Set(['PENDING', 'UNCERTAIN', 'DEAD']);

function when(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

export function NotificationDeliveries({ rows }: { rows: DeliveryRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const act = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(done);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <AdminCard title="Recent deliveries">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing has been queued yet.</p>
      ) : (
        <AdminTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>What</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tries</TableHead>
                <TableHead>Queued</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-[26rem]">
                    <p className="truncate text-sm font-medium text-foreground" title={r.subject}>{r.subject}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.type.replace(/_/g, ' ').toLowerCase()} · {r.destination}
                      {r.lastErrorCode ? ` · ${r.lastErrorCode}` : ''}
                    </p>
                    {r.lastError && r.status !== 'SENT' && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground" title={r.lastError}>{r.lastError}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_TONE[r.status] ?? 'outline'}>{r.status.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.attemptCount}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{when(r.createdAt)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {r.link ? (
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-4 hover:decoration-primary">
                        {when(r.sentAt)}
                      </a>
                    ) : (
                      when(r.sentAt)
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    {RETRYABLE.has(r.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        disabled={pending}
                        title={r.status === 'UNCERTAIN' ? 'Check the channel first: this may already have been posted' : undefined}
                        onClick={() => act(() => retryNotificationDelivery(r.id), 'Queued again')}
                      >
                        Retry
                      </Button>
                    )}
                    {CANCELLABLE.has(r.status) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-1 h-7 px-2 text-xs"
                        disabled={pending}
                        onClick={() => act(() => cancelNotificationDelivery(r.id), 'Cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableShell>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        <strong className="font-semibold text-foreground">Uncertain</strong> means the outcome is unknown — a timeout after the
        request left, or a run that stopped mid-send. It is never retried automatically. Check the channel before retrying.
      </p>
    </AdminCard>
  );
}
