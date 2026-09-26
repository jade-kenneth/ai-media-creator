import { gql } from 'graphql-request';

import { GENERATION_JOB_FRAGMENT } from '@/react-query/generation-jobs/graphql/generation-jobs';

export const CLAIM_FLAG_FRAGMENT = gql`
  fragment ClaimFlagRecord on ClaimFlag {
    category
    lead
    reason
    claim
  }
`;

export const SCRIPT_VERSION_FRAGMENT = gql`
  fragment ScriptVersionRecord on ScriptVersion {
    id
    projectId
    number
    status
    origin {
      kind
      fromNumber
    }
    angleTitle
    language
    lengthSeconds
    contentStyle
    studio
    hooks {
      id
      type
      text
      openingShot
      flags {
        ...ClaimFlagRecord
      }
    }
    selectedHookId
    scenes {
      id
      order
      purpose
      durationSeconds
      narration
      lines {
        speaker
        text
        shot
        reaction
        pauseSeconds
        delivery
      }
      sound
      onScreenText
      visual
      direction {
        inFrame
        framing
        setting
        props
      }
      transitionIn
      cta
      factIds
      flags {
        ...ClaimFlagRecord
      }
    }
    shoot {
      scenario
      presenter
    }
    caption
    captionFlags {
      ...ClaimFlagRecord
    }
    spokenSeconds
    totalSeconds
    usedFactIds
    createdAt
    approvedAt
  }
  ${CLAIM_FLAG_FRAGMENT}
`;

export const SCRIPT_VERSIONS_QUERY = gql`
  query ScriptVersions($projectId: ID!) {
    scriptVersions(projectId: $projectId) {
      ...ScriptVersionRecord
    }
  }
  ${SCRIPT_VERSION_FRAGMENT}
`;

export const CREATOR_BRIEF_QUERY = gql`
  query CreatorBrief($projectId: ID!) {
    creatorBrief(projectId: $projectId) {
      text
      fileName
      versionNumber
      approvedAt
      newerDraft {
        number
        hasNewClaim
      }
    }
  }
`;

export const WRITE_SCRIPT_MUTATION = gql`
  mutation WriteScript($input: WriteScriptInput!) {
    writeScript(input: $input) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;

export const REWRITE_HOOK_MUTATION = gql`
  mutation RewriteHook($input: RewriteHookInput!) {
    rewriteHook(input: $input) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;

export const REWRITE_SCENE_MUTATION = gql`
  mutation RewriteScene($input: RewriteSceneInput!) {
    rewriteScene(input: $input) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;

export const UPDATE_SCRIPT_VERSION_MUTATION = gql`
  mutation UpdateScriptVersion($input: UpdateScriptVersionInput!) {
    updateScriptVersion(input: $input) {
      ...ScriptVersionRecord
    }
  }
  ${SCRIPT_VERSION_FRAGMENT}
`;

export const APPROVE_SCRIPT_VERSION_MUTATION = gql`
  mutation ApproveScriptVersion($id: ID!) {
    approveScriptVersion(id: $id) {
      ...ScriptVersionRecord
    }
  }
  ${SCRIPT_VERSION_FRAGMENT}
`;

export const COPY_SCRIPT_VERSION_MUTATION = gql`
  mutation CopyScriptVersion($input: CopyScriptVersionInput!) {
    copyScriptVersion(input: $input) {
      ...ScriptVersionRecord
    }
  }
  ${SCRIPT_VERSION_FRAGMENT}
`;
