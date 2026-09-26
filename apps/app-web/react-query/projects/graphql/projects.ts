import { gql } from 'graphql-request';

import { GENERATION_JOB_FRAGMENT } from '@/react-query/generation-jobs/graphql/generation-jobs';

/** The fields a dashboard card shows. */
export const PROJECT_CARD_FRAGMENT = gql`
  fragment ProjectCard on Project {
    id
    title
    studio
    status
    stage
    productTitle
    thumbnailUrl
    lastEditedAt
    exportCount
    latestExportAt
    latestExportDownloaded
    failureNotice {
      kind
    }
    currentStep
    story {
      genre
    }
  }
`;

/** Everything the workflow steps read from the project. */
export const PROJECT_FRAGMENT = gql`
  fragment ProjectDetail on Project {
    ...ProjectCard
    hasApprovedScript
    hasScript
    assetCount
    product {
      title
      category
      pricePhp
      description
      affiliateUrl
      features {
        id
        text
        source
      }
      fieldSources {
        field
        source
      }
      importUrl
      lastImport {
        outcome
        host
        filled
        missing
        at
      }
    }
    strategy {
      buyer
      problem
      benefit
      platform
      language
      lengthSeconds
      tone
      contentStyle
      selectedAngle {
        kind
        suggestionId
        text
      }
    }
    angleSuggestionSet {
      suggestions {
        id
        type
        title
        pitch
        factIds
      }
      isStale
      createdAt
    }
    audienceSuggestionSet {
      suggestions {
        id
        buyer
        problem
        benefit
        factIds
      }
      isStale
      createdAt
    }
    story {
      genre
      detail
      premise {
        kind
        suggestionId
        title
        logline
      }
      cast {
        id
        name
        role
        look
      }
      storytelling
      language
      lengthSeconds
    }
    premiseSuggestionSet {
      suggestions {
        id
        title
        logline
        cast {
          id
          name
          role
          look
        }
      }
      genre
      detail
      isStale
      createdAt
    }
    factsSummary {
      total
      unreviewed
      approved
      rejected
      unknown
    }
    approvedFacts {
      id
      text
    }
    steps {
      key
      status
      lockedReason
    }
    updatedAt
  }
  ${PROJECT_CARD_FRAGMENT}
`;

export const PROJECTS_QUERY = gql`
  query Projects(
    $filter: ProjectFilterInput
    $sort: ProjectSortInput
    $pagination: CursorPaginationInput
  ) {
    projects(filter: $filter, sort: $sort, pagination: $pagination) {
      totalCount
      edges {
        cursor
        node {
          ...ProjectCard
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${PROJECT_CARD_FRAGMENT}
`;

export const PROJECT_COUNTS_QUERY = gql`
  query ProjectCounts {
    projectCounts {
      all
      inProgress
      ready
      exported
    }
  }
`;

export const PROJECT_QUERY = gql`
  query Project($id: ID!) {
    project(id: $id) {
      ...ProjectDetail
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const STUDIOS_QUERY = gql`
  query Studios {
    studios {
      type
      area
      title
      description
    }
  }
`;

export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($input: CreateProjectInput) {
    createProject(input: $input) {
      ...ProjectDetail
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const RENAME_PROJECT_MUTATION = gql`
  mutation RenameProject($input: RenameProjectInput!) {
    renameProject(input: $input) {
      ...ProjectDetail
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const DUPLICATE_PROJECT_MUTATION = gql`
  mutation DuplicateProject($id: ID!) {
    duplicateProject(id: $id) {
      ...ProjectCard
    }
  }
  ${PROJECT_CARD_FRAGMENT}
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      ...ProjectDetail
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const IMPORT_PRODUCT_MUTATION = gql`
  mutation ImportProduct($input: ImportProductInput!) {
    importProduct(input: $input) {
      outcome
      host
      filled
      missing
      project {
        ...ProjectDetail
      }
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const CLEAR_IMPORTED_PRODUCT_VALUES_MUTATION = gql`
  mutation ClearImportedProductValues($projectId: ID!) {
    clearImportedProductValues(projectId: $projectId) {
      ...ProjectDetail
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const UPDATE_STRATEGY_MUTATION = gql`
  mutation UpdateStrategy($input: UpdateStrategyInput!) {
    updateStrategy(input: $input) {
      ...ProjectDetail
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const SUGGEST_AUDIENCES_MUTATION = gql`
  mutation SuggestAudiences($input: SuggestAudiencesInput!) {
    suggestAudiences(input: $input) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;

export const UPDATE_STORY_MUTATION = gql`
  mutation UpdateStory($input: UpdateStoryInput!) {
    updateStory(input: $input) {
      ...ProjectDetail
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const SUGGEST_PREMISES_MUTATION = gql`
  mutation SuggestPremises($input: SuggestPremisesInput!) {
    suggestPremises(input: $input) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;

export const SUGGEST_ANGLES_MUTATION = gql`
  mutation SuggestAngles($input: SuggestAnglesInput!) {
    suggestAngles(input: $input) {
      ...GenerationJobRecord
    }
  }
  ${GENERATION_JOB_FRAGMENT}
`;
