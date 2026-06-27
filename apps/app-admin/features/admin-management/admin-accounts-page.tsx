'use client';

import { format } from 'date-fns';
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ModuleErrorState, PageHeader } from '@/components/core';
import {
  type AdminAccountRecord,
  adminAccountsQueryKeys,
  useAdminAccountsQuery,
  useDeactivateAdminAccountMutation,
  useReactivateAdminAccountMutation,
} from '@/react-query/admin-management/admin-management-operations';
import {
  useOrganizationsQuery,
  organizationsQueryKeys,
} from '@/react-query/organizations/organizations-operations';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';
import { useQueryClient } from '@tanstack/react-query';

import { CreateAdminAccountSheet } from './create-admin-account-sheet';
import { EditAdminAccountSheet } from './edit-admin-account-sheet';

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return format(date, 'MMM d, yyyy');
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
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
  );
}

function LoadingTable() {
  return (
    <div className="admin-surface overflow-hidden border border-border/70">
      <Table>
        <TableHeader>
          <TableRow>
            {[
              'Name',
              'Position',
              'Email',
              'Organization',
              'Status',
              'Created',
              'Actions',
            ].map((label) => (
              <TableHead key={label}>{label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-44" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-9 w-9 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminAccountsPage() {
  const queryClient = useQueryClient();
  const adminAccountsQuery = useAdminAccountsQuery();
  const organizationsQuery = useOrganizationsQuery();
  const deactivateMutation = useDeactivateAdminAccountMutation();
  const reactivateMutation = useReactivateAdminAccountMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState<AdminAccountRecord | null>(
    null,
  );
  const [adminToDeactivate, setAdminToDeactivate] =
    useState<AdminAccountRecord | null>(null);

  const organizations = organizationsQuery.data?.organizations ?? [];
  const adminAccounts = adminAccountsQuery.data?.adminAccounts ?? [];

  const organizationNameById = useMemo(
    () =>
      new Map(
        organizations.map((organization) => [organization.id, organization.name] as const),
      ),
    [organizations],
  );

  async function invalidateRelevantQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminAccountsQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: organizationsQueryKeys.all }),
    ]);
  }

  async function handleReactivate(adminAccount: AdminAccountRecord) {
    try {
      await reactivateMutation.mutateAsync({ id: adminAccount.id });
      await invalidateRelevantQueries();
      toast.success('Admin account reactivated');
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to reactivate the admin account right now.',
        ),
      );
    }
  }

  async function handleDeactivate() {
    if (!adminToDeactivate) return;

    try {
      await deactivateMutation.mutateAsync({ id: adminToDeactivate.id });
      await invalidateRelevantQueries();
      toast.success('Admin account deactivated');
      setAdminToDeactivate(null);
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to deactivate the admin account right now.',
        ),
      );
    }
  }

  if (adminAccountsQuery.isError || organizationsQuery.isError) {
    return (
      <ModuleErrorState
        title="Admin accounts unavailable"
        message={explainGraphqlErrorMessage(
          adminAccountsQuery.error instanceof Error
            ? adminAccountsQuery.error
            : organizationsQuery.error instanceof Error
              ? organizationsQuery.error
              : undefined,
          'Try again in a moment.',
        )}
        onRetry={() => {
          void Promise.all([
            adminAccountsQuery.refetch(),
            organizationsQuery.refetch(),
          ]);
        }}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Admin Accounts"
          description="Create and manage organization admin access across every registered tenant."
          action={
            <Button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              disabled={organizations.length === 0}
            >
              <Plus className="size-4" />
              Create Admin
            </Button>
          }
        />

        {adminAccountsQuery.isLoading || organizationsQuery.isLoading ? (
          <LoadingTable />
        ) : adminAccounts.length === 0 ? (
          <section className="admin-surface flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-[22px] border border-border/70 bg-muted/70 text-primary shadow-sm">
              <Users className="size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-medium text-foreground">
                No admin accounts yet
              </h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Add organization admins here so each tenant has an assigned operator
                with platform access.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              disabled={organizations.length === 0}
            >
              <Plus className="size-4" />
              Create first admin
            </Button>
          </section>
        ) : (
          <div className="admin-surface overflow-hidden border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[72px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminAccounts.map((adminAccount) => (
                  <TableRow key={adminAccount.id}>
                    <TableCell>
                      <div className="flex min-w-[220px] items-center gap-3">
                        <Avatar className="size-10 border border-border/70">
                          <AvatarFallback className="bg-primary/10 font-medium text-primary">
                            {getInitials(
                              adminAccount.firstName,
                              adminAccount.lastName,
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {adminAccount.firstName} {adminAccount.lastName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            ID: {adminAccount.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      {adminAccount.position}
                    </TableCell>
                    <TableCell className="min-w-[220px] text-muted-foreground">
                      {adminAccount.email}
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      {organizationNameById.get(adminAccount.organizationId) ?? '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge isActive={adminAccount.isActive} />
                    </TableCell>
                    <TableCell>{formatDate(adminAccount.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Open admin actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setAdminToEdit(adminAccount)}
                          >
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          {adminAccount.isActive ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  setAdminToDeactivate(adminAccount)
                                }
                              >
                                <PowerOff className="mr-2 size-4" />
                                Deactivate
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  void handleReactivate(adminAccount);
                                }}
                              >
                                <Power className="mr-2 size-4" />
                                Reactivate
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateAdminAccountSheet
        organizations={organizations}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <EditAdminAccountSheet
        adminAccount={adminToEdit}
        organizations={organizations}
        open={adminToEdit != null}
        onOpenChange={(open) => {
          if (!open) setAdminToEdit(null);
        }}
      />

      <AlertDialog
        open={adminToDeactivate != null}
        onOpenChange={(open) => {
          if (!deactivateMutation.isPending && !open) {
            setAdminToDeactivate(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <ShieldCheck className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Deactivate Admin Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{' '}
              <span className="font-semibold text-foreground">
                {adminToDeactivate?.firstName} {adminToDeactivate?.lastName}
              </span>
              ? This preserves ownership history while blocking admin access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivateMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deactivateMutation.isPending || !adminToDeactivate}
              onClick={() => {
                void handleDeactivate();
              }}
            >
              {deactivateMutation.isPending ? (
                <>
                  <PowerOff className="size-4 animate-pulse" />
                  Deactivating...
                </>
              ) : (
                <>
                  <PowerOff className="size-4" />
                  Deactivate
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
