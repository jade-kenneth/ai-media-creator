
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum AccountDeletionRequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export enum AnnouncementCategory {
    NEWS = "NEWS",
    EVENT = "EVENT",
    EMERGENCY = "EMERGENCY",
    ROAD_CLOSURE = "ROAD_CLOSURE",
    POWER_INTERRUPTION = "POWER_INTERRUPTION",
    HEALTH_ADVISORY = "HEALTH_ADVISORY",
    GENERAL_NOTICE = "GENERAL_NOTICE"
}

export enum AnnouncementSortField {
    PUBLISHED_AT = "PUBLISHED_AT",
    CREATED_AT = "CREATED_AT",
    TITLE = "TITLE"
}

export enum UserRole {
    MEMBER = "MEMBER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN"
}

export enum RegistrationStatus {
    pending_approval = "pending_approval",
    approved = "approved",
    rejected = "rejected"
}

export enum RegistrationRejectionReason {
    INCOMPLETE_INFORMATION = "INCOMPLETE_INFORMATION",
    INVALID_IDENTITY = "INVALID_IDENTITY",
    NOT_A_MEMBER = "NOT_A_MEMBER",
    DUPLICATE_ACCOUNT = "DUPLICATE_ACCOUNT",
    UNDERAGE = "UNDERAGE",
    INVALID_CONTACT_DETAILS = "INVALID_CONTACT_DETAILS",
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
    OTHER = "OTHER"
}

export enum SortDirection {
    ASC = "ASC",
    DESC = "DESC"
}

export enum DocumentRequestType {
    ORGANIZATION_CLEARANCE = "ORGANIZATION_CLEARANCE",
    CERTIFICATE_OF_RESIDENCY = "CERTIFICATE_OF_RESIDENCY",
    CERTIFICATE_OF_INDIGENCY = "CERTIFICATE_OF_INDIGENCY",
    CERTIFICATE_OF_GOOD_MORAL = "CERTIFICATE_OF_GOOD_MORAL",
    BUSINESS_CLEARANCE_INQUIRY = "BUSINESS_CLEARANCE_INQUIRY",
    BUSINESS_PERMIT_RENEWAL = "BUSINESS_PERMIT_RENEWAL",
    FOUR_PS_ENROLLMENT_ASSISTANCE = "FOUR_PS_ENROLLMENT_ASSISTANCE",
    SOLO_PARENT_ID = "SOLO_PARENT_ID",
    PWD_ID_ASSISTANCE = "PWD_ID_ASSISTANCE",
    BLOTTER_REPORT = "BLOTTER_REPORT",
    KATARUNGANG_PAMORGANIZATION = "KATARUNGANG_PAMORGANIZATION"
}

export enum DocumentRequestStatus {
    PENDING = "PENDING",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    READY_FOR_PICKUP = "READY_FOR_PICKUP",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}

export enum DocumentRequestSortField {
    CREATED_AT = "CREATED_AT",
    UPDATED_AT = "UPDATED_AT",
    REFERENCE_NUMBER = "REFERENCE_NUMBER"
}

export enum EmergencyContactType {
    ORGANIZATION_HALL = "ORGANIZATION_HALL",
    ORGANIZATION_TANOD = "ORGANIZATION_TANOD",
    HEALTH_CENTER = "HEALTH_CENTER",
    POLICE = "POLICE",
    FIRE_STATION = "FIRE_STATION",
    AMBULANCE = "AMBULANCE",
    DISASTER_RESPONSE_TEAM = "DISASTER_RESPONSE_TEAM"
}

export enum EmergencyContactSortField {
    CREATED_AT = "CREATED_AT",
    NAME = "NAME",
    TYPE = "TYPE"
}

export enum GallerySourceType {
    ANNOUNCEMENT = "ANNOUNCEMENT",
    EVENT_POST = "EVENT_POST",
    SCHEDULE = "SCHEDULE",
    GALLERY_PHOTO = "GALLERY_PHOTO"
}

export enum NotificationType {
    ANNOUNCEMENT = "ANNOUNCEMENT",
    EMERGENCY_ANNOUNCEMENT = "EMERGENCY_ANNOUNCEMENT",
    REQUEST_APPROVED = "REQUEST_APPROVED",
    REQUEST_REJECTED = "REQUEST_REJECTED",
    REQUEST_READY_FOR_PICKUP = "REQUEST_READY_FOR_PICKUP",
    REQUEST_COMPLETED = "REQUEST_COMPLETED",
    REQUEST_STATUS_UPDATE = "REQUEST_STATUS_UPDATE",
    REGISTRATION_APPROVED = "REGISTRATION_APPROVED",
    REGISTRATION_REJECTED = "REGISTRATION_REJECTED",
    POLL = "POLL",
    POLL_SUGGESTION_APPROVED = "POLL_SUGGESTION_APPROVED",
    POLL_SUGGESTION_REJECTED = "POLL_SUGGESTION_REJECTED",
    SCHEDULE = "SCHEDULE",
    SCHEDULE_POST = "SCHEDULE_POST",
    SYSTEM = "SYSTEM"
}

export enum PollStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    CLOSED = "CLOSED"
}

export enum SuggestionStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export enum PushPlatform {
    ANDROID = "ANDROID",
    IOS = "IOS",
    WEB = "WEB"
}

export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER",
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"
}

export enum MemberSortField {
    CREATED_AT = "CREATED_AT",
    FIRST_NAME = "FIRST_NAME",
    LAST_NAME = "LAST_NAME"
}

