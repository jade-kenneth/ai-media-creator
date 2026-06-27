export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Cursor: { input: string; output: string; }
  DateTime: { input: string | Date; output: string; }
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
  Rejected = 'REJECTED'
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
  RoadClosure = 'ROAD_CLOSURE'
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
  Title = 'TITLE'
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
  UpdatedAt = 'UPDATED_AT'
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
  UnderReview = 'UNDER_REVIEW'
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
  SoloParentId = 'SOLO_PARENT_ID'
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
  Type = 'TYPE'
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
  Police = 'POLICE'
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
  Schedule = 'SCHEDULE'
}

export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE',
  Other = 'OTHER',
  PreferNotToSay = 'PREFER_NOT_TO_SAY'
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
  email: Scalars['String']['input'];
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
  System = 'SYSTEM'
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
  Draft = 'DRAFT'
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
  Web = 'WEB'
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
  Underage = 'UNDERAGE'
}

export enum RegistrationStatus {
  Approved = 'approved',
  PendingApproval = 'pending_approval',
  Rejected = 'rejected'
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
  LastName = 'LAST_NAME'
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
  Vaccination = 'VACCINATION'
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
  Volunteering = 'VOLUNTEERING'
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
  Upcoming = 'UPCOMING'
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
  Desc = 'DESC'
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
  Rejected = 'REJECTED'
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
  SuperAdmin = 'SUPER_ADMIN'
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
  Member = 'MEMBER'
}

export type WaitlistRoleFilterInput = {
  equal?: InputMaybe<WaitlistRole>;
  in?: InputMaybe<Array<WaitlistRole>>;
};

export type AnnouncementRecordFragment = { id: string, title: string, content: string, category: AnnouncementCategory, coverImageUrl?: string | null, isPinned?: boolean | null, isPublished?: boolean | null, publishedAt?: string | null, createdAt: string, updatedAt: string };

export type AnnouncementsQueryVariables = Exact<{
  filter?: InputMaybe<AnnouncementsFilterInput>;
  sort?: InputMaybe<AnnouncementSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type AnnouncementsQuery = { announcements: { totalCount: number, edges: Array<{ cursor: string, node: { id: string, title: string, content: string, category: AnnouncementCategory, coverImageUrl?: string | null, isPinned?: boolean | null, isPublished?: boolean | null, publishedAt?: string | null, createdAt: string, updatedAt: string } }>, pageInfo: { hasNextPage: boolean, endCursor?: string | null } } };

export type AnnouncementQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AnnouncementQuery = { announcement?: { id: string, title: string, content: string, category: AnnouncementCategory, coverImageUrl?: string | null, isPinned?: boolean | null, isPublished?: boolean | null, publishedAt?: string | null, createdAt: string, updatedAt: string } | null };

export type AuthRegistrationReviewFragment = { reviewedBy?: string | null, reviewedAt?: string | null, rejectionReason?: RegistrationRejectionReason | null, rejectionNote?: string | null };

export type AuthUserFragment = { id: string, email: string, role: UserRole, isActive: boolean, registrationStatus: RegistrationStatus, registrationReview?: { reviewedBy?: string | null, reviewedAt?: string | null, rejectionReason?: RegistrationRejectionReason | null, rejectionNote?: string | null } | null };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { login: { accessToken: string, refreshToken: string, tokenType: string, expiresIn: number, user: { id: string, email: string, role: UserRole, isActive: boolean, registrationStatus: RegistrationStatus, registrationReview?: { reviewedBy?: string | null, reviewedAt?: string | null, rejectionReason?: RegistrationRejectionReason | null, rejectionNote?: string | null } | null } } };

export type RegisterMemberMutationVariables = Exact<{
  input: RegisterMemberInput;
}>;


export type RegisterMemberMutation = { registerMember: { accessToken: string, refreshToken: string, user: { id: string, email: string, role: UserRole, isActive: boolean, registrationStatus: RegistrationStatus, registrationReview?: { reviewedBy?: string | null, reviewedAt?: string | null, rejectionReason?: RegistrationRejectionReason | null, rejectionNote?: string | null } | null } } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { logout: boolean };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, email: string, role: UserRole, isActive: boolean, registrationStatus: RegistrationStatus, registrationReview?: { reviewedBy?: string | null, reviewedAt?: string | null, rejectionReason?: RegistrationRejectionReason | null, rejectionNote?: string | null } | null } };

