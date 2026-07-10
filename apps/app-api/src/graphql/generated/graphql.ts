/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum AccountDeletionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
}

export enum PushPlatform {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB',
}

export interface AccountDeletionRequestStatusFilterInput {
  equal?: Nullable<AccountDeletionRequestStatus>;
  in?: Nullable<AccountDeletionRequestStatus[]>;
  notIn?: Nullable<AccountDeletionRequestStatus[]>;
  notEqual?: Nullable<AccountDeletionRequestStatus>;
}

export interface AccountDeletionRequestFilterInput {
  status?: Nullable<AccountDeletionRequestStatusFilterInput>;
  organizationId?: Nullable<IDFilterInput>;
}

export interface AccountDeletionRequestSortInput {
  createdAt?: Nullable<SortDirection>;
  reviewedAt?: Nullable<SortDirection>;
}

export interface SubmitAccountDeletionRequestInput {
  fullName: string;
  email: string;
  organizationId: string;
}

export interface ReviewAccountDeletionRequestInput {
  requestId: string;
  status: AccountDeletionRequestStatus;
  reviewNote?: Nullable<string>;
}

export interface CreateAdminAccountInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  position: string;
  organizationId: string;
}

export interface UpdateAdminAccountInput {
  firstName?: Nullable<string>;
  lastName?: Nullable<string>;
  position?: Nullable<string>;
  organizationId?: Nullable<string>;
  password?: Nullable<string>;
}

export interface LoginInput {
  email: string;
  password: string;
  organizationSlug?: Nullable<string>;
}

export interface RegisterUserInput {
  organizationSlug: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: Nullable<string>;
  lastName?: Nullable<string>;
}

export interface UpdateMyProfileInput {
  firstName?: Nullable<string>;
  lastName?: Nullable<string>;
  position?: Nullable<string>;
}

export interface CursorPaginationInput {
  first?: Nullable<number>;
  after?: Nullable<Cursor>;
}

export interface OffsetLimitPaginationInput {
  page?: Nullable<number>;
  limit?: Nullable<number>;
}

export interface DateTimeFilterInput {
  equal?: Nullable<DateTime>;
  notEqual?: Nullable<DateTime>;
  in?: Nullable<DateTime[]>;
  notIn?: Nullable<DateTime[]>;
  lesserThan?: Nullable<DateTime>;
  lesserThanOrEqual?: Nullable<DateTime>;
  greaterThan?: Nullable<DateTime>;
  greaterThanOrEqual?: Nullable<DateTime>;
}

export interface IDFilterInput {
  equal?: Nullable<string>;
  notEqual?: Nullable<string>;
  in?: Nullable<string[]>;
  notIn?: Nullable<string[]>;
}

export interface StringFilterInput {
  equal?: Nullable<string>;
  notEqual?: Nullable<string>;
  contains?: Nullable<string>;
  startsWith?: Nullable<string>;
  in?: Nullable<string[]>;
  notIn?: Nullable<string[]>;
}

export interface OrganizationFilterInput {
  slug?: Nullable<string>;
  isActive?: Nullable<boolean>;
  name?: Nullable<StringFilterInput>;
  contactNumber?: Nullable<StringFilterInput>;
  address?: Nullable<StringFilterInput>;
  createdAt?: Nullable<DateTimeFilterInput>;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  logoUrl?: Nullable<string>;
  primaryColor?: Nullable<string>;
  contactNumber?: Nullable<string>;
  address?: Nullable<string>;
  adminEmail: string;
  adminPassword: string;
}

export interface UpdateOrganizationInput {
  name?: Nullable<string>;
  logoUrl?: Nullable<string>;
  primaryColor?: Nullable<string>;
  contactNumber?: Nullable<string>;
  address?: Nullable<string>;
  features?: Nullable<string[]>;
  isActive?: Nullable<boolean>;
}

export interface NotificationsFilterInput {
  unreadOnly?: Nullable<boolean>;
}

export interface NotificationSortInput {
  createdAt?: Nullable<SortDirection>;
}

export interface SendTestPushNotificationInput {
  title: string;
  body: string;
  userId?: Nullable<string>;
}

export interface PushDeviceMetadataInput {
  appOwnership?: Nullable<string>;
  appVersion?: Nullable<string>;
  buildVersion?: Nullable<string>;
  deviceName?: Nullable<string>;
  locale?: Nullable<string>;
  osName?: Nullable<string>;
  osVersion?: Nullable<string>;
}

export interface RegisterPushTokenInput {
  token: string;
  platform: PushPlatform;
  deviceMetadata?: Nullable<PushDeviceMetadataInput>;
}

export interface UnregisterPushTokenInput {
  token: string;
  platform: PushPlatform;
}

