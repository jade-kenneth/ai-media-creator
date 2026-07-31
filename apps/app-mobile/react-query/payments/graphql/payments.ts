import { gql } from 'graphql-request';

export const PAYMENT_FRAGMENT = gql`
  fragment PaymentDetails on Payment {
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
`;

export const CREATE_PAYMENT_MUTATION = gql`
  mutation CreatePayment($input: CreatePaymentInput!) {
    createPayment(input: $input) {
      ...PaymentDetails
    }
  }
  ${PAYMENT_FRAGMENT}
`;

export const PAYMENT_QUERY = gql`
  query Payment($id: ID!) {
    payment(id: $id) {
      ...PaymentDetails
    }
  }
  ${PAYMENT_FRAGMENT}
`;

export const MY_PAYMENTS_QUERY = gql`
  query MyPayments {
    myPayments {
      ...PaymentDetails
    }
  }
  ${PAYMENT_FRAGMENT}
`;
