import type {
  CompleteAssetUploadMutation,
  CompleteAssetUploadMutationVariables,
  CreateAssetUploadMutation,
  CreateAssetUploadMutationVariables,
  ProjectAssetRecordFragment,
  ProjectAssetsQuery,
  ProjectAssetsQueryVariables,
  RemoveAssetMutation,
  RemoveAssetMutationVariables,
} from '@/react-query/generated__types';
import { client } from '@/react-query/graphql-client';
import { unwrapGraphqlResult } from '@/react-query/graphql-error';
import { defineMutation, defineQuery } from '@/react-query/utils';

import {
  COMPLETE_ASSET_UPLOAD_MUTATION,
  CREATE_ASSET_UPLOAD_MUTATION,
  PROJECT_ASSETS_QUERY,
  REMOVE_ASSET_MUTATION,
} from './graphql/assets';

export type ProjectAsset = ProjectAssetRecordFragment;

export const assetsQueryKeys = {
  all: ['assets'] as const,
  list: (projectId: string) => ['assets', 'list', projectId] as const,
};

export const useProjectAssetsQuery = defineQuery<
  ProjectAssetsQuery,
  ProjectAssetsQueryVariables
>({
  queryKey: (input) => assetsQueryKeys.list(input?.projectId ?? ''),
  queryFn: async (input, context) => {
    if (!input) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<ProjectAssetsQuery, ProjectAssetsQueryVariables>(
        PROJECT_ASSETS_QUERY,
        input,
        { signal: context?.signal },
      ),
    );
  },
  // Preview URLs are signed for 15 minutes; refresh well before they expire.
  staleTime: 5 * 60_000,
});

export async function createAssetUploadRequest(
  variables: CreateAssetUploadMutationVariables,
) {
  return unwrapGraphqlResult(
    await client.request<
      CreateAssetUploadMutation,
      CreateAssetUploadMutationVariables
    >(CREATE_ASSET_UPLOAD_MUTATION, variables),
  );
}

export async function completeAssetUploadRequest(
  variables: CompleteAssetUploadMutationVariables,
) {
  return unwrapGraphqlResult(
    await client.request<
      CompleteAssetUploadMutation,
      CompleteAssetUploadMutationVariables
    >(COMPLETE_ASSET_UPLOAD_MUTATION, variables),
  );
}

export async function removeAssetRequest(variables: RemoveAssetMutationVariables) {
  return unwrapGraphqlResult(
    await client.request<RemoveAssetMutation, RemoveAssetMutationVariables>(
      REMOVE_ASSET_MUTATION,
      variables,
    ),
  );
}

export const useRemoveAssetMutation = defineMutation<
  RemoveAssetMutation,
  RemoveAssetMutationVariables
>({
  mutationKey: ['assets', 'remove'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A file id is required.');

    return removeAssetRequest(variables);
  },
});
