'use client';

import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from 'lucide-react';
import { useReducer, useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';

import type { Column, DateRange } from '@/components/DataTable';
import { DataTable } from '@/components/DataTable';
import {
  AnnouncementCategoryBadge,
  LoadingChip,
  ModuleErrorState,
  PublishStateBadge,
} from '@/components/core';
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
  announcementsQueryKeys,
  useAdminAnnouncementsQuery,
  usePinAnnouncementMutation,
  usePublishAnnouncementMutation,
  useSearchAdminAnnouncementsQuery,
} from '@/react-query/announcements/announcements-operations';
import {
  type AdminAnnouncementsFilterInput,
  AnnouncementCategory,
  type AnnouncementFragment,
} from '@/react-query/generated__types';
import { explainGraphqlErrorMessage } from '@/react-query/graphql-error';

import { AnnouncementFormDialog } from './announcement-form-dialog';
import {
  ANNOUNCEMENT_PAGE_SIZE,
  type AnnouncementCategoryFilterValue,
  announcementCategoryOptions,
} from './constants';
import { DeleteAnnouncementDialog } from './delete-announcement-dialog';

function toAnnouncementPreviewText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPublishedDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return format(date, 'MMM d, yyyy');
}

interface AnnouncementsPageState {
  category: AnnouncementCategoryFilterValue | undefined;
  id: string[] | undefined;
  isPinned: boolean | undefined;
  page: number;
  pageSize: number;
  publishedAt: Partial<DateRange> | null | undefined;
  status: 'true' | 'false' | undefined;
}

