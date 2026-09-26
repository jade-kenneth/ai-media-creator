import type {
  AlignRecordingMutation,
  AlignRecordingMutationVariables,
  AutoFillSceneMediaMutation,
  AutoFillSceneMediaMutationVariables,
  GenerateVoiceoverMutation,
  GenerateVoiceoverMutationVariables,
  ResetCaptionsMutation,
  ResetCaptionsMutationVariables,
  StartVideoEditMutation,
  StartVideoEditMutationVariables,
  SwitchVideoEditVersionMutation,
  SwitchVideoEditVersionMutationVariables,
  UpdateVideoEditMutation,
  UpdateVideoEditMutationVariables,
  VideoEditQuery,
  VideoEditQueryVariables,
  VideoEditRecordFragment,
  VoiceOptionsQuery,
} from '@/react-query/generated__types';
import { client } from '@/react-query/graphql-client';
import { unwrapGraphqlResult } from '@/react-query/graphql-error';
import { defineMutation, defineQuery } from '@/react-query/utils';

import {
  ALIGN_RECORDING_MUTATION,
  AUTO_FILL_SCENE_MEDIA_MUTATION,
  GENERATE_VOICEOVER_MUTATION,
  RESET_CAPTIONS_MUTATION,
  START_VIDEO_EDIT_MUTATION,
  SWITCH_VIDEO_EDIT_VERSION_MUTATION,
  UPDATE_VIDEO_EDIT_MUTATION,
  VIDEO_EDIT_QUERY,
  VOICE_OPTIONS_QUERY,
} from './graphql/video-edits';

export type VideoEdit = VideoEditRecordFragment;
export type VideoEditScene = VideoEdit['scenes'][number];
export type VoiceOption = VoiceOptionsQuery['voiceOptions'][number];

export const videoEditsQueryKeys = {
  all: ['video-edit'] as const,
  detail: (projectId: string) => ['video-edit', projectId] as const,
  voiceOptions: ['voice-options'] as const,
};

export const useVideoEditQuery = defineQuery<
  VideoEditQuery,
  VideoEditQueryVariables
>({
  queryKey: (input) => videoEditsQueryKeys.detail(input?.projectId ?? ''),
  queryFn: async (input, context) => {
    if (!input) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<VideoEditQuery, VideoEditQueryVariables>(
        VIDEO_EDIT_QUERY,
        input,
        { signal: context?.signal },
      ),
    );
  },
  // Media preview URLs are signed for 15 minutes; refresh well before.
  staleTime: 5 * 60_000,
});

export const useStartVideoEditMutation = defineMutation<
  StartVideoEditMutation,
  StartVideoEditMutationVariables
>({
  mutationKey: ['video-edit', 'start'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<StartVideoEditMutation, StartVideoEditMutationVariables>(
        START_VIDEO_EDIT_MUTATION,
        variables,
      ),
    );
  },
});

export const useUpdateVideoEditMutation = defineMutation<
  UpdateVideoEditMutation,
  UpdateVideoEditMutationVariables
>({
  mutationKey: ['video-edit', 'update'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('Changes are required.');

    return unwrapGraphqlResult(
      await client.request<UpdateVideoEditMutation, UpdateVideoEditMutationVariables>(
        UPDATE_VIDEO_EDIT_MUTATION,
        variables,
      ),
    );
  },
});

export const useAutoFillSceneMediaMutation = defineMutation<
  AutoFillSceneMediaMutation,
  AutoFillSceneMediaMutationVariables
>({
  mutationKey: ['video-edit', 'auto-fill'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project id is required.');

    return unwrapGraphqlResult(
      await client.request<
        AutoFillSceneMediaMutation,
        AutoFillSceneMediaMutationVariables
      >(AUTO_FILL_SCENE_MEDIA_MUTATION, variables),
    );
  },
});

export const useSwitchVideoEditVersionMutation = defineMutation<
  SwitchVideoEditVersionMutation,
  SwitchVideoEditVersionMutationVariables
>({
  mutationKey: ['video-edit', 'switch-version'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A version is required.');

    return unwrapGraphqlResult(
      await client.request<
        SwitchVideoEditVersionMutation,
        SwitchVideoEditVersionMutationVariables
      >(SWITCH_VIDEO_EDIT_VERSION_MUTATION, variables),
    );
  },
});

export const useVoiceOptionsQuery = defineQuery<VoiceOptionsQuery>({
  queryKey: videoEditsQueryKeys.voiceOptions,
  queryFn: async (_input, context) =>
    unwrapGraphqlResult(
      await client.request<VoiceOptionsQuery>(VOICE_OPTIONS_QUERY, undefined, {
        signal: context?.signal,
      }),
    ),
  // The allowlist changes only with configuration; sample URLs are public.
  staleTime: 30 * 60_000,
});

export const useGenerateVoiceoverMutation = defineMutation<
  GenerateVoiceoverMutation,
  GenerateVoiceoverMutationVariables
>({
  mutationKey: ['video-edit', 'generate-voiceover'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project is required.');

    return unwrapGraphqlResult(
      await client.request<
        GenerateVoiceoverMutation,
        GenerateVoiceoverMutationVariables
      >(GENERATE_VOICEOVER_MUTATION, variables),
    );
  },
});

export const useAlignRecordingMutation = defineMutation<
  AlignRecordingMutation,
  AlignRecordingMutationVariables
>({
  mutationKey: ['video-edit', 'align-recording'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project is required.');

    return unwrapGraphqlResult(
      await client.request<AlignRecordingMutation, AlignRecordingMutationVariables>(
        ALIGN_RECORDING_MUTATION,
        variables,
      ),
    );
  },
});

export const useResetCaptionsMutation = defineMutation<
  ResetCaptionsMutation,
  ResetCaptionsMutationVariables
>({
  mutationKey: ['video-edit', 'reset-captions'],
  mutationFn: async (variables) => {
    if (!variables) throw new Error('A project is required.');

    return unwrapGraphqlResult(
      await client.request<ResetCaptionsMutation, ResetCaptionsMutationVariables>(
        RESET_CAPTIONS_MUTATION,
        variables,
      ),
    );
  },
});
