import { gql } from 'graphql-request';

export const PROJECT_ASSET_FRAGMENT = gql`
  fragment ProjectAssetRecord on ProjectAsset {
    id
    projectId
    kind
    purpose
    origin
    aiClip {
      jobId
      sceneId
      sourceAssetId
      mode
      endAssetId
      referenceAssetIds
      continuitySceneId
      continuityAssetId
      label
      prompt
      checkedAt
    }
    status
    fileName
    sizeBytes
    durationSeconds
    previewUrl
    createdAt
  }
`;

export const PROJECT_ASSETS_QUERY = gql`
  query ProjectAssets($projectId: ID!) {
    projectAssets(projectId: $projectId) {
      ...ProjectAssetRecord
    }
  }
  ${PROJECT_ASSET_FRAGMENT}
`;

export const CREATE_ASSET_UPLOAD_MUTATION = gql`
  mutation CreateAssetUpload($input: CreateAssetUploadInput!) {
    createAssetUpload(input: $input) {
      uploadUrl
      asset {
        ...ProjectAssetRecord
      }
    }
  }
  ${PROJECT_ASSET_FRAGMENT}
`;

export const COMPLETE_ASSET_UPLOAD_MUTATION = gql`
  mutation CompleteAssetUpload($id: ID!) {
    completeAssetUpload(id: $id) {
      ...ProjectAssetRecord
    }
  }
  ${PROJECT_ASSET_FRAGMENT}
`;

export const REMOVE_ASSET_MUTATION = gql`
  mutation RemoveAsset($id: ID!) {
    removeAsset(id: $id)
  }
`;
