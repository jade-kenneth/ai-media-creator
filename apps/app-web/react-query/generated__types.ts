export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Cursor: { input: string; output: string };
  DateTime: { input: string | Date; output: string };
};

export type AccountDeletionRequestFilterInput = {
  organizationId?: InputMaybe<IdFilterInput>;
  status?: InputMaybe<AccountDeletionRequestStatusFilterInput>;
};

export type AccountDeletionRequestSortInput = {
  createdAt?: InputMaybe<SortDirection>;
  reviewedAt?: InputMaybe<SortDirection>;
};

export enum AccountDeletionRequestStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
}

export type AccountDeletionRequestStatusFilterInput = {
  equal?: InputMaybe<AccountDeletionRequestStatus>;
  in?: InputMaybe<Array<AccountDeletionRequestStatus>>;
  notEqual?: InputMaybe<AccountDeletionRequestStatus>;
  notIn?: InputMaybe<Array<AccountDeletionRequestStatus>>;
};

export type CreateAdminAccountInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  password: Scalars['String']['input'];
  position: Scalars['String']['input'];
};

export type CreateOrganizationInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  adminEmail: Scalars['String']['input'];
  adminPassword: Scalars['String']['input'];
  contactNumber?: InputMaybe<Scalars['String']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  primaryColor?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
};

export type CursorPaginationInput = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type DateTimeFilterInput = {
  equal?: InputMaybe<Scalars['DateTime']['input']>;
  greaterThan?: InputMaybe<Scalars['DateTime']['input']>;
  greaterThanOrEqual?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  lesserThan?: InputMaybe<Scalars['DateTime']['input']>;
  lesserThanOrEqual?: InputMaybe<Scalars['DateTime']['input']>;
  notEqual?: InputMaybe<Scalars['DateTime']['input']>;
  notIn?: InputMaybe<Array<Scalars['DateTime']['input']>>;
};

