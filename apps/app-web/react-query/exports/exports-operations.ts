import type {
  CreateExportDownloadMutation,
  CreateExportDownloadMutationVariables,
  ExportRecordFragment,
  ProjectExportsQuery,
  ProjectExportsQueryVariables,
  RenderVideoMutation,
  RenderVideoMutationVariables,
} from '@/react-query/generated__types';
import { client } from '@/react-query/graphql-client';
import { unwrapGraphqlResult } from '@/react-query/graphql-error';
import { defineMutation, defineQuery } from '@/react-query/utils';

import {
  CREATE_EXPORT_DOWNLOAD_MUTATION,
  PROJECT_EXPORTS_QUERY,
  RENDER_VIDEO_MUTATION,
} from './graphql/exports';

export type ExportRecord = ExportRecordFragment;

export const exportsQueryKeys = {
  all: ['exports'] as const,
  project: (projectId: string) => ['exports', projectId] as const,
};

export const useProjectExportsQuery = defineQuery<
  ProjectExportsQuery,
  ProjectExportsQueryVariables
>({
  queryKey: (input) => exportsQueryKeys.project(input?.projectId ?? ''),
  queryFn: async (input, context) => {
    if (!input) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<ProjectExportsQuery, ProjectExportsQueryVariables>(
        PROJECT_EXPORTS_QUERY,
        input,
        { signal: context?.signal },
      ),
    );
  },
  // Poster and playback URLs are signed for 15 minutes.
  staleTime: 5 * 60_000,
});

export const useRenderVideoMutation = defineMutation<
  RenderVideoMutation,
  RenderVideoMutationVariables
>({
  mutationKey: ['exports', 'render'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project is required.');

    return unwrapGraphqlResult(
      await client.request<RenderVideoMutation, RenderVideoMutationVariables>(
        RENDER_VIDEO_MUTATION,
        variables,
      ),
    );
  },
});

export const useCreateExportDownloadMutation = defineMutation<
  CreateExportDownloadMutation,
  CreateExportDownloadMutationVariables
>({
  mutationKey: ['exports', 'download'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('An export is required.');

    return unwrapGraphqlResult(
      await client.request<
        CreateExportDownloadMutation,
        CreateExportDownloadMutationVariables
      >(CREATE_EXPORT_DOWNLOAD_MUTATION, variables),
    );
  },
});
