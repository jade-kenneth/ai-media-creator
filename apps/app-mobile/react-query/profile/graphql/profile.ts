import { gql } from "graphql-request";

export const MEMBER_PROFILE_FRAGMENT = gql`
  fragment MemberProfileRecord on MemberProfile {
    id
    userId
    firstName
    lastName
    middleName
    fullName
    birthdate
    gender
    address
    purok
    contactNumber
    createdAt
    updatedAt
    user {
      id
      email
    }
  }
`;

export const MY_PROFILE_QUERY = gql`
  query MyProfile {
    myProfile {
      ...MemberProfileRecord
    }
  }
  ${MEMBER_PROFILE_FRAGMENT}
`;

export const UPDATE_MY_PROFILE_MUTATION = gql`
  mutation UpdateMyProfile($input: UpdateMemberProfileInput!) {
    updateMyProfile(input: $input) {
      ...MemberProfileRecord
    }
  }
  ${MEMBER_PROFILE_FRAGMENT}
`;
