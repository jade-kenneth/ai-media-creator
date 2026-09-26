import { gql } from 'graphql-request';

import { PROJECT_ASSET_FRAGMENT } from '@/react-query/assets/graphql/assets';
import { GENERATION_JOB_FRAGMENT } from '@/react-query/generation-jobs/graphql/generation-jobs';

export const VIDEO_EDIT_FRAGMENT = gql`
  fragment VideoEditRecord on VideoEdit {
    id
    projectId
    scriptVersion {
      id
      number
      approvedAt
    }
    newerApprovedVersion {
      id
      number
    }
    shoot {
      scenario
      presenter
    }
    clipContext {
      language
      tone
      openingShot
      genre
      cast {
        id
        name
        role
        look
      }
    }
    studio
    totalSeconds
    scenes {
      sceneId
      order
      purpose
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
      clipSound {
        on
        levelPercent
      }
      visual
      onScreenText
      transitionIn
      direction {
        inFrame
        framing
        setting
        props
      }
      cta
      durationSeconds
      startSeconds
      media {
        kind
        motion
        clipStartSeconds
        asset {
          ...ProjectAssetRecord
        }
      }
      flags {
        category
        lead
        reason
        claim
      }
    }
    voice {
      source
      voiceId
      speed
      pronunciations {
        word
        sayAs
      }
      recording {
        ...ProjectAssetRecord
      }
      track {
        id
        source
        voiceName
        speed
        scriptVersionNumber
        recordingFileName
        durationMs
        createdAt
        segments {
          sceneId
          audioUrl
          offsetMs
          durationMs
        }
      }
      outdated
      settingsChanged
    }
    captions {
      enabled
      style
      editable
      lines {
        id
        sceneId
        startMs
        endMs
        text
        edited
        words {
          text
          startMs
          endMs
        }
        flags {
          category
          lead
          reason
          claim
        }
      }
    }
    music {
      levelPercent
      asset {
        ...ProjectAssetRecord
      }
    }
    endCard {
      enabled
      durationSeconds
      productTitle
      cta
      storyTitle
      endLine
    }
    postCaption {
      text
      adTag
      flags {
        category
        lead
        reason
        claim
      }
    }
    readiness {
      mediaComplete
      missingMediaCount
      voiceSettled
      voiceOutdated
      blocking
    }
    aiClipsEnabled
    consistentItems {
      id
      kind
      name
      sceneIds
      photo {
        ...ProjectAssetRecord
      }
      likenessConfirmed
    }
    updatedAt
  }
  ${PROJECT_ASSET_FRAGMENT}
`;

export const VIDEO_EDIT_QUERY = gql`
  query VideoEdit($projectId: ID!) {
    videoEdit(projectId: $projectId) {
      ...VideoEditRecord
    }
  }
  ${VIDEO_EDIT_FRAGMENT}
`;

export const START_VIDEO_EDIT_MUTATION = gql`
  mutation StartVideoEdit($projectId: ID!) {
    startVideoEdit(projectId: $projectId) {
      ...VideoEditRecord
    }
  }
  ${VIDEO_EDIT_FRAGMENT}
`;

export const UPDATE_VIDEO_EDIT_MUTATION = gql`
  mutation UpdateVideoEdit($input: UpdateVideoEditInput!) {
    updateVideoEdit(input: $input) {
      ...VideoEditRecord
    }
  }
  ${VIDEO_EDIT_FRAGMENT}
`;

export const AUTO_FILL_SCENE_MEDIA_MUTATION = gql`
  mutation AutoFillSceneMedia($projectId: ID!) {
    autoFillSceneMedia(projectId: $projectId) {
      ...VideoEditRecord
    }
  }
  ${VIDEO_EDIT_FRAGMENT}
`;

export const SWITCH_VIDEO_EDIT_VERSION_MUTATION = gql`
  mutation SwitchVideoEditVersion($input: SwitchVideoEditVersionInput!) {
    switchVideoEditVersion(input: $input) {
      ...VideoEditRecord
    }
  }
  ${VIDEO_EDIT_FRAGMENT}
`;

export const VOICE_OPTIONS_QUERY = gql`
  query VoiceOptions {
    voiceOptions {
      id
      name
      descriptor
      sampleUrl
    }
  }
`;

export const GENERATE_VOICEOVER_MUTATION = gql`
  mutation GenerateVoiceover($input: VoiceJobInput!) {
    generateVoiceover(input: $input) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;

export const ALIGN_RECORDING_MUTATION = gql`
  mutation AlignRecording($input: VoiceJobInput!) {
    alignRecording(input: $input) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;

export const RESET_CAPTIONS_MUTATION = gql`
  mutation ResetCaptions($projectId: ID!) {
    resetCaptions(projectId: $projectId) {
      ...VideoEditRecord
    }
  }
  ${VIDEO_EDIT_FRAGMENT}
`;
