import { gql } from 'graphql-request';

import { PROJECT_ASSET_FRAGMENT } from '@/react-query/assets/graphql/assets';
import { CLAIM_FLAG_FRAGMENT } from '@/react-query/scripts/graphql/scripts';
import { GENERATION_JOB_FRAGMENT } from '@/react-query/generation-jobs/graphql/generation-jobs';

export const CLIP_PROMPT_FLAGS_QUERY = gql`
  query ClipPromptFlags($projectId: ID!, $prompt: String!) {
    clipPromptFlags(projectId: $projectId, prompt: $prompt) {
      ...ClaimFlagRecord
    }
  }
  ${CLAIM_FLAG_FRAGMENT}
`;

export const GENERATE_SCENE_CLIPS_MUTATION = gql`
  mutation GenerateSceneClips($input: GenerateSceneClipsInput!) {
    generateSceneClips(input: $input) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;

export const CHECK_AI_CLIP_MUTATION = gql`
  mutation CheckAiClip($id: ID!) {
    checkAiClip(id: $id) {
      ...ProjectAssetRecord
    }
  }
  ${PROJECT_ASSET_FRAGMENT}
`;

export const DISCARD_AI_CLIPS_MUTATION = gql`
  mutation DiscardAiClips($jobId: ID!) {
    discardAiClips(jobId: $jobId)
  }
`;
