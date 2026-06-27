'use client';

import { format } from 'date-fns';
import {
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  SearchCheck,
  ShieldX,
} from 'lucide-react';
import { useReducer, useState } from 'react';
import * as z from 'zod';

import type { Column } from '@/components/DataTable';
import { DataTable } from '@/components/DataTable';
import {
  LoadingChip,
  ModuleErrorState,
  StatCard,
  StatsCardsSkeleton,
} from '@/components/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePaginated } from '@/hooks/use-paginated';
import {
  type AccountDeletionRequestRecord,
  useAdminAccountDeletionRequestsCountQuery,
  useAdminAccountDeletionRequestsQuery,
} from '@/react-query/account-deletion-requests/account-deletion-requests-operations';
import {
  type AccountDeletionRequestFilterInput,
  AccountDeletionRequestStatus,
  SortDirection,
} from '@/react-query/generated__types';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { formatCount } from '@/utils/date';

import {
  ACCOUNT_DELETION_REQUESTS_PAGE_SIZE,
  type AccountDeletionStatusFilterValue,
  accountDeletionStatusOptions,
  formatAccountDeletionStatus,
} from './constants';
import { ReviewDeletionRequestDialog } from './review-deletion-request-dialog';

interface AccountDeletionRequestsPageState {
  page: number;
  pageSize: number;
  status: AccountDeletionStatusFilterValue | undefined;
}

function formatDateValue(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return format(date, 'MMM d, yyyy');
}

