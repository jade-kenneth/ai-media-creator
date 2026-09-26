import { gql } from 'graphql-request';

import { GENERATION_JOB_FRAGMENT } from '@/react-query/generation-jobs/graphql/generation-jobs';

export const EXPORT_FRAGMENT = gql`
  fragment ExportRecord on Export {
    id
    number
    preset
    durationMs
    width
    height
    sizeBytes
    posterUrl
    videoUrl
    createdAt
    downloadedAt
    snapshot {
      scriptVersionNumber
      voice
      captions
      music
      endCard
      postCaption
      adTag
      studio
      scenes {
        order
        purpose
        media
        durationSeconds
        onScreenText
        transitionIn
        clipSound {
          on
          levelPercent
        }
      }
    }
  }
`;

export const PROJECT_EXPORTS_QUERY = gql`
  query ProjectExports($projectId: ID!) {
    projectExports(projectId: $projectId) {
      changedSinceLatest
      exports {
        ...ExportRecord
      }
    }
  }
  ${EXPORT_FRAGMENT}
`;

export const RENDER_VIDEO_MUTATION = gql`
  mutation RenderVideo($input: RenderVideoInput!) {
    renderVideo(input: $input) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;

export const CREATE_EXPORT_DOWNLOAD_MUTATION = gql`
  mutation CreateExportDownload($id: ID!) {
    createExportDownload(id: $id) {
      url
      fileName
    }
  }
`;