export function AnnouncementsPageView() {
  const queryClient = useQueryClient();
  const publishAnnouncementMutation = usePublishAnnouncementMutation();
  const pinAnnouncementMutation = usePinAnnouncementMutation();

  const [state, setState] = useReducer(
    (
      previousState: AnnouncementsPageState,
      nextState: Partial<AnnouncementsPageState>,
    ) => ({
      ...previousState,
      ...nextState,
    }),
    {
      category: undefined,
      id: undefined,
      isPinned: undefined,
      page: 1,
      pageSize: ANNOUNCEMENT_PAGE_SIZE,
      publishedAt: undefined,
      status: undefined,
    },
  );

  const [formAnnouncement, setFormAnnouncement] =
    useState<AnnouncementFragment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] =
    useState<AnnouncementFragment | null>(null);

  const filter = {
    deletedAt: {
      equal: null,
    },
    ...(state.category != null && {
      category: {
        equal: state.category,
      },
    }),
    ...(state.status != null && {
      isPublished: {
        equal: state.status === 'true',
      },
    }),
    ...(state.isPinned && {
      isPinned: {
        equal: true,
      },
    }),
    ...(state.publishedAt?.start && {
      publishedAt: {
        greaterThanOrEqual: state.publishedAt.start,
      },
    }),
    ...(state.publishedAt?.until && {
      publishedAt: {
        ...(state.publishedAt.start
          ? {
              greaterThanOrEqual: state.publishedAt.start,
            }
          : {}),
        lesserThanOrEqual: state.publishedAt.until,
      },
    }),
    ...(state.id?.length && {
      id: {
        in: state.id,
      },
    }),
  } satisfies AdminAnnouncementsFilterInput;

  const listQuery = useAdminAnnouncementsQuery({
    filter,
    first: state.pageSize,
  });

  const { currentPage, totalPages } = usePaginated<AnnouncementFragment>(
    () =>
      listQuery.data?.pages.flatMap((page) =>
        page.adminAnnouncements.edges.map(
          (edge) => edge.node as AnnouncementFragment,
        ),
      ) ?? [],
    state,
  );

  async function invalidateAnnouncements() {
    await queryClient.invalidateQueries({
      queryKey: announcementsQueryKeys.all,
    });
  }

  async function handlePublishToggle(announcement: AnnouncementFragment) {
    try {
      await publishAnnouncementMutation.mutateAsync({
        id: announcement.id,
        isPublished: !announcement.isPublished,
      });

      await invalidateAnnouncements();

      toast.success(
        announcement.isPublished
          ? 'Announcement unpublished'
          : 'Announcement published — members will be notified',
      );
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to update the announcement status right now.',
        ),
      );
    }
  }

  async function handlePinToggle(announcement: AnnouncementFragment) {
    try {
      await pinAnnouncementMutation.mutateAsync({
        id: announcement.id,
        isPinned: !announcement.isPinned,
      });

      await invalidateAnnouncements();

      toast.success(
        announcement.isPinned
          ? 'Announcement unpinned'
          : 'Announcement pinned to the top',
      );
    } catch (error) {
      toast.error(
        explainGraphqlErrorMessage(
          error instanceof Error ? error : undefined,
          'Unable to update the pinned state right now.',
        ),
      );
    }
  }

  if (listQuery.isError) {
    return (
      <>
        <ModuleErrorState
          title="Announcements unavailable"
          message={explainGraphqlErrorMessage(
            listQuery.error,
            'Try again in a moment.',
          )}
          onRetry={() => {
            void listQuery.refetch();
          }}
        />
        <AnnouncementFormDialog
          announcement={formAnnouncement}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative space-y-6">
        <DataTable
          id="announcements"
          collection={DataTable.collection({
            items: currentPage,
            itemToString: (announcement) =>
              `${announcement.title} ${toAnnouncementPreviewText(announcement.content)}`,
            itemToValue: (announcement) => announcement.id,
          })}
          columns={
            [
              {
                id: 'title',
                heading: 'Title',
                hideable: true,
                cell: (row) => (
                  <div className="max-w-55 space-y-1">
                    <p className="truncate font-medium">{row.title}</p>
                    <p className="line-clamp-1 line-clamp-3 text-sm text-muted-foreground text-wrap">
                      {toAnnouncementPreviewText(row.content)}
                    </p>
                  </div>
                ),
              },
              {
                id: 'category',
                heading: 'Category',
                cell: (row) => (
                  <AnnouncementCategoryBadge category={row.category} />
                ),
              },
              {
                id: 'status',
                heading: 'Status',
                cell: (row) => (
                  <PublishStateBadge
                    state={row.isPublished ? 'PUBLISHED' : 'DRAFT'}
                  />
                ),
              },
              {
                id: 'isPinned',
                heading: 'Pinned',
                cell: (row) =>
                  row.isPinned ? (
                    <Pin className="mx-auto size-4 fill-current text-primary" />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  ),
              },
              {
                id: 'publishedAt',
                heading: 'Published Date',
                cell: (row) =>
                  row.isPublished ? formatPublishedDate(row.publishedAt) : '—',
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
                  const isPublishingCurrentRow =
                    publishAnnouncementMutation.isPending &&
                    publishAnnouncementMutation.variables?.id === row.id;
                  const isPinningCurrentRow =
                    pinAnnouncementMutation.isPending &&
                    pinAnnouncementMutation.variables?.id === row.id;

                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={
                            isPublishingCurrentRow || isPinningCurrentRow
                          }
                        >
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">
                            Open announcement actions
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setFormAnnouncement(row);
                            setIsFormOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            void handlePublishToggle(row);
                          }}
                        >
                          {row.isPublished ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                          {row.isPublished ? 'Unpublish' : 'Publish'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            void handlePinToggle(row);
                          }}
                        >
                          {row.isPinned ? (
                            <PinOff className="size-4" />
                          ) : (
                            <Pin className="size-4" />
                          )}
                          {row.isPinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => {
                            setAnnouncementToDelete(row);
                          }}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                },
              },
            ] satisfies Column<AnnouncementFragment>[]
          }
          title="Announcement queue"
          filter={{
            entries: {
              category: {
                type: 'SELECT',
                attached: true,
                clearable: true,
                label: 'Category',
                placeholder: 'All categories',
                options: [...announcementCategoryOptions],
              },
              status: {
                type: 'SELECT',
                clearable: true,
                label: 'Publish status',
                placeholder: 'All statuses',
                options: [
                  { value: 'true', label: 'Published' },
                  { value: 'false', label: 'Draft' },
                ],
              },
              isPinned: {
                type: 'TOGGLE',
                label: 'Pinned only',
              },
              publishedAt: {
                type: 'DATE_RANGE',
                clearable: true,
                label: 'Published date',
              },
            },
            value: {
              category: state.category ?? '',
              status: state.status ?? '',
              isPinned: state.isPinned,
              publishedAt: state.publishedAt,
            },
            onValueChange: (values) => {
              setState({
                category: z
                  .nativeEnum(AnnouncementCategory)
                  .safeParse(values.category).data,
                status:
                  values.status === 'true'
                    ? 'true'
                    : values.status === 'false'
                      ? 'false'
                      : undefined,
                isPinned: values.isPinned === true ? true : undefined,
                publishedAt: values.publishedAt,
                page: 1,
              });
            },
          }}
          search={{
            enabled: true,
            placeholder: 'Search announcements...',
            onValueChange: async (value) => {
              if (value.length > 0) {
                const input = useSearchAdminAnnouncementsQuery['~input']({
                  search: value,
                });
                const data = await queryClient.fetchQuery({
                  queryKey: useSearchAdminAnnouncementsQuery.getQueryKey(input),
                  queryFn: useSearchAdminAnnouncementsQuery.getQueryFn(input),
                });

                const results = data.searchByAdminAnnouncements ?? [];

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
                  id: results.map((announcement) => announcement.id),
                  page: 1,
                });
              } else {
                setState({
                  ...state,
                  id: undefined,
                  page: 1,
                });
              }
            },
          }}
          loading={listQuery.isFetching}
          onReload={() => {
            void listQuery.refetch();
          }}
          pagination={{
            count:
              listQuery.data?.pages.at(-1)?.adminAnnouncements.totalCount ?? 0,
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
                setFormAnnouncement(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create Announcement
            </Button>
          }
        />
      </div>

      <AnnouncementFormDialog
        announcement={formAnnouncement}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);

          if (!open) {
            setFormAnnouncement(null);
          }
        }}
      />

      <DeleteAnnouncementDialog
        announcement={announcementToDelete}
        open={announcementToDelete !== null}
        onDeleted={() => {
          if (currentPage.length !== 1 || state.page === 1) {
            return;
          }

          setState({
            page: state.page - 1,
          });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setAnnouncementToDelete(null);
          }
        }}
      />
    </>
  );
}
