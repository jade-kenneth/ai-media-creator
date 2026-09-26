import type {
  CheckAiClipMutation,
  CheckAiClipMutationVariables,
  ClipPromptFlagsQuery,
  ClipPromptFlagsQueryVariables,
  DiscardAiClipsMutation,
  DiscardAiClipsMutationVariables,
  GenerateSceneClipsMutation,
  GenerateSceneClipsMutationVariables,
} from '@/react-query/generated__types';
import { client } from '@/react-query/graphql-client';
import { unwrapGraphqlResult } from '@/react-query/graphql-error';
import { defineMutation, defineQuery } from '@/react-query/utils';

import {
  CHECK_AI_CLIP_MUTATION,
  CLIP_PROMPT_FLAGS_QUERY,
  DISCARD_AI_CLIPS_MUTATION,
  GENERATE_SCENE_CLIPS_MUTATION,
} from './graphql/ai-clips';

export const aiClipsQueryKeys = {
  all: ['ai-clips'] as const,
  promptFlags: (projectId: string, prompt: string) =>
    ['ai-clips', 'prompt-flags', projectId, prompt] as const,
};

/** Claim check of a clip description; callers debounce the prompt first. */
export const useClipPromptFlagsQuery = defineQuery<
  ClipPromptFlagsQuery,
  ClipPromptFlagsQueryVariables
>({
  queryKey: (input) =>
    aiClipsQueryKeys.promptFlags(input?.projectId ?? '', input?.prompt ?? ''),
  queryFn: async (input, context) => {
    if (!input) throw new Error('A project id and description are required.');

    return unwrapGraphqlResult(
      await client.request<ClipPromptFlagsQuery, ClipPromptFlagsQueryVariables>(
        CLIP_PROMPT_FLAGS_QUERY,
        input,
        { signal: context?.signal },
      ),
    );
  },
  staleTime: 60_000,
});

export const useGenerateSceneClipsMutation = defineMutation<
  GenerateSceneClipsMutation,
  GenerateSceneClipsMutationVariables
>({
  mutationKey: ['ai-clips', 'generate'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A clip request is required.');

    return unwrapGraphqlResult(
      await client.request<
        GenerateSceneClipsMutation,
        GenerateSceneClipsMutationVariables
      >(GENERATE_SCENE_CLIPS_MUTATION, variables),
    );
  },
});

export const useCheckAiClipMutation = defineMutation<
  CheckAiClipMutation,
  CheckAiClipMutationVariables
>({
  mutationKey: ['ai-clips', 'check'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A clip id is required.');

    return unwrapGraphqlResult(
      await client.request<CheckAiClipMutation, CheckAiClipMutationVariables>(
        CHECK_AI_CLIP_MUTATION,
        variables,
      ),
    );
  },
});

export const useDiscardAiClipsMutation = defineMutation<
  DiscardAiClipsMutation,
  DiscardAiClipsMutationVariables
>({
  mutationKey: ['ai-clips', 'discard'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A clip job id is required.');

    return unwrapGraphqlResult(
      await client.request<
        DiscardAiClipsMutation,
        DiscardAiClipsMutationVariables
      >(DISCARD_AI_CLIPS_MUTATION, variables),
    );
  },
});
