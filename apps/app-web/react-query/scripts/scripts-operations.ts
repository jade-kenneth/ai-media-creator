import type {
  ApproveScriptVersionMutation,
  ApproveScriptVersionMutationVariables,
  CopyScriptVersionMutation,
  CopyScriptVersionMutationVariables,
  CreatorBriefQuery,
  CreatorBriefQueryVariables,
  RewriteHookMutation,
  RewriteHookMutationVariables,
  RewriteSceneMutation,
  RewriteSceneMutationVariables,
  ScriptVersionRecordFragment,
  ScriptVersionsQuery,
  ScriptVersionsQueryVariables,
  UpdateScriptVersionMutation,
  UpdateScriptVersionMutationVariables,
  WriteScriptMutation,
  WriteScriptMutationVariables,
} from '@/react-query/generated__types';
import { client } from '@/react-query/graphql-client';
import { unwrapGraphqlResult } from '@/react-query/graphql-error';
import { defineMutation, defineQuery } from '@/react-query/utils';

import {
  APPROVE_SCRIPT_VERSION_MUTATION,
  COPY_SCRIPT_VERSION_MUTATION,
  CREATOR_BRIEF_QUERY,
  REWRITE_HOOK_MUTATION,
  REWRITE_SCENE_MUTATION,
  SCRIPT_VERSIONS_QUERY,
  UPDATE_SCRIPT_VERSION_MUTATION,
  WRITE_SCRIPT_MUTATION,
} from './graphql/scripts';

export type ScriptVersion = ScriptVersionRecordFragment;
export type ScriptHook = ScriptVersion['hooks'][number];
export type ScriptScene = ScriptVersion['scenes'][number];
export type ClaimFlag = ScriptScene['flags'][number];

export const scriptsQueryKeys = {
  all: ['scripts'] as const,
  versions: (projectId: string) => ['scripts', 'versions', projectId] as const,
  brief: (projectId: string) => ['scripts', 'brief', projectId] as const,
};

export const useScriptVersionsQuery = defineQuery<
  ScriptVersionsQuery,
  ScriptVersionsQueryVariables
>({
  queryKey: (input) => scriptsQueryKeys.versions(input?.projectId ?? ''),
  queryFn: async (input, context) => {
    if (!input) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<ScriptVersionsQuery, ScriptVersionsQueryVariables>(
        SCRIPT_VERSIONS_QUERY,
        input,
        { signal: context?.signal },
      ),
    );
  },
});

export const useCreatorBriefQuery = defineQuery<
  CreatorBriefQuery,
  CreatorBriefQueryVariables
>({
  queryKey: (input) => scriptsQueryKeys.brief(input?.projectId ?? ''),
  queryFn: async (input, context) => {
    if (!input) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<CreatorBriefQuery, CreatorBriefQueryVariables>(
        CREATOR_BRIEF_QUERY,
        input,
        { signal: context?.signal },
      ),
    );
  },
  retry: (failureCount, error) =>
    error.name !== 'ConflictError' && failureCount < 2,
});

export const useWriteScriptMutation = defineMutation<
  WriteScriptMutation,
  WriteScriptMutationVariables
>({
  mutationKey: ['scripts', 'write'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<WriteScriptMutation, WriteScriptMutationVariables>(
        WRITE_SCRIPT_MUTATION,
        variables,
      ),
    );
  },
});

export const useRewriteHookMutation = defineMutation<
  RewriteHookMutation,
  RewriteHookMutationVariables
>({
  mutationKey: ['scripts', 'rewrite-hook'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A hook is required.');

    return unwrapGraphqlResult(
      await client.request<RewriteHookMutation, RewriteHookMutationVariables>(
        REWRITE_HOOK_MUTATION,
        variables,
      ),
    );
  },
});

export const useRewriteSceneMutation = defineMutation<
  RewriteSceneMutation,
  RewriteSceneMutationVariables
>({
  mutationKey: ['scripts', 'rewrite-scene'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A scene is required.');

    return unwrapGraphqlResult(
      await client.request<RewriteSceneMutation, RewriteSceneMutationVariables>(
        REWRITE_SCENE_MUTATION,
        variables,
      ),
    );
  },
});

export const useUpdateScriptVersionMutation = defineMutation<
  UpdateScriptVersionMutation,
  UpdateScriptVersionMutationVariables
>({
  mutationKey: ['scripts', 'update'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Script changes are required.');

    return unwrapGraphqlResult(
      await client.request<
        UpdateScriptVersionMutation,
        UpdateScriptVersionMutationVariables
      >(UPDATE_SCRIPT_VERSION_MUTATION, variables),
    );
  },
});

export const useApproveScriptVersionMutation = defineMutation<
  ApproveScriptVersionMutation,
  ApproveScriptVersionMutationVariables
>({
  mutationKey: ['scripts', 'approve'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A version id is required.');

    return unwrapGraphqlResult(
      await client.request<
        ApproveScriptVersionMutation,
        ApproveScriptVersionMutationVariables
      >(APPROVE_SCRIPT_VERSION_MUTATION, variables),
    );
  },
});

export const useCopyScriptVersionMutation = defineMutation<
  CopyScriptVersionMutation,
  CopyScriptVersionMutationVariables
>({
  mutationKey: ['scripts', 'copy'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A version id is required.');

    return unwrapGraphqlResult(
      await client.request<
        CopyScriptVersionMutation,
        CopyScriptVersionMutationVariables
      >(COPY_SCRIPT_VERSION_MUTATION, variables),
    );
  },
});
