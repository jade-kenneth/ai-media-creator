
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

export enum SceneClipMode {
    FIRST_FRAME = "FIRST_FRAME",
    FIRST_LAST_FRAME = "FIRST_LAST_FRAME",
    REFERENCES = "REFERENCES",
    CONSISTENT = "CONSISTENT",
    DESCRIBE = "DESCRIBE"
}

export enum AssetKind {
    PHOTO = "PHOTO",
    CLIP = "CLIP",
    AUDIO = "AUDIO"
}

export enum AssetPurpose {
    MEDIA = "MEDIA",
    RECORDING = "RECORDING",
    MUSIC = "MUSIC"
}

export enum AssetOrigin {
    UPLOAD = "UPLOAD",
    AI_CLIP = "AI_CLIP"
}

export enum AssetStatus {
    UPLOADING = "UPLOADING",
    READY = "READY"
}

export enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN"
}

export enum ResetCodeStatus {
    VALID = "VALID",
    INVALID = "INVALID",
    EXPIRED = "EXPIRED"
}

export enum SortDirection {
    ASC = "ASC",
    DESC = "DESC"
}

export enum CreditEntryKind {
    GRANT = "GRANT",
    HOLD = "HOLD",
    CAPTURE = "CAPTURE",
    RELEASE = "RELEASE"
}

export enum ExportPreset {
    TIKTOK_9_16 = "TIKTOK_9_16"
}

export enum FactSource {
    LISTING = "LISTING",
    CREATOR = "CREATOR",
    EDITED = "EDITED",
    NOT_STATED = "NOT_STATED"
}

export enum FactStatus {
    UNREVIEWED = "UNREVIEWED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    UNKNOWN = "UNKNOWN"
}

export enum ClaimFlagCategory {
    PERFORMANCE = "PERFORMANCE",
    HEALTH = "HEALTH",
    GUARANTEE = "GUARANTEE",
    SUPERLATIVE = "SUPERLATIVE",
    PRICE_STOCK = "PRICE_STOCK",
    TESTIMONIAL = "TESTIMONIAL",
    NOT_APPROVED_FACT = "NOT_APPROVED_FACT"
}

export enum GenerationJobType {
    SUGGEST_ANGLES = "SUGGEST_ANGLES",
    SUGGEST_AUDIENCES = "SUGGEST_AUDIENCES",
    SUGGEST_PREMISES = "SUGGEST_PREMISES",
    WRITE_SCRIPT = "WRITE_SCRIPT",
    REWRITE_HOOK = "REWRITE_HOOK",
    REWRITE_SCENE = "REWRITE_SCENE",
    GENERATE_VOICEOVER = "GENERATE_VOICEOVER",
    ALIGN_RECORDING = "ALIGN_RECORDING",
    RENDER_VIDEO = "RENDER_VIDEO",
    GENERATE_SCENE_CLIPS = "GENERATE_SCENE_CLIPS"
}

export enum GenerationJobStatus {
    QUEUED = "QUEUED",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}

export enum GenerationFailureCode {
    PROVIDER_TIMEOUT = "PROVIDER_TIMEOUT",
    PROVIDER_REJECTED = "PROVIDER_REJECTED",
    PROVIDER_NOT_CONFIGURED = "PROVIDER_NOT_CONFIGURED",
    INVALID_OUTPUT = "INVALID_OUTPUT",
    RECORDING_MISMATCH = "RECORDING_MISMATCH",
    UNREADABLE_MEDIA = "UNREADABLE_MEDIA",
    MEDIA_MISSING = "MEDIA_MISSING",
    RENDER_TIMEOUT = "RENDER_TIMEOUT",
    WORKER_UNAVAILABLE = "WORKER_UNAVAILABLE",
    INTERNAL = "INTERNAL"
}

export enum ProjectStatus {
    DRAFT = "DRAFT",
    FACTS_REVIEW = "FACTS_REVIEW",
    SCRIPT_REVIEW = "SCRIPT_REVIEW",
    MEDIA_REVIEW = "MEDIA_REVIEW",
    GENERATING = "GENERATING",
    READY = "READY",
    EXPORTED = "EXPORTED"
}

export enum ProjectStage {
    DRAFT = "DRAFT",
    REVIEWING_FACTS = "REVIEWING_FACTS",
    WRITING_SCRIPT = "WRITING_SCRIPT",
    SCRIPT_APPROVED = "SCRIPT_APPROVED",
    CHOOSING_MEDIA = "CHOOSING_MEDIA",
    GENERATING = "GENERATING",
    READY_TO_EXPORT = "READY_TO_EXPORT",
    EXPORTED = "EXPORTED"
}

export enum ProjectStepKey {
    STORY = "STORY",
    PRODUCT = "PRODUCT",
    FACTS = "FACTS",
    STRATEGY = "STRATEGY",
    SCRIPT = "SCRIPT",
    MEDIA = "MEDIA",
    VOICE = "VOICE",
    EDIT = "EDIT",
    BRIEF = "BRIEF",
    EXPORT = "EXPORT"
}

export enum StudioType {
    AFFILIATE = "AFFILIATE",
    ENTERTAINMENT = "ENTERTAINMENT"
}

export enum StoryGenre {
    DRAMA = "DRAMA",
    ACTION = "ACTION",
    COMEDY = "COMEDY",
    ROMANCE = "ROMANCE",
    HORROR = "HORROR",
    MYSTERY = "MYSTERY",
    FANTASY = "FANTASY",
    SLICE_OF_LIFE = "SLICE_OF_LIFE"
}

export enum Storytelling {
    ACTED = "ACTED",
    NARRATED = "NARRATED"
}

export enum PremiseKind {
    SUGGESTED = "SUGGESTED",
    OWN = "OWN"
}

export enum ProjectStepStatus {
    DONE = "DONE",
    OPEN = "OPEN",
    LOCKED = "LOCKED"
}