export interface IQuery {
  _health(): Nullable<string> | Promise<Nullable<string>>;
  adminAccountDeletionRequests(
    filter?: Nullable<AccountDeletionRequestFilterInput>,
    sort?: Nullable<AccountDeletionRequestSortInput>,
    first?: Nullable<number>,
    after?: Nullable<Cursor>,
  ): AccountDeletionRequestConnection | Promise<AccountDeletionRequestConnection>;
  adminAccountDeletionRequest(
    id: string,
  ): Nullable<AccountDeletionRequest> | Promise<Nullable<AccountDeletionRequest>>;
  adminAccounts(): AdminAccount[] | Promise<AdminAccount[]>;
  me(): User | Promise<User>;
  organizations(
    filter?: Nullable<OrganizationFilterInput>,
  ): Organization[] | Promise<Organization[]>;
  organization(
    id: string,
  ): Nullable<Organization> | Promise<Nullable<Organization>>;
  myNotifications(
    filter?: Nullable<NotificationsFilterInput>,
    sort?: Nullable<NotificationSortInput>,
    first?: Nullable<number>,
    after?: Nullable<Cursor>,
  ): NotificationConnection | Promise<NotificationConnection>;
  validateSession(): ValidateSessionResult | Promise<ValidateSessionResult>;
}

export interface IMutation {
  _noop(): Nullable<boolean> | Promise<Nullable<boolean>>;
  submitAccountDeletionRequest(
    input: SubmitAccountDeletionRequestInput,
  ): AccountDeletionRequest | Promise<AccountDeletionRequest>;
  reviewAccountDeletionRequest(
    input: ReviewAccountDeletionRequestInput,
  ): AccountDeletionRequest | Promise<AccountDeletionRequest>;
  createAdminAccount(
    input: CreateAdminAccountInput,
  ): AdminAccount | Promise<AdminAccount>;
  updateAdminAccount(
    id: string,
    input: UpdateAdminAccountInput,
  ): AdminAccount | Promise<AdminAccount>;
  deactivateAdminAccount(id: string): AdminAccount | Promise<AdminAccount>;
  reactivateAdminAccount(id: string): AdminAccount | Promise<AdminAccount>;
  registerUser(input: RegisterUserInput): AuthPayload | Promise<AuthPayload>;
  updateMyProfile(input: UpdateMyProfileInput): User | Promise<User>;
  login(input: LoginInput): AuthPayload | Promise<AuthPayload>;
  logout(): boolean | Promise<boolean>;
  createOrganization(
    input: CreateOrganizationInput,
  ): Organization | Promise<Organization>;
  updateOrganization(
    id: string,
    input: UpdateOrganizationInput,
  ): Organization | Promise<Organization>;
  deactivateOrganization(id: string): Organization | Promise<Organization>;
  reactivateOrganization(id: string): Organization | Promise<Organization>;
  markNotificationAsRead(id: string): Notification | Promise<Notification>;
  markAllNotificationsAsRead(): MarkAllNotificationsAsReadResult | Promise<MarkAllNotificationsAsReadResult>;
  sendTestPushNotification(
    input: SendTestPushNotificationInput,
  ): SendTestPushNotificationResult | Promise<SendTestPushNotificationResult>;
  registerPushToken(input: RegisterPushTokenInput): boolean | Promise<boolean>;
  unregisterPushToken(
    input: UnregisterPushTokenInput,
  ): boolean | Promise<boolean>;
}

export interface Node {
  id: string;
}

export interface Edge {
  cursor: Cursor;
  node: Node;
}

export interface Connection {
  totalCount: number;
  edges: Edge[];
  pageInfo: CursorPageInfo;
}

export interface AccountDeletionRequest extends Node {
  id: string;
  fullName: string;
  email: string;
  organizationId: string;
  organizationName: string;
  status: AccountDeletionRequestStatus;
  reviewNote?: Nullable<string>;
  reviewedBy?: Nullable<string>;
  reviewedAt?: Nullable<DateTime>;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface AccountDeletionRequestEdge extends Edge {
  cursor: Cursor;
  node: AccountDeletionRequest;
}

export interface AccountDeletionRequestConnection extends Connection {
  totalCount: number;
  edges: AccountDeletionRequestEdge[];
  pageInfo: CursorPageInfo;
}

export interface AdminAccount extends Node {
  id: string;
  email: string;
  isActive: boolean;
  organizationId: string;
  firstName: string;
  lastName: string;
  position: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface User extends Node {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: Nullable<string>;
  isActive: boolean;
  firstName?: Nullable<string>;
  lastName?: Nullable<string>;
  position?: Nullable<string>;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface CursorPageInfo {
  hasNextPage: boolean;
  endCursor?: Nullable<Cursor>;
}

export interface OffsetLimitPageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Organization extends Node {
  id: string;
  name: string;
  slug: string;
  logoUrl?: Nullable<string>;
  primaryColor?: Nullable<string>;
  contactNumber?: Nullable<string>;
  address?: Nullable<string>;
  features: string[];
  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface Notification extends Node {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedEntityId?: Nullable<string>;
  createdAt: DateTime;
}

export interface NotificationEdge extends Edge {
  cursor: Cursor;
  node: Notification;
}

export interface NotificationConnection extends Connection {
  totalCount: number;
  edges: NotificationEdge[];
  pageInfo: CursorPageInfo;
  unreadCount: number;
}

export interface MarkAllNotificationsAsReadResult {
  updatedCount: number;
}

export interface SendTestPushNotificationResult {
  tokenCount: number;
}

export interface ValidateSessionResult {
  ok: boolean;
  status: number;
}

export type DateTime = any;
export type Cursor = any;
type Nullable<T> = T | null;
