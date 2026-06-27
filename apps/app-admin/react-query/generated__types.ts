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

export type AdminAnnouncementBooleanFilterInput = {
  equal?: InputMaybe<Scalars['Boolean']['input']>;
  in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  notEqual?: InputMaybe<Scalars['Boolean']['input']>;
  notIn?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

export type AdminAnnouncementsFilterInput = {
  category?: InputMaybe<AnnouncementCategoryFilterInput>;
  deletedAt?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isPinned?: InputMaybe<AdminAnnouncementBooleanFilterInput>;
  isPublished?: InputMaybe<AdminAnnouncementBooleanFilterInput>;
  publishedAt?: InputMaybe<DateTimeFilterInput>;
};

export type AdminDocumentRequestsFilterInput = {
  createdAt?: InputMaybe<DateTimeFilterInput>;
  currentStatus?: InputMaybe<DocumentRequestStatusFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  preferredPickupDate?: InputMaybe<DateTimeFilterInput>;
  requestType?: InputMaybe<DocumentRequestTypeFilterInput>;
  memberId?: InputMaybe<Scalars['ID']['input']>;
};

export type AdminEmergencyContactsFilterInput = {
  id?: InputMaybe<IdFilterInput>;
  type?: InputMaybe<EmergencyContactTypeFilterInput>;
  updatedAt?: InputMaybe<DateTimeFilterInput>;
};

export type AdminMembersActiveFilterInput = {
  gender?: InputMaybe<GenderFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  isActive?: InputMaybe<AdminMembersFilterInput>;
  registrationStatus?: InputMaybe<RegistrationStatusFilterInput>;
};

export type AdminMembersFilterInput = {
  equal?: InputMaybe<Scalars['Boolean']['input']>;
  in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  notEqual?: InputMaybe<Scalars['Boolean']['input']>;
  notIn?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

export type AdminMembersSortInput = {
  createdAt?: InputMaybe<SortDirection>;
  firstName?: InputMaybe<SortDirection>;
  lastName?: InputMaybe<SortDirection>;
};

export enum AnnouncementCategory {
  Emergency = 'EMERGENCY',
  Event = 'EVENT',
  GeneralNotice = 'GENERAL_NOTICE',
  HealthAdvisory = 'HEALTH_ADVISORY',
  News = 'NEWS',
  PowerInterruption = 'POWER_INTERRUPTION',
  RoadClosure = 'ROAD_CLOSURE',
}

export type AnnouncementCategoryFilterInput = {
  equal?: InputMaybe<AnnouncementCategory>;
  in?: InputMaybe<Array<AnnouncementCategory>>;
  notEqual?: InputMaybe<AnnouncementCategory>;
  notIn?: InputMaybe<Array<AnnouncementCategory>>;
};

export enum AnnouncementSortField {
  CreatedAt = 'CREATED_AT',
  PublishedAt = 'PUBLISHED_AT',
  Title = 'TITLE',
}

export type AnnouncementSortInput = {
  direction?: SortDirection;
  field?: AnnouncementSortField;
};

export type AnnouncementsFilterInput = {
  category?: InputMaybe<AnnouncementCategoryFilterInput>;
};

export type OrganizationFilterInput = {
  address?: InputMaybe<StringFilterInput>;
  contactNumber?: InputMaybe<StringFilterInput>;
  createdAt?: InputMaybe<DateTimeFilterInput>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<StringFilterInput>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type OrgOfficialFilterInput = {
  organizationId?: InputMaybe<IdFilterInput>;
};

export type CreateAdminAccountInput = {
  organizationId: Scalars['ID']['input'];
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  position: Scalars['String']['input'];
};

export type CreateAnnouncementInput = {
  category: AnnouncementCategory;
  content: Scalars['String']['input'];
  coverImageUrl?: InputMaybe<Scalars['String']['input']>;
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  isPublished?: InputMaybe<Scalars['Boolean']['input']>;
  title: Scalars['String']['input'];
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

export type CreateOrgOfficialInput = {
  contactNumber?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  order: Scalars['Int']['input'];
  photoUrl?: InputMaybe<Scalars['String']['input']>;
  position: Scalars['String']['input'];
  termEnd?: InputMaybe<Scalars['Int']['input']>;
  termStart: Scalars['Int']['input'];
};

export type CreateDocumentRequestInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  preferredPickupDate?: InputMaybe<Scalars['DateTime']['input']>;
  purpose: Scalars['String']['input'];
  requestType: DocumentRequestType;
};

export type CreateEmergencyContactInput = {
  alternateNumber?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  primaryNumber: Scalars['String']['input'];
  type: EmergencyContactType;
};

export type CreateEventPostInput = {
  content: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  scheduleId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type CreateGalleryPhotoInput = {
  caption?: InputMaybe<Scalars['String']['input']>;
  imageUrl: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type CreatePollInput = {
  closingDate: Scalars['DateTime']['input'];
  description: Scalars['String']['input'];
  options: Array<Scalars['String']['input']>;
  status?: InputMaybe<PollStatus>;
  title: Scalars['String']['input'];
};

export type CreateScheduleInput = {
  category: ScheduleCategory;
  coverImageUrl?: InputMaybe<Scalars['String']['input']>;
  date: Scalars['DateTime']['input'];
  description: Scalars['String']['input'];
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  title: Scalars['String']['input'];
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

export enum DocumentRequestSortField {
  CreatedAt = 'CREATED_AT',
  ReferenceNumber = 'REFERENCE_NUMBER',
  UpdatedAt = 'UPDATED_AT',
}

export type DocumentRequestSortFieldFilterInput = {
  equal?: InputMaybe<DocumentRequestSortField>;
  in?: InputMaybe<Array<DocumentRequestSortField>>;
  notEqual?: InputMaybe<DocumentRequestSortField>;
  notIn?: InputMaybe<Array<DocumentRequestSortField>>;
};

export type DocumentRequestSortInput = {
  createdAt?: InputMaybe<SortDirection>;
  updatedAt?: InputMaybe<SortDirection>;
};

export enum DocumentRequestStatus {
  Approved = 'APPROVED',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Pending = 'PENDING',
  ReadyForPickup = 'READY_FOR_PICKUP',
  Rejected = 'REJECTED',
  UnderReview = 'UNDER_REVIEW',
}

export type DocumentRequestStatusFilterInput = {
  equal?: InputMaybe<DocumentRequestStatus>;
  in?: InputMaybe<Array<DocumentRequestStatus>>;
  notEqual?: InputMaybe<DocumentRequestStatus>;
  notIn?: InputMaybe<Array<DocumentRequestStatus>>;
};

export enum DocumentRequestType {
  OrganizationClearance = 'ORGANIZATION_CLEARANCE',
  BlotterReport = 'BLOTTER_REPORT',
  BusinessClearanceInquiry = 'BUSINESS_CLEARANCE_INQUIRY',
  BusinessPermitRenewal = 'BUSINESS_PERMIT_RENEWAL',
  CertificateOfGoodMoral = 'CERTIFICATE_OF_GOOD_MORAL',
  CertificateOfIndigency = 'CERTIFICATE_OF_INDIGENCY',
  CertificateOfResidency = 'CERTIFICATE_OF_RESIDENCY',
  FourPsEnrollmentAssistance = 'FOUR_PS_ENROLLMENT_ASSISTANCE',
  KatarungangPamorganization = 'KATARUNGANG_PAMORGANIZATION',
  PwdIdAssistance = 'PWD_ID_ASSISTANCE',
  SoloParentId = 'SOLO_PARENT_ID',
}

export type DocumentRequestTypeFilterInput = {
  equal?: InputMaybe<DocumentRequestType>;
  in?: InputMaybe<Array<DocumentRequestType>>;
  notEqual?: InputMaybe<DocumentRequestType>;
  notIn?: InputMaybe<Array<DocumentRequestType>>;
};

export enum EmergencyContactSortField {
  CreatedAt = 'CREATED_AT',
  Name = 'NAME',
  Type = 'TYPE',
}

export type EmergencyContactSortFieldFilterInput = {
  equal?: InputMaybe<EmergencyContactSortField>;
  in?: InputMaybe<Array<EmergencyContactSortField>>;
  notEqual?: InputMaybe<EmergencyContactSortField>;
  notIn?: InputMaybe<Array<EmergencyContactSortField>>;
};

export type EmergencyContactSortInput = {
  createdAt?: InputMaybe<SortDirection>;
  name?: InputMaybe<SortDirection>;
};

export enum EmergencyContactType {
  Ambulance = 'AMBULANCE',
  OrganizationHall = 'ORGANIZATION_HALL',
  OrganizationTanod = 'ORGANIZATION_TANOD',
  DisasterResponseTeam = 'DISASTER_RESPONSE_TEAM',
  FireStation = 'FIRE_STATION',
  HealthCenter = 'HEALTH_CENTER',
  Police = 'POLICE',
}

export type EmergencyContactTypeFilterInput = {
  equal?: InputMaybe<EmergencyContactType>;
  in?: InputMaybe<Array<EmergencyContactType>>;
  notEqual?: InputMaybe<EmergencyContactType>;
  notIn?: InputMaybe<Array<EmergencyContactType>>;
};

export type EmergencyContactsFilterInput = {
  type?: InputMaybe<EmergencyContactTypeFilterInput>;
};

export type EventPostFilterInput = {
  createdAt?: InputMaybe<DateTimeFilterInput>;
  scheduleId?: InputMaybe<IdFilterInput>;
};

export type EventPostSortInput = {
  createdAt?: InputMaybe<SortDirection>;
  title?: InputMaybe<SortDirection>;
};

export type GalleryPhotoFilterInput = {
  organizationId?: InputMaybe<IdFilterInput>;
};

export type GalleryPhotoSortInput = {
  createdAt?: InputMaybe<SortDirection>;
  order?: InputMaybe<SortDirection>;
};

export enum GallerySourceType {
  Announcement = 'ANNOUNCEMENT',
  EventPost = 'EVENT_POST',
  GalleryPhoto = 'GALLERY_PHOTO',
  Schedule = 'SCHEDULE',
}

export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE',
  Other = 'OTHER',
  PreferNotToSay = 'PREFER_NOT_TO_SAY',
}

export type GenderFilterInput = {
  equal?: InputMaybe<Gender>;
  in?: InputMaybe<Array<Gender>>;
  notEqual?: InputMaybe<Gender>;
  notIn?: InputMaybe<Array<Gender>>;
};

export type IdFilterInput = {
  equal?: InputMaybe<Scalars['ID']['input']>;
  in?: InputMaybe<Array<Scalars['ID']['input']>>;
  notEqual?: InputMaybe<Scalars['ID']['input']>;
  notIn?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type JoinWaitlistInput = {
  organizationName?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  mobile?: InputMaybe<Scalars['String']['input']>;
  role: WaitlistRole;
};

export type LoginInput = {
  organizationSlug?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MyDocumentRequestsFilterInput = {
  currentStatus?: InputMaybe<DocumentRequestStatusFilterInput>;
  requestType?: InputMaybe<DocumentRequestTypeFilterInput>;
};

export type NotificationSortInput = {
  createdAt?: InputMaybe<SortDirection>;
};

export enum NotificationType {
  Announcement = 'ANNOUNCEMENT',
  EmergencyAnnouncement = 'EMERGENCY_ANNOUNCEMENT',
  Poll = 'POLL',
  PollSuggestionApproved = 'POLL_SUGGESTION_APPROVED',
  PollSuggestionRejected = 'POLL_SUGGESTION_REJECTED',
  RegistrationApproved = 'REGISTRATION_APPROVED',
  RegistrationRejected = 'REGISTRATION_REJECTED',
  RequestApproved = 'REQUEST_APPROVED',
  RequestCompleted = 'REQUEST_COMPLETED',
  RequestReadyForPickup = 'REQUEST_READY_FOR_PICKUP',
  RequestRejected = 'REQUEST_REJECTED',
  RequestStatusUpdate = 'REQUEST_STATUS_UPDATE',
  Schedule = 'SCHEDULE',
  SchedulePost = 'SCHEDULE_POST',
  System = 'SYSTEM',
}

export type NotificationsFilterInput = {
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type OffsetLimitPaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export type PollSortInput = {
  closingDate?: InputMaybe<SortDirection>;
  createdAt?: InputMaybe<SortDirection>;
};

export enum PollStatus {
  Active = 'ACTIVE',
  Closed = 'CLOSED',
  Draft = 'DRAFT',
}

export type PollStatusFilterInput = {
  equal?: InputMaybe<PollStatus>;
  in?: InputMaybe<Array<PollStatus>>;
  notEqual?: InputMaybe<PollStatus>;
  notIn?: InputMaybe<Array<PollStatus>>;
};

export type PollSuggestionSortInput = {
  createdAt?: InputMaybe<SortDirection>;
};

export type PollSuggestionsFilterInput = {
  memberId?: InputMaybe<IdFilterInput>;
  status?: InputMaybe<SuggestionStatusFilterInput>;
  title?: InputMaybe<StringFilterInput>;
};

export type PollsFilterInput = {
  id?: InputMaybe<IdFilterInput>;
  status?: InputMaybe<PollStatusFilterInput>;
  title?: InputMaybe<StringFilterInput>;
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

export type RegisterMemberInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  organizationSlug: Scalars['String']['input'];
  birthdate?: InputMaybe<Scalars['DateTime']['input']>;
  confirmPassword: Scalars['String']['input'];
  contactNumber?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  gender?: InputMaybe<Gender>;
  lastName: Scalars['String']['input'];
  middleName?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  purok?: InputMaybe<Scalars['String']['input']>;
};

export enum RegistrationRejectionReason {
  DuplicateAccount = 'DUPLICATE_ACCOUNT',
  IncompleteInformation = 'INCOMPLETE_INFORMATION',
  InvalidContactDetails = 'INVALID_CONTACT_DETAILS',
  InvalidIdentity = 'INVALID_IDENTITY',
  NotAMember = 'NOT_A_MEMBER',
  Other = 'OTHER',
  SuspiciousActivity = 'SUSPICIOUS_ACTIVITY',
  Underage = 'UNDERAGE',
}

export enum RegistrationStatus {
  Approved = 'approved',
  PendingApproval = 'pending_approval',
  Rejected = 'rejected',
}

export type RegistrationStatusFilterInput = {
  equal?: InputMaybe<RegistrationStatus>;
  in?: InputMaybe<Array<RegistrationStatus>>;
  notEqual?: InputMaybe<RegistrationStatus>;
  notIn?: InputMaybe<Array<RegistrationStatus>>;
};

export enum MemberSortField {
  CreatedAt = 'CREATED_AT',
  FirstName = 'FIRST_NAME',
  LastName = 'LAST_NAME',
}

export type MemberSortFieldFilterInput = {
  equal?: InputMaybe<MemberSortField>;
  in?: InputMaybe<Array<MemberSortField>>;
  notEqual?: InputMaybe<MemberSortField>;
  notIn?: InputMaybe<Array<MemberSortField>>;
};

export type ReviewAccountDeletionRequestInput = {
  requestId: Scalars['ID']['input'];
  reviewNote?: InputMaybe<Scalars['String']['input']>;
  status: AccountDeletionRequestStatus;
};

export enum ScheduleCategory {
  OrganizationEvent = 'ORGANIZATION_EVENT',
  CleanupDrive = 'CLEANUP_DRIVE',
  ClinicSchedule = 'CLINIC_SCHEDULE',
  GarbageCollection = 'GARBAGE_COLLECTION',
  GeneralSchedule = 'GENERAL_SCHEDULE',
  PayoutSchedule = 'PAYOUT_SCHEDULE',
  Vaccination = 'VACCINATION',
}

export type ScheduleCategoryFilterInput = {
  equal?: InputMaybe<ScheduleCategory>;
  in?: InputMaybe<Array<ScheduleCategory>>;
  notEqual?: InputMaybe<ScheduleCategory>;
  notIn?: InputMaybe<Array<ScheduleCategory>>;
};

export enum ScheduleResponseType {
  BringingOthers = 'BRINGING_OTHERS',
  Going = 'GOING',
  Interested = 'INTERESTED',
  Supported = 'SUPPORTED',
  Volunteering = 'VOLUNTEERING',
}

export type ScheduleSortInput = {
  createdAt?: InputMaybe<SortDirection>;
  date?: InputMaybe<SortDirection>;
  title?: InputMaybe<SortDirection>;
};

export enum ScheduleStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Past = 'PAST',
  Today = 'TODAY',
  Upcoming = 'UPCOMING',
}

export type ScheduleStatusFilterInput = {
  equal?: InputMaybe<ScheduleStatus>;
  in?: InputMaybe<Array<ScheduleStatus>>;
  notEqual?: InputMaybe<ScheduleStatus>;
  notIn?: InputMaybe<Array<ScheduleStatus>>;
};

export type SchedulesFilterInput = {
  category?: InputMaybe<ScheduleCategoryFilterInput>;
  date?: InputMaybe<DateTimeFilterInput>;
  id?: InputMaybe<IdFilterInput>;
  location?: InputMaybe<StringFilterInput>;
  status?: InputMaybe<ScheduleStatusFilterInput>;
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

export type StringFilterInput = {
  contains?: InputMaybe<Scalars['String']['input']>;
  equal?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  notEqual?: InputMaybe<Scalars['String']['input']>;
  notIn?: InputMaybe<Array<Scalars['String']['input']>>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

export type SubmitAccountDeletionRequestInput = {
  organizationId: Scalars['String']['input'];
  email: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
};

export type SuggestPollInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export enum SuggestionStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
}

export type SuggestionStatusFilterInput = {
  equal?: InputMaybe<SuggestionStatus>;
  in?: InputMaybe<Array<SuggestionStatus>>;
  notEqual?: InputMaybe<SuggestionStatus>;
  notIn?: InputMaybe<Array<SuggestionStatus>>;
};

export type UnregisterPushTokenInput = {
  platform: PushPlatform;
  token: Scalars['String']['input'];
};

export type UpdateAdminAccountInput = {
  organizationId?: InputMaybe<Scalars['ID']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  position?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAnnouncementInput = {
  category: AnnouncementCategory;
  content: Scalars['String']['input'];
  coverImageUrl?: InputMaybe<Scalars['String']['input']>;
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  isPublished?: InputMaybe<Scalars['Boolean']['input']>;
  title: Scalars['String']['input'];
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

export type UpdateOrgOfficialInput = {
  contactNumber?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  order: Scalars['Int']['input'];
  photoUrl?: InputMaybe<Scalars['String']['input']>;
  position: Scalars['String']['input'];
  termEnd?: InputMaybe<Scalars['Int']['input']>;
  termStart: Scalars['Int']['input'];
};

export type UpdateDocumentRequestStatusInput = {
  adminRemark?: InputMaybe<Scalars['String']['input']>;
  newStatus: DocumentRequestStatus;
  note?: InputMaybe<Scalars['String']['input']>;
  pickupInstructions?: InputMaybe<Scalars['String']['input']>;
  rejectedReason?: InputMaybe<Scalars['String']['input']>;
  requestId: Scalars['ID']['input'];
};

export type UpdateEmergencyContactInput = {
  alternateNumber?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  primaryNumber: Scalars['String']['input'];
  type: EmergencyContactType;
};

export type UpdateEventPostInput = {
  content: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};

export type UpdateGalleryPhotoInput = {
  caption?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePollInput = {
  closingDate?: InputMaybe<Scalars['DateTime']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  options?: InputMaybe<Array<Scalars['String']['input']>>;
  status?: InputMaybe<PollStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMemberProfileInput = {
  address: Scalars['String']['input'];
  birthdate: Scalars['DateTime']['input'];
  contactNumber: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  gender?: InputMaybe<Gender>;
  lastName: Scalars['String']['input'];
  middleName?: InputMaybe<Scalars['String']['input']>;
  purok?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateScheduleInput = {
  category: ScheduleCategory;
  coverImageUrl?: InputMaybe<Scalars['String']['input']>;
  date: Scalars['DateTime']['input'];
  description: Scalars['String']['input'];
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  title: Scalars['String']['input'];
};

export type UpdateServiceCatalogConfigInput = {
  fee?: InputMaybe<Scalars['String']['input']>;
  isEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  processingTime?: InputMaybe<Scalars['String']['input']>;
  requestType: DocumentRequestType;
  requirements?: InputMaybe<Array<Scalars['String']['input']>>;
};

export enum UserRole {
  Admin = 'ADMIN',
  Member = 'MEMBER',
  SuperAdmin = 'SUPER_ADMIN',
}

export type WaitlistEntrySortInput = {
  createdAt?: InputMaybe<SortDirection>;
};

export type WaitlistFilterInput = {
  createdAt?: InputMaybe<DateTimeFilterInput>;
  role?: InputMaybe<WaitlistRoleFilterInput>;
};

export enum WaitlistRole {
  OrganizationOfficial = 'ORGANIZATION_OFFICIAL',
  LguStaff = 'STAFF',
  Other = 'OTHER',
  Member = 'MEMBER',
}

export type WaitlistRoleFilterInput = {
  equal?: InputMaybe<WaitlistRole>;
  in?: InputMaybe<Array<WaitlistRole>>;
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

export type AnnouncementFragment = {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  coverImageUrl?: string | null;
  isPinned?: boolean | null;
  isPublished?: boolean | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminAnnouncementsQueryVariables = Exact<{
  filter?: InputMaybe<AdminAnnouncementsFilterInput>;
  sort?: InputMaybe<AnnouncementSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type AdminAnnouncementsQuery = {
  adminAnnouncements: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        title: string;
        content: string;
        category: AnnouncementCategory;
        coverImageUrl?: string | null;
        isPinned?: boolean | null;
        isPublished?: boolean | null;
        publishedAt?: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type SearchByAdminAnnouncementsQueryVariables = Exact<{
  search: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
}>;

export type SearchByAdminAnnouncementsQuery = {
  searchByAdminAnnouncements?: Array<{
    id: string;
    title: string;
    content: string;
    category: AnnouncementCategory;
    coverImageUrl?: string | null;
    isPinned?: boolean | null;
    isPublished?: boolean | null;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  }> | null;
};

export type CreateAnnouncementMutationVariables = Exact<{
  input: CreateAnnouncementInput;
}>;

export type CreateAnnouncementMutation = {
  createAnnouncement: {
    id: string;
    title: string;
    content: string;
    category: AnnouncementCategory;
    coverImageUrl?: string | null;
    isPinned?: boolean | null;
    isPublished?: boolean | null;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateAnnouncementMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateAnnouncementInput;
}>;

export type UpdateAnnouncementMutation = {
  updateAnnouncement: {
    id: string;
    title: string;
    content: string;
    category: AnnouncementCategory;
    coverImageUrl?: string | null;
    isPinned?: boolean | null;
    isPublished?: boolean | null;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeleteAnnouncementMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeleteAnnouncementMutation = { deleteAnnouncement: boolean };

export type PublishAnnouncementMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  isPublished: Scalars['Boolean']['input'];
}>;

export type PublishAnnouncementMutation = {
  publishAnnouncement: {
    id: string;
    title: string;
    content: string;
    category: AnnouncementCategory;
    coverImageUrl?: string | null;
    isPinned?: boolean | null;
    isPublished?: boolean | null;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type PinAnnouncementMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  isPinned: Scalars['Boolean']['input'];
}>;

export type PinAnnouncementMutation = {
  pinAnnouncement: {
    id: string;
    title: string;
    content: string;
    category: AnnouncementCategory;
    coverImageUrl?: string | null;
    isPinned?: boolean | null;
    isPublished?: boolean | null;
    publishedAt?: string | null;
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

export type RegisterMemberMutationVariables = Exact<{
  input: RegisterMemberInput;
}>;

export type RegisterMemberMutation = {
  registerMember: {
    user: { id: string; email: string; role: UserRole; isActive: boolean };
  };
};

export type LogoutMutationVariables = Exact<{ [key: string]: never }>;

export type LogoutMutation = { logout: boolean };

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

export type ValidateSessionQueryVariables = Exact<{ [key: string]: never }>;

export type ValidateSessionQuery = {
  validateSession: { ok: boolean; status: number };
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

export type AdminDashboardSummaryQueryVariables = Exact<{
  [key: string]: never;
}>;

export type AdminDashboardSummaryQuery = {
  adminDashboardSummary: {
    totalMembers: number;
    totalActiveRequests: number;
    pendingRequestsCount: number;
    approvedRequestsCount: number;
    readyForPickupCount: number;
    rejectedRequestsCount: number;
    activePollsCount: number;
    totalVotesCast: number;
    membersTrend: { delta: number; deltaPercent: number; direction: string };
    activeRequestsTrend: {
      delta: number;
      deltaPercent: number;
      direction: string;
    };
    votesCastTrend: { delta: number; deltaPercent: number; direction: string };
    requestsPerMonth: Array<{
      month: string;
      label: string;
      pending: number;
      approved: number;
      readyForPickup: number;
      rejected: number;
      total: number;
    }>;
    recentRequests: Array<{
      id: string;
      referenceNumber: string;
      requestType: DocumentRequestType;
      currentStatus: DocumentRequestStatus;
      fullName: string;
      createdAt: string;
    }>;
    latestAnnouncements: Array<{
      id: string;
      title: string;
      category: AnnouncementCategory;
      publishedAt?: string | null;
    }>;
    upcomingSchedules: Array<{
      id: string;
      title: string;
      category: ScheduleCategory;
      date: string;
    }>;
  };
};

export type SuperAdminDashboardSummaryQueryVariables = Exact<{
  [key: string]: never;
}>;

export type SuperAdminDashboardSummaryQuery = {
  superAdminDashboardSummary: {
    totalOrganizations: number;
    activeOrganizations: number;
    inactiveOrganizations: number;
    totalAdminAccounts: number;
    activeAdminAccounts: number;
    inactiveAdminAccounts: number;
    pendingDeletionRequests: number;
    waitlistTotal: number;
    totalMembers: number;
    totalActiveRequests: number;
    pendingRequestsCount: number;
    approvedRequestsCount: number;
    readyForPickupCount: number;
    rejectedRequestsCount: number;
    activePollsCount: number;
    totalVotesCast: number;
    waitlistByRole: Array<{ role: WaitlistRole; count: number }>;
    latestOrganizations: Array<{
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
      createdAt: string;
    }>;
    membersTrend: { delta: number; deltaPercent: number; direction: string };
    activeRequestsTrend: {
      delta: number;
      deltaPercent: number;
      direction: string;
    };
    votesCastTrend: { delta: number; deltaPercent: number; direction: string };
    requestsPerMonth: Array<{
      month: string;
      label: string;
      pending: number;
      approved: number;
      readyForPickup: number;
      rejected: number;
      total: number;
    }>;
    recentRequests: Array<{
      id: string;
      referenceNumber: string;
      requestType: DocumentRequestType;
      currentStatus: DocumentRequestStatus;
      fullName: string;
      createdAt: string;
    }>;
  };
};

export type DocumentRequestRecordFragment = {
  id: string;
  memberId: string;
  requestType: DocumentRequestType;
  referenceNumber: string;
  purpose: string;
  notes?: string | null;
  preferredPickupDate?: string | null;
  fullName: string;
  contactNumber: string;
  address: string;
  currentStatus: DocumentRequestStatus;
  adminRemark?: string | null;
  rejectedReason?: string | null;
  pickupInstructions?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentRequestDetailFragment = {
  id: string;
  memberId: string;
  requestType: DocumentRequestType;
  referenceNumber: string;
  purpose: string;
  notes?: string | null;
  preferredPickupDate?: string | null;
  fullName: string;
  contactNumber: string;
  address: string;
  currentStatus: DocumentRequestStatus;
  adminRemark?: string | null;
  rejectedReason?: string | null;
  pickupInstructions?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  statusLogs: Array<{
    id: string;
    requestId: string;
    previousStatus?: DocumentRequestStatus | null;
    newStatus: DocumentRequestStatus;
    note?: string | null;
    changedBy: string;
    changedAt: string;
  }>;
};

export type AdminDocumentRequestsQueryVariables = Exact<{
  filter?: InputMaybe<AdminDocumentRequestsFilterInput>;
  sort?: InputMaybe<DocumentRequestSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type AdminDocumentRequestsQuery = {
  adminDocumentRequests: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        memberId: string;
        requestType: DocumentRequestType;
        referenceNumber: string;
        purpose: string;
        notes?: string | null;
        preferredPickupDate?: string | null;
        fullName: string;
        contactNumber: string;
        address: string;
        currentStatus: DocumentRequestStatus;
        adminRemark?: string | null;
        rejectedReason?: string | null;
        pickupInstructions?: string | null;
        reviewedBy?: string | null;
        reviewedAt?: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type SearchByDocumentRequestsQueryVariables = Exact<{
  search: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
}>;

export type SearchByDocumentRequestsQuery = {
  searchByDocumentRequests?: Array<{
    id: string;
    memberId: string;
    requestType: DocumentRequestType;
    referenceNumber: string;
    purpose: string;
    notes?: string | null;
    preferredPickupDate?: string | null;
    fullName: string;
    contactNumber: string;
    address: string;
    currentStatus: DocumentRequestStatus;
    adminRemark?: string | null;
    rejectedReason?: string | null;
    pickupInstructions?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  }> | null;
};

export type AdminDocumentRequestQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type AdminDocumentRequestQuery = {
  adminDocumentRequest?: {
    id: string;
    memberId: string;
    requestType: DocumentRequestType;
    referenceNumber: string;
    purpose: string;
    notes?: string | null;
    preferredPickupDate?: string | null;
    fullName: string;
    contactNumber: string;
    address: string;
    currentStatus: DocumentRequestStatus;
    adminRemark?: string | null;
    rejectedReason?: string | null;
    pickupInstructions?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    statusLogs: Array<{
      id: string;
      requestId: string;
      previousStatus?: DocumentRequestStatus | null;
      newStatus: DocumentRequestStatus;
      note?: string | null;
      changedBy: string;
      changedAt: string;
    }>;
  } | null;
};

export type UpdateDocumentRequestStatusMutationVariables = Exact<{
  input: UpdateDocumentRequestStatusInput;
}>;

export type UpdateDocumentRequestStatusMutation = {
  updateDocumentRequestStatus: {
    id: string;
    memberId: string;
    requestType: DocumentRequestType;
    referenceNumber: string;
    purpose: string;
    notes?: string | null;
    preferredPickupDate?: string | null;
    fullName: string;
    contactNumber: string;
    address: string;
    currentStatus: DocumentRequestStatus;
    adminRemark?: string | null;
    rejectedReason?: string | null;
    pickupInstructions?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    statusLogs: Array<{
      id: string;
      requestId: string;
      previousStatus?: DocumentRequestStatus | null;
      newStatus: DocumentRequestStatus;
      note?: string | null;
      changedBy: string;
      changedAt: string;
    }>;
  };
};

export type EmergencyContactRecordFragment = {
  id: string;
  name: string;
  type: EmergencyContactType;
  primaryNumber: string;
  alternateNumber?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminEmergencyContactsQueryVariables = Exact<{
  filter?: InputMaybe<AdminEmergencyContactsFilterInput>;
  sort?: InputMaybe<EmergencyContactSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type AdminEmergencyContactsQuery = {
  adminEmergencyContacts: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        name: string;
        type: EmergencyContactType;
        primaryNumber: string;
        alternateNumber?: string | null;
        description?: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type SearchByEmergencyContactsQueryVariables = Exact<{
  search: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
}>;

export type SearchByEmergencyContactsQuery = {
  searchByEmergencyContacts?: Array<{
    id: string;
    name: string;
    type: EmergencyContactType;
    primaryNumber: string;
    alternateNumber?: string | null;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  }> | null;
};

export type CreateEmergencyContactMutationVariables = Exact<{
  input: CreateEmergencyContactInput;
}>;

export type CreateEmergencyContactMutation = {
  createEmergencyContact: {
    id: string;
    name: string;
    type: EmergencyContactType;
    primaryNumber: string;
    alternateNumber?: string | null;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateEmergencyContactMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateEmergencyContactInput;
}>;

export type UpdateEmergencyContactMutation = {
  updateEmergencyContact: {
    id: string;
    name: string;
    type: EmergencyContactType;
    primaryNumber: string;
    alternateNumber?: string | null;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeleteEmergencyContactMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeleteEmergencyContactMutation = {
  deleteEmergencyContact: boolean;
};

export type EventPostFragment = {
  id: string;
  scheduleId: string;
  scheduleName: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type EventPostsQueryVariables = Exact<{
  filter?: InputMaybe<EventPostFilterInput>;
  sort?: InputMaybe<EventPostSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type EventPostsQuery = {
  eventPosts: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        scheduleId: string;
        scheduleName: string;
        title: string;
        content: string;
        imageUrl?: string | null;
        createdById: string;
        createdByName: string;
        createdAt: string;
        updatedAt: string;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type EventPostsCountQueryVariables = Exact<{
  filter?: InputMaybe<EventPostFilterInput>;
}>;

export type EventPostsCountQuery = { eventPosts: { totalCount: number } };

export type LatestEventPostQueryVariables = Exact<{ [key: string]: never }>;

export type LatestEventPostQuery = {
  eventPosts: { edges: Array<{ node: { createdAt: string } }> };
};

export type CreateEventPostMutationVariables = Exact<{
  input: CreateEventPostInput;
}>;

export type CreateEventPostMutation = {
  createEventPost: {
    id: string;
    scheduleId: string;
    scheduleName: string;
    title: string;
    content: string;
    imageUrl?: string | null;
    createdById: string;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateEventPostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateEventPostInput;
}>;

export type UpdateEventPostMutation = {
  updateEventPost: {
    id: string;
    scheduleId: string;
    scheduleName: string;
    title: string;
    content: string;
    imageUrl?: string | null;
    createdById: string;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeleteEventPostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeleteEventPostMutation = { deleteEventPost: boolean };

export type GalleryFeedItemFragment = {
  id: string;
  sourceId: string;
  sourceType: GallerySourceType;
  imageUrl: string;
  title?: string | null;
  caption?: string | null;
  createdAt: string;
};

export type GalleryFeedQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type GalleryFeedQuery = {
  galleryFeed: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        sourceId: string;
        sourceType: GallerySourceType;
        imageUrl: string;
        title?: string | null;
        caption?: string | null;
        createdAt: string;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type GalleryPhotoFragment = {
  id: string;
  organizationId: string;
  imageUrl: string;
  title?: string | null;
  caption?: string | null;
  order: number;
  uploadedById: string;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
};

export type GalleryPhotosQueryVariables = Exact<{
  filter?: InputMaybe<GalleryPhotoFilterInput>;
  sort?: InputMaybe<GalleryPhotoSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type GalleryPhotosQuery = {
  galleryPhotos: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        organizationId: string;
        imageUrl: string;
        title?: string | null;
        caption?: string | null;
        order: number;
        uploadedById: string;
        uploadedByName: string;
        createdAt: string;
        updatedAt: string;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type GalleryPhotosCountQueryVariables = Exact<{
  filter?: InputMaybe<GalleryPhotoFilterInput>;
}>;

export type GalleryPhotosCountQuery = { galleryPhotos: { totalCount: number } };

export type CreateGalleryPhotoMutationVariables = Exact<{
  input: CreateGalleryPhotoInput;
}>;

export type CreateGalleryPhotoMutation = {
  createGalleryPhoto: {
    id: string;
    organizationId: string;
    imageUrl: string;
    title?: string | null;
    caption?: string | null;
    order: number;
    uploadedById: string;
    uploadedByName: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateGalleryPhotoMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateGalleryPhotoInput;
}>;

export type UpdateGalleryPhotoMutation = {
  updateGalleryPhoto: {
    id: string;
    organizationId: string;
    imageUrl: string;
    title?: string | null;
    caption?: string | null;
    order: number;
    uploadedById: string;
    uploadedByName: string;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeleteGalleryPhotoMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeleteGalleryPhotoMutation = { deleteGalleryPhoto: boolean };

export type ReorderGalleryPhotosMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;

export type ReorderGalleryPhotosMutation = {
  reorderGalleryPhotos: Array<{
    id: string;
    organizationId: string;
    imageUrl: string;
    title?: string | null;
    caption?: string | null;
    order: number;
    uploadedById: string;
    uploadedByName: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type OrgOfficialRecordFragment = {
  id: string;
  organizationId: string;
  name: string;
  position: string;
  photoUrl?: string | null;
  contactNumber?: string | null;
  termStart: number;
  termEnd?: number | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type OrgOfficialsQueryVariables = Exact<{
  filter?: InputMaybe<OrgOfficialFilterInput>;
}>;

export type OrgOfficialsQuery = {
  orgOfficials: Array<{
    id: string;
    organizationId: string;
    name: string;
    position: string;
    photoUrl?: string | null;
    contactNumber?: string | null;
    termStart: number;
    termEnd?: number | null;
    order: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type CreateOrgOfficialMutationVariables = Exact<{
  input: CreateOrgOfficialInput;
}>;

export type CreateOrgOfficialMutation = {
  createOrgOfficial: {
    id: string;
    organizationId: string;
    name: string;
    position: string;
    photoUrl?: string | null;
    contactNumber?: string | null;
    termStart: number;
    termEnd?: number | null;
    order: number;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateOrgOfficialMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateOrgOfficialInput;
}>;

export type UpdateOrgOfficialMutation = {
  updateOrgOfficial: {
    id: string;
    organizationId: string;
    name: string;
    position: string;
    photoUrl?: string | null;
    contactNumber?: string | null;
    termStart: number;
    termEnd?: number | null;
    order: number;
    createdAt: string;
    updatedAt: string;
  };
};

export type DeleteOrgOfficialMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeleteOrgOfficialMutation = { deleteOrgOfficial: boolean };

export type PollRecordFragment = {
  id: string;
  title: string;
  description: string;
  status: PollStatus;
  closingDate: string;
  totalVotes: number;
  myVotedOptionId?: string | null;
  createdAt: string;
  updatedAt: string;
  options: Array<{ id: string; label: string; order: number; votes: number }>;
};

export type PollSuggestionRecordFragment = {
  id: string;
  memberId: string;
  title: string;
  description?: string | null;
  status: SuggestionStatus;
  createdAt: string;
};

export type PollsQueryVariables = Exact<{
  filter?: InputMaybe<PollsFilterInput>;
  sort?: InputMaybe<PollSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type PollsQuery = {
  polls: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        title: string;
        description: string;
        status: PollStatus;
        closingDate: string;
        totalVotes: number;
        myVotedOptionId?: string | null;
        createdAt: string;
        updatedAt: string;
        options: Array<{
          id: string;
          label: string;
          order: number;
          votes: number;
        }>;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type PollQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type PollQuery = {
  poll?: {
    id: string;
    title: string;
    description: string;
    status: PollStatus;
    closingDate: string;
    totalVotes: number;
    myVotedOptionId?: string | null;
    createdAt: string;
    updatedAt: string;
    options: Array<{ id: string; label: string; order: number; votes: number }>;
  } | null;
};

export type PollsSummaryQueryVariables = Exact<{ [key: string]: never }>;

export type PollsSummaryQuery = {
  pollsSummary: {
    totalPolls: number;
    activePolls: number;
    closedPolls: number;
    totalVotes: number;
    pendingSuggestions: number;
  };
};

export type PollSuggestionsQueryVariables = Exact<{
  filter?: InputMaybe<PollSuggestionsFilterInput>;
  sort?: InputMaybe<PollSuggestionSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type PollSuggestionsQuery = {
  pollSuggestions: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        memberId: string;
        title: string;
        description?: string | null;
        status: SuggestionStatus;
        createdAt: string;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type CreatePollMutationVariables = Exact<{
  input: CreatePollInput;
}>;

export type CreatePollMutation = {
  createPoll: {
    id: string;
    title: string;
    description: string;
    status: PollStatus;
    closingDate: string;
    totalVotes: number;
    myVotedOptionId?: string | null;
    createdAt: string;
    updatedAt: string;
    options: Array<{ id: string; label: string; order: number; votes: number }>;
  };
};

export type UpdatePollMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdatePollInput;
}>;

export type UpdatePollMutation = {
  updatePoll: {
    id: string;
    title: string;
    description: string;
    status: PollStatus;
    closingDate: string;
    totalVotes: number;
    myVotedOptionId?: string | null;
    createdAt: string;
    updatedAt: string;
    options: Array<{ id: string; label: string; order: number; votes: number }>;
  };
};

export type DeletePollMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeletePollMutation = { deletePoll: boolean };

export type ApprovePollSuggestionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type ApprovePollSuggestionMutation = {
  approvePollSuggestion: {
    id: string;
    memberId: string;
    title: string;
    description?: string | null;
    status: SuggestionStatus;
    createdAt: string;
  };
};

export type RejectPollSuggestionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type RejectPollSuggestionMutation = {
  rejectPollSuggestion: {
    id: string;
    memberId: string;
    title: string;
    description?: string | null;
    status: SuggestionStatus;
    createdAt: string;
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

export type RegistrationReviewRecordFragment = {
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: RegistrationRejectionReason | null;
  rejectionNote?: string | null;
  reviewedByUser?: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  } | null;
};

export type MemberAccountReviewFragment = {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  registrationStatus: RegistrationStatus;
  registrationReview?: {
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    rejectionReason?: RegistrationRejectionReason | null;
    rejectionNote?: string | null;
    reviewedByUser?: {
      id: string;
      email: string;
      role: UserRole;
      isActive: boolean;
    } | null;
  } | null;
};

export type MemberDirectoryRecordFragment = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  fullName: string;
  birthdate?: string | null;
  gender?: Gender | null;
  address?: string | null;
  purok?: string | null;
  contactNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    registrationStatus: RegistrationStatus;
    registrationReview?: {
      reviewedBy?: string | null;
      reviewedAt?: string | null;
      rejectionReason?: RegistrationRejectionReason | null;
      rejectionNote?: string | null;
      reviewedByUser?: {
        id: string;
        email: string;
        role: UserRole;
        isActive: boolean;
      } | null;
    } | null;
  } | null;
};

export type AdminMembersQueryVariables = Exact<{
  filter?: InputMaybe<AdminMembersActiveFilterInput>;
  sort?: InputMaybe<AdminMembersSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type AdminMembersQuery = {
  adminMembers: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        userId: string;
        firstName: string;
        lastName: string;
        middleName?: string | null;
        fullName: string;
        birthdate?: string | null;
        gender?: Gender | null;
        address?: string | null;
        purok?: string | null;
        contactNumber?: string | null;
        createdAt: string;
        updatedAt: string;
        user?: {
          id: string;
          email: string;
          role: UserRole;
          isActive: boolean;
          registrationStatus: RegistrationStatus;
          registrationReview?: {
            reviewedBy?: string | null;
            reviewedAt?: string | null;
            rejectionReason?: RegistrationRejectionReason | null;
            rejectionNote?: string | null;
            reviewedByUser?: {
              id: string;
              email: string;
              role: UserRole;
              isActive: boolean;
            } | null;
          } | null;
        } | null;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type AdminMembersCountQueryVariables = Exact<{
  filter?: InputMaybe<AdminMembersActiveFilterInput>;
}>;

export type AdminMembersCountQuery = {
  adminMembers: { totalCount: number };
};

export type SearchByMembersQueryVariables = Exact<{
  search: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
}>;

export type SearchByMembersQuery = {
  searchByMembers?: Array<string> | null;
};

export type ApproveMemberMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;

export type ApproveMemberMutation = {
  approveMember: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    registrationStatus: RegistrationStatus;
    registrationReview?: {
      reviewedBy?: string | null;
      reviewedAt?: string | null;
      rejectionReason?: RegistrationRejectionReason | null;
      rejectionNote?: string | null;
      reviewedByUser?: {
        id: string;
        email: string;
        role: UserRole;
        isActive: boolean;
      } | null;
    } | null;
  };
};

export type RejectMemberMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
  rejectionReason: RegistrationRejectionReason;
  rejectionNote?: InputMaybe<Scalars['String']['input']>;
}>;

export type RejectMemberMutation = {
  rejectMember: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    registrationStatus: RegistrationStatus;
    registrationReview?: {
      reviewedBy?: string | null;
      reviewedAt?: string | null;
      rejectionReason?: RegistrationRejectionReason | null;
      rejectionNote?: string | null;
      reviewedByUser?: {
        id: string;
        email: string;
        role: UserRole;
        isActive: boolean;
      } | null;
    } | null;
  };
};

export type RetriggerApprovalNotificationMutationVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;

export type RetriggerApprovalNotificationMutation = {
  retriggerApprovalNotification: boolean;
};

export type AdminMemberQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type AdminMemberQuery = {
  adminMember?: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    middleName?: string | null;
    fullName: string;
    birthdate?: string | null;
    gender?: Gender | null;
    address?: string | null;
    purok?: string | null;
    contactNumber?: string | null;
    createdAt: string;
    updatedAt: string;
    user?: {
      id: string;
      email: string;
      role: UserRole;
      isActive: boolean;
      registrationStatus: RegistrationStatus;
      registrationReview?: {
        reviewedBy?: string | null;
        reviewedAt?: string | null;
        rejectionReason?: RegistrationRejectionReason | null;
        rejectionNote?: string | null;
        reviewedByUser?: {
          id: string;
          email: string;
          role: UserRole;
          isActive: boolean;
        } | null;
      } | null;
    } | null;
  } | null;
};

export type ScheduleRecordFragment = {
  id: string;
  title: string;
  description: string;
  category: ScheduleCategory;
  status: ScheduleStatus;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  coverImageUrl?: string | null;
  myResponse?: ScheduleResponseType | null;
  createdBy: string;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  responsesByType: {
    going: Array<string>;
    interested: Array<string>;
    volunteering: Array<string>;
    bringingOthers: Array<string>;
    supported: Array<string>;
  };
};

export type ScheduleDetailFragment = {
  id: string;
  title: string;
  description: string;
  category: ScheduleCategory;
  status: ScheduleStatus;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  coverImageUrl?: string | null;
  myResponse?: ScheduleResponseType | null;
  createdBy: string;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  responses: Array<{
    memberId: string;
    responseType: ScheduleResponseType;
    respondedAt: string;
    member: { id: string; fullName: string; avatarUrl?: string | null };
  }>;
  responsesByType: {
    going: Array<string>;
    interested: Array<string>;
    volunteering: Array<string>;
    bringingOthers: Array<string>;
    supported: Array<string>;
  };
};

export type SchedulesQueryVariables = Exact<{
  filter?: InputMaybe<SchedulesFilterInput>;
  sort?: InputMaybe<ScheduleSortInput>;
  includePast?: InputMaybe<Scalars['Boolean']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type SchedulesQuery = {
  schedules: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        title: string;
        description: string;
        category: ScheduleCategory;
        status: ScheduleStatus;
        date: string;
        startTime?: string | null;
        endTime?: string | null;
        location?: string | null;
        coverImageUrl?: string | null;
        myResponse?: ScheduleResponseType | null;
        createdBy: string;
        updatedBy?: string | null;
        createdAt: string;
        updatedAt: string;
        responsesByType: {
          going: Array<string>;
          interested: Array<string>;
          volunteering: Array<string>;
          bringingOthers: Array<string>;
          supported: Array<string>;
        };
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type SchedulesCountQueryVariables = Exact<{
  filter?: InputMaybe<SchedulesFilterInput>;
  includePast?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type SchedulesCountQuery = { schedules: { totalCount: number } };

export type PendingRecapSchedulesQueryVariables = Exact<{
  [key: string]: never;
}>;

export type PendingRecapSchedulesQuery = {
  pendingRecapSchedules: Array<{
    id: string;
    title: string;
    description: string;
    category: ScheduleCategory;
    status: ScheduleStatus;
    date: string;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    coverImageUrl?: string | null;
    myResponse?: ScheduleResponseType | null;
    createdBy: string;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    responsesByType: {
      going: Array<string>;
      interested: Array<string>;
      volunteering: Array<string>;
      bringingOthers: Array<string>;
      supported: Array<string>;
    };
  }>;
};

export type SearchBySchedulesQueryVariables = Exact<{
  search: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
}>;

export type SearchBySchedulesQuery = {
  searchBySchedules?: Array<string> | null;
};

export type CreateScheduleMutationVariables = Exact<{
  input: CreateScheduleInput;
}>;

export type CreateScheduleMutation = {
  createSchedule: {
    id: string;
    title: string;
    description: string;
    category: ScheduleCategory;
    status: ScheduleStatus;
    date: string;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    coverImageUrl?: string | null;
    myResponse?: ScheduleResponseType | null;
    createdBy: string;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    responsesByType: {
      going: Array<string>;
      interested: Array<string>;
      volunteering: Array<string>;
      bringingOthers: Array<string>;
      supported: Array<string>;
    };
  };
};

export type UpdateScheduleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateScheduleInput;
}>;

export type UpdateScheduleMutation = {
  updateSchedule: {
    id: string;
    title: string;
    description: string;
    category: ScheduleCategory;
    status: ScheduleStatus;
    date: string;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    coverImageUrl?: string | null;
    myResponse?: ScheduleResponseType | null;
    createdBy: string;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    responsesByType: {
      going: Array<string>;
      interested: Array<string>;
      volunteering: Array<string>;
      bringingOthers: Array<string>;
      supported: Array<string>;
    };
  };
};

export type DeleteScheduleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeleteScheduleMutation = { deleteSchedule: boolean };

export type AdminServiceCatalogConfigsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type AdminServiceCatalogConfigsQuery = {
  adminServiceCatalogConfigs: Array<{
    id: string;
    requestType: DocumentRequestType;
    isEnabled: boolean;
    fee: string;
    processingTime: string;
    requirements: Array<string>;
    updatedAt: string;
  }>;
};

export type UpdateServiceCatalogConfigMutationVariables = Exact<{
  input: UpdateServiceCatalogConfigInput;
}>;

export type UpdateServiceCatalogConfigMutation = {
  updateServiceCatalogConfig: {
    id: string;
    requestType: DocumentRequestType;
    isEnabled: boolean;
    fee: string;
    processingTime: string;
    requirements: Array<string>;
    updatedAt: string;
  };
};

export type WaitlistEntryRecordFragment = {
  id: string;
  email: string;
  role: WaitlistRole;
  firstName?: string | null;
  lastName?: string | null;
  organizationName?: string | null;
  city?: string | null;
  mobile?: string | null;
  message?: string | null;
  createdAt: string;
};

export type AdminWaitlistEntriesQueryVariables = Exact<{
  filter?: InputMaybe<WaitlistFilterInput>;
  sort?: InputMaybe<WaitlistEntrySortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;

export type AdminWaitlistEntriesQuery = {
  adminWaitlistEntries: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        email: string;
        role: WaitlistRole;
        firstName?: string | null;
        lastName?: string | null;
        organizationName?: string | null;
        city?: string | null;
        mobile?: string | null;
        message?: string | null;
        createdAt: string;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type AdminWaitlistStatsQueryVariables = Exact<{ [key: string]: never }>;

export type AdminWaitlistStatsQuery = {
  adminWaitlistStats: {
    total: number;
    byRole: Array<{ role: WaitlistRole; count: number }>;
  };
};

export type JoinWaitlistMutationVariables = Exact<{
  input: JoinWaitlistInput;
}>;

export type JoinWaitlistMutation = {
  joinWaitlist: {
    id: string;
    email: string;
    role: WaitlistRole;
    firstName?: string | null;
    lastName?: string | null;
    organizationName?: string | null;
    city?: string | null;
    mobile?: string | null;
    message?: string | null;
    createdAt: string;
  };
};

export type DeleteWaitlistEntryMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DeleteWaitlistEntryMutation = { deleteWaitlistEntry: boolean };
