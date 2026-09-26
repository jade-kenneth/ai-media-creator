import type {
  ClearImportedProductValuesMutation,
  ClearImportedProductValuesMutationVariables,
  CreateProjectMutation,
  CreateProjectMutationVariables,
  DuplicateProjectMutation,
  DuplicateProjectMutationVariables,
  ImportProductMutation,
  ImportProductMutationVariables,
  ProjectCardFragment,
  ProjectCountsQuery,
  ProjectDetailFragment,
  ProjectFilterInput,
  ProjectQuery,
  ProjectQueryVariables,
  ProjectSortInput,
  ProjectsQuery,
  ProjectsQueryVariables,
  RenameProjectMutation,
  RenameProjectMutationVariables,
  StudiosQuery,
  SuggestAnglesMutation,
  SuggestAnglesMutationVariables,
  SuggestAudiencesMutation,
  SuggestAudiencesMutationVariables,
  SuggestPremisesMutation,
  SuggestPremisesMutationVariables,
  UpdateProductMutation,
  UpdateProductMutationVariables,
  UpdateStoryMutation,
  UpdateStoryMutationVariables,
  UpdateStrategyMutation,
  UpdateStrategyMutationVariables,
} from '@/react-query/generated__types';
import { client } from '@/react-query/graphql-client';
import { unwrapGraphqlResult } from '@/react-query/graphql-error';
import {
  defineInfiniteQuery,
  defineMutation,
  defineQuery,
} from '@/react-query/utils';

import {
  CLEAR_IMPORTED_PRODUCT_VALUES_MUTATION,
  CREATE_PROJECT_MUTATION,
  DUPLICATE_PROJECT_MUTATION,
  IMPORT_PRODUCT_MUTATION,
  PROJECT_COUNTS_QUERY,
  PROJECT_QUERY,
  PROJECTS_QUERY,
  RENAME_PROJECT_MUTATION,
  STUDIOS_QUERY,
  SUGGEST_ANGLES_MUTATION,
  SUGGEST_AUDIENCES_MUTATION,
  SUGGEST_PREMISES_MUTATION,
  UPDATE_PRODUCT_MUTATION,
  UPDATE_STORY_MUTATION,
  UPDATE_STRATEGY_MUTATION,
} from './graphql/projects';

export type ProjectCard = ProjectCardFragment;
export type ProjectDetail = ProjectDetailFragment;

export interface ProjectListInput {
  filter?: ProjectFilterInput;
  sort?: ProjectSortInput;
}

/** Cards per dashboard page. */
export const PROJECTS_PAGE_SIZE = 24;

export const projectsQueryKeys = {
  all: ['projects'] as const,
  lists: ['projects', 'list'] as const,
  list: (input?: ProjectListInput) =>
    ['projects', 'list', input ?? {}] as const,
  counts: ['projects', 'counts'] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
  studios: ['projects', 'studios'] as const,
};

export const useProjectsQuery = defineInfiniteQuery<
  ProjectsQuery,
  ProjectListInput
>({
  queryKey: (input) => projectsQueryKeys.list(input),
  queryFn: async (input, context) =>
    unwrapGraphqlResult(
      await client.request<ProjectsQuery, ProjectsQueryVariables>(
        PROJECTS_QUERY,
        {
          filter: input?.filter,
          sort: input?.sort,
          pagination: {
            first: PROJECTS_PAGE_SIZE,
            after: context?.pageParam ?? undefined,
          },
        },
        { signal: context?.signal },
      ),
    ),
  getNextPageParam: (data) =>
    data.projects.pageInfo.hasNextPage
      ? (data.projects.pageInfo.endCursor ?? null)
      : null,
});

export const useProjectCountsQuery = defineQuery<ProjectCountsQuery>({
  queryKey: projectsQueryKeys.counts,
  queryFn: async (_input, context) =>
    unwrapGraphqlResult(
      await client.request<ProjectCountsQuery>(
        PROJECT_COUNTS_QUERY,
        undefined,
        {
          signal: context?.signal,
        },
      ),
    ),
});

export const useProjectQuery = defineQuery<ProjectQuery, ProjectQueryVariables>(
  {
    queryKey: (input) => projectsQueryKeys.detail(input?.id ?? ''),
    queryFn: async (input, context) => {
      if (!input) throw new Error('A project id is required.');

      return unwrapGraphqlResult(
        await client.request<ProjectQuery, ProjectQueryVariables>(
          PROJECT_QUERY,
          input,
          { signal: context?.signal },
        ),
      );
    },
    // A missing or inaccessible project is a designed state, not a retry case.
    retry: (failureCount, error) =>
      error.name !== 'NotFoundError' &&
      error.name !== 'ForbiddenError' &&
      failureCount < 2,
  },
);