export enum ScheduleCategory {
    GARBAGE_COLLECTION = "GARBAGE_COLLECTION",
    VACCINATION = "VACCINATION",
    CLINIC_SCHEDULE = "CLINIC_SCHEDULE",
    PAYOUT_SCHEDULE = "PAYOUT_SCHEDULE",
    ORGANIZATION_EVENT = "ORGANIZATION_EVENT",
    CLEANUP_DRIVE = "CLEANUP_DRIVE",
    GENERAL_SCHEDULE = "GENERAL_SCHEDULE"
}

export enum ScheduleStatus {
    UPCOMING = "UPCOMING",
    TODAY = "TODAY",
    PAST = "PAST",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}

export enum ScheduleResponseType {
    GOING = "GOING",
    INTERESTED = "INTERESTED",
    VOLUNTEERING = "VOLUNTEERING",
    BRINGING_OTHERS = "BRINGING_OTHERS",
    SUPPORTED = "SUPPORTED"
}

export enum WaitlistRole {
    MEMBER = "MEMBER",
    ORGANIZATION_OFFICIAL = "ORGANIZATION_OFFICIAL",
    STAFF = "STAFF",
    OTHER = "OTHER"
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

export interface AnnouncementSortInput {
    field: AnnouncementSortField;
    direction: SortDirection;
}

export interface AnnouncementCategoryFilterInput {
    equal?: Nullable<AnnouncementCategory>;
    in?: Nullable<AnnouncementCategory[]>;
    notIn?: Nullable<AnnouncementCategory[]>;
    notEqual?: Nullable<AnnouncementCategory>;
}

export interface AdminAnnouncementBooleanFilterInput {
    equal?: Nullable<boolean>;
    in?: Nullable<boolean[]>;
    notIn?: Nullable<boolean[]>;
    notEqual?: Nullable<boolean>;
}

export interface AnnouncementsFilterInput {
    category?: Nullable<AnnouncementCategoryFilterInput>;
}

export interface AdminAnnouncementsFilterInput {
    id?: Nullable<IDFilterInput>;
    category?: Nullable<AnnouncementCategoryFilterInput>;
    isPublished?: Nullable<AdminAnnouncementBooleanFilterInput>;
    isPinned?: Nullable<AdminAnnouncementBooleanFilterInput>;
    deletedAt?: Nullable<DateTimeFilterInput>;
    publishedAt?: Nullable<DateTimeFilterInput>;
}

export interface CreateAnnouncementInput {
    title: string;
    content: string;
    category: AnnouncementCategory;
    coverImageUrl?: Nullable<string>;
    isPinned?: Nullable<boolean>;
    isPublished?: Nullable<boolean>;
}

export interface UpdateAnnouncementInput {
    title: string;
    content: string;
    category: AnnouncementCategory;
    coverImageUrl?: Nullable<string>;
    isPinned?: Nullable<boolean>;
    isPublished?: Nullable<boolean>;
}

export interface LoginInput {
    email: string;
    password: string;
    organizationSlug?: Nullable<string>;
}

export interface RegisterMemberInput {
    organizationSlug: string;
    firstName: string;
    lastName: string;
    middleName?: Nullable<string>;
    birthdate?: Nullable<DateTime>;
    gender?: Nullable<Gender>;
    email: string;
    contactNumber?: Nullable<string>;
    address?: Nullable<string>;
    purok?: Nullable<string>;
    password: string;
    confirmPassword: string;
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

export interface DocumentRequestSortFieldFilterInput {
    equal?: Nullable<DocumentRequestSortField>;
    in?: Nullable<DocumentRequestSortField[]>;
    notIn?: Nullable<DocumentRequestSortField[]>;
    notEqual?: Nullable<DocumentRequestSortField>;
}

export interface DocumentRequestStatusFilterInput {
    equal?: Nullable<DocumentRequestStatus>;
    in?: Nullable<DocumentRequestStatus[]>;
    notIn?: Nullable<DocumentRequestStatus[]>;
    notEqual?: Nullable<DocumentRequestStatus>;
}

export interface DocumentRequestTypeFilterInput {
    equal?: Nullable<DocumentRequestType>;
    in?: Nullable<DocumentRequestType[]>;
    notIn?: Nullable<DocumentRequestType[]>;
    notEqual?: Nullable<DocumentRequestType>;
}

export interface MyDocumentRequestsFilterInput {
    currentStatus?: Nullable<DocumentRequestStatusFilterInput>;
    requestType?: Nullable<DocumentRequestTypeFilterInput>;
}

export interface AdminDocumentRequestsFilterInput {
    id?: Nullable<IDFilterInput>;
    memberId?: Nullable<string>;
    currentStatus?: Nullable<DocumentRequestStatusFilterInput>;
    requestType?: Nullable<DocumentRequestTypeFilterInput>;
    preferredPickupDate?: Nullable<DateTimeFilterInput>;
    createdAt?: Nullable<DateTimeFilterInput>;
}

export interface DocumentRequestSortInput {
    createdAt?: Nullable<SortDirection>;
    updatedAt?: Nullable<SortDirection>;
}

export interface CreateDocumentRequestInput {
    requestType: DocumentRequestType;
    purpose: string;
    notes?: Nullable<string>;
    preferredPickupDate?: Nullable<DateTime>;
}

export interface UpdateDocumentRequestStatusInput {
    requestId: string;
    newStatus: DocumentRequestStatus;
    note?: Nullable<string>;
    adminRemark?: Nullable<string>;
    rejectedReason?: Nullable<string>;
    pickupInstructions?: Nullable<string>;
}

export interface EmergencyContactSortFieldFilterInput {
    equal?: Nullable<EmergencyContactSortField>;
    in?: Nullable<EmergencyContactSortField[]>;
    notIn?: Nullable<EmergencyContactSortField[]>;
    notEqual?: Nullable<EmergencyContactSortField>;
}

export interface EmergencyContactTypeFilterInput {
    equal?: Nullable<EmergencyContactType>;
    in?: Nullable<EmergencyContactType[]>;
    notIn?: Nullable<EmergencyContactType[]>;
    notEqual?: Nullable<EmergencyContactType>;
}

export interface EmergencyContactsFilterInput {
    type?: Nullable<EmergencyContactTypeFilterInput>;
}

export interface AdminEmergencyContactsFilterInput {
    id?: Nullable<IDFilterInput>;
    type?: Nullable<EmergencyContactTypeFilterInput>;
    updatedAt?: Nullable<DateTimeFilterInput>;
}

export interface EmergencyContactSortInput {
    createdAt?: Nullable<SortDirection>;
    name?: Nullable<SortDirection>;
}

export interface CreateEmergencyContactInput {
    name: string;
    type: EmergencyContactType;
    primaryNumber: string;
    alternateNumber?: Nullable<string>;
    description?: Nullable<string>;
}

export interface UpdateEmergencyContactInput {
    name: string;
    type: EmergencyContactType;
    primaryNumber: string;
    alternateNumber?: Nullable<string>;
    description?: Nullable<string>;
}

export interface EventPostSortInput {
    createdAt?: Nullable<SortDirection>;
    title?: Nullable<SortDirection>;
}

export interface EventPostFilterInput {
    scheduleId?: Nullable<IDFilterInput>;
    createdAt?: Nullable<DateTimeFilterInput>;
}

export interface CreateEventPostInput {
    scheduleId: string;
    title: string;
    content: string;
    imageUrl?: Nullable<string>;
}

export interface UpdateEventPostInput {
    title: string;
    content: string;
    imageUrl?: Nullable<string>;
}

export interface GalleryPhotoSortInput {
    order?: Nullable<SortDirection>;
    createdAt?: Nullable<SortDirection>;
}

export interface GalleryPhotoFilterInput {
    organizationId?: Nullable<IDFilterInput>;
}

export interface CreateGalleryPhotoInput {
    imageUrl: string;
    title?: Nullable<string>;
    caption?: Nullable<string>;
    order?: Nullable<number>;
}

export interface UpdateGalleryPhotoInput {
    title?: Nullable<string>;
    caption?: Nullable<string>;
    order?: Nullable<number>;
}

export interface NotificationsFilterInput {
    unreadOnly?: Nullable<boolean>;
}

export interface NotificationSortInput {
    createdAt?: Nullable<SortDirection>;
}

export interface OrgOfficialFilterInput {
    organizationId?: Nullable<IDFilterInput>;
}

export interface CreateOrgOfficialInput {
    name: string;
    position: string;
    photoUrl?: Nullable<string>;
    contactNumber?: Nullable<string>;
    termStart: number;
    termEnd?: Nullable<number>;
    order: number;
}

export interface UpdateOrgOfficialInput {
    name: string;
    position: string;
    photoUrl?: Nullable<string>;
    contactNumber?: Nullable<string>;
    termStart: number;
    termEnd?: Nullable<number>;
    order: number;
}

export interface PollStatusFilterInput {
    equal?: Nullable<PollStatus>;
    notEqual?: Nullable<PollStatus>;
    in?: Nullable<PollStatus[]>;
    notIn?: Nullable<PollStatus[]>;
}

export interface SuggestionStatusFilterInput {
    equal?: Nullable<SuggestionStatus>;
    notEqual?: Nullable<SuggestionStatus>;
    in?: Nullable<SuggestionStatus[]>;
    notIn?: Nullable<SuggestionStatus[]>;
}

export interface PollsFilterInput {
    id?: Nullable<IDFilterInput>;
    status?: Nullable<PollStatusFilterInput>;
    title?: Nullable<StringFilterInput>;
}

export interface PollSortInput {
    createdAt?: Nullable<SortDirection>;
    closingDate?: Nullable<SortDirection>;
}

export interface PollSuggestionsFilterInput {
    memberId?: Nullable<IDFilterInput>;
    status?: Nullable<SuggestionStatusFilterInput>;
    title?: Nullable<StringFilterInput>;
}

export interface PollSuggestionSortInput {
    createdAt?: Nullable<SortDirection>;
}

export interface CreatePollInput {
    title: string;
    description: string;
    closingDate: DateTime;
    status?: Nullable<PollStatus>;
    options: string[];
}

export interface UpdatePollInput {
    title?: Nullable<string>;
    description?: Nullable<string>;
    closingDate?: Nullable<DateTime>;
    status?: Nullable<PollStatus>;
    options?: Nullable<string[]>;
}

export interface SuggestPollInput {
    title: string;
    description?: Nullable<string>;
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

export interface MemberSortFieldFilterInput {
    equal?: Nullable<MemberSortField>;
    in?: Nullable<MemberSortField[]>;
    notIn?: Nullable<MemberSortField[]>;
    notEqual?: Nullable<MemberSortField>;
}

export interface GenderFilterInput {
    equal?: Nullable<Gender>;
    in?: Nullable<Gender[]>;
    notIn?: Nullable<Gender[]>;
    notEqual?: Nullable<Gender>;
}

export interface AdminMembersFilterInput {
    equal?: Nullable<boolean>;
    in?: Nullable<boolean[]>;
    notIn?: Nullable<boolean[]>;
    notEqual?: Nullable<boolean>;
}

export interface RegistrationStatusFilterInput {
    equal?: Nullable<RegistrationStatus>;
    in?: Nullable<RegistrationStatus[]>;
    notIn?: Nullable<RegistrationStatus[]>;
    notEqual?: Nullable<RegistrationStatus>;
}

export interface AdminMembersActiveFilterInput {
    id?: Nullable<IDFilterInput>;
    isActive?: Nullable<AdminMembersFilterInput>;
    registrationStatus?: Nullable<RegistrationStatusFilterInput>;
    gender?: Nullable<GenderFilterInput>;
}

export interface AdminMembersSortInput {
    createdAt?: Nullable<SortDirection>;
    firstName?: Nullable<SortDirection>;
    lastName?: Nullable<SortDirection>;
}

export interface UpdateMemberProfileInput {
    firstName: string;
    lastName: string;
    middleName?: Nullable<string>;
    contactNumber: string;
    address: string;
    purok?: Nullable<string>;
    gender?: Nullable<Gender>;
    birthdate: DateTime;
}

export interface ScheduleSortInput {
    date?: Nullable<SortDirection>;
    createdAt?: Nullable<SortDirection>;
    title?: Nullable<SortDirection>;
}

export interface ScheduleCategoryFilterInput {
    equal?: Nullable<ScheduleCategory>;
    in?: Nullable<ScheduleCategory[]>;
    notIn?: Nullable<ScheduleCategory[]>;
    notEqual?: Nullable<ScheduleCategory>;
}

export interface ScheduleStatusFilterInput {
    equal?: Nullable<ScheduleStatus>;
    in?: Nullable<ScheduleStatus[]>;
    notIn?: Nullable<ScheduleStatus[]>;
    notEqual?: Nullable<ScheduleStatus>;
}

export interface SchedulesFilterInput {
    id?: Nullable<IDFilterInput>;
    category?: Nullable<ScheduleCategoryFilterInput>;
    status?: Nullable<ScheduleStatusFilterInput>;
    date?: Nullable<DateTimeFilterInput>;
    location?: Nullable<StringFilterInput>;
}

export interface CreateScheduleInput {
    title: string;
    description: string;
    category: ScheduleCategory;
    date: DateTime;
    startTime?: Nullable<DateTime>;
    endTime?: Nullable<DateTime>;
    location?: Nullable<string>;
    coverImageUrl?: Nullable<string>;
}

export interface UpdateScheduleInput {
    title: string;
    description: string;
    category: ScheduleCategory;
    date: DateTime;
    startTime?: Nullable<DateTime>;
    endTime?: Nullable<DateTime>;
    location?: Nullable<string>;
    coverImageUrl?: Nullable<string>;
}

export interface UpdateServiceCatalogConfigInput {
    requestType: DocumentRequestType;
    isEnabled?: Nullable<boolean>;
    fee?: Nullable<string>;
    processingTime?: Nullable<string>;
    requirements?: Nullable<string[]>;
}

export interface WaitlistRoleFilterInput {
    equal?: Nullable<WaitlistRole>;
    in?: Nullable<WaitlistRole[]>;
}

export interface WaitlistFilterInput {
    role?: Nullable<WaitlistRoleFilterInput>;
    createdAt?: Nullable<DateTimeFilterInput>;
}

export interface WaitlistEntrySortInput {
    createdAt?: Nullable<SortDirection>;
}

export interface JoinWaitlistInput {
    email: string;
    role: WaitlistRole;
    firstName?: Nullable<string>;
    lastName?: Nullable<string>;
    organizationName?: Nullable<string>;
    city?: Nullable<string>;
    mobile?: Nullable<string>;
    message?: Nullable<string>;
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

export interface IQuery {
    adminAccountDeletionRequests(filter?: Nullable<AccountDeletionRequestFilterInput>, sort?: Nullable<AccountDeletionRequestSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): AccountDeletionRequestConnection | Promise<AccountDeletionRequestConnection>;
    adminAccountDeletionRequest(id: string): Nullable<AccountDeletionRequest> | Promise<Nullable<AccountDeletionRequest>>;
    adminAccounts(): AdminAccount[] | Promise<AdminAccount[]>;
    announcements(filter?: Nullable<AnnouncementsFilterInput>, sort?: Nullable<AnnouncementSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): AnnouncementConnection | Promise<AnnouncementConnection>;
    announcement(id: string): Nullable<Announcement> | Promise<Nullable<Announcement>>;
    adminAnnouncements(filter?: Nullable<AdminAnnouncementsFilterInput>, sort?: Nullable<AnnouncementSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): AnnouncementConnection | Promise<AnnouncementConnection>;
    searchByAdminAnnouncements(search: string, first?: Nullable<number>, after?: Nullable<Cursor>): Nullable<Announcement[]> | Promise<Nullable<Announcement[]>>;
    me(): User | Promise<User>;
    organizations(filter?: Nullable<OrganizationFilterInput>): Organization[] | Promise<Organization[]>;
    organization(id: string): Nullable<Organization> | Promise<Nullable<Organization>>;
    _health(): Nullable<string> | Promise<Nullable<string>>;
    adminDashboardSummary(): AdminDashboardSummary | Promise<AdminDashboardSummary>;
    superAdminDashboardSummary(): SuperAdminDashboardSummary | Promise<SuperAdminDashboardSummary>;
    myDocumentRequests(filter?: Nullable<MyDocumentRequestsFilterInput>, sort?: Nullable<DocumentRequestSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): DocumentRequestConnection | Promise<DocumentRequestConnection>;
    documentRequest(id: string): Nullable<DocumentRequest> | Promise<Nullable<DocumentRequest>>;
    adminDocumentRequests(filter?: Nullable<AdminDocumentRequestsFilterInput>, sort?: Nullable<DocumentRequestSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): DocumentRequestConnection | Promise<DocumentRequestConnection>;
    adminDocumentRequest(id: string): Nullable<DocumentRequest> | Promise<Nullable<DocumentRequest>>;
    searchByDocumentRequests(search: string, first?: Nullable<number>, after?: Nullable<Cursor>): Nullable<DocumentRequest[]> | Promise<Nullable<DocumentRequest[]>>;
    emergencyContacts(filter?: Nullable<EmergencyContactsFilterInput>, sort?: Nullable<EmergencyContactSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): EmergencyContactConnection | Promise<EmergencyContactConnection>;
    adminEmergencyContacts(filter?: Nullable<AdminEmergencyContactsFilterInput>, sort?: Nullable<EmergencyContactSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): EmergencyContactConnection | Promise<EmergencyContactConnection>;
    searchByEmergencyContacts(search: string, first?: Nullable<number>, after?: Nullable<Cursor>): Nullable<EmergencyContact[]> | Promise<Nullable<EmergencyContact[]>>;
    eventPosts(filter?: Nullable<EventPostFilterInput>, sort?: Nullable<EventPostSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): EventPostConnection | Promise<EventPostConnection>;
    galleryFeed(first?: Nullable<number>, after?: Nullable<Cursor>): GalleryFeedConnection | Promise<GalleryFeedConnection>;
    galleryPhotos(filter?: Nullable<GalleryPhotoFilterInput>, sort?: Nullable<GalleryPhotoSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): GalleryPhotoConnection | Promise<GalleryPhotoConnection>;
    myNotifications(filter?: Nullable<NotificationsFilterInput>, sort?: Nullable<NotificationSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): NotificationConnection | Promise<NotificationConnection>;
    orgOfficials(filter?: Nullable<OrgOfficialFilterInput>): OrgOfficial[] | Promise<OrgOfficial[]>;
    polls(filter?: Nullable<PollsFilterInput>, sort?: Nullable<PollSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): PollConnection | Promise<PollConnection>;
    poll(id: string): Nullable<Poll> | Promise<Nullable<Poll>>;
    pollsSummary(): PollsSummary | Promise<PollsSummary>;
    pollSuggestions(filter?: Nullable<PollSuggestionsFilterInput>, sort?: Nullable<PollSuggestionSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): PollSuggestionConnection | Promise<PollSuggestionConnection>;
    myProfile(): MemberProfile | Promise<MemberProfile>;
    adminMembers(filter?: Nullable<AdminMembersActiveFilterInput>, sort?: Nullable<AdminMembersSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): MemberProfileConnection | Promise<MemberProfileConnection>;
    adminMember(id: string): Nullable<MemberProfile> | Promise<Nullable<MemberProfile>>;
    searchByMembers(search: string, first?: Nullable<number>, after?: Nullable<Cursor>): Nullable<string[]> | Promise<Nullable<string[]>>;
    schedule(id: string): Nullable<Schedule> | Promise<Nullable<Schedule>>;
    schedules(filter?: Nullable<SchedulesFilterInput>, sort?: Nullable<ScheduleSortInput>, includePast?: Nullable<boolean>, first?: Nullable<number>, after?: Nullable<Cursor>): ScheduleConnection | Promise<ScheduleConnection>;
    pendingRecapSchedules(): Schedule[] | Promise<Schedule[]>;
    searchBySchedules(search: string, first?: Nullable<number>, after?: Nullable<Cursor>): Nullable<string[]> | Promise<Nullable<string[]>>;
    serviceCatalogConfigs(): ServiceCatalogConfig[] | Promise<ServiceCatalogConfig[]>;
    adminServiceCatalogConfigs(): ServiceCatalogConfig[] | Promise<ServiceCatalogConfig[]>;
    validateSession(): ValidateSessionResult | Promise<ValidateSessionResult>;
    adminWaitlistEntries(filter?: Nullable<WaitlistFilterInput>, sort?: Nullable<WaitlistEntrySortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): WaitlistEntryConnection | Promise<WaitlistEntryConnection>;
    adminWaitlistStats(): WaitlistStats | Promise<WaitlistStats>;
}

export interface IMutation {
    submitAccountDeletionRequest(input: SubmitAccountDeletionRequestInput): AccountDeletionRequest | Promise<AccountDeletionRequest>;
    reviewAccountDeletionRequest(input: ReviewAccountDeletionRequestInput): AccountDeletionRequest | Promise<AccountDeletionRequest>;
    createAdminAccount(input: CreateAdminAccountInput): AdminAccount | Promise<AdminAccount>;
    updateAdminAccount(id: string, input: UpdateAdminAccountInput): AdminAccount | Promise<AdminAccount>;
    deactivateAdminAccount(id: string): AdminAccount | Promise<AdminAccount>;
    reactivateAdminAccount(id: string): AdminAccount | Promise<AdminAccount>;
    createAnnouncement(input: CreateAnnouncementInput): Announcement | Promise<Announcement>;
    updateAnnouncement(id: string, input: UpdateAnnouncementInput): Announcement | Promise<Announcement>;
    deleteAnnouncement(id: string): boolean | Promise<boolean>;
    publishAnnouncement(id: string, isPublished: boolean): Announcement | Promise<Announcement>;
    pinAnnouncement(id: string, isPinned: boolean): Announcement | Promise<Announcement>;
    registerMember(input: RegisterMemberInput): AuthPayload | Promise<AuthPayload>;
    login(input: LoginInput): AuthPayload | Promise<AuthPayload>;
    logout(): boolean | Promise<boolean>;
    createOrganization(input: CreateOrganizationInput): Organization | Promise<Organization>;
    updateOrganization(id: string, input: UpdateOrganizationInput): Organization | Promise<Organization>;
    deactivateOrganization(id: string): Organization | Promise<Organization>;
    reactivateOrganization(id: string): Organization | Promise<Organization>;
    _noop(): Nullable<boolean> | Promise<Nullable<boolean>>;
    createDocumentRequest(input: CreateDocumentRequestInput): DocumentRequest | Promise<DocumentRequest>;
    cancelDocumentRequest(id: string, note?: Nullable<string>): DocumentRequest | Promise<DocumentRequest>;
    updateDocumentRequestStatus(input: UpdateDocumentRequestStatusInput): DocumentRequest | Promise<DocumentRequest>;
    createEmergencyContact(input: CreateEmergencyContactInput): EmergencyContact | Promise<EmergencyContact>;
    updateEmergencyContact(id: string, input: UpdateEmergencyContactInput): EmergencyContact | Promise<EmergencyContact>;
    deleteEmergencyContact(id: string): boolean | Promise<boolean>;
    createEventPost(input: CreateEventPostInput): EventPost | Promise<EventPost>;
    updateEventPost(id: string, input: UpdateEventPostInput): EventPost | Promise<EventPost>;
    deleteEventPost(id: string): boolean | Promise<boolean>;
    createGalleryPhoto(input: CreateGalleryPhotoInput): GalleryPhoto | Promise<GalleryPhoto>;
    updateGalleryPhoto(id: string, input: UpdateGalleryPhotoInput): GalleryPhoto | Promise<GalleryPhoto>;
    deleteGalleryPhoto(id: string): boolean | Promise<boolean>;
    reorderGalleryPhotos(ids: string[]): GalleryPhoto[] | Promise<GalleryPhoto[]>;
    markNotificationAsRead(id: string): Notification | Promise<Notification>;
    markAllNotificationsAsRead(): MarkAllNotificationsAsReadResult | Promise<MarkAllNotificationsAsReadResult>;
    createOrgOfficial(input: CreateOrgOfficialInput): OrgOfficial | Promise<OrgOfficial>;
    updateOrgOfficial(id: string, input: UpdateOrgOfficialInput): OrgOfficial | Promise<OrgOfficial>;
    deleteOrgOfficial(id: string): boolean | Promise<boolean>;
    createPoll(input: CreatePollInput): Poll | Promise<Poll>;
    updatePoll(id: string, input: UpdatePollInput): Poll | Promise<Poll>;
    deletePoll(id: string): boolean | Promise<boolean>;
    castVote(pollId: string, optionId: string): Poll | Promise<Poll>;
    suggestPoll(input: SuggestPollInput): PollSuggestion | Promise<PollSuggestion>;
    approvePollSuggestion(id: string): PollSuggestion | Promise<PollSuggestion>;
    rejectPollSuggestion(id: string): PollSuggestion | Promise<PollSuggestion>;
    sendTestPushNotification(input: SendTestPushNotificationInput): SendTestPushNotificationResult | Promise<SendTestPushNotificationResult>;
    registerPushToken(input: RegisterPushTokenInput): boolean | Promise<boolean>;
    unregisterPushToken(input: UnregisterPushTokenInput): boolean | Promise<boolean>;
    updateMyProfile(input: UpdateMemberProfileInput): MemberProfile | Promise<MemberProfile>;
    approveMember(userId: string): User | Promise<User>;
    rejectMember(userId: string, rejectionReason: RegistrationRejectionReason, rejectionNote?: Nullable<string>): User | Promise<User>;
    retriggerApprovalNotification(userId: string): boolean | Promise<boolean>;
    createSchedule(input: CreateScheduleInput): Schedule | Promise<Schedule>;
    updateSchedule(id: string, input: UpdateScheduleInput): Schedule | Promise<Schedule>;
    deleteSchedule(id: string): boolean | Promise<boolean>;
    respondToSchedule(scheduleId: string, responseType: ScheduleResponseType): Schedule | Promise<Schedule>;
    removeScheduleResponse(scheduleId: string): Schedule | Promise<Schedule>;
    updateServiceCatalogConfig(input: UpdateServiceCatalogConfigInput): ServiceCatalogConfig | Promise<ServiceCatalogConfig>;
    joinWaitlist(input: JoinWaitlistInput): WaitlistEntry | Promise<WaitlistEntry>;
    deleteWaitlistEntry(id: string): boolean | Promise<boolean>;
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

export interface Announcement extends Node {
    id: string;
    cursor: Cursor;
    title: string;
    content: string;
    category: AnnouncementCategory;
    coverImageUrl?: Nullable<string>;
    isPinned?: Nullable<boolean>;
    isPublished?: Nullable<boolean>;
    publishedAt?: Nullable<DateTime>;
    createdBy: string;
    updatedBy?: Nullable<string>;
    deletedAt?: Nullable<DateTime>;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface AnnouncementEdge extends Edge {
    cursor: Cursor;
    node: Announcement;
}

export interface AnnouncementConnection extends Connection {
    totalCount: number;
    edges: AnnouncementEdge[];
    pageInfo: CursorPageInfo;
}

export interface RegistrationReview {
    reviewedBy?: Nullable<string>;
    reviewedByUser?: Nullable<User>;
    reviewedAt?: Nullable<DateTime>;
    rejectionReason?: Nullable<RegistrationRejectionReason>;
    rejectionNote?: Nullable<string>;
}

export interface User extends Node {
    id: string;
    email: string;
    role: UserRole;
    organizationId?: Nullable<string>;
    isActive: boolean;
    registrationStatus: RegistrationStatus;
    registrationReview?: Nullable<RegistrationReview>;
    position: string;
    createdAt: DateTime;
    updatedAt: DateTime;
    memberProfile?: Nullable<MemberProfile>;
}

export interface AuthPayload {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: User;
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

export interface MonthlyRequestStat {
    month: string;
    label: string;
    pending: number;
    approved: number;
    readyForPickup: number;
    rejected: number;
    total: number;
}

export interface KpiTrend {
    delta: number;
    deltaPercent: number;
    direction: string;
}

export interface RecentRequest {
    id: string;
    referenceNumber: string;
    requestType: DocumentRequestType;
    currentStatus: DocumentRequestStatus;
    fullName: string;
    createdAt: DateTime;
}

export interface AdminDashboardSummary {
    totalMembers: number;
    totalActiveRequests: number;
    pendingRequestsCount: number;
    approvedRequestsCount: number;
    readyForPickupCount: number;
    rejectedRequestsCount: number;
    activePollsCount: number;
    totalVotesCast: number;
    latestAnnouncements: Announcement[];
    upcomingSchedules: Schedule[];
    membersTrend: KpiTrend;
    activeRequestsTrend: KpiTrend;
    votesCastTrend: KpiTrend;
    requestsPerMonth: MonthlyRequestStat[];
    recentRequests: RecentRequest[];
}

export interface SuperAdminDashboardSummary {
    totalOrganizations: number;
    activeOrganizations: number;
    inactiveOrganizations: number;
    totalAdminAccounts: number;
    activeAdminAccounts: number;
    inactiveAdminAccounts: number;
    pendingDeletionRequests: number;
    waitlistTotal: number;
    waitlistByRole: WaitlistRoleCount[];
    latestOrganizations: Organization[];
    totalMembers: number;
    totalActiveRequests: number;
    pendingRequestsCount: number;
    approvedRequestsCount: number;
    readyForPickupCount: number;
    rejectedRequestsCount: number;
    activePollsCount: number;
    totalVotesCast: number;
    membersTrend: KpiTrend;
    activeRequestsTrend: KpiTrend;
    votesCastTrend: KpiTrend;
    requestsPerMonth: MonthlyRequestStat[];
    recentRequests: RecentRequest[];
}

export interface RequestStatusLog extends Node {
    id: string;
    requestId: string;
    previousStatus?: Nullable<DocumentRequestStatus>;
    newStatus: DocumentRequestStatus;
    note?: Nullable<string>;
    changedBy: string;
    changedAt: DateTime;
}

export interface DocumentRequest extends Node {
    id: string;
    memberId: string;
    member?: Nullable<MemberProfile>;
    requestType: DocumentRequestType;
    referenceNumber: string;
    purpose: string;
    notes?: Nullable<string>;
    preferredPickupDate?: Nullable<DateTime>;
    fullName: string;
    contactNumber: string;
    address: string;
    currentStatus: DocumentRequestStatus;
    adminRemark?: Nullable<string>;
    rejectedReason?: Nullable<string>;
    pickupInstructions?: Nullable<string>;
    reviewedBy?: Nullable<string>;
    reviewedAt?: Nullable<DateTime>;
    createdAt: DateTime;
    updatedAt: DateTime;
    statusLogs: RequestStatusLog[];
}

export interface DocumentRequestEdge extends Edge {
    cursor: Cursor;
    node: DocumentRequest;
}

export interface DocumentRequestConnection extends Connection {
    totalCount: number;
    edges: DocumentRequestEdge[];
    pageInfo: CursorPageInfo;
}

export interface EmergencyContact extends Node {
    id: string;
    name: string;
    type: EmergencyContactType;
    primaryNumber: string;
    alternateNumber?: Nullable<string>;
    description?: Nullable<string>;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface EmergencyContactEdge extends Edge {
    cursor: Cursor;
    node: EmergencyContact;
}

export interface EmergencyContactConnection extends Connection {
    totalCount: number;
    edges: EmergencyContactEdge[];
    pageInfo: CursorPageInfo;
}

export interface EventPost extends Node {
    id: string;
    scheduleId: string;
    scheduleName: string;
    title: string;
    content: string;
    imageUrl?: Nullable<string>;
    createdById: string;
    createdByName: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface EventPostEdge extends Edge {
    cursor: Cursor;
    node: EventPost;
}

export interface EventPostConnection extends Connection {
    totalCount: number;
    edges: EventPostEdge[];
    pageInfo: CursorPageInfo;
}

export interface GalleryFeedItem extends Node {
    id: string;
    sourceId: string;
    sourceType: GallerySourceType;
    imageUrl: string;
    title?: Nullable<string>;
    caption?: Nullable<string>;
    createdAt: DateTime;
}

export interface GalleryFeedItemEdge extends Edge {
    cursor: Cursor;
    node: GalleryFeedItem;
}

export interface GalleryFeedConnection extends Connection {
    totalCount: number;
    edges: GalleryFeedItemEdge[];
    pageInfo: CursorPageInfo;
}

export interface GalleryPhoto extends Node {
    id: string;
    organizationId: string;
    imageUrl: string;
    title?: Nullable<string>;
    caption?: Nullable<string>;
    order: number;
    uploadedById: string;
    uploadedByName: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface GalleryPhotoEdge extends Edge {
    cursor: Cursor;
    node: GalleryPhoto;
}

export interface GalleryPhotoConnection extends Connection {
    totalCount: number;
    edges: GalleryPhotoEdge[];
    pageInfo: CursorPageInfo;
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

export interface OrgOfficial extends Node {
    id: string;
    organizationId: string;
    name: string;
    position: string;
    photoUrl?: Nullable<string>;
    contactNumber?: Nullable<string>;
    termStart: number;
    termEnd?: Nullable<number>;
    order: number;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface PollOption {
    id: string;
    label: string;
    order: number;
    votes: number;
}

export interface Poll extends Node {
    id: string;
    title: string;
    description: string;
    status: PollStatus;
    closingDate: DateTime;
    options: PollOption[];
    totalVotes: number;
    myVotedOptionId?: Nullable<string>;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface PollEdge extends Edge {
    cursor: Cursor;
    node: Poll;
}

export interface PollConnection extends Connection {
    totalCount: number;
    edges: PollEdge[];
    pageInfo: CursorPageInfo;
}

export interface PollSuggestion extends Node {
    id: string;
    memberId: string;
    title: string;
    description?: Nullable<string>;
    status: SuggestionStatus;
    createdAt: DateTime;
}

export interface PollSuggestionEdge extends Edge {
    cursor: Cursor;
    node: PollSuggestion;
}

export interface PollSuggestionConnection extends Connection {
    totalCount: number;
    edges: PollSuggestionEdge[];
    pageInfo: CursorPageInfo;
}

export interface PollsSummary {
    totalPolls: number;
    activePolls: number;
    closedPolls: number;
    totalVotes: number;
    pendingSuggestions: number;
}

export interface SendTestPushNotificationResult {
    tokenCount: number;
}

export interface MemberProfile extends Node {
    id: string;
    userId: string;
    user?: Nullable<User>;
    firstName: string;
    lastName: string;
    middleName?: Nullable<string>;
    fullName: string;
    birthdate?: Nullable<DateTime>;
    gender?: Nullable<Gender>;
    address?: Nullable<string>;
    purok?: Nullable<string>;
    contactNumber?: Nullable<string>;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface MemberProfileEdge extends Edge {
    cursor: Cursor;
    node: MemberProfile;
}

export interface MemberProfileConnection extends Connection {
    totalCount: number;
    edges: MemberProfileEdge[];
    pageInfo: CursorPageInfo;
}

export interface ScheduleResponseRecord {
    memberId: string;
    responseType: ScheduleResponseType;
    respondedAt: DateTime;
    member: ScheduleResponseMember;
}

export interface ScheduleResponseMember {
    id: string;
    fullName: string;
    avatarUrl?: Nullable<string>;
}

export interface ScheduleResponseByType {
    going: string[];
    interested: string[];
    volunteering: string[];
    bringingOthers: string[];
    supported: string[];
}

export interface Schedule extends Node {
    id: string;
    title: string;
    description: string;
    category: ScheduleCategory;
    status: ScheduleStatus;
    date: DateTime;
    startTime?: Nullable<DateTime>;
    endTime?: Nullable<DateTime>;
    location?: Nullable<string>;
    coverImageUrl?: Nullable<string>;
    responses: ScheduleResponseRecord[];
    responsesByType: ScheduleResponseByType;
    myResponse?: Nullable<ScheduleResponseType>;
    createdBy: string;
    updatedBy?: Nullable<string>;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface ScheduleEdge extends Edge {
    cursor: Cursor;
    node: Schedule;
}

export interface ScheduleConnection extends Connection {
    totalCount: number;
    edges: ScheduleEdge[];
    pageInfo: CursorPageInfo;
}

export interface ServiceCatalogConfig extends Node {
    id: string;
    requestType: DocumentRequestType;
    isEnabled: boolean;
    fee: string;
    processingTime: string;
    requirements: string[];
    updatedAt: DateTime;
}

export interface ValidateSessionResult {
    ok: boolean;
    status: number;
}

export interface WaitlistEntry extends Node {
    id: string;
    email: string;
    role: WaitlistRole;
    firstName?: Nullable<string>;
    lastName?: Nullable<string>;
    organizationName?: Nullable<string>;
    city?: Nullable<string>;
    mobile?: Nullable<string>;
    message?: Nullable<string>;
    createdAt: DateTime;
}

export interface WaitlistEntryEdge extends Edge {
    cursor: Cursor;
    node: WaitlistEntry;
}

export interface WaitlistEntryConnection extends Connection {
    totalCount: number;
    edges: WaitlistEntryEdge[];
    pageInfo: CursorPageInfo;
}

export interface WaitlistStats {
    total: number;
    byRole: WaitlistRoleCount[];
}

export interface WaitlistRoleCount {
    role: WaitlistRole;
    count: number;
}

export type DateTime = any;
export type Cursor = any;
type Nullable<T> = T | null;