export enum ProjectListFilter {
    ALL = "ALL",
    IN_PROGRESS = "IN_PROGRESS",
    READY = "READY",
    EXPORTED = "EXPORTED"
}

export enum ProjectSortField {
    LAST_EDITED = "LAST_EDITED",
    NAME = "NAME"
}

export enum FieldSource {
    IMPORTED = "IMPORTED",
    CREATOR = "CREATOR",
    EDITED = "EDITED"
}

export enum ProductField {
    TITLE = "TITLE",
    CATEGORY = "CATEGORY",
    PRICE = "PRICE",
    DESCRIPTION = "DESCRIPTION",
    FEATURES = "FEATURES",
    AFFILIATE_URL = "AFFILIATE_URL"
}

export enum ImportOutcome {
    FILLED = "FILLED",
    PARTIAL = "PARTIAL",
    FAILED = "FAILED",
    NOT_ALLOWED = "NOT_ALLOWED"
}

export enum Platform {
    TIKTOK_SHOP = "TIKTOK_SHOP",
    SHOPEE_VIDEO = "SHOPEE_VIDEO",
    OTHER = "OTHER"
}

export enum ScriptLanguage {
    ENGLISH = "ENGLISH",
    FILIPINO = "FILIPINO",
    TAGLISH = "TAGLISH"
}

export enum Tone {
    FRIENDLY = "FRIENDLY",
    ENERGETIC = "ENERGETIC",
    CALM = "CALM",
    STRAIGHT_TALKING = "STRAIGHT_TALKING"
}

export enum ContentStyle {
    VOICEOVER_PRODUCT_SHOTS = "VOICEOVER_PRODUCT_SHOTS",
    TALKING_TO_CAMERA = "TALKING_TO_CAMERA",
    TEXT_ONLY = "TEXT_ONLY",
    HANDS_ON_DEMO = "HANDS_ON_DEMO",
    SKIT = "SKIT",
    NARRATION = "NARRATION"
}

export enum AngleType {
    USE_CASE = "USE_CASE",
    FEATURE_DEMO = "FEATURE_DEMO",
    PROBLEM_SOLUTION = "PROBLEM_SOLUTION",
    ROUTINE = "ROUTINE",
    GIFT_IDEA = "GIFT_IDEA"
}

export enum AngleKind {
    SUGGESTED = "SUGGESTED",
    OWN = "OWN"
}

export enum FailureNoticeKind {
    SCRIPT_WRITING = "SCRIPT_WRITING",
    ANGLE_SUGGESTIONS = "ANGLE_SUGGESTIONS",
    AUDIENCE_SUGGESTIONS = "AUDIENCE_SUGGESTIONS",
    PREMISE_SUGGESTIONS = "PREMISE_SUGGESTIONS"
}

export enum ScriptVersionStatus {
    DRAFT = "DRAFT",
    APPROVED = "APPROVED",
    NEEDS_REVIEW = "NEEDS_REVIEW"
}

export enum ScriptOriginKind {
    WRITTEN = "WRITTEN",
    RESTORED = "RESTORED",
    EDITED = "EDITED",
    COPIED = "COPIED"
}

export enum HookType {
    PROBLEM_FIRST = "PROBLEM_FIRST",
    QUESTION = "QUESTION",
    SHOW_DONT_TELL = "SHOW_DONT_TELL",
    RELATABLE_MOMENT = "RELATABLE_MOMENT",
    DIRECT_PITCH = "DIRECT_PITCH",
    COLD_OPEN = "COLD_OPEN",
    FLASH_FORWARD = "FLASH_FORWARD",
    MYSTERY = "MYSTERY"
}

export enum ScenePurpose {
    HOOK = "HOOK",
    PROBLEM = "PROBLEM",
    DEMO = "DEMO",
    FEATURE = "FEATURE",
    PROOF = "PROOF",
    CALL_TO_ACTION = "CALL_TO_ACTION",
    SETUP = "SETUP",
    BUILD = "BUILD",
    TURN = "TURN",
    PAYOFF = "PAYOFF"
}

export enum SceneTransition {
    CUT = "CUT",
    PUNCH_IN = "PUNCH_IN",
    WHIP = "WHIP",
    DISSOLVE = "DISSOLVE"
}

export enum ShotSubject {
    CREATOR = "CREATOR",
    HANDS = "HANDS",
    PRODUCT_ONLY = "PRODUCT_ONLY"
}

export enum ShotFraming {
    CLOSE_UP = "CLOSE_UP",
    MEDIUM = "MEDIUM",
    WIDE = "WIDE",
    OVERHEAD = "OVERHEAD",
    POV = "POV"
}

export enum ScriptCopyReason {
    RESTORE = "RESTORE",
    EDIT = "EDIT"
}

export enum SceneMediaKind {
    ASSET = "ASSET",
    TEXT_CARD = "TEXT_CARD"
}

export enum PhotoMotion {
    STILL = "STILL",
    SLOW_ZOOM = "SLOW_ZOOM"
}

export enum VideoEditBlocker {
    MEDIA_INCOMPLETE = "MEDIA_INCOMPLETE",
    VOICE_NOT_SETTLED = "VOICE_NOT_SETTLED",
    VOICE_OUTDATED = "VOICE_OUTDATED",
    FLAGGED_LINES = "FLAGGED_LINES"
}

export enum CaptionStyle {
    CLEAN = "CLEAN",
    BOXED = "BOXED",
    WORD_HIGHLIGHT = "WORD_HIGHLIGHT"
}

export enum ConsistentItemKind {
    PRODUCT = "PRODUCT",
    PROP = "PROP",
    CHARACTER = "CHARACTER"
}

