'use client';

import { AdminFormattedTime } from '@/components/admin/AdminFormattedTime';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type AdminLogRow = {
  id: string;
  type: string;
  message: string;
  timestamp: Date | string;
  userLabel: string;
};

export function AdminLogsTable({ logs }: { logs: AdminLogRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[160px]">Time</TableHead>
          <TableHead className="w-[110px] hidden sm:table-cell">Type</TableHead>
          <TableHead className="min-w-[240px]">Message</TableHead>
          <TableHead className="w-[140px] hidden md:table-cell">User</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-muted-foreground whitespace-nowrap text-[12px]">
              <AdminFormattedTime value={log.timestamp} />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {/* The kit's capsule. `inline-flex rounded-full` was caught by the
                  global status-badge rule and uppercased, so a log type like
                  `article.update` printed as ARTICLE.UPDATE. */}
              <span className="admin-tag-capsule admin-tag-capsule--xs font-mono">
                {log.type}
              </span>
            </TableCell>
            <TableCell className="text-[13px] font-medium text-foreground/90">{log.message}</TableCell>
            <TableCell className="text-muted-foreground text-[12px] hidden md:table-cell">{log.userLabel}</TableCell>
          </TableRow>
        ))}
        {logs.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-muted-foreground text-center py-8">
              No logs yet
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}