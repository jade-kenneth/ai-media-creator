import { gql } from 'graphql-request';

import { PROJECT_FRAGMENT } from '@/react-query/projects/graphql/projects';

export const PRODUCT_FACT_FRAGMENT = gql`
  fragment ProductFactRecord on ProductFact {
    id
    projectId
    text
    source
    sourceUrl
    sourceNote
    status
    note
    flag {
      category
      lead
      reason
      claim
    }
    removable
    createdAt
    updatedAt
  }
`;

export const PRODUCT_FACTS_QUERY = gql`
  query ProductFacts($projectId: ID!) {
    productFacts(projectId: $projectId) {
      ...ProductFactRecord
    }
  }
  ${PRODUCT_FACT_FRAGMENT}
`;

export const CONTINUE_TO_FACTS_MUTATION = gql`
  mutation ContinueToFacts($projectId: ID!) {
    continueToFacts(projectId: $projectId) {
      ...ProjectDetail
    }
  }
  ${PROJECT_FRAGMENT}
`;

export const ADD_PRODUCT_FACT_MUTATION = gql`
  mutation AddProductFact($input: AddProductFactInput!) {
    addProductFact(input: $input) {
      ...ProductFactRecord
    }
  }
  ${PRODUCT_FACT_FRAGMENT}
`;

export const UPDATE_PRODUCT_FACT_TEXT_MUTATION = gql`
  mutation UpdateProductFactText($input: UpdateProductFactTextInput!) {
    updateProductFactText(input: $input) {
      ...ProductFactRecord
    }
  }
  ${PRODUCT_FACT_FRAGMENT}
`;

export const SET_PRODUCT_FACT_STATUS_MUTATION = gql`
  mutation SetProductFactStatus($input: SetProductFactStatusInput!) {
    setProductFactStatus(input: $input) {
      ...ProductFactRecord
    }
  }
  ${PRODUCT_FACT_FRAGMENT}
`;

export const REMOVE_PRODUCT_FACT_MUTATION = gql`
  mutation RemoveProductFact($id: ID!) {
    removeProductFact(id: $id)
  }
`;
