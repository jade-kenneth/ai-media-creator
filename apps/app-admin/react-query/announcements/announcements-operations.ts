import type {
  AdminAnnouncementsQuery,
  AdminAnnouncementsQueryVariables,
  AnnouncementFragment,
  CreateAnnouncementMutation,
  CreateAnnouncementMutationVariables,
  DeleteAnnouncementMutation,
  DeleteAnnouncementMutationVariables,
  PinAnnouncementMutation,
  PinAnnouncementMutationVariables,
  PublishAnnouncementMutation,
  PublishAnnouncementMutationVariables,
  SearchByAdminAnnouncementsQuery,
  SearchByAdminAnnouncementsQueryVariables,
  UpdateAnnouncementMutation,
  UpdateAnnouncementMutationVariables,
} from '@/react-query/generated__types';
import type {
  GraphqlRequestOptions,
  GraphqlRequestResult,
} from '@/react-query/graphql-client';

import { client } from '@/react-query/graphql-client';
import {
  defineInfiniteQuery,
  defineMutation,
  defineQuery,
} from '@/react-query/utils';

import {
  ADMIN_ANNOUNCEMENTS_QUERY,
  CREATE_ANNOUNCEMENT_MUTATION,
  DELETE_ANNOUNCEMENT_MUTATION,
  PIN_ANNOUNCEMENT_MUTATION,
  PUBLISH_ANNOUNCEMENT_MUTATION,
  SEARCH_ADMIN_ANNOUNCEMENTS_QUERY,
  UPDATE_ANNOUNCEMENT_MUTATION,
} from '../graphql/announcements';

export type AnnouncementRecord = AnnouncementFragment;

export const announcementsQueryKeys = {
  all: ['announcements'] as const,
  list: (variables?: AdminAnnouncementsQueryVariables) =>
    [...announcementsQueryKeys.all, 'list', variables ?? {}] as const,
  search: (variables: SearchByAdminAnnouncementsQueryVariables) =>
    [...announcementsQueryKeys.all, 'search', variables] as const,
};

function normalizeAdminAnnouncementsListVariables(
  variables?: AdminAnnouncementsQueryVariables,
) {
  if (!variables) {
    return undefined;
  }

  const { after: _after, ...rest } = variables;

  return rest;
}

function unwrapGraphqlResult<Data extends Record<string, unknown>>(
  result: GraphqlRequestResult<Data>,
) {
  if (result.ok) {
    return result.data;
  }

  const error = new Error(result.error.message);
  error.name = result.error.name;

  throw error;
}

export function adminAnnouncementsRequest(
  variables?: AdminAnnouncementsQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    AdminAnnouncementsQuery,
    AdminAnnouncementsQueryVariables
  >(ADMIN_ANNOUNCEMENTS_QUERY, variables, options);
}

export function searchAdminAnnouncementsRequest(
  variables: SearchByAdminAnnouncementsQueryVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    SearchByAdminAnnouncementsQuery,
    SearchByAdminAnnouncementsQueryVariables
  >(SEARCH_ADMIN_ANNOUNCEMENTS_QUERY, variables, options);
}

export function createAnnouncementRequest(
  variables: CreateAnnouncementMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    CreateAnnouncementMutation,
    CreateAnnouncementMutationVariables
  >(CREATE_ANNOUNCEMENT_MUTATION, variables, options);
}

export function updateAnnouncementRequest(
  variables: UpdateAnnouncementMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    UpdateAnnouncementMutation,
    UpdateAnnouncementMutationVariables
  >(UPDATE_ANNOUNCEMENT_MUTATION, variables, options);
}

export function deleteAnnouncementRequest(
  variables: DeleteAnnouncementMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    DeleteAnnouncementMutation,
    DeleteAnnouncementMutationVariables
  >(DELETE_ANNOUNCEMENT_MUTATION, variables, options);
}

export function publishAnnouncementRequest(
  variables: PublishAnnouncementMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    PublishAnnouncementMutation,
    PublishAnnouncementMutationVariables
  >(PUBLISH_ANNOUNCEMENT_MUTATION, variables, options);
}

export function pinAnnouncementRequest(
  variables: PinAnnouncementMutationVariables,
  options?: GraphqlRequestOptions,
) {
  return client.request<
    PinAnnouncementMutation,
    PinAnnouncementMutationVariables
  >(PIN_ANNOUNCEMENT_MUTATION, variables, options);
}

export const useAdminAnnouncementsQuery = defineInfiniteQuery<
  AdminAnnouncementsQuery,
  AdminAnnouncementsQueryVariables
>({
  queryFn: async (variables, context) => {
    const result = await adminAnnouncementsRequest(
      {
        ...variables,
        after: context?.pageParam ?? null,
      },
      {
        signal: context?.signal,
      },
    );

    return unwrapGraphqlResult(result);
  },
  getNextPageParam: (data) =>
    data.adminAnnouncements.pageInfo.hasNextPage
      ? (data.adminAnnouncements.pageInfo.endCursor ?? null)
      : null,
  queryKey: (variables) =>
    announcementsQueryKeys.list(
      normalizeAdminAnnouncementsListVariables(variables),
    ),
});

export const useSearchAdminAnnouncementsQuery = defineQuery<
  SearchByAdminAnnouncementsQuery,
  SearchByAdminAnnouncementsQueryVariables
>({
  queryFn: async (variables, context) => {
    if (!variables) {
      throw new Error('Search variables are required.');
    }

    const result = await searchAdminAnnouncementsRequest(variables, {
      signal: context?.signal,
    });

    return unwrapGraphqlResult(result);
  },
  queryKey: (variables) =>
    announcementsQueryKeys.search(variables ?? { search: '', first: 0 }),
});

export const useCreateAnnouncementMutation = defineMutation<
  CreateAnnouncementMutation,
  CreateAnnouncementMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Create announcement variables are required.');
    }

    return unwrapGraphqlResult(await createAnnouncementRequest(variables));
  },
  mutationKey: [...announcementsQueryKeys.all, 'create'],
});

export const useUpdateAnnouncementMutation = defineMutation<
  UpdateAnnouncementMutation,
  UpdateAnnouncementMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Update announcement variables are required.');
    }

    return unwrapGraphqlResult(await updateAnnouncementRequest(variables));
  },
  mutationKey: [...announcementsQueryKeys.all, 'update'],
});

export const useDeleteAnnouncementMutation = defineMutation<
  DeleteAnnouncementMutation,
  DeleteAnnouncementMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Delete announcement variables are required.');
    }

    return unwrapGraphqlResult(await deleteAnnouncementRequest(variables));
  },
  mutationKey: [...announcementsQueryKeys.all, 'delete'],
});

export const usePublishAnnouncementMutation = defineMutation<
  PublishAnnouncementMutation,
  PublishAnnouncementMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Publish announcement variables are required.');
    }

    return unwrapGraphqlResult(await publishAnnouncementRequest(variables));
  },
  mutationKey: [...announcementsQueryKeys.all, 'publish'],
});

export const usePinAnnouncementMutation = defineMutation<
  PinAnnouncementMutation,
  PinAnnouncementMutationVariables
>({
  mutationFn: async (variables) => {
    if (!variables) {
      throw new Error('Pin announcement variables are required.');
    }

    return unwrapGraphqlResult(await pinAnnouncementRequest(variables));
  },
  mutationKey: [...announcementsQueryKeys.all, 'pin'],
});