export type ValidateSessionQueryVariables = Exact<{ [key: string]: never; }>;


export type ValidateSessionQuery = { validateSession: { ok: boolean, status: number } };

export type DocumentRequestRecordFragment = { id: string, memberId: string, requestType: DocumentRequestType, referenceNumber: string, purpose: string, notes?: string | null, preferredPickupDate?: string | null, fullName: string, contactNumber: string, address: string, currentStatus: DocumentRequestStatus, adminRemark?: string | null, rejectedReason?: string | null, pickupInstructions?: string | null, reviewedBy?: string | null, reviewedAt?: string | null, createdAt: string, updatedAt: string };

export type DocumentRequestDetailFragment = { id: string, memberId: string, requestType: DocumentRequestType, referenceNumber: string, purpose: string, notes?: string | null, preferredPickupDate?: string | null, fullName: string, contactNumber: string, address: string, currentStatus: DocumentRequestStatus, adminRemark?: string | null, rejectedReason?: string | null, pickupInstructions?: string | null, reviewedBy?: string | null, reviewedAt?: string | null, createdAt: string, updatedAt: string, statusLogs: Array<{ id: string, requestId: string, previousStatus?: DocumentRequestStatus | null, newStatus: DocumentRequestStatus, note?: string | null, changedBy: string, changedAt: string }> };

export type MyDocumentRequestsQueryVariables = Exact<{
  filter?: InputMaybe<MyDocumentRequestsFilterInput>;
  sort?: InputMaybe<DocumentRequestSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type MyDocumentRequestsQuery = { myDocumentRequests: { totalCount: number, edges: Array<{ cursor: string, node: { id: string, memberId: string, requestType: DocumentRequestType, referenceNumber: string, purpose: string, notes?: string | null, preferredPickupDate?: string | null, fullName: string, contactNumber: string, address: string, currentStatus: DocumentRequestStatus, adminRemark?: string | null, rejectedReason?: string | null, pickupInstructions?: string | null, reviewedBy?: string | null, reviewedAt?: string | null, createdAt: string, updatedAt: string } }>, pageInfo: { hasNextPage: boolean, endCursor?: string | null } } };

export type MyDocumentRequestsCountQueryVariables = Exact<{
  filter?: InputMaybe<MyDocumentRequestsFilterInput>;
}>;


export type MyDocumentRequestsCountQuery = { myDocumentRequests: { totalCount: number } };

export type DocumentRequestQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DocumentRequestQuery = { documentRequest?: { id: string, memberId: string, requestType: DocumentRequestType, referenceNumber: string, purpose: string, notes?: string | null, preferredPickupDate?: string | null, fullName: string, contactNumber: string, address: string, currentStatus: DocumentRequestStatus, adminRemark?: string | null, rejectedReason?: string | null, pickupInstructions?: string | null, reviewedBy?: string | null, reviewedAt?: string | null, createdAt: string, updatedAt: string, statusLogs: Array<{ id: string, requestId: string, previousStatus?: DocumentRequestStatus | null, newStatus: DocumentRequestStatus, note?: string | null, changedBy: string, changedAt: string }> } | null };

export type CreateDocumentRequestMutationVariables = Exact<{
  input: CreateDocumentRequestInput;
}>;


export type CreateDocumentRequestMutation = { createDocumentRequest: { id: string, memberId: string, requestType: DocumentRequestType, referenceNumber: string, purpose: string, notes?: string | null, preferredPickupDate?: string | null, fullName: string, contactNumber: string, address: string, currentStatus: DocumentRequestStatus, adminRemark?: string | null, rejectedReason?: string | null, pickupInstructions?: string | null, reviewedBy?: string | null, reviewedAt?: string | null, createdAt: string, updatedAt: string } };

export type CancelDocumentRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
}>;


