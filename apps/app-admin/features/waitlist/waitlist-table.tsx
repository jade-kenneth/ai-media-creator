'use client';

import { format } from 'date-fns';
import { MoreHorizontal, SearchCheck, Trash2 } from 'lucide-react';

import { z } from 'zod';

import type { Column, DateRange } from '@/components/DataTable';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WaitlistRole } from '@/react-query/generated__types';
import type { WaitlistEntryRecord } from '@/react-query/waitlist/waitlist-operations';
import { WAITLIST_ROLE_LABELS } from './constants';
import { WaitlistRoleBadge } from './waitlist-role-badge';

type WaitlistTableProps = {
  entries: WaitlistEntryRecord[];
  loadedEntries: WaitlistEntryRecord[];
  totalCount: number;
  loading: boolean;
  page: number;
  pageSize: number;
  selectedRole: WaitlistRole | undefined;
  selectedJoinedAt: Partial<DateRange> | null | undefined;
  onRoleChange: (role: WaitlistRole | undefined) => void;
  onJoinedAtChange: (range: Partial<DateRange> | null | undefined) => void;
  onDeleteEntry: (entry: WaitlistEntryRecord) => void;
  onReload: () => void;
  onPageChange: (page: number) => Promise<void>;
  onPageSizeChange: (pageSize: number) => void;
};

const ROLE_OPTIONS = Object.values(WaitlistRole).map((role) => ({
  label: WAITLIST_ROLE_LABELS[role],
  value: role,
}));

function formatDateValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return format(date, 'MMM d, yyyy');
}

function toCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function exportToCSV(entries: WaitlistEntryRecord[]) {
  if (entries.length === 0) {
    return;
  }

  const rows = [
    ['Name', 'Email', 'Role', 'Organization', 'City', 'Mobile', 'Message', 'Joined'],
    ...entries.map((entry) => [
      [entry.firstName, entry.lastName].filter(Boolean).join(' '),
      entry.email,
      entry.role,
      entry.organizationName ?? '',
      entry.city ?? '',
      entry.mobile ?? '',
      entry.message ?? '',
      entry.createdAt,
    ]),
  ];

  const csv = rows
    .map((row) => row.map((value) => toCsvValue(String(value))).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');

  anchor.href = url;
  anchor.download = `waitlist-${timestamp}.csv`;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function WaitlistTable({
  entries,
  loadedEntries,
  totalCount,
  loading,
  page,
  pageSize,
  selectedRole,
  selectedJoinedAt,
  onRoleChange,
  onJoinedAtChange,
  onDeleteEntry,
  onReload,
  onPageChange,
  onPageSizeChange,
}: WaitlistTableProps) {
  return (
    <div className="space-y-4">
      <DataTable
        id="waitlist-entries"
        collection={DataTable.collection({
          items: entries,
          itemToString: (entry) =>
            `${entry.firstName ?? ''} ${entry.lastName ?? ''} ${entry.email} ${entry.role} ${entry.organizationName ?? ''} ${entry.city ?? ''}`,
          itemToValue: (entry) => entry.id,
        })}
        selectableRows
        columns={
          [
            {
              id: 'name',
              heading: 'Name',
              cell: (row) => {
                const name = [row.firstName, row.lastName]
                  .filter(Boolean)
                  .join(' ');

                return name ? (
                  <span className="block max-w-50 truncate font-medium text-foreground">
                    {name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                );
              },
            },
            {
              id: 'email',
              heading: 'Email',
              cell: (row) => (
                <span className="block max-w-[280px] truncate font-medium text-foreground">
                  {row.email}
                </span>
              ),
            },
            {
              id: 'role',
              heading: 'Role',
              cell: (row) => <WaitlistRoleBadge role={row.role} />,
            },
            {
              id: 'organizationName',
              heading: 'Organization',
              cell: (row) =>
                row.organizationName ?? (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              id: 'city',
              heading: 'City / Municipality',
              hideable: true,
              cell: (row) =>
                row.city ?? <span className="text-muted-foreground">—</span>,
            },
            {
              id: 'mobile',
              heading: 'Mobile',
              hideable: true,
              cell: (row) =>
                row.mobile ?? <span className="text-muted-foreground">—</span>,
            },
            {
              id: 'message',
              heading: 'Message',
              hideable: true,
              cell: (row) =>
                row.message ? (
                  <span
                    className="block max-w-70 truncate text-muted-foreground"
                    title={row.message}
                  >
                    {row.message}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                ),
            },
            {
              id: 'createdAt',
              heading: 'Joined',
              cell: (row) => formatDateValue(row.createdAt),
            },
            {
              id: 'actions',
              heading: 'Actions',
              hideable: true,
              orderable: false,
              controls: {
                enabled: false,
                label: '',
              },
              cell: (row) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Open waitlist actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeleteEntry(row)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ] satisfies Column<WaitlistEntryRecord>[]
        }
        title="Waitlist entries"
        description="Track early-access signups from the public landing page."
        loading={loading}
        onReload={onReload}
        onExport={() => exportToCSV(loadedEntries)}
        filter={{
          entries: {
            role: {
              type: 'SELECT',
              label: 'Role',
              placeholder: 'All roles',
              clearable: true,
              options: ROLE_OPTIONS,
            },
            createdAt: {
              type: 'DATE_RANGE',
              label: 'Joined date',
              clearable: true,
            },
          },
          value: {
            role: selectedRole ?? '',
            createdAt: selectedJoinedAt,
          },
          onValueChange: (values) => {
            onRoleChange(
              z
                .enum(Object.values(WaitlistRole) as [string, ...string[]])
                .safeParse(values.role).data as WaitlistRole | undefined,
            );
            onJoinedAtChange(values.createdAt);
          },
        }}
        pagination={{
          count: totalCount,
          loading,
          page,
          pageSize,
          onPageChange,
          onPageSizeChange,
        }}
        renderBeforeTable={
          !loading && entries.length === 0
            ? () => (
                <div className="flex items-center gap-2 px-3 pb-3 text-sm text-muted-foreground">
                  <SearchCheck className="size-4" />
                  No waitlist entries match this filter yet.
                </div>
              )
            : undefined
        }
      />
    </div>
  );
}