export enum VoiceSource {
    AI = "AI",
    RECORDING = "RECORDING",
    NONE = "NONE",
    SCENE = "SCENE"
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

export interface GenerateSceneClipsInput {
    projectId: string;
    sceneId: string;
    mode?: Nullable<SceneClipMode>;
    clipCount?: Nullable<number>;
    sourceAssetId?: Nullable<string>;
    endAssetId?: Nullable<string>;
    referenceAssetIds?: Nullable<string[]>;
    prompt: string;
    idempotencyKey: string;
}

export interface CreateAssetUploadInput {
    projectId: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    durationSeconds?: Nullable<number>;
    rightsConfirmed: boolean;
    purpose?: Nullable<AssetPurpose>;
    replacesAssetId?: Nullable<string>;
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

export interface ResetPasswordInput {
    email: string;
    code: string;
    newPassword: string;
}

export interface GoogleAuthInput {
    idToken: string;
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

export interface RenderVideoInput {
    projectId: string;
    idempotencyKey: string;
}

export interface AddProductFactInput {
    projectId: string;
    text: string;
    sourceNote?: Nullable<string>;
    approve?: Nullable<boolean>;
}

export interface UpdateProductFactTextInput {
    id: string;
    text: string;
}

export interface SetProductFactStatusInput {
    id: string;
    status: FactStatus;
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

export interface ProjectFilterInput {
    stage?: Nullable<ProjectListFilter>;
}

export interface ProjectSortInput {
    field: ProjectSortField;
}

export interface RenameProjectInput {
    id: string;
    title: string;
}

export interface ProductFeatureInput {
    id?: Nullable<string>;
    text: string;
}

export interface UpdateProductInput {
    projectId: string;
    title?: Nullable<string>;
    category?: Nullable<string>;
    pricePhp?: Nullable<number>;
    description?: Nullable<string>;
    affiliateUrl?: Nullable<string>;
    features?: Nullable<ProductFeatureInput[]>;
}

export interface ImportProductInput {
    projectId: string;
    url: string;
}

export interface SelectedAngleInput {
    kind: AngleKind;
    suggestionId?: Nullable<string>;
    text?: Nullable<string>;
}

export interface UpdateStrategyInput {
    projectId: string;
    buyer?: Nullable<string>;
    problem?: Nullable<string>;
    benefit?: Nullable<string>;
    platform?: Nullable<Platform>;
    language?: Nullable<ScriptLanguage>;
    lengthSeconds?: Nullable<number>;
    tone?: Nullable<Tone>;
    contentStyle?: Nullable<ContentStyle>;
    selectedAngle?: Nullable<SelectedAngleInput>;
}

export interface SuggestAnglesInput {
    projectId: string;
    idempotencyKey: string;
}

export interface SuggestAudiencesInput {
    projectId: string;
    idempotencyKey: string;
}

export interface CreateProjectInput {
    studio?: Nullable<StudioType>;
}

export interface StoryCharacterInput {
    id?: Nullable<string>;
    name: string;
    role?: Nullable<string>;
    look?: Nullable<string>;
}

export interface StoryPremiseInput {
    kind: PremiseKind;
    suggestionId?: Nullable<string>;
    text?: Nullable<string>;
}

export interface UpdateStoryInput {
    projectId: string;
    genre?: Nullable<StoryGenre>;
    detail?: Nullable<string>;
    premise?: Nullable<StoryPremiseInput>;
    cast?: Nullable<StoryCharacterInput[]>;
    storytelling?: Nullable<Storytelling>;
    language?: Nullable<ScriptLanguage>;
    lengthSeconds?: Nullable<number>;
    isFinal?: Nullable<boolean>;
}

export interface SuggestPremisesInput {
    projectId: string;
    idempotencyKey: string;
}

export interface ScriptHookInput {
    id: string;
    text?: Nullable<string>;
    openingShot?: Nullable<string>;
}

export interface SceneDirectionInput {
    inFrame?: Nullable<ShotSubject>;
    framing?: Nullable<ShotFraming>;
    setting?: Nullable<string>;
    props?: Nullable<string>;
}

export interface SceneLineInput {
    speaker: string;
    text: string;
    shot?: Nullable<string>;
    reaction?: Nullable<string>;
    pauseSeconds?: Nullable<number>;
    delivery?: Nullable<string>;
}

export interface ScriptSceneInput {
    id: string;
    durationSeconds?: Nullable<number>;
    narration?: Nullable<string>;
    lines?: Nullable<SceneLineInput[]>;
    sound?: Nullable<string>;
    onScreenText?: Nullable<string>;
    visual?: Nullable<string>;
    direction?: Nullable<SceneDirectionInput>;
    transitionIn?: Nullable<SceneTransition>;
    cta?: Nullable<string>;
}

export interface ShootPlanInput {
    scenario?: Nullable<string>;
    presenter?: Nullable<string>;
}

export interface UpdateScriptVersionInput {
    id: string;
    selectedHookId?: Nullable<string>;
    hooks?: Nullable<ScriptHookInput[]>;
    scenes?: Nullable<ScriptSceneInput[]>;
    shoot?: Nullable<ShootPlanInput>;
    caption?: Nullable<string>;
}

export interface WriteScriptInput {
    projectId: string;
    idempotencyKey: string;
}

export interface RewriteHookInput {
    versionId: string;
    hookId: string;
    idempotencyKey: string;
}

export interface RewriteSceneInput {
    versionId: string;
    sceneId: string;
    idempotencyKey: string;
}

export interface CopyScriptVersionInput {
    id: string;
    reason: ScriptCopyReason;
}

export interface SceneMediaChoiceInput {
    kind: SceneMediaKind;
    assetId?: Nullable<string>;
    motion?: Nullable<PhotoMotion>;
    clipStartSeconds?: Nullable<number>;
}

export interface SceneMediaInput {
    sceneId: string;
    media?: Nullable<SceneMediaChoiceInput>;
}

export interface PronunciationRuleInput {
    word: string;
    sayAs: string;
}

export interface VoiceSettingsInput {
    source?: Nullable<VoiceSource>;
    voiceId?: Nullable<string>;
    speed?: Nullable<number>;
    pronunciations?: Nullable<PronunciationRuleInput[]>;
}

export interface SceneTextInput {
    sceneId: string;
    onScreenText: string;
}

export interface SceneTransitionInput {
    sceneId: string;
    transitionIn: SceneTransition;
}

export interface SceneDurationInput {
    sceneId: string;
    durationSeconds: number;
}

export interface ClipSoundInput {
    sceneId: string;
    on: boolean;
    levelPercent: number;
}

export interface CaptionLineInput {
    id: string;
    text: string;
}

export interface CaptionsInput {
    enabled?: Nullable<boolean>;
    style?: Nullable<CaptionStyle>;
    lines?: Nullable<CaptionLineInput[]>;
}

export interface ConsistentItemInput {
    id?: Nullable<string>;
    name: string;
    sceneIds: string[];
    assetId?: Nullable<string>;
    likenessConfirmed?: Nullable<boolean>;
}

export interface UpdateVideoEditInput {
    projectId: string;
    sceneMedia?: Nullable<SceneMediaInput[]>;
    voice?: Nullable<VoiceSettingsInput>;
    sceneOrder?: Nullable<string[]>;
    sceneText?: Nullable<SceneTextInput[]>;
    sceneTransitions?: Nullable<SceneTransitionInput[]>;
    sceneDurations?: Nullable<SceneDurationInput[]>;
    clipSounds?: Nullable<ClipSoundInput[]>;
    captions?: Nullable<CaptionsInput>;
    musicLevelPercent?: Nullable<number>;
    endCardEnabled?: Nullable<boolean>;
    postCaption?: Nullable<string>;
    adTag?: Nullable<boolean>;
    consistentItems?: Nullable<ConsistentItemInput[]>;
    endLine?: Nullable<string>;
}

export interface VoiceJobInput {
    projectId: string;
    idempotencyKey: string;
}

export interface SwitchVideoEditVersionInput {
    projectId: string;
    scriptVersionId: string;
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
    __typename?: 'AccountDeletionRequest';
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
    __typename?: 'AccountDeletionRequestEdge';
    cursor: Cursor;
    node: AccountDeletionRequest;
}

export interface AccountDeletionRequestConnection extends Connection {
    __typename?: 'AccountDeletionRequestConnection';
    totalCount: number;
    edges: AccountDeletionRequestEdge[];
    pageInfo: CursorPageInfo;
}

export interface IQuery {
    __typename?: 'IQuery';
    adminAccountDeletionRequests(filter?: Nullable<AccountDeletionRequestFilterInput>, sort?: Nullable<AccountDeletionRequestSortInput>, first?: Nullable<number>, after?: Nullable<Cursor>): AccountDeletionRequestConnection | Promise<AccountDeletionRequestConnection>;
    adminAccountDeletionRequest(id: string): Nullable<AccountDeletionRequest> | Promise<Nullable<AccountDeletionRequest>>;
    adminAccounts(): AdminAccount[] | Promise<AdminAccount[]>;
    clipPromptFlags(projectId: string, prompt: string): ClaimFlag[] | Promise<ClaimFlag[]>;
    projectAssets(projectId: string): ProjectAsset[] | Promise<ProjectAsset[]>;
    me(): User | Promise<User>;
    _health(): Nullable<string> | Promise<Nullable<string>>;
    myCredits(): CreditSummary | Promise<CreditSummary>;
    projectExports(projectId: string): ProjectExports | Promise<ProjectExports>;
    productFacts(projectId: string): ProductFact[] | Promise<ProductFact[]>;
    generationJob(id: string): GenerationJob | Promise<GenerationJob>;
    projectJobs(projectId: string, active?: Nullable<boolean>): GenerationJob[] | Promise<GenerationJob[]>;
    organizations(filter?: Nullable<OrganizationFilterInput>): Organization[] | Promise<Organization[]>;
    organization(id: string): Nullable<Organization> | Promise<Nullable<Organization>>;
    projects(filter?: Nullable<ProjectFilterInput>, sort?: Nullable<ProjectSortInput>, pagination?: Nullable<CursorPaginationInput>): ProjectConnection | Promise<ProjectConnection>;
    projectCounts(): ProjectCounts | Promise<ProjectCounts>;
    project(id: string): Project | Promise<Project>;
    studios(): StudioInfo[] | Promise<StudioInfo[]>;
    scriptVersions(projectId: string): ScriptVersion[] | Promise<ScriptVersion[]>;
    creatorBrief(projectId: string): CreatorBrief | Promise<CreatorBrief>;
    validateSession(): ValidateSessionResult | Promise<ValidateSessionResult>;
    videoEdit(projectId: string): Nullable<VideoEdit> | Promise<Nullable<VideoEdit>>;
    voiceOptions(): VoiceOption[] | Promise<VoiceOption[]>;
}

export interface IMutation {
    __typename?: 'IMutation';
    submitAccountDeletionRequest(input: SubmitAccountDeletionRequestInput): AccountDeletionRequest | Promise<AccountDeletionRequest>;
    reviewAccountDeletionRequest(input: ReviewAccountDeletionRequestInput): AccountDeletionRequest | Promise<AccountDeletionRequest>;
    createAdminAccount(input: CreateAdminAccountInput): AdminAccount | Promise<AdminAccount>;
    updateAdminAccount(id: string, input: UpdateAdminAccountInput): AdminAccount | Promise<AdminAccount>;
    deactivateAdminAccount(id: string): AdminAccount | Promise<AdminAccount>;
    reactivateAdminAccount(id: string): AdminAccount | Promise<AdminAccount>;
    generateSceneClips(input: GenerateSceneClipsInput): GenerationJob | Promise<GenerationJob>;
    checkAiClip(id: string): ProjectAsset | Promise<ProjectAsset>;
    discardAiClips(jobId: string): boolean | Promise<boolean>;
    createAssetUpload(input: CreateAssetUploadInput): AssetUploadTicket | Promise<AssetUploadTicket>;
    completeAssetUpload(id: string): ProjectAsset | Promise<ProjectAsset>;
    removeAsset(id: string): boolean | Promise<boolean>;
    registerUser(input: RegisterUserInput): AuthPayload | Promise<AuthPayload>;
    updateMyProfile(input: UpdateMyProfileInput): User | Promise<User>;
    login(input: LoginInput): AuthPayload | Promise<AuthPayload>;
    loginWithGoogle(input: GoogleAuthInput): AuthPayload | Promise<AuthPayload>;
    linkGoogleAccount(input: GoogleAuthInput): User | Promise<User>;
    unlinkGoogleAccount(): User | Promise<User>;
    logout(): boolean | Promise<boolean>;
    requestPasswordReset(email: string): PasswordResetRequestResult | Promise<PasswordResetRequestResult>;
    verifyResetCode(email: string, code: string): PasswordResetCodeResult | Promise<PasswordResetCodeResult>;
    resetPassword(input: ResetPasswordInput): boolean | Promise<boolean>;
    _noop(): Nullable<boolean> | Promise<Nullable<boolean>>;
    renderVideo(input: RenderVideoInput): GenerationJob | Promise<GenerationJob>;
    createExportDownload(id: string): ExportDownload | Promise<ExportDownload>;
    continueToFacts(projectId: string): Project | Promise<Project>;
    addProductFact(input: AddProductFactInput): ProductFact | Promise<ProductFact>;
    updateProductFactText(input: UpdateProductFactTextInput): ProductFact | Promise<ProductFact>;
    setProductFactStatus(input: SetProductFactStatusInput): ProductFact | Promise<ProductFact>;
    removeProductFact(id: string): boolean | Promise<boolean>;
    retryGenerationJob(id: string): GenerationJob | Promise<GenerationJob>;
    createOrganization(input: CreateOrganizationInput): Organization | Promise<Organization>;
    updateOrganization(id: string, input: UpdateOrganizationInput): Organization | Promise<Organization>;
    deactivateOrganization(id: string): Organization | Promise<Organization>;
    reactivateOrganization(id: string): Organization | Promise<Organization>;
    duplicateProject(id: string): Project | Promise<Project>;
    createProject(input?: Nullable<CreateProjectInput>): Project | Promise<Project>;
    renameProject(input: RenameProjectInput): Project | Promise<Project>;
    updateProduct(input: UpdateProductInput): Project | Promise<Project>;
    importProduct(input: ImportProductInput): ProductImportResult | Promise<ProductImportResult>;
    clearImportedProductValues(projectId: string): Project | Promise<Project>;
    updateStrategy(input: UpdateStrategyInput): Project | Promise<Project>;
    suggestAngles(input: SuggestAnglesInput): GenerationJob | Promise<GenerationJob>;
    suggestAudiences(input: SuggestAudiencesInput): GenerationJob | Promise<GenerationJob>;
    updateStory(input: UpdateStoryInput): Project | Promise<Project>;
    suggestPremises(input: SuggestPremisesInput): GenerationJob | Promise<GenerationJob>;
    writeScript(input: WriteScriptInput): GenerationJob | Promise<GenerationJob>;
    rewriteHook(input: RewriteHookInput): GenerationJob | Promise<GenerationJob>;
    rewriteScene(input: RewriteSceneInput): GenerationJob | Promise<GenerationJob>;
    updateScriptVersion(input: UpdateScriptVersionInput): ScriptVersion | Promise<ScriptVersion>;
    approveScriptVersion(id: string): ScriptVersion | Promise<ScriptVersion>;
    copyScriptVersion(input: CopyScriptVersionInput): ScriptVersion | Promise<ScriptVersion>;
    createNextEpisode(projectId: string): Project | Promise<Project>;
    startVideoEdit(projectId: string): VideoEdit | Promise<VideoEdit>;
    updateVideoEdit(input: UpdateVideoEditInput): VideoEdit | Promise<VideoEdit>;
    autoFillSceneMedia(projectId: string): VideoEdit | Promise<VideoEdit>;
    switchVideoEditVersion(input: SwitchVideoEditVersionInput): VideoEdit | Promise<VideoEdit>;
    generateVoiceover(input: VoiceJobInput): GenerationJob | Promise<GenerationJob>;
    alignRecording(input: VoiceJobInput): GenerationJob | Promise<GenerationJob>;
    resetCaptions(projectId: string): VideoEdit | Promise<VideoEdit>;
}

export interface AdminAccount extends Node {
    __typename?: 'AdminAccount';
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

export interface AiClipInfo {
    __typename?: 'AiClipInfo';
    jobId: string;
    sceneId: string;
    sourceAssetId?: Nullable<string>;
    mode: SceneClipMode;
    endAssetId?: Nullable<string>;
    referenceAssetIds: string[];
    continuitySceneId?: Nullable<string>;
    continuityAssetId?: Nullable<string>;
    label: string;
    prompt: string;
    checkedAt?: Nullable<DateTime>;
}

export interface ProjectAsset extends Node {
    __typename?: 'ProjectAsset';
    id: string;
    projectId: string;
    kind: AssetKind;
    purpose: AssetPurpose;
    origin: AssetOrigin;
    aiClip?: Nullable<AiClipInfo>;
    status: AssetStatus;
    fileName: string;
    sizeBytes: number;
    durationSeconds?: Nullable<number>;
    previewUrl?: Nullable<string>;
    createdAt: DateTime;
}

export interface AssetUploadTicket {
    __typename?: 'AssetUploadTicket';
    asset: ProjectAsset;
    uploadUrl: string;
}

export interface User extends Node {
    __typename?: 'User';
    id: string;
    email: string;
    role: UserRole;
    organizationId?: Nullable<string>;
    isActive: boolean;
    firstName?: Nullable<string>;
    lastName?: Nullable<string>;
    position?: Nullable<string>;
    googleLinked: boolean;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface AuthPayload {
    __typename?: 'AuthPayload';
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: User;
}

export interface PasswordResetRequestResult {
    __typename?: 'PasswordResetRequestResult';
    accepted: boolean;
    message: string;
}

export interface PasswordResetCodeResult {
    __typename?: 'PasswordResetCodeResult';
    status: ResetCodeStatus;
}

export interface CursorPageInfo {
    __typename?: 'CursorPageInfo';
    hasNextPage: boolean;
    endCursor?: Nullable<Cursor>;
}

export interface OffsetLimitPageInfo {
    __typename?: 'OffsetLimitPageInfo';
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface CreditUsage {
    __typename?: 'CreditUsage';
    id: string;
    label: string;
    projectTitle?: Nullable<string>;
    amount: number;
    kind: CreditEntryKind;
    createdAt: DateTime;
}

export interface CreditSummary {
    __typename?: 'CreditSummary';
    balance: number;
    held: number;
    recentUsage: CreditUsage[];
}

export interface ExportSnapshotScene {
    __typename?: 'ExportSnapshotScene';
    order: number;
    purpose: ScenePurpose;
    media: string;
    durationSeconds: number;
    onScreenText: string;
    transitionIn: SceneTransition;
    clipSound: ClipSound;
}

export interface ExportSnapshot {
    __typename?: 'ExportSnapshot';
    scriptVersionNumber: number;
    scenes: ExportSnapshotScene[];
    voice: string;
    captions: string;
    music: string;
    endCard: boolean;
    postCaption: string;
    adTag: boolean;
    studio: StudioType;
}

export interface Export extends Node {
    __typename?: 'Export';
    id: string;
    number: number;
    preset: ExportPreset;
    durationMs: number;
    width: number;
    height: number;
    sizeBytes: number;
    posterUrl?: Nullable<string>;
    videoUrl?: Nullable<string>;
    snapshot: ExportSnapshot;
    createdAt: DateTime;
    downloadedAt?: Nullable<DateTime>;
}

export interface ProjectExports {
    __typename?: 'ProjectExports';
    exports: Export[];
    changedSinceLatest: boolean;
}

export interface ExportDownload {
    __typename?: 'ExportDownload';
    url: string;
    fileName: string;
}

export interface ClaimFlag {
    __typename?: 'ClaimFlag';
    category: ClaimFlagCategory;
    lead: string;
    reason: string;
    claim: string;
}

export interface ProductFact extends Node {
    __typename?: 'ProductFact';
    id: string;
    projectId: string;
    text: string;
    source: FactSource;
    sourceUrl?: Nullable<string>;
    sourceNote?: Nullable<string>;
    status: FactStatus;
    note?: Nullable<string>;
    flag?: Nullable<ClaimFlag>;
    removable: boolean;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface GenerationJob extends Node {
    __typename?: 'GenerationJob';
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: Nullable<string>;
    hookId?: Nullable<string>;
    sceneId?: Nullable<string>;
    sourceAssetId?: Nullable<string>;
    prompt?: Nullable<string>;
    clipMode?: Nullable<SceneClipMode>;
    clipCount?: Nullable<number>;
    clipSeconds?: Nullable<number>;
    endAssetId?: Nullable<string>;
    referenceAssetIds?: Nullable<string[]>;
    continuitySceneId?: Nullable<string>;
    continuityAssetId?: Nullable<string>;
    resultVersionId?: Nullable<string>;
    failureCode?: Nullable<GenerationFailureCode>;
    createdAt: DateTime;
    startedAt?: Nullable<DateTime>;
    finishedAt?: Nullable<DateTime>;
}

export interface Organization extends Node {
    __typename?: 'Organization';
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

export interface ProductFeature {
    __typename?: 'ProductFeature';
    id: string;
    text: string;
    source: FieldSource;
}

export interface ProductFieldSource {
    __typename?: 'ProductFieldSource';
    field: ProductField;
    source: FieldSource;
}

export interface ProductImport {
    __typename?: 'ProductImport';
    outcome: ImportOutcome;
    host: string;
    filled: ProductField[];
    missing: ProductField[];
    at: DateTime;
}

export interface Product {
    __typename?: 'Product';
    title?: Nullable<string>;
    category?: Nullable<string>;
    pricePhp?: Nullable<number>;
    description?: Nullable<string>;
    affiliateUrl?: Nullable<string>;
    features: ProductFeature[];
    fieldSources: ProductFieldSource[];
    importUrl?: Nullable<string>;
    lastImport?: Nullable<ProductImport>;
}

export interface SelectedAngle {
    __typename?: 'SelectedAngle';
    kind: AngleKind;
    suggestionId?: Nullable<string>;
    text: string;
}

export interface Strategy {
    __typename?: 'Strategy';
    buyer?: Nullable<string>;
    problem?: Nullable<string>;
    benefit?: Nullable<string>;
    platform: Platform;
    language: ScriptLanguage;
    lengthSeconds: number;
    tone: Tone;
    contentStyle: ContentStyle;
    selectedAngle?: Nullable<SelectedAngle>;
}

export interface AngleSuggestion {
    __typename?: 'AngleSuggestion';
    id: string;
    type: AngleType;
    title: string;
    pitch: string;
    factIds: string[];
}

export interface AudienceSuggestion {
    __typename?: 'AudienceSuggestion';
    id: string;
    buyer: string;
    problem: string;
    benefit: string;
    factIds: string[];
}

export interface AudienceSuggestionSet {
    __typename?: 'AudienceSuggestionSet';
    suggestions: AudienceSuggestion[];
    isStale: boolean;
    createdAt: DateTime;
}

export interface AngleSuggestionSet {
    __typename?: 'AngleSuggestionSet';
    suggestions: AngleSuggestion[];
    isStale: boolean;
    createdAt: DateTime;
}

export interface StoryCharacter {
    __typename?: 'StoryCharacter';
    id: string;
    name: string;
    role: string;
    look: string;
}

export interface StoryPremise {
    __typename?: 'StoryPremise';
    kind: PremiseKind;
    suggestionId?: Nullable<string>;
    title: string;
    logline: string;
}

export interface Story {
    __typename?: 'Story';
    genre?: Nullable<StoryGenre>;
    detail: string;
    premise?: Nullable<StoryPremise>;
    cast: StoryCharacter[];
    storytelling: Storytelling;
    language: ScriptLanguage;
    lengthSeconds: number;
}

export interface PremiseSuggestion {
    __typename?: 'PremiseSuggestion';
    id: string;
    title: string;
    logline: string;
    cast: StoryCharacter[];
}

export interface PremiseSuggestionSet {
    __typename?: 'PremiseSuggestionSet';
    suggestions: PremiseSuggestion[];
    genre: StoryGenre;
    detail: string;
    isStale: boolean;
    createdAt: DateTime;
}

export interface StoryEpisode {
    __typename?: 'StoryEpisode';
    projectId: string;
    episodeNumber: number;
    title: string;
    stage: ProjectStage;
}

export interface StoryPreviously {
    __typename?: 'StoryPreviously';
    projectId: string;
    episodeNumber: number;
    title: string;
    seriesPremise: string;
    lastScene: string;
}

export interface StorySeries {
    __typename?: 'StorySeries';
    id?: Nullable<string>;
    episodeNumber: number;
    episodeCount: number;
    isFinal: boolean;
    episodes: StoryEpisode[];
    previous?: Nullable<StoryPreviously>;
    continuityStale: boolean;
}

export interface StudioInfo {
    __typename?: 'StudioInfo';
    type: StudioType;
    area: string;
    title: string;
    description: string;
}

export interface ProjectStep {
    __typename?: 'ProjectStep';
    key: ProjectStepKey;
    status: ProjectStepStatus;
    lockedReason?: Nullable<string>;
}

export interface FailureNotice {
    __typename?: 'FailureNotice';
    kind: FailureNoticeKind;
}

export interface ApprovedFact {
    __typename?: 'ApprovedFact';
    id: string;
    text: string;
}

export interface FactsSummary {
    __typename?: 'FactsSummary';
    total: number;
    unreviewed: number;
    approved: number;
    rejected: number;
    unknown: number;
}

export interface Project extends Node {
    __typename?: 'Project';
    id: string;
    title: string;
    studio: StudioType;
    status: ProjectStatus;
    stage: ProjectStage;
    hasApprovedScript: boolean;
    hasScript: boolean;
    productTitle?: Nullable<string>;
    thumbnailUrl?: Nullable<string>;
    assetCount: number;
    lastEditedAt: DateTime;
    exportCount: number;
    latestExportAt?: Nullable<DateTime>;
    latestExportDownloaded: boolean;
    failureNotice?: Nullable<FailureNotice>;
    product: Product;
    strategy: Strategy;
    angleSuggestionSet?: Nullable<AngleSuggestionSet>;
    audienceSuggestionSet?: Nullable<AudienceSuggestionSet>;
    story?: Nullable<Story>;
    premiseSuggestionSet?: Nullable<PremiseSuggestionSet>;
    series?: Nullable<StorySeries>;
    factsSummary: FactsSummary;
    approvedFacts: ApprovedFact[];
    steps: ProjectStep[];
    currentStep: ProjectStepKey;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface ProjectEdge extends Edge {
    __typename?: 'ProjectEdge';
    cursor: Cursor;
    node: Project;
}

export interface ProjectConnection extends Connection {
    __typename?: 'ProjectConnection';
    totalCount: number;
    edges: ProjectEdge[];
    pageInfo: CursorPageInfo;
}

export interface ProjectCounts {
    __typename?: 'ProjectCounts';
    all: number;
    inProgress: number;
    ready: number;
    exported: number;
}

export interface ProductImportResult {
    __typename?: 'ProductImportResult';
    outcome: ImportOutcome;
    host: string;
    filled: ProductField[];
    missing: ProductField[];
    project: Project;
}

export interface ScriptOrigin {
    __typename?: 'ScriptOrigin';
    kind: ScriptOriginKind;
    fromNumber?: Nullable<number>;
}

export interface ScriptHook {
    __typename?: 'ScriptHook';
    id: string;
    type: HookType;
    text: string;
    openingShot: string;
    flags: ClaimFlag[];
}

export interface SceneDirection {
    __typename?: 'SceneDirection';
    inFrame: ShotSubject;
    framing: ShotFraming;
    setting: string;
    props: string;
}

export interface ShootPlan {
    __typename?: 'ShootPlan';
    scenario: string;
    presenter?: Nullable<string>;
}

export interface SceneLine {
    __typename?: 'SceneLine';
    speaker: string;
    text: string;
    shot: string;
    reaction: string;
    pauseSeconds: number;
    delivery: string;
}

export interface ScriptScene {
    __typename?: 'ScriptScene';
    id: string;
    order: number;
    purpose: ScenePurpose;
    durationSeconds: number;
    narration: string;
    lines: SceneLine[];
    sound?: Nullable<string>;
    onScreenText: string;
    visual: string;
    direction?: Nullable<SceneDirection>;
    transitionIn?: Nullable<SceneTransition>;
    cta?: Nullable<string>;
    factIds: string[];
    flags: ClaimFlag[];
}

export interface ScriptVersion extends Node {
    __typename?: 'ScriptVersion';
    id: string;
    projectId: string;
    number: number;
    status: ScriptVersionStatus;
    origin: ScriptOrigin;
    angleTitle?: Nullable<string>;
    language: ScriptLanguage;
    lengthSeconds: number;
    contentStyle?: Nullable<ContentStyle>;
    studio: StudioType;
    endsSeries: boolean;
    hooks: ScriptHook[];
    selectedHookId?: Nullable<string>;
    scenes: ScriptScene[];
    shoot?: Nullable<ShootPlan>;
    caption: string;
    captionFlags: ClaimFlag[];
    spokenSeconds: number;
    totalSeconds: number;
    usedFactIds: string[];
    createdAt: DateTime;
    approvedAt?: Nullable<DateTime>;
}

export interface NewerDraft {
    __typename?: 'NewerDraft';
    number: number;
    hasNewClaim: boolean;
}

export interface CreatorBrief {
    __typename?: 'CreatorBrief';
    text: string;
    fileName: string;
    versionNumber: number;
    approvedAt: DateTime;
    newerDraft?: Nullable<NewerDraft>;
}

export interface ValidateSessionResult {
    __typename?: 'ValidateSessionResult';
    ok: boolean;
    status: number;
}

export interface PronunciationRule {
    __typename?: 'PronunciationRule';
    word: string;
    sayAs: string;
}

export interface VideoEditVoice {
    __typename?: 'VideoEditVoice';
    source: VoiceSource;
    voiceId?: Nullable<string>;
    speed: number;
    pronunciations: PronunciationRule[];
    recording?: Nullable<ProjectAsset>;
    track?: Nullable<VoiceTrack>;
    outdated: boolean;
    settingsChanged: boolean;
}

export interface CaptionWord {
    __typename?: 'CaptionWord';
    text: string;
    startMs: number;
    endMs: number;
}

export interface CaptionLine {
    __typename?: 'CaptionLine';
    id: string;
    sceneId: string;
    startMs: number;
    endMs: number;
    text: string;
    edited: boolean;
    words: CaptionWord[];
    flags: ClaimFlag[];
}

export interface VideoEditCaptions {
    __typename?: 'VideoEditCaptions';
    enabled: boolean;
    style: CaptionStyle;
    lines: CaptionLine[];
    editable: boolean;
}

export interface VideoEditMusic {
    __typename?: 'VideoEditMusic';
    asset?: Nullable<ProjectAsset>;
    levelPercent: number;
}

export interface PostCaption {
    __typename?: 'PostCaption';
    text: string;
    adTag: boolean;
    flags: ClaimFlag[];
}

export interface VideoEditEndCard {
    __typename?: 'VideoEditEndCard';
    enabled: boolean;
    durationSeconds: number;
    productTitle?: Nullable<string>;
    cta?: Nullable<string>;
    storyTitle?: Nullable<string>;
    endLine?: Nullable<string>;
}

export interface SceneMedia {
    __typename?: 'SceneMedia';
    kind: SceneMediaKind;
    asset?: Nullable<ProjectAsset>;
    motion: PhotoMotion;
    clipStartSeconds: number;
}

export interface ConsistentItem {
    __typename?: 'ConsistentItem';
    id: string;
    kind: ConsistentItemKind;
    name: string;
    sceneIds: string[];
    photo?: Nullable<ProjectAsset>;
    likenessConfirmed: boolean;
}

export interface ClipSound {
    __typename?: 'ClipSound';
    on: boolean;
    levelPercent: number;
}

export interface VideoEditScene {
    __typename?: 'VideoEditScene';
    sceneId: string;
    order: number;
    purpose: ScenePurpose;
    narration: string;
    lines: SceneLine[];
    sound?: Nullable<string>;
    clipSound: ClipSound;
    visual: string;
    onScreenText: string;
    transitionIn: SceneTransition;
    direction?: Nullable<SceneDirection>;
    cta?: Nullable<string>;
    durationSeconds: number;
    startSeconds: number;
    media?: Nullable<SceneMedia>;
    flags: ClaimFlag[];
}

export interface ScriptVersionRef {
    __typename?: 'ScriptVersionRef';
    id: string;
    number: number;
    approvedAt?: Nullable<DateTime>;
}

export interface VideoEditReadiness {
    __typename?: 'VideoEditReadiness';
    mediaComplete: boolean;
    missingMediaCount: number;
    voiceSettled: boolean;
    voiceOutdated: boolean;
    blocking: VideoEditBlocker[];
}

export interface ClipContext {
    __typename?: 'ClipContext';
    language: ScriptLanguage;
    tone: Tone;
    openingShot?: Nullable<string>;
    genre?: Nullable<StoryGenre>;
    cast: StoryCharacter[];
}

export interface VideoEdit extends Node {
    __typename?: 'VideoEdit';
    id: string;
    projectId: string;
    scriptVersion: ScriptVersionRef;
    newerApprovedVersion?: Nullable<ScriptVersionRef>;
    shoot?: Nullable<ShootPlan>;
    clipContext: ClipContext;
    scenes: VideoEditScene[];
    totalSeconds: number;
    voice: VideoEditVoice;
    captions: VideoEditCaptions;
    music: VideoEditMusic;
    endCard: VideoEditEndCard;
    postCaption: PostCaption;
    readiness: VideoEditReadiness;
    aiClipsEnabled: boolean;
    consistentItems: ConsistentItem[];
    studio: StudioType;
    updatedAt: DateTime;
}

export interface VoiceOption {
    __typename?: 'VoiceOption';
    id: string;
    name: string;
    descriptor: string;
    sampleUrl?: Nullable<string>;
}

export interface VoiceSegment {
    __typename?: 'VoiceSegment';
    sceneId: string;
    audioUrl?: Nullable<string>;
    offsetMs: number;
    durationMs: number;
}

export interface VoiceTrack extends Node {
    __typename?: 'VoiceTrack';
    id: string;
    source: VoiceSource;
    voiceName?: Nullable<string>;
    speed: number;
    scriptVersionNumber: number;
    recordingFileName?: Nullable<string>;
    durationMs: number;
    segments: VoiceSegment[];
    createdAt: DateTime;
}

export type DateTime = any;
export type Cursor = any;
type Nullable<T> = T | null;