export type CancelDocumentRequestMutation = { cancelDocumentRequest: { id: string, memberId: string, requestType: DocumentRequestType, referenceNumber: string, purpose: string, notes?: string | null, preferredPickupDate?: string | null, fullName: string, contactNumber: string, address: string, currentStatus: DocumentRequestStatus, adminRemark?: string | null, rejectedReason?: string | null, pickupInstructions?: string | null, reviewedBy?: string | null, reviewedAt?: string | null, createdAt: string, updatedAt: string, statusLogs: Array<{ id: string, requestId: string, previousStatus?: DocumentRequestStatus | null, newStatus: DocumentRequestStatus, note?: string | null, changedBy: string, changedAt: string }> } };

export type EmergencyContactRecordFragment = { id: string, name: string, type: EmergencyContactType, primaryNumber: string, alternateNumber?: string | null, description?: string | null, createdAt: string, updatedAt: string };

export type EmergencyContactsQueryVariables = Exact<{
  filter?: InputMaybe<EmergencyContactsFilterInput>;
  sort?: InputMaybe<EmergencyContactSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type EmergencyContactsQuery = { emergencyContacts: { totalCount: number, edges: Array<{ cursor: string, node: { id: string, name: string, type: EmergencyContactType, primaryNumber: string, alternateNumber?: string | null, description?: string | null, createdAt: string, updatedAt: string } }>, pageInfo: { hasNextPage: boolean, endCursor?: string | null } } };

export type EventPostRecordFragment = { id: string, scheduleId: string, scheduleName: string, title: string, content: string, imageUrl?: string | null, createdById: string, createdByName: string, createdAt: string, updatedAt: string };

export type EventPostsFeedQueryVariables = Exact<{
  sort?: InputMaybe<EventPostSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type EventPostsFeedQuery = { eventPosts: { totalCount: number, edges: Array<{ cursor: string, node: { id: string, scheduleId: string, scheduleName: string, title: string, content: string, imageUrl?: string | null, createdById: string, createdByName: string, createdAt: string, updatedAt: string } }>, pageInfo: { hasNextPage: boolean, endCursor?: string | null } } };

export type GalleryFeedItemFragment = { id: string, sourceId: string, sourceType: GallerySourceType, imageUrl: string, title?: string | null, caption?: string | null, createdAt: string };

export type GalleryFeedQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type GalleryFeedQuery = { galleryFeed: { totalCount: number, edges: Array<{ cursor: string, node: { id: string, sourceId: string, sourceType: GallerySourceType, imageUrl: string, title?: string | null, caption?: string | null, createdAt: string } }>, pageInfo: { hasNextPage: boolean, endCursor?: string | null } } };

export type OrganizationPickerRecordFragment = { id: string, name: string, slug: string, logoUrl?: string | null, primaryColor?: string | null, contactNumber?: string | null, address?: string | null, features: Array<string>, isActive: boolean };

export type OrganizationsQueryVariables = Exact<{
  filter?: InputMaybe<OrganizationFilterInput>;
}>;


export type OrganizationsQuery = { organizations: Array<{ id: string, name: string, slug: string, logoUrl?: string | null, primaryColor?: string | null, contactNumber?: string | null, address?: string | null, features: Array<string>, isActive: boolean }> };

export type NotificationRecordFragment = { id: string, userId: string, title: string, message: string, type: NotificationType, isRead: boolean, relatedEntityId?: string | null, createdAt: string };

export type MyNotificationsQueryVariables = Exact<{
  filter?: InputMaybe<NotificationsFilterInput>;
  sort?: InputMaybe<NotificationSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type MyNotificationsQuery = { myNotifications: { totalCount: number, unreadCount: number, edges: Array<{ cursor: string, node: { id: string, userId: string, title: string, message: string, type: NotificationType, isRead: boolean, relatedEntityId?: string | null, createdAt: string } }>, pageInfo: { hasNextPage: boolean, endCursor?: string | null } } };

export type MarkNotificationAsReadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type MarkNotificationAsReadMutation = { markNotificationAsRead: { id: string, userId: string, title: string, message: string, type: NotificationType, isRead: boolean, relatedEntityId?: string | null, createdAt: string } };

export type MarkAllNotificationsAsReadMutationVariables = Exact<{ [key: string]: never; }>;


export type MarkAllNotificationsAsReadMutation = { markAllNotificationsAsRead: { updatedCount: number } };

export type RegisterPushTokenMutationVariables = Exact<{
  input: RegisterPushTokenInput;
}>;


export type RegisterPushTokenMutation = { registerPushToken: boolean };

export type UnregisterPushTokenMutationVariables = Exact<{
  input: UnregisterPushTokenInput;
}>;


export type UnregisterPushTokenMutation = { unregisterPushToken: boolean };

export type OrgOfficialRecordFragment = { id: string, name: string, position: string, photoUrl?: string | null, contactNumber?: string | null, termStart: number, termEnd?: number | null, order: number };

export type OrgOfficialsQueryVariables = Exact<{
  filter?: InputMaybe<OrgOfficialFilterInput>;
}>;


export type OrgOfficialsQuery = { orgOfficials: Array<{ id: string, name: string, position: string, photoUrl?: string | null, contactNumber?: string | null, termStart: number, termEnd?: number | null, order: number }> };

export type PollRecordFragment = { id: string, title: string, description: string, status: PollStatus, closingDate: string, totalVotes: number, myVotedOptionId?: string | null, createdAt: string, updatedAt: string, options: Array<{ id: string, label: string, order: number, votes: number }> };

export type PollsQueryVariables = Exact<{
  filter?: InputMaybe<PollsFilterInput>;
  sort?: InputMaybe<PollSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type PollsQuery = { polls: { totalCount: number, edges: Array<{ cursor: string, node: { id: string, title: string, description: string, status: PollStatus, closingDate: string, totalVotes: number, myVotedOptionId?: string | null, createdAt: string, updatedAt: string, options: Array<{ id: string, label: string, order: number, votes: number }> } }>, pageInfo: { hasNextPage: boolean, endCursor?: string | null } } };

export type PollQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PollQuery = { poll?: { id: string, title: string, description: string, status: PollStatus, closingDate: string, totalVotes: number, myVotedOptionId?: string | null, createdAt: string, updatedAt: string, options: Array<{ id: string, label: string, order: number, votes: number }> } | null };

export type CastVoteMutationVariables = Exact<{
  pollId: Scalars['ID']['input'];
  optionId: Scalars['ID']['input'];
}>;


export type CastVoteMutation = { castVote: { id: string, title: string, description: string, status: PollStatus, closingDate: string, totalVotes: number, myVotedOptionId?: string | null, createdAt: string, updatedAt: string, options: Array<{ id: string, label: string, order: number, votes: number }> } };

export type SuggestPollMutationVariables = Exact<{
  input: SuggestPollInput;
}>;


export type SuggestPollMutation = { suggestPoll: { id: string, memberId: string, title: string, description?: string | null, status: SuggestionStatus, createdAt: string } };

export type MyPollSuggestionsQueryVariables = Exact<{
  memberId: Scalars['ID']['input'];
  sort?: InputMaybe<PollSuggestionSortInput>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type MyPollSuggestionsQuery = { pollSuggestions: { totalCount: number, pageInfo: { hasNextPage: boolean, endCursor?: string | null }, edges: Array<{ cursor: string, node: { id: string, title: string, description?: string | null, status: SuggestionStatus, createdAt: string } }> } };

export type MemberProfileRecordFragment = { id: string, userId: string, firstName: string, lastName: string, middleName?: string | null, fullName: string, birthdate?: string | null, gender?: Gender | null, address?: string | null, purok?: string | null, contactNumber?: string | null, createdAt: string, updatedAt: string, user?: { id: string, email: string } | null };

export type MyProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type MyProfileQuery = { myProfile: { id: string, userId: string, firstName: string, lastName: string, middleName?: string | null, fullName: string, birthdate?: string | null, gender?: Gender | null, address?: string | null, purok?: string | null, contactNumber?: string | null, createdAt: string, updatedAt: string, user?: { id: string, email: string } | null } };

export type UpdateMyProfileMutationVariables = Exact<{
  input: UpdateMemberProfileInput;
}>;


export type UpdateMyProfileMutation = { updateMyProfile: { id: string, userId: string, firstName: string, lastName: string, middleName?: string | null, fullName: string, birthdate?: string | null, gender?: Gender | null, address?: string | null, purok?: string | null, contactNumber?: string | null, createdAt: string, updatedAt: string, user?: { id: string, email: string } | null } };

export type ScheduleRecordFragment = { id: string, title: string, description: string, category: ScheduleCategory, status: ScheduleStatus, date: string, startTime?: string | null, endTime?: string | null, location?: string | null, coverImageUrl?: string | null, myResponse?: ScheduleResponseType | null, createdAt: string, updatedAt: string, responsesByType: { going: Array<string>, interested: Array<string>, volunteering: Array<string>, bringingOthers: Array<string>, supported: Array<string> } };

export type ScheduleDetailFragment = { id: string, title: string, description: string, category: ScheduleCategory, status: ScheduleStatus, date: string, startTime?: string | null, endTime?: string | null, location?: string | null, coverImageUrl?: string | null, myResponse?: ScheduleResponseType | null, createdAt: string, updatedAt: string, responses: Array<{ memberId: string, responseType: ScheduleResponseType, respondedAt: string, member: { id: string, fullName: string, avatarUrl?: string | null } }>, responsesByType: { going: Array<string>, interested: Array<string>, volunteering: Array<string>, bringingOthers: Array<string>, supported: Array<string> } };

export type SchedulesQueryVariables = Exact<{
  filter?: InputMaybe<SchedulesFilterInput>;
  sort?: InputMaybe<ScheduleSortInput>;
  includePast?: InputMaybe<Scalars['Boolean']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type SchedulesQuery = { schedules: { totalCount: number, edges: Array<{ cursor: string, node: { id: string, title: string, description: string, category: ScheduleCategory, status: ScheduleStatus, date: string, startTime?: string | null, endTime?: string | null, location?: string | null, coverImageUrl?: string | null, myResponse?: ScheduleResponseType | null, createdAt: string, updatedAt: string, responsesByType: { going: Array<string>, interested: Array<string>, volunteering: Array<string>, bringingOthers: Array<string>, supported: Array<string> } } }>, pageInfo: { hasNextPage: boolean, endCursor?: string | null } } };

export type ScheduleDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ScheduleDetailQuery = { schedule?: { id: string, title: string, description: string, category: ScheduleCategory, status: ScheduleStatus, date: string, startTime?: string | null, endTime?: string | null, location?: string | null, coverImageUrl?: string | null, myResponse?: ScheduleResponseType | null, createdAt: string, updatedAt: string, responses: Array<{ memberId: string, responseType: ScheduleResponseType, respondedAt: string, member: { id: string, fullName: string, avatarUrl?: string | null } }>, responsesByType: { going: Array<string>, interested: Array<string>, volunteering: Array<string>, bringingOthers: Array<string>, supported: Array<string> } } | null };

export type RespondToScheduleMutationVariables = Exact<{
  scheduleId: Scalars['ID']['input'];
  responseType: ScheduleResponseType;
}>;


export type RespondToScheduleMutation = { respondToSchedule: { id: string, title: string, description: string, category: ScheduleCategory, status: ScheduleStatus, date: string, startTime?: string | null, endTime?: string | null, location?: string | null, coverImageUrl?: string | null, myResponse?: ScheduleResponseType | null, createdAt: string, updatedAt: string, responses: Array<{ memberId: string, responseType: ScheduleResponseType, respondedAt: string, member: { id: string, fullName: string, avatarUrl?: string | null } }>, responsesByType: { going: Array<string>, interested: Array<string>, volunteering: Array<string>, bringingOthers: Array<string>, supported: Array<string> } } };

export type RemoveScheduleResponseMutationVariables = Exact<{
  scheduleId: Scalars['ID']['input'];
}>;


export type RemoveScheduleResponseMutation = { removeScheduleResponse: { id: string, title: string, description: string, category: ScheduleCategory, status: ScheduleStatus, date: string, startTime?: string | null, endTime?: string | null, location?: string | null, coverImageUrl?: string | null, myResponse?: ScheduleResponseType | null, createdAt: string, updatedAt: string, responses: Array<{ memberId: string, responseType: ScheduleResponseType, respondedAt: string, member: { id: string, fullName: string, avatarUrl?: string | null } }>, responsesByType: { going: Array<string>, interested: Array<string>, volunteering: Array<string>, bringingOthers: Array<string>, supported: Array<string> } } };

export type ServiceCatalogConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type ServiceCatalogConfigsQuery = { serviceCatalogConfigs: Array<{ id: string, requestType: DocumentRequestType, isEnabled: boolean, fee: string, processingTime: string, requirements: Array<string> }> };
