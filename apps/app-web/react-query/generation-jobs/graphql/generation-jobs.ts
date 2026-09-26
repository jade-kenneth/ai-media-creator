import { gql } from 'graphql-request';

export const GENERATION_JOB_FRAGMENT = gql`
  fragment GenerationJobRecord on GenerationJob {
    id
    projectId
    type
    status
    step
    stepCount
    creditCost
    versionId
    hookId
    sceneId
    sourceAssetId
    prompt
    clipMode
    clipCount
    clipSeconds
    endAssetId
    referenceAssetIds
    continuitySceneId
    continuityAssetId
    resultVersionId
    failureCode
    createdAt
    startedAt
    finishedAt
  }
`;

export const GENERATION_JOB_QUERY = gql`
  query GenerationJob($id: ID!) {
    generationJob(id: $id) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;

export const PROJECT_JOBS_QUERY = gql`
  query ProjectJobs($projectId: ID!, $active: Boolean) {
    projectJobs(projectId: $projectId, active: $active) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;

export const RETRY_GENERATION_JOB_MUTATION = gql`
  mutation RetryGenerationJob($id: ID!) {
    retryGenerationJob(id: $id) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;
