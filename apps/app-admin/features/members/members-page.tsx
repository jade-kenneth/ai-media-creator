'use client';

import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Eye,
  MoreHorizontal,
  RefreshCw,
  UserCheck,
  UserPlus,
  UserX,
  Users,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePaginated } from '@/hooks/use-paginated';
import { useAdminDashboardSummaryQuery } from '@/react-query/dashboard/dashboard-operations';
import {
  type AdminMembersActiveFilterInput,
  Gender,
  RegistrationStatus,
  SortDirection,
} from '@/react-query/generated__types';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import {
  type MemberRecord,
  useAdminMembersCountQuery,
  useAdminMembersQuery,
  useSearchMembersQuery,
} from '@/react-query/members/members-operations';
import { formatCount } from '@/utils/date';

import { ApproveMemberDialog } from './approve-member-dialog';
import {
  MEMBERS_PAGE_SIZE,
  formatGender,
  formatMemberRegistrationStatus,
  formatMemberReviewer,
  getMemberRegistrationStatusBadgeClassName,
  getMemberRegistrationStatusBadgeVariant,
  memberActivityOptions,
  memberGenderOptions,
  memberRegistrationStatusOptions,
} from './constants';
import { RejectMemberDialog } from './reject-member-dialog';
import { MemberDetailDialog } from './member-detail-dialog';
import { MemberRegistrationDialog } from './member-registration-dialog';
import { RetriggerApprovalDialog } from './retrigger-approval-dialog';

function formatMemberDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return format(date, 'MMM d, yyyy');
}

interface MembersPageState {
  gender: Gender | undefined;
  id: string[] | undefined;
  isActive: boolean | undefined;
  page: number;
  pageSize: number;
  registrationStatus: RegistrationStatus | undefined;
}

