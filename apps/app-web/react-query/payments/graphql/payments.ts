import { gql } from 'graphql-request';

export const CREATE_PAYMENT_MUTATION = gql`
  mutation CreatePayment($input: CreatePaymentInput!) {
    createPayment(input: $input) {
      id
      referenceId
      status
      channel
      amount
      currency
      description
      redirectUrl
      createdAt
      updatedAt
    }
  }
`;

export const PAYMENT_QUERY = gql`
  query Payment($id: ID!) {
    payment(id: $id) {
      id
      referenceId
      status
      channel
      amount
      currency
      description
      redirectUrl
      createdAt
      updatedAt
    }
  }
`;

export const MY_PAYMENTS_QUERY = gql`
  query MyPayments {
    myPayments {
      id
      referenceId
      status
      channel
      amount
      currency
      description
      redirectUrl
      createdAt
      updatedAt
    }
  }
`;