export type IdFilterInput = {
  equal?: InputMaybe<Scalars['ID']['input']>;
  in?: InputMaybe<Array<Scalars['ID']['input']>>;
  notEqual?: InputMaybe<Scalars['ID']['input']>;
  notIn?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type LoginInput = {
  email: Scalars['String']['input'];
  organizationSlug?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
};

export type NotificationSortInput = {
  createdAt?: InputMaybe<SortDirection>;
};

export enum NotificationType {
  Error = 'ERROR',
  Info = 'INFO',
  Success = 'SUCCESS',
  System = 'SYSTEM',
  Warning = 'WARNING',
}

export type NotificationsFilterInput = {
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type OffsetLimitPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export type OrganizationFilterInput = {
  address?: InputMaybe<StringFilterInput>;
  contactNumber?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<StringFilterInput>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type PushDeviceMetadataInput = {
  appOwnership?: InputMaybe<Scalars['String']['input']>;
  appVersion?: InputMaybe<Scalars['String']['input']>;
  buildVersion?: InputMaybe<Scalars['String']['input']>;
  deviceName?: InputMaybe<Scalars['String']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
  osName?: InputMaybe<Scalars['String']['input']>;
  osVersion?: InputMaybe<Scalars['String']['input']>;
};

export enum PushPlatform {
  Android = 'ANDROID',
  Ios = 'IOS',
  Web = 'WEB',
}

export type RegisterPushTokenInput = {
  deviceMetadata?: InputMaybe<PushDeviceMetadataInput>;
  platform: PushPlatform;
  token: Scalars['String']['input'];
};

export type RegisterUserInput = {
  confirmPassword: Scalars['String']['input'];
  email: Scalars['String']['input'];
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  organizationSlug: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export enum ResetCodeStatus {
  Expired = 'EXPIRED',
  Invalid = 'INVALID',
  Valid = 'VALID',
}

export type ResetPasswordInput = {
  code: Scalars['String']['input'];
  email: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};

export type ReviewAccountDeletionRequestInput = {
  requestId: Scalars['ID']['input'];
  reviewNote?: InputMaybe<Scalars['String']['input']>;
  status: AccountDeletionRequestStatus;
};

export type SendTestPushNotificationInput = {
  body: Scalars['String']['input'];
  title: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['ID']['input']>;
};

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

export enum StorePlatform {
  Apple = 'APPLE',
  Google = 'GOOGLE',
}

export type StringFilterInput = {
  contains?: InputMaybe<Scalars['String']['input']>;
  equal?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  notEqual?: InputMaybe<Scalars['String']['input']>;
  notIn?: InputMaybe<Array<Scalars['String']['input']>>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

export type SubmitAccountDeletionRequestInput = {
  email: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};

export type UnregisterPushTokenInput = {
  platform: PushPlatform;
  token: Scalars['String']['input'];
};

export type UpdateAdminAccountInput = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMyProfileInput = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateOrganizationInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  contactNumber?: InputMaybe<Scalars['String']['input']>;
  features?: InputMaybe<Array<Scalars['String']['input']>>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  primaryColor?: InputMaybe<Scalars['String']['input']>;
};

export enum UserRole {
  Admin = 'ADMIN',
  SuperAdmin = 'SUPER_ADMIN',
  User = 'USER',
}

export type VerifyStorePurchaseInput = {
  productId: Scalars['String']['input'];
  purchaseToken: Scalars['String']['input'];
  store: StorePlatform;
  transactionId?: InputMaybe<Scalars['String']['input']>;
};

export type AccountDeletionRequestRecordFragment = {
  id: string;
  fullName: string;
  email: string;
  organizationId: string;
  organizationName: string;
  status: AccountDeletionRequestStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminAccountDeletionRequestsQueryVariables = Exact<{
  filter?: InputMaybe<AccountDeletionRequestFilterInput>;
  sort?: InputMaybe<AccountDeletionRequestSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type AdminAccountDeletionRequestsQuery = {
  adminAccountDeletionRequests: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        fullName: string;
        email: string;
        organizationId: string;
        organizationName: string;
        status: AccountDeletionRequestStatus;
        reviewNote?: string | null;
        reviewedBy?: string | null;
        reviewedAt?: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type AdminAccountDeletionRequestsCountQueryVariables = Exact<{
  filter?: InputMaybe<AccountDeletionRequestFilterInput>;
}>;

export type AdminAccountDeletionRequestsCountQuery = {
  adminAccountDeletionRequests: { totalCount: number };
};

export type AdminAccountDeletionRequestQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type AdminAccountDeletionRequestQuery = {
  adminAccountDeletionRequest?: {
    id: string;
    fullName: string;
    email: string;
    organizationId: string;
    organizationName: string;
    status: AccountDeletionRequestStatus;
    reviewNote?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type SubmitAccountDeletionRequestMutationVariables = Exact<{
  input: SubmitAccountDeletionRequestInput;
}>;

export type SubmitAccountDeletionRequestMutation = {
  submitAccountDeletionRequest: {
    id: string;
    fullName: string;
    email: string;
    organizationId: string;
    organizationName: string;
    status: AccountDeletionRequestStatus;
    reviewNote?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type ReviewAccountDeletionRequestMutationVariables = Exact<{
  input: ReviewAccountDeletionRequestInput;
}>;

export type ReviewAccountDeletionRequestMutation = {
  reviewAccountDeletionRequest: {
    id: string;
    fullName: string;
    email: string;
    organizationId: string;
    organizationName: string;
    status: AccountDeletionRequestStatus;
    reviewNote?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type AdminAccountRecordFragment = {
  id: string;
  email: string;
  isActive: boolean;
  organizationId: string;
  firstName: string;
  lastName: string;
  position: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminAccountsQueryVariables = Exact<{ [key: string]: never }>;

export type AdminAccountsQuery = {
  adminAccounts: Array<{
    id: string;
    email: string;
    isActive: boolean;
    organizationId: string;
    firstName: string;
    lastName: string;
    position: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type CreateAdminAccountMutationVariables = Exact<{
  input: CreateAdminAccountInput;
}>;

export type CreateAdminAccountMutation = {
  createAdminAccount: {
    id: string;
    email: string;
    isActive: boolean;
    organizationId: string;
    firstName: string;
    lastName: string;
    position: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateAdminAccountMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAdminAccountInput;
}>;

export type UpdateAdminAccountMutation = {
  updateAdminAccount: {
    id: string;
    email: string;
    isActive: boolean;
    organizationId: string;
    firstName: string;
    lastName: string;
    position: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeactivateAdminAccountMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeactivateAdminAccountMutation = {
  deactivateAdminAccount: {
    id: string;
    email: string;
    isActive: boolean;
    organizationId: string;
    firstName: string;
    lastName: string;
    position: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type ReactivateAdminAccountMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type ReactivateAdminAccountMutation = {
  reactivateAdminAccount: {
    id: string;
    email: string;
    isActive: boolean;
    organizationId: string;
    firstName: string;
    lastName: string;
    position: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;

export type LoginMutation = {
  login: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: { id: string; email: string; role: UserRole; isActive: boolean };
  };
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  me: {
    id: string;
    email: string;
    role: UserRole;
    organizationId?: string | null;
    isActive: boolean;
  };
};

export type OrganizationRecordFragment = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  contactNumber?: string | null;
  address?: string | null;
  features: Array<string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationsQueryVariables = Exact<{
  filter?: InputMaybe<OrganizationFilterInput>;
}>;

export type OrganizationsQuery = {
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    contactNumber?: string | null;
    address?: string | null;
    features: Array<string>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type OrganizationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type OrganizationQuery = {
  organization?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    contactNumber?: string | null;
    address?: string | null;
    features: Array<string>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateOrganizationMutationVariables = Exact<{
  input: CreateOrganizationInput;
}>;

export type CreateOrganizationMutation = {
  createOrganization: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    contactNumber?: string | null;
    address?: string | null;
    features: Array<string>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateOrganizationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateOrganizationInput;
}>;

export type UpdateOrganizationMutation = {
  updateOrganization: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    contactNumber?: string | null;
    address?: string | null;
    features: Array<string>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeactivateOrganizationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeactivateOrganizationMutation = {
  deactivateOrganization: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    contactNumber?: string | null;
    address?: string | null;
    features: Array<string>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type ReactivateOrganizationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type ReactivateOrganizationMutation = {
  reactivateOrganization: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    contactNumber?: string | null;
    address?: string | null;
    features: Array<string>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type RegisterTestPushTokenMutationVariables = Exact<{
  input: RegisterPushTokenInput;
}>;

export type RegisterTestPushTokenMutation = { registerTestPushToken: boolean };

export type SendTestPushNotificationMutationVariables = Exact<{
  input: SendTestPushNotificationInput;
}>;

export type SendTestPushNotificationMutation = {
  sendTestPushNotification: { tokenCount: number };
};