function getStatusBadgeClassName(status: AccountDeletionRequestStatus) {
  switch (status) {
    case AccountDeletionRequestStatus.Pending:
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
    case AccountDeletionRequestStatus.Approved:
      return 'bg-destructive/10 text-destructive';
    case AccountDeletionRequestStatus.Rejected:
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function AccountDeletionRequestsPageView() {
  const [state, setState] = useReducer(
    (
      previousState: AccountDeletionRequestsPageState,
      nextState: Partial<AccountDeletionRequestsPageState>,
    ) => ({
      ...previousState,
      ...nextState,
    }),
    {
      page: 1,
      pageSize: ACCOUNT_DELETION_REQUESTS_PAGE_SIZE,
      status: undefined,
    },
  );
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );

  const filter =
    state.status == null
      ? undefined
      : ({
          ...(state.status != null && {
            status: {
              equal: state.status,
            },
          }),
        } satisfies AccountDeletionRequestFilterInput);

  const listQuery = useAdminAccountDeletionRequestsQuery({
    filter,
    first: state.pageSize,
    sort: { createdAt: SortDirection.Desc },
  });
  const pendingCountQuery = useAdminAccountDeletionRequestsCountQuery({
    filter: {
      status: {
        equal: AccountDeletionRequestStatus.Pending,
      },
    },
  });
  const approvedCountQuery = useAdminAccountDeletionRequestsCountQuery({
    filter: {
      status: {
        equal: AccountDeletionRequestStatus.Approved,
      },
    },
  });
  const rejectedCountQuery = useAdminAccountDeletionRequestsCountQuery({
    filter: {
      status: {
        equal: AccountDeletionRequestStatus.Rejected,
      },
    },
  });

  const { currentPage, totalPages } =
    usePaginated<AccountDeletionRequestRecord>(
      () =>
        listQuery.data?.pages.flatMap((page) =>
          page.adminAccountDeletionRequests.edges.map((edge) => edge.node),
        ) ?? [],
      state,
    );

  if (listQuery.isError) {
    return (
      <div className="space-y-6">
        <ModuleErrorState
          title="Deletion requests unavailable"
          message={explainGraphqlErrorMessage(
            listQuery.error,
            'Try again in a moment.',
          )}
          onRetry={() => {
            void listQuery.refetch();
          }}
        />
      </div>
    );
  }

  const pendingCount =
    pendingCountQuery.data?.adminAccountDeletionRequests.totalCount;
  const approvedCount =
    approvedCountQuery.data?.adminAccountDeletionRequests.totalCount;
  const rejectedCount =
    rejectedCountQuery.data?.adminAccountDeletionRequests.totalCount;
  const isSummaryLoading =
    pendingCountQuery.isLoading ||
    approvedCountQuery.isLoading ||
    rejectedCountQuery.isLoading;

  return (
    <>
      <div className="space-y-6">
        {isSummaryLoading ? (
          <StatsCardsSkeleton />
        ) : typeof pendingCount === 'number' &&
          typeof approvedCount === 'number' &&
          typeof rejectedCount === 'number' ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={Clock3}
              label="Pending Requests"
              value={formatCount(pendingCount)}
              iconClassName="text-amber-600 dark:text-amber-400"
              caption="Members still waiting for a review decision."
            />
            <StatCard
              icon={CheckCircle2}
              label="Approved Deletions"
              value={formatCount(approvedCount)}
              iconClassName="text-destructive"
              caption="Requests that already triggered account removal."
            />
            <StatCard
              icon={ShieldX}
              label="Rejected Requests"
              value={formatCount(rejectedCount)}
              iconClassName="text-slate-600 dark:text-slate-300"
              caption="Requests that were reviewed and declined."
            />
          </section>
        ) : null}

        <DataTable
          id="account-deletion-requests"
          collection={DataTable.collection({
            items: currentPage,
            itemToString: (request) => `${request.fullName} ${request.email}`,
            itemToValue: (request) => request.id,
          })}
          columns={
            [
              {
                id: 'submittedBy',
                heading: 'Submitted By',
                cell: (row) => (
                  <div className="min-w-55 space-y-1">
                    <p className="font-medium text-foreground">
                      {row.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">{row.email}</p>
                  </div>
                ),
              },
              {
                id: 'organizationName',
                heading: 'Organization',
                cell: (row) => row.organizationName,
              },
              {
                id: 'status',
                heading: 'Status',
                cell: (row) => (
                  <Badge className={getStatusBadgeClassName(row.status)}>
                    {formatAccountDeletionStatus(row.status)}
                  </Badge>
                ),
              },
              {
                id: 'createdAt',
                heading: 'Submitted',
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
                        <span className="sr-only">
                          Open deletion request actions
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          setSelectedRequestId(row.id);
                        }}
                      >
                        <SearchCheck className="size-4" />
                        Review request
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ),
              },
            ] satisfies Column<AccountDeletionRequestRecord>[]
          }
          title="Deletion requests"
          description="Review public account removal submissions before they are approved or declined."
          filter={{
            entries: {
              status: {
                type: 'SELECT',
                attached: true,
                clearable: true,
                label: 'Status',
                placeholder: 'All statuses',
                options: [...accountDeletionStatusOptions],
              },
            },
            value: {
              status: state.status ?? '',
            },
            onValueChange: (values) => {
              setState({
                status: z
                  .nativeEnum(AccountDeletionRequestStatus)
                  .safeParse(values.status).data,
                page: 1,
              });
            },
          }}
          loading={listQuery.isFetching}
          onReload={() => {
            void listQuery.refetch();
            void pendingCountQuery.refetch();
            void approvedCountQuery.refetch();
            void rejectedCountQuery.refetch();
          }}
          pagination={{
            count:
              listQuery.data?.pages.at(0)?.adminAccountDeletionRequests
                .totalCount ?? 0,
            loading: listQuery.isFetching,
            page: state.page,
            pageSize: state.pageSize,
            onPageChange: async (page) => {
              if (page > totalPages) {
                await listQuery.fetchNextPage();
              }

              setState({ page });
            },
            onPageSizeChange: (pageSize) => {
              setState({
                page: 1,
                pageSize,
              });
            },
          }}
          renderRightStartMenu={
            listQuery.isFetching ? <LoadingChip label="Refreshing" /> : null
          }
        />
      </div>

      <ReviewDeletionRequestDialog
        open={selectedRequestId !== null}
        requestId={selectedRequestId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequestId(null);
          }
        }}
      />
    </>
  );
}
