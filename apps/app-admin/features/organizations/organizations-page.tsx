'use client';

import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Building2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
} from 'lucide-react';
import { useReducer, useState } from 'react';
import { toast } from 'sonner';

import type { Column, DateRange } from '@/components/DataTable';
import { DataTable } from '@/components/DataTable';
import { ModuleErrorState } from '@/components/core';
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
import {
  type OrganizationRecord,
  organizationsQueryKeys,
  useOrganizationsQuery,
  useReactivateOrganizationMutation,
} from '@/react-query/organizations/organizations-operations';
import type { OrganizationFilterInput } from '@/react-query/generated__types';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { capitalize } from '@/utils/capitalize';

import { CreateOrganizationDialog } from './create-organization-dialog';
import { DeactivateOrganizationDialog } from './deactivate-organization-dialog';
import { UpdateOrganizationDialog } from './update-organization-dialog';

const PAGE_SIZE = 20;

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'MMM d, yyyy');
}

interface OrganizationsPageState {
  address: string | undefined;
  contactNumber: string | undefined;
  createdAt: Partial<DateRange> | null | undefined;
  name: string | undefined;
  page: number;
  pageSize: number;
  status: 'true' | 'false' | undefined;
}

export function OrganizationsPageView() {
  const queryClient = useQueryClient();
  const reactivateMutation = useReactivateOrganizationMutation();
  const [state, setState] = useReducer(
    (
      prev: OrganizationsPageState,
      next: Partial<OrganizationsPageState>,
    ) => ({ ...prev, ...next }),
    {
      address: undefined,
      contactNumber: undefined,
      createdAt: undefined,
      name: undefined,
      page: 1,
      pageSize: PAGE_SIZE,
      status: undefined,
    },
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [organizationToEdit, setOrganizationToEdit] = useState<OrganizationRecord | null>(
    null,
  );
  const [organizationToDeactivate, setOrganizationToDeactivate] =
    useState<OrganizationRecord | null>(null);

  const filter =
    state.status == null &&
    !state.name &&
    !state.contactNumber &&
    !state.address &&
    !state.createdAt?.start &&
    !state.createdAt?.until
      ? undefined
      : ({
          ...(state.status != null && {
            isActive: state.status === 'true',
          }),
          ...(state.name && {
            name: {
              contains: state.name,
            },
          }),
          ...(state.contactNumber && {
            contactNumber: {
              contains: state.contactNumber,
            },
          }),
          ...(state.address && {
            address: {
              contains: state.address,
            },
          }),
          ...(state.createdAt?.start && {
            createdAt: {
              greaterThanOrEqual: state.createdAt.start,
            },
          }),
          ...(state.createdAt?.until && {
            createdAt: {
              ...(state.createdAt.start
                ? {
                    greaterThanOrEqual: state.createdAt.start,
                  }
                : {}),
              lesserThanOrEqual: state.createdAt.until,
            },
          }),
        } satisfies OrganizationFilterInput);

  const listQuery = useOrganizationsQuery({
    filter,
  });

  const allOrganizations = listQuery.data?.organizations ?? [];

  const { currentPage } = usePaginated<OrganizationRecord>(
    () => allOrganizations,
    state,
  );

  async function handleReactivate(organization: OrganizationRecord) {
    try {
      await reactivateMutation.mutateAsync({ id: organization.id });
      await queryClient.invalidateQueries({
        queryKey: organizationsQueryKeys.all,
      });
      toast.success('Organization reactivated');
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to reactivate the organization right now.',
        ),
      );
    }
  }

  if (listQuery.isError) {
    return (
      <ModuleErrorState
        title="Organizations unavailable"
        message={explainGraphqlErrorMessage(
          listQuery.error,
          'Try again in a moment.',
        )}
        onRetry={() => {
          void listQuery.refetch();
        }}
      />
    );
  }

  const columns: Column<OrganizationRecord>[] = [
    {
      id: 'name',
      heading: 'Name',
      cell: (row) => (
        <div className="min-w-[200px] space-y-1">
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.slug}</p>
        </div>
      ),
    },
    {
      id: 'status',
      heading: 'Status',
      cell: (row) =>
        row.isActive ? (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          >
            Active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-destructive/30 bg-destructive/10 text-destructive"
          >
            Inactive
          </Badge>
        ),
    },
    {
      id: 'contactNumber',
      heading: 'Contact',
      cell: (row) => row.contactNumber || '—',
    },
    {
      id: 'address',
      heading: 'Address',
      cell: (row) => (
        <p className="line-clamp-2 min-w-[180px] text-sm text-muted-foreground">
          {row.address || '—'}
        </p>
      ),
    },
    {
      id: 'features',
      heading: 'Features',
      cell: (row) => (
        <p className="text-sm text-muted-foreground">
          {row.features.length > 0
            ? row.features
                .map((feature) =>
                  capitalize(feature, {
                    delimiter: capitalize.delimiters.UNDERSCORE,
                  }),
                )
                .join(', ')
            : '—'}
        </p>
      ),
    },
    {
      id: 'createdAt',
      heading: 'Created',
      cell: (row) => formatDate(row.createdAt),
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
              <span className="sr-only">Open organization actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setOrganizationToEdit(row)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            {row.isActive ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setOrganizationToDeactivate(row)}
                >
                  <PowerOff className="mr-2 size-4" />
                  Deactivate
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={reactivateMutation.isPending}
                  onClick={() => {
                    void handleReactivate(row);
                  }}
                >
                  <Power className="mr-2 size-4" />
                  Reactivate
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        id="organizations"
        collection={DataTable.collection({
          items: currentPage,
          itemToString: (b) => b.name,
          itemToValue: (b) => b.id,
        })}
        columns={columns}
        filter={{
          entries: {
            status: {
              type: 'SELECT',
              clearable: true,
              label: 'Status',
              placeholder: 'All statuses',
              options: [
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ],
            },
            name: {
              type: 'TEXT',
              clearable: true,
              label: 'Name',
              placeholder: 'Filter by name',
            },
            contactNumber: {
              type: 'TEXT',
              clearable: true,
              label: 'Contact number',
              placeholder: 'Filter by number',
            },
            address: {
              type: 'TEXT',
              clearable: true,
              label: 'Address',
              placeholder: 'Filter by address',
            },
            createdAt: {
              type: 'DATE_RANGE',
              clearable: true,
              label: 'Created date',
            },
          },
          value: {
            status: state.status ?? '',
            name: state.name,
            contactNumber: state.contactNumber,
            address: state.address,
            createdAt: state.createdAt,
          },
          onValueChange: (values) => {
            setState({
              status:
                values.status === 'true'
                  ? 'true'
                  : values.status === 'false'
                    ? 'false'
                    : undefined,
              name: values.name,
              contactNumber: values.contactNumber,
              address: values.address,
              createdAt: values.createdAt,
              page: 1,
            });
          },
        }}
        loading={listQuery.isLoading}
        summary__loading={listQuery.isFetching && !listQuery.isLoading}
        onReload={() => {
          void listQuery.refetch();
        }}
        pagination={{
          count: allOrganizations.length,
          page: state.page,
          pageSize: state.pageSize,
          onPageChange: (page) => setState({ page }),
        }}
        renderRightEndMenu={() => (
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" />
            Add Organization
          </Button>
        )}
        title={
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <span>
              {listQuery.isLoading
                ? 'Loading...'
                : `${allOrganizations.length} ${allOrganizations.length === 1 ? 'organization' : 'organizations'}`}
            </span>
          </div>
        }
      />

      <CreateOrganizationDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <UpdateOrganizationDialog
        organization={organizationToEdit}
        open={organizationToEdit !== null}
        onOpenChange={(open) => {
          if (!open) setOrganizationToEdit(null);
        }}
      />

      <DeactivateOrganizationDialog
        organization={organizationToDeactivate}
        open={organizationToDeactivate !== null}
        onOpenChange={(open) => {
          if (!open) setOrganizationToDeactivate(null);
        }}
      />
    </>
  );
}