/** The built studios for the New video chooser, in registry order (§3.23). */
export const useStudiosQuery = defineQuery<StudiosQuery>({
  queryKey: projectsQueryKeys.studios,
  queryFn: async (_input, context) =>
    unwrapGraphqlResult(
      await client.request<StudiosQuery>(STUDIOS_QUERY, undefined, {
        signal: context?.signal,
      }),
    ),
  staleTime: Infinity,
});

export const useCreateProjectMutation = defineMutation<
  CreateProjectMutation,
  CreateProjectMutationVariables
>({
  mutationKey: ['projects', 'create'],
  mutationFn: async (variables) =>
    unwrapGraphqlResult(
      await client.request<
        CreateProjectMutation,
        CreateProjectMutationVariables
      >(CREATE_PROJECT_MUTATION, variables ?? {}),
    ),
});

export const useRenameProjectMutation = defineMutation<
  RenameProjectMutation,
  RenameProjectMutationVariables
>({
  mutationKey: ['projects', 'rename'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A new name is required.');

    return unwrapGraphqlResult(
      await client.request<
        RenameProjectMutation,
        RenameProjectMutationVariables
      >(RENAME_PROJECT_MUTATION, variables),
    );
  },
});

export const useDuplicateProjectMutation = defineMutation<
  DuplicateProjectMutation,
  DuplicateProjectMutationVariables
>({
  mutationKey: ['projects', 'duplicate'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<
        DuplicateProjectMutation,
        DuplicateProjectMutationVariables
      >(DUPLICATE_PROJECT_MUTATION, variables),
    );
  },
});

export const useUpdateProductMutation = defineMutation<
  UpdateProductMutation,
  UpdateProductMutationVariables
>({
  mutationKey: ['projects', 'update-product'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Product changes are required.');

    return unwrapGraphqlResult(
      await client.request<
        UpdateProductMutation,
        UpdateProductMutationVariables
      >(UPDATE_PRODUCT_MUTATION, variables),
    );
  },
});

export const useImportProductMutation = defineMutation<
  ImportProductMutation,
  ImportProductMutationVariables
>({
  mutationKey: ['projects', 'import-product'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A product link is required.');

    return unwrapGraphqlResult(
      await client.request<
        ImportProductMutation,
        ImportProductMutationVariables
      >(IMPORT_PRODUCT_MUTATION, variables),
    );
  },
});

export const useClearImportedProductValuesMutation = defineMutation<
  ClearImportedProductValuesMutation,
  ClearImportedProductValuesMutationVariables
>({
  mutationKey: ['projects', 'clear-imported'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<
        ClearImportedProductValuesMutation,
        ClearImportedProductValuesMutationVariables
      >(CLEAR_IMPORTED_PRODUCT_VALUES_MUTATION, variables),
    );
  },
});

export const useUpdateStrategyMutation = defineMutation<
  UpdateStrategyMutation,
  UpdateStrategyMutationVariables
>({
  mutationKey: ['projects', 'update-strategy'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Strategy changes are required.');

    return unwrapGraphqlResult(
      await client.request<
        UpdateStrategyMutation,
        UpdateStrategyMutationVariables
      >(UPDATE_STRATEGY_MUTATION, variables),
    );
  },
});

export const useSuggestAudiencesMutation = defineMutation<
  SuggestAudiencesMutation,
  SuggestAudiencesMutationVariables
>({
  mutationKey: ['projects', 'suggest-audiences'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<
        SuggestAudiencesMutation,
        SuggestAudiencesMutationVariables
      >(SUGGEST_AUDIENCES_MUTATION, variables),
    );
  },
});

export const useSuggestAnglesMutation = defineMutation<
  SuggestAnglesMutation,
  SuggestAnglesMutationVariables
>({
  mutationKey: ['projects', 'suggest-angles'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<
        SuggestAnglesMutation,
        SuggestAnglesMutationVariables
      >(SUGGEST_ANGLES_MUTATION, variables),
    );
  },
});

export const useUpdateStoryMutation = defineMutation<
  UpdateStoryMutation,
  UpdateStoryMutationVariables
>({
  mutationKey: ['projects', 'update-story'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Story changes are required.');

    return unwrapGraphqlResult(
      await client.request<UpdateStoryMutation, UpdateStoryMutationVariables>(
        UPDATE_STORY_MUTATION,
        variables,
      ),
    );
  },
});

export const useSuggestPremisesMutation = defineMutation<
  SuggestPremisesMutation,
  SuggestPremisesMutationVariables
>({
  mutationKey: ['projects', 'suggest-premises'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<
        SuggestPremisesMutation,
        SuggestPremisesMutationVariables
      >(SUGGEST_PREMISES_MUTATION, variables),
    );
  },
});
