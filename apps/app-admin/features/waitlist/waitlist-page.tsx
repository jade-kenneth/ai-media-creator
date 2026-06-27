'use client';

import { useReducer, useState } from 'react';

import { ModuleErrorState } from '@/components/core';
import {
  type WaitlistEntryRecord,
  useAdminWaitlistEntriesQuery,
  useAdminWaitlistStatsQuery,
} from '@/react-query/waitlist/waitlist-operations';
import {
  type WaitlistFilterInput,
  SortDirection,
  WaitlistRole,
} from '@/react-query/generated__types';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { usePaginated } from '@/hooks/use-paginated';
import type { DateRange } from '@/components/DataTable';
import { WAITLIST_PAGE_SIZE } from './constants';
import { DeleteWaitlistEntryDialog } from './delete-waitlist-entry-dialog';
import { WaitlistStatsCards } from './waitlist-stats-cards';
import { WaitlistTable } from './waitlist-table';

interface WaitlistPageState {
  page: number;
  pageSize: number;
  role: WaitlistRole | undefined;
  joinedAt: Partial<DateRange> | null | undefined;
}

export function WaitlistPageView() {
  const [entryToDelete, setEntryToDelete] =
    useState<WaitlistEntryRecord | null>(null);
  const [state, setState] = useReducer(
    (
      previousState: WaitlistPageState,
      nextState: Partial<WaitlistPageState>,
    ) => ({
      ...previousState,
      ...nextState,
    }),
    {
      page: 1,
      pageSize: WAITLIST_PAGE_SIZE,
      role: undefined,
      joinedAt: undefined,
    },
  );

  const hasFilter =
    state.role != null ||
    state.joinedAt?.start != null ||
    state.joinedAt?.until != null;

  const filter = hasFilter
    ? ({
        ...(state.role != null && { role: { equal: state.role } }),
        ...(state.joinedAt?.start != null && {
          createdAt: {
            greaterThanOrEqual: state.joinedAt.start,
          },
        }),
        ...(state.joinedAt?.until != null && {
          createdAt: {
            ...(state.joinedAt.start != null && {
              greaterThanOrEqual: state.joinedAt.start,
            }),
            lesserThanOrEqual: state.joinedAt.until,
          },
        }),
      } satisfies WaitlistFilterInput)
    : undefined;

  const listQuery = useAdminWaitlistEntriesQuery({
    filter,
    first: state.pageSize,
    sort: { createdAt: SortDirection.Desc },
  });

  const statsQuery = useAdminWaitlistStatsQuery();

  const loadedEntries =
    listQuery.data?.pages.flatMap((page) =>
      page.adminWaitlistEntries.edges.map((edge) => edge.node),
    ) ?? [];

  const { currentPage, totalPages } = usePaginated<WaitlistEntryRecord>(
    () => loadedEntries,
    state,
  );

  if (listQuery.isError) {
    return (
      <ModuleErrorState
        title="Waitlist unavailable"
        message={explainGraphqlErrorMessage(
          listQuery.error,
          'Try again in a moment.',
        )}
        onRetry={() => {
          void listQuery.refetch();
          void statsQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <WaitlistStatsCards
        isLoading={statsQuery.isLoading}
        total={statsQuery.data?.adminWaitlistStats.total ?? 0}
        byRole={statsQuery.data?.adminWaitlistStats.byRole ?? []}
      />

      <WaitlistTable
        entries={currentPage}
        loadedEntries={loadedEntries}
        totalCount={
          listQuery.data?.pages[0]?.adminWaitlistEntries.totalCount ?? 0
        }
        loading={listQuery.isFetching}
        page={state.page}
        pageSize={state.pageSize}
        selectedRole={state.role}
        selectedJoinedAt={state.joinedAt}
        onRoleChange={(role) => {
          setState({ role, page: 1 });
        }}
        onJoinedAtChange={(joinedAt) => {
          setState({ joinedAt, page: 1 });
        }}
        onDeleteEntry={setEntryToDelete}
        onReload={() => {
          void listQuery.refetch();
          void statsQuery.refetch();
        }}
        onPageChange={async (page) => {
          if (page > totalPages) {
            await listQuery.fetchNextPage();
          }

          setState({ page });
        }}
        onPageSizeChange={(pageSize) => {
          setState({ page: 1, pageSize });
        }}
      />

      <DeleteWaitlistEntryDialog
        entry={entryToDelete}
        open={entryToDelete !== null}
        onDeleted={() => {
          if (currentPage.length !== 1 || state.page === 1) {
            return;
          }

          setState({ page: state.page - 1 });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setEntryToDelete(null);
          }
        }}
      />
    </div>
  );
}