export function MembersPageView() {
  const queryClient = useQueryClient();
  const dashboardQuery = useAdminDashboardSummaryQuery();

  const [state, setState] = useReducer(
    (
      previousState: MembersPageState,
      nextState: Partial<MembersPageState>,
    ) => ({
      ...previousState,
      ...nextState,
    }),
    {
      gender: undefined,
      id: undefined,
      isActive: undefined,
      page: 1,
      pageSize: MEMBERS_PAGE_SIZE,
      registrationStatus: undefined,
    },
  );

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    null,
  );
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [memberToApprove, setMemberToApprove] =
    useState<MemberRecord | null>(null);
  const [memberToReject, setMemberToReject] =
    useState<MemberRecord | null>(null);
  const [memberToRetrigger, setMemberToRetrigger] =
    useState<MemberRecord | null>(null);

  const filter = {
    ...(state.registrationStatus != null && {
      registrationStatus: {
        equal: state.registrationStatus,
      },
    }),
    ...(state.isActive != null && {
      isActive: {
        equal: state.isActive,
      },
    }),
    ...(state.gender != null && {
      gender: {
        equal: state.gender,
      },
    }),
    ...(state.id?.length && {
      id: {
        in: state.id,
      },
    }),
  } satisfies AdminMembersActiveFilterInput;

  const listQuery = useAdminMembersQuery({
    filter: filter,
    first: state.pageSize,
    sort: { createdAt: SortDirection.Desc },
  });

  const activeMembersCountQuery = useAdminMembersCountQuery({
    filter: {
      isActive: {
        equal: true,
      },
    },
  });

  const inactiveMembersCountQuery = useAdminMembersCountQuery({
    filter: {
      isActive: {
        equal: false,
      },
    },
  });

  const { currentPage, totalPages } = usePaginated<MemberRecord>(
    () =>
      listQuery.data?.pages.flatMap((page) =>
        page.adminMembers.edges.map((edge) => edge.node),
      ) ?? [],
    state,
  );
  console.log(totalPages, 'total pages');
  if (listQuery.isError) {
    return (
      <div className="space-y-6">
        <ModuleErrorState
          title="Members unavailable"
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

  const summary = dashboardQuery.data?.adminDashboardSummary;

  const activeMembersCount =
    activeMembersCountQuery.data?.adminMembers.totalCount;

  const inactiveMembersCount =
    inactiveMembersCountQuery.data?.adminMembers.totalCount;

  const isSummaryLoading =
    dashboardQuery.isLoading ||
    activeMembersCountQuery.isLoading ||
    inactiveMembersCountQuery.isLoading;

  return (
    <>
      <div className="space-y-6">
        {isSummaryLoading ? (
          <StatsCardsSkeleton />
        ) : summary &&
          typeof activeMembersCount === 'number' &&
          typeof inactiveMembersCount === 'number' ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={Users}
              label="Registered Members"
              value={formatCount(summary.totalMembers)}
              iconClassName="text-blue-600 dark:text-blue-400"
              caption="Member profiles currently registered in the organization system."
            />
            <StatCard
              icon={UserCheck}
              label="Active Accounts"
              value={formatCount(activeMembersCount)}
              iconClassName="text-emerald-600 dark:text-emerald-400"
              caption="Members who can still access their linked account."
            />
            <StatCard
              icon={UserX}
              label="Inactive Accounts"
              value={formatCount(inactiveMembersCount)}
              iconClassName="text-amber-600 dark:text-amber-400"
              caption="Profiles with linked accounts that are currently inactive."
            />
          </section>
        ) : null}

        <DataTable
          id="members"
          collection={DataTable.collection({
            items: currentPage,
            itemToString: (member) =>
              `${member.fullName} ${member.user?.email ?? ''}`,
            itemToValue: (member) => member.id,
          })}
          columns={
            [
              {
                id: 'fullName',
                heading: 'Member',
                hideable: true,
                cell: (row) => (
                  <div className="min-w-55 space-y-1">
                    <p className="font-medium text-foreground">
                      {row.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {row.user?.email ?? 'No linked email'}
                    </p>
                  </div>
                ),
              },
              {
                id: 'contactNumber',
                heading: 'Contact',
                cell: (row) => (
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">
                      {row.contactNumber || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.purok || 'No purok'}
                    </p>
                  </div>
                ),
              },
              {
                id: 'address',
                heading: 'Address',
                enabled: false,
                cell: (row) => (
                  <div className="min-w-60">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {row.address || '—'}
                    </p>
                  </div>
                ),
              },
              {
                id: 'gender',
                heading: 'Gender',
                cell: (row) => formatGender(row.gender),
              },
              {
                id: 'registrationStatus',
                heading: 'Registration',
                cell: (row) => {
                  const registrationStatus =
                    row.user?.registrationStatus ??
                    RegistrationStatus.PendingApproval;

                  return (
                    <Badge
                      variant={getMemberRegistrationStatusBadgeVariant(
                        registrationStatus,
                      )}
                      className={getMemberRegistrationStatusBadgeClassName(
                        registrationStatus,
                      )}
                    >
                      {formatMemberRegistrationStatus(registrationStatus)}
                    </Badge>
                  );
                },
              },
              {
                id: 'isActive',
                heading: 'Account status',
                cell: (row) => (
                  <Badge
                    variant={row.user?.isActive ? 'secondary' : 'outline'}
                    className={
                      row.user?.isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'text-muted-foreground'
                    }
                  >
                    {row.user?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                ),
              },
              {
                id: 'reviewedBy',
                heading: 'Reviewed by',
                cell: (row) => (
                  <p className="min-w-45 text-sm text-muted-foreground">
                    {formatMemberReviewer(row.user?.registrationReview)}
                  </p>
                ),
              },
              {
                id: 'updatedAt',
                heading: 'Updated',
                cell: (row) => formatMemberDate(row.updatedAt),
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
                cell: (row) => {
                  const registrationStatus =
                    row.user?.registrationStatus ??
                    RegistrationStatus.PendingApproval;
                  const isPendingRegistration =
                    registrationStatus === RegistrationStatus.PendingApproval;
                  const isApproved =
                    registrationStatus === RegistrationStatus.Approved;

                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open member actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setSelectedMemberId(row.id);
                          }}
                        >
                          <Eye className="size-4" />
                          View details
                        </DropdownMenuItem>
                        {isPendingRegistration ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => {
                                setMemberToApprove(row);
                              }}
                            >
                              <UserCheck className="size-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => {
                                setMemberToReject(row);
                              }}
                            >
                              <UserX className="size-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        ) : null}
                        {isApproved ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => {
                                setMemberToRetrigger(row);
                              }}
                            >
                              <RefreshCw className="size-4" />
                              Resend approval notification
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                },
              },
            ] satisfies Column<MemberRecord>[]
          }
          title="Member directory"
          filter={{
            entries: {
              registrationStatus: {
                type: 'SELECT',
                attached: true,
                clearable: true,
                label: 'Registration status',
                placeholder: 'All statuses',
                options: [...memberRegistrationStatusOptions],
              },
              isActive: {
                type: 'SELECT',
                attached: true,
                clearable: true,
                label: 'Account status',
                placeholder: 'All account statuses',
                options: [...memberActivityOptions],
              },
              gender: {
                type: 'SELECT',
                clearable: true,
                label: 'Gender',
                placeholder: 'All genders',
                options: [...memberGenderOptions],
              },
            },
            value: {
              registrationStatus: state.registrationStatus ?? '',
              isActive: state.isActive != null ? String(state.isActive) : '',
              gender: state.gender ?? '',
            },
            onValueChange: (values) => {
              setState({
                registrationStatus: z
                  .nativeEnum(RegistrationStatus)
                  .safeParse(values.registrationStatus).data,
                isActive:
                  values.isActive === 'true'
                    ? true
                    : values.isActive === 'false'
                      ? false
                      : undefined,
                gender: z.nativeEnum(Gender).safeParse(values.gender).data,
                page: 1,
              });
            },
          }}
          search={{
            enabled: true,
            placeholder: 'Search by name',
            onValueChange: async (value) => {
              if (value.length > 0) {
                const input = useSearchMembersQuery['~input']({
                  search: value,
                });
                const data = await queryClient.fetchQuery({
                  queryKey: useSearchMembersQuery.getQueryKey(input),
                  queryFn: useSearchMembersQuery.getQueryFn(input),
                });
                const results = data.searchByMembers ?? [];

                if (!results.length) {
                  setState({
                    ...state,
                    id: undefined,
                    page: 1,
                  });
                  return;
                }

                setState({
                  ...state,
                  id: results.map((request) => request),
                  page: 1,
                });
                return;
              }

              setState({
                ...state,
                id: undefined,
                page: 1,
              });
            },
          }}
          loading={listQuery.isFetching}
          onReload={() => {
            void listQuery.refetch();
            void dashboardQuery.refetch();
            void activeMembersCountQuery.refetch();
            void inactiveMembersCountQuery.refetch();
          }}
          pagination={{
            count: listQuery.data?.pages.at(0)?.adminMembers.totalCount ?? 0,
            loading: listQuery.isFetching,
            page: state.page,
            pageSize: state.pageSize,
            onPageChange: async (page) => {
              if (page > totalPages) {
                await listQuery.fetchNextPage();
              }

              setState({
                page,
              });
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
          renderRightEndMenu={
            <Button
              type="button"
              onClick={() => {
                setIsRegistrationOpen(true);
              }}
            >
              <UserPlus className="size-4" />
              Register Member
            </Button>
          }
        />
      </div>

      <MemberDetailDialog
        memberId={selectedMemberId}
        open={selectedMemberId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMemberId(null);
          }
        }}
      />

      <MemberRegistrationDialog
        open={isRegistrationOpen}
        onOpenChange={setIsRegistrationOpen}
        onRegistered={() => {
          setState({
            page: 1,
          });
        }}
      />

      <ApproveMemberDialog
        member={memberToApprove}
        open={memberToApprove !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToApprove(null);
          }
        }}
      />

      <RejectMemberDialog
        member={memberToReject}
        open={memberToReject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToReject(null);
          }
        }}
      />

      <RetriggerApprovalDialog
        member={memberToRetrigger}
        open={memberToRetrigger !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMemberToRetrigger(null);
          }
        }}
      />
    </>
  );
}
