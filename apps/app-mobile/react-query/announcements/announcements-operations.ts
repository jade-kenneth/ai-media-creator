import type {
  AnnouncementQuery,
  AnnouncementQueryVariables,
  AnnouncementRecordFragment,
  AnnouncementsQuery,
  AnnouncementsQueryVariables,
} from "@/react-query/generated__types";
import type {
  GraphqlRequestOptions,
  GraphqlRequestResult,
} from "@/react-query/graphql-client";

import { client } from "@/react-query/graphql-client";
import { defineInfiniteQuery, defineQuery } from "@/react-query/utils";

import {
  ANNOUNCEMENTS_QUERY,
  ANNOUNCEMENT_QUERY,
} from "./graphql/announcements";

export type AnnouncementRecord = AnnouncementRecordFragment;

export const announcementsQueryKeys = {
  all: ["announcements"] as const,
  list: (variables?: AnnouncementsQueryVariables) =>
    [...announcementsQueryKeys.all, "list", variables ?? {}] as const,
  detail: (id: string) =>
    [...announcementsQueryKeys.all, "detail", id] as const,
};

function unwrapGraphqlResult<Data extends Record<string, unknown>>(
  result: GraphqlRequestResult<Data>
) {
  if (result.ok) {
    return result.data;
  }

  const error = new Error(result.error.message);
  error.name = result.error.name;
  throw error;
}

function normalizeListVariables(variables?: AnnouncementsQueryVariables) {
  if (!variables) return undefined;
  const { after: _after, ...rest } = variables;
  return rest;
}

export function announcementsRequest(
  variables?: AnnouncementsQueryVariables,
  options?: GraphqlRequestOptions
) {
  return client.request<AnnouncementsQuery, AnnouncementsQueryVariables>(
    ANNOUNCEMENTS_QUERY,
    variables,
    options
  );
}

export function announcementRequest(
  variables: AnnouncementQueryVariables,
  options?: GraphqlRequestOptions
) {
  return client.request<AnnouncementQuery, AnnouncementQueryVariables>(
    ANNOUNCEMENT_QUERY,
    variables,
    options
  );
}

export const useAnnouncementsQuery = defineInfiniteQuery<
  AnnouncementsQuery,
  AnnouncementsQueryVariables
>({
  queryFn: async (variables, context) => {
    const normalizedVariables = normalizeListVariables(variables);
    const result = await announcementsRequest(
      {
        ...normalizedVariables,
        after: context?.pageParam ?? null,
      },
      { signal: context?.signal }
    );
    return unwrapGraphqlResult(result);
  },
  getNextPageParam: (data) =>
    data.announcements.pageInfo.hasNextPage
      ? data.announcements.pageInfo.endCursor ?? null
      : null,
  queryKey: (variables) =>
    announcementsQueryKeys.list(normalizeListVariables(variables)),
});

export const useAnnouncementQuery = defineQuery<
  AnnouncementQuery,
  AnnouncementQueryVariables
>({
  queryFn: async (variables, context) => {
    if (!variables) {
      throw new Error("Announcement ID is required.");
    }
    const result = await announcementRequest(variables, {
      signal: context?.signal,
    });
    return unwrapGraphqlResult(result);
  },
  queryKey: (variables) => announcementsQueryKeys.detail(variables?.id ?? ""),
});
