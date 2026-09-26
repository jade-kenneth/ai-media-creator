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

export type AddProductFactInput = {
  approve?: InputMaybe<Scalars['Boolean']['input']>;
  projectId: Scalars['ID']['input'];
  sourceNote?: InputMaybe<Scalars['String']['input']>;
  text: Scalars['String']['input'];
};

export enum AngleKind {
  Own = 'OWN',
  Suggested = 'SUGGESTED',
}

export enum AngleType {
  FeatureDemo = 'FEATURE_DEMO',
  GiftIdea = 'GIFT_IDEA',
  ProblemSolution = 'PROBLEM_SOLUTION',
  Routine = 'ROUTINE',
  UseCase = 'USE_CASE',
}

export enum AssetKind {
  Audio = 'AUDIO',
  Clip = 'CLIP',
  Photo = 'PHOTO',
}

export enum AssetOrigin {
  AiClip = 'AI_CLIP',
  Upload = 'UPLOAD',
}

export enum AssetPurpose {
  Media = 'MEDIA',
  Music = 'MUSIC',
  Recording = 'RECORDING',
}

export enum AssetStatus {
  Ready = 'READY',
  Uploading = 'UPLOADING',
}

export type CaptionLineInput = {
  id: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};

export enum CaptionStyle {
  Boxed = 'BOXED',
  Clean = 'CLEAN',
  WordHighlight = 'WORD_HIGHLIGHT',
}

export type CaptionsInput = {
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  lines?: InputMaybe<Array<CaptionLineInput>>;
  style?: InputMaybe<CaptionStyle>;
};

export enum ClaimFlagCategory {
  Guarantee = 'GUARANTEE',
  Health = 'HEALTH',
  NotApprovedFact = 'NOT_APPROVED_FACT',
  Performance = 'PERFORMANCE',
  PriceStock = 'PRICE_STOCK',
  Superlative = 'SUPERLATIVE',
  Testimonial = 'TESTIMONIAL',
}

export type ClipSoundInput = {
  levelPercent: Scalars['Int']['input'];
  on: Scalars['Boolean']['input'];
  sceneId: Scalars['ID']['input'];
};

export type ConsistentItemInput = {
  assetId?: InputMaybe<Scalars['ID']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  likenessConfirmed?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  sceneIds: Array<Scalars['ID']['input']>;
};

export enum ConsistentItemKind {
  Character = 'CHARACTER',
  Product = 'PRODUCT',
  Prop = 'PROP',
}

export enum ContentStyle {
  HandsOnDemo = 'HANDS_ON_DEMO',
  Narration = 'NARRATION',
  Skit = 'SKIT',
  TalkingToCamera = 'TALKING_TO_CAMERA',
  TextOnly = 'TEXT_ONLY',
  VoiceoverProductShots = 'VOICEOVER_PRODUCT_SHOTS',
}

export type CopyScriptVersionInput = {
  id: Scalars['ID']['input'];
  reason: ScriptCopyReason;
};

export type CreateAdminAccountInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  password: Scalars['String']['input'];
  position: Scalars['String']['input'];
};

export type CreateAssetUploadInput = {
  contentType: Scalars['String']['input'];
  durationSeconds?: InputMaybe<Scalars['Float']['input']>;
  fileName: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
  purpose?: InputMaybe<AssetPurpose>;
  replacesAssetId?: InputMaybe<Scalars['ID']['input']>;
  rightsConfirmed: Scalars['Boolean']['input'];
  sizeBytes: Scalars['Int']['input'];
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

export type CreateProjectInput = {
  studio?: InputMaybe<StudioType>;
};

export enum CreditEntryKind {
  Capture = 'CAPTURE',
  Grant = 'GRANT',
  Hold = 'HOLD',
  Release = 'RELEASE',
}

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

export enum ExportPreset {
  Tiktok_9_16 = 'TIKTOK_9_16',
}

export enum FactSource {
  Creator = 'CREATOR',
  Edited = 'EDITED',
  Listing = 'LISTING',
  NotStated = 'NOT_STATED',
}

export enum FactStatus {
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Unknown = 'UNKNOWN',
  Unreviewed = 'UNREVIEWED',
}

export enum FailureNoticeKind {
  AngleSuggestions = 'ANGLE_SUGGESTIONS',
  AudienceSuggestions = 'AUDIENCE_SUGGESTIONS',
  PremiseSuggestions = 'PREMISE_SUGGESTIONS',
  ScriptWriting = 'SCRIPT_WRITING',
}

export enum FieldSource {
  Creator = 'CREATOR',
  Edited = 'EDITED',
  Imported = 'IMPORTED',
}

export type GenerateSceneClipsInput = {
  clipCount?: InputMaybe<Scalars['Int']['input']>;
  endAssetId?: InputMaybe<Scalars['ID']['input']>;
  idempotencyKey: Scalars['String']['input'];
  mode?: InputMaybe<SceneClipMode>;
  projectId: Scalars['ID']['input'];
  prompt: Scalars['String']['input'];
  referenceAssetIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  sceneId: Scalars['ID']['input'];
  sourceAssetId?: InputMaybe<Scalars['ID']['input']>;
};

export enum GenerationFailureCode {
  Internal = 'INTERNAL',
  InvalidOutput = 'INVALID_OUTPUT',
  MediaMissing = 'MEDIA_MISSING',
  ProviderNotConfigured = 'PROVIDER_NOT_CONFIGURED',
  ProviderRejected = 'PROVIDER_REJECTED',
  ProviderTimeout = 'PROVIDER_TIMEOUT',
  RecordingMismatch = 'RECORDING_MISMATCH',
  RenderTimeout = 'RENDER_TIMEOUT',
  UnreadableMedia = 'UNREADABLE_MEDIA',
  WorkerUnavailable = 'WORKER_UNAVAILABLE',
}

export enum GenerationJobStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Queued = 'QUEUED',
  Running = 'RUNNING',
}

export enum GenerationJobType {
  AlignRecording = 'ALIGN_RECORDING',
  GenerateSceneClips = 'GENERATE_SCENE_CLIPS',
  GenerateVoiceover = 'GENERATE_VOICEOVER',
  RenderVideo = 'RENDER_VIDEO',
  RewriteHook = 'REWRITE_HOOK',
  RewriteScene = 'REWRITE_SCENE',
  SuggestAngles = 'SUGGEST_ANGLES',
  SuggestAudiences = 'SUGGEST_AUDIENCES',
  SuggestPremises = 'SUGGEST_PREMISES',
  WriteScript = 'WRITE_SCRIPT',
}

export type GoogleAuthInput = {
  idToken: Scalars['String']['input'];
};

export enum HookType {
  ColdOpen = 'COLD_OPEN',
  DirectPitch = 'DIRECT_PITCH',
  FlashForward = 'FLASH_FORWARD',
  Mystery = 'MYSTERY',
  ProblemFirst = 'PROBLEM_FIRST',
  Question = 'QUESTION',
  RelatableMoment = 'RELATABLE_MOMENT',
  ShowDontTell = 'SHOW_DONT_TELL',
}

export type IdFilterInput = {
  equal?: InputMaybe<Scalars['ID']['input']>;
  in?: InputMaybe<Array<Scalars['ID']['input']>>;
  notEqual?: InputMaybe<Scalars['ID']['input']>;
  notIn?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export enum ImportOutcome {
  Failed = 'FAILED',
  Filled = 'FILLED',
  NotAllowed = 'NOT_ALLOWED',
  Partial = 'PARTIAL',
}

export type ImportProductInput = {
  projectId: Scalars['ID']['input'];
  url: Scalars['String']['input'];
};

export type LoginInput = {
  email: Scalars['String']['input'];
  organizationSlug?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
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

export enum PhotoMotion {
  SlowZoom = 'SLOW_ZOOM',
  Still = 'STILL',
}

export enum Platform {
  Other = 'OTHER',
  ShopeeVideo = 'SHOPEE_VIDEO',
  TiktokShop = 'TIKTOK_SHOP',
}

export enum PremiseKind {
  Own = 'OWN',
  Suggested = 'SUGGESTED',
}

export type ProductFeatureInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  text: Scalars['String']['input'];
};

export enum ProductField {
  AffiliateUrl = 'AFFILIATE_URL',
  Category = 'CATEGORY',
  Description = 'DESCRIPTION',
  Features = 'FEATURES',
  Price = 'PRICE',
  Title = 'TITLE',
}

export type ProjectFilterInput = {
  stage?: InputMaybe<ProjectListFilter>;
};

export enum ProjectListFilter {
  All = 'ALL',
  Exported = 'EXPORTED',
  InProgress = 'IN_PROGRESS',
  Ready = 'READY',
}

export enum ProjectSortField {
  LastEdited = 'LAST_EDITED',
  Name = 'NAME',
}

export type ProjectSortInput = {
  field: ProjectSortField;
};

export enum ProjectStage {
  ChoosingMedia = 'CHOOSING_MEDIA',
  Draft = 'DRAFT',
  Exported = 'EXPORTED',
  Generating = 'GENERATING',
  ReadyToExport = 'READY_TO_EXPORT',
  ReviewingFacts = 'REVIEWING_FACTS',
  ScriptApproved = 'SCRIPT_APPROVED',
  WritingScript = 'WRITING_SCRIPT',
}

export enum ProjectStatus {
  Draft = 'DRAFT',
  Exported = 'EXPORTED',
  FactsReview = 'FACTS_REVIEW',
  Generating = 'GENERATING',
  MediaReview = 'MEDIA_REVIEW',
  Ready = 'READY',
  ScriptReview = 'SCRIPT_REVIEW',
}

export enum ProjectStepKey {
  Brief = 'BRIEF',
  Edit = 'EDIT',
  Export = 'EXPORT',
  Facts = 'FACTS',
  Media = 'MEDIA',
  Product = 'PRODUCT',
  Script = 'SCRIPT',
  Story = 'STORY',
  Strategy = 'STRATEGY',
  Voice = 'VOICE',
}

export enum ProjectStepStatus {
  Done = 'DONE',
  Locked = 'LOCKED',
  Open = 'OPEN',
}

export type PronunciationRuleInput = {
  sayAs: Scalars['String']['input'];
  word: Scalars['String']['input'];
};

export type RegisterUserInput = {
  confirmPassword: Scalars['String']['input'];
  email: Scalars['String']['input'];
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  organizationSlug: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type RenameProjectInput = {
  id: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type RenderVideoInput = {
  idempotencyKey: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
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

export type RewriteHookInput = {
  hookId: Scalars['ID']['input'];
  idempotencyKey: Scalars['String']['input'];
  versionId: Scalars['ID']['input'];
};

export type RewriteSceneInput = {
  idempotencyKey: Scalars['String']['input'];
  sceneId: Scalars['ID']['input'];
  versionId: Scalars['ID']['input'];
};

export enum SceneClipMode {
  Consistent = 'CONSISTENT',
  Describe = 'DESCRIBE',
  FirstFrame = 'FIRST_FRAME',
  FirstLastFrame = 'FIRST_LAST_FRAME',
  References = 'REFERENCES',
}

export type SceneDirectionInput = {
  framing?: InputMaybe<ShotFraming>;
  inFrame?: InputMaybe<ShotSubject>;
  props?: InputMaybe<Scalars['String']['input']>;
  setting?: InputMaybe<Scalars['String']['input']>;
};

export type SceneDurationInput = {
  durationSeconds: Scalars['Int']['input'];
  sceneId: Scalars['ID']['input'];
};

export type SceneLineInput = {
  delivery?: InputMaybe<Scalars['String']['input']>;
  pauseSeconds?: InputMaybe<Scalars['Float']['input']>;
  reaction?: InputMaybe<Scalars['String']['input']>;
  shot?: InputMaybe<Scalars['String']['input']>;
  speaker: Scalars['String']['input'];
  text: Scalars['String']['input'];
};

export type SceneMediaChoiceInput = {
  assetId?: InputMaybe<Scalars['ID']['input']>;
  clipStartSeconds?: InputMaybe<Scalars['Float']['input']>;
  kind: SceneMediaKind;
  motion?: InputMaybe<PhotoMotion>;
};

export type SceneMediaInput = {
  media?: InputMaybe<SceneMediaChoiceInput>;
  sceneId: Scalars['ID']['input'];
};

export enum SceneMediaKind {
  Asset = 'ASSET',
  TextCard = 'TEXT_CARD',
}

export enum ScenePurpose {
  Build = 'BUILD',
  CallToAction = 'CALL_TO_ACTION',
  Demo = 'DEMO',
  Feature = 'FEATURE',
  Hook = 'HOOK',
  Payoff = 'PAYOFF',
  Problem = 'PROBLEM',
  Proof = 'PROOF',
  Setup = 'SETUP',
  Turn = 'TURN',
}

export type SceneTextInput = {
  onScreenText: Scalars['String']['input'];
  sceneId: Scalars['ID']['input'];
};

export enum SceneTransition {
  Cut = 'CUT',
  Dissolve = 'DISSOLVE',
  PunchIn = 'PUNCH_IN',
  Whip = 'WHIP',
}

export type SceneTransitionInput = {
  sceneId: Scalars['ID']['input'];
  transitionIn: SceneTransition;
};

export enum ScriptCopyReason {
  Edit = 'EDIT',
  Restore = 'RESTORE',
}

export type ScriptHookInput = {
  id: Scalars['ID']['input'];
  openingShot?: InputMaybe<Scalars['String']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
};

export enum ScriptLanguage {
  English = 'ENGLISH',
  Filipino = 'FILIPINO',
  Taglish = 'TAGLISH',
}

export enum ScriptOriginKind {
  Copied = 'COPIED',
  Edited = 'EDITED',
  Restored = 'RESTORED',
  Written = 'WRITTEN',
}

export type ScriptSceneInput = {
  cta?: InputMaybe<Scalars['String']['input']>;
  direction?: InputMaybe<SceneDirectionInput>;
  durationSeconds?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['ID']['input'];
  lines?: InputMaybe<Array<SceneLineInput>>;
  narration?: InputMaybe<Scalars['String']['input']>;
  onScreenText?: InputMaybe<Scalars['String']['input']>;
  sound?: InputMaybe<Scalars['String']['input']>;
  transitionIn?: InputMaybe<SceneTransition>;
  visual?: InputMaybe<Scalars['String']['input']>;
};

export enum ScriptVersionStatus {
  Approved = 'APPROVED',
  Draft = 'DRAFT',
  NeedsReview = 'NEEDS_REVIEW',
}

export type SelectedAngleInput = {
  kind: AngleKind;
  suggestionId?: InputMaybe<Scalars['ID']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
};

export type SetProductFactStatusInput = {
  id: Scalars['ID']['input'];
  status: FactStatus;
};

export type ShootPlanInput = {
  presenter?: InputMaybe<Scalars['String']['input']>;
  scenario?: InputMaybe<Scalars['String']['input']>;
};

export enum ShotFraming {
  CloseUp = 'CLOSE_UP',
  Medium = 'MEDIUM',
  Overhead = 'OVERHEAD',
  Pov = 'POV',
  Wide = 'WIDE',
}

export enum ShotSubject {
  Creator = 'CREATOR',
  Hands = 'HANDS',
  ProductOnly = 'PRODUCT_ONLY',
}

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

export type StoryCharacterInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  look?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  role?: InputMaybe<Scalars['String']['input']>;
};

export enum StoryGenre {
  Action = 'ACTION',
  Comedy = 'COMEDY',
  Drama = 'DRAMA',
  Fantasy = 'FANTASY',
  Horror = 'HORROR',
  Mystery = 'MYSTERY',
  Romance = 'ROMANCE',
  SliceOfLife = 'SLICE_OF_LIFE',
}

export type StoryPremiseInput = {
  kind: PremiseKind;
  suggestionId?: InputMaybe<Scalars['ID']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
};

export enum Storytelling {
  Acted = 'ACTED',
  Narrated = 'NARRATED',
}

export type StringFilterInput = {
  contains?: InputMaybe<Scalars['String']['input']>;
  equal?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  notEqual?: InputMaybe<Scalars['String']['input']>;
  notIn?: InputMaybe<Array<Scalars['String']['input']>>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

export enum StudioType {
  Affiliate = 'AFFILIATE',
  Entertainment = 'ENTERTAINMENT',
}

export type SubmitAccountDeletionRequestInput = {
  email: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};

export type SuggestAnglesInput = {
  idempotencyKey: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};

export type SuggestAudiencesInput = {
  idempotencyKey: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};

export type SuggestPremisesInput = {
  idempotencyKey: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};

export type SwitchVideoEditVersionInput = {
  projectId: Scalars['ID']['input'];
  scriptVersionId: Scalars['ID']['input'];
};

export enum Tone {
  Calm = 'CALM',
  Energetic = 'ENERGETIC',
  Friendly = 'FRIENDLY',
  StraightTalking = 'STRAIGHT_TALKING',
}

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

export type UpdateProductFactTextInput = {
  id: Scalars['ID']['input'];
  text: Scalars['String']['input'];
};

export type UpdateProductInput = {
  affiliateUrl?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  features?: InputMaybe<Array<ProductFeatureInput>>;
  pricePhp?: InputMaybe<Scalars['Float']['input']>;
  projectId: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateScriptVersionInput = {
  caption?: InputMaybe<Scalars['String']['input']>;
  hooks?: InputMaybe<Array<ScriptHookInput>>;
  id: Scalars['ID']['input'];
  scenes?: InputMaybe<Array<ScriptSceneInput>>;
  selectedHookId?: InputMaybe<Scalars['ID']['input']>;
  shoot?: InputMaybe<ShootPlanInput>;
};

export type UpdateStoryInput = {
  cast?: InputMaybe<Array<StoryCharacterInput>>;
  detail?: InputMaybe<Scalars['String']['input']>;
  genre?: InputMaybe<StoryGenre>;
  language?: InputMaybe<ScriptLanguage>;
  lengthSeconds?: InputMaybe<Scalars['Int']['input']>;
  premise?: InputMaybe<StoryPremiseInput>;
  projectId: Scalars['ID']['input'];
  storytelling?: InputMaybe<Storytelling>;
};

export type UpdateStrategyInput = {
  benefit?: InputMaybe<Scalars['String']['input']>;
  buyer?: InputMaybe<Scalars['String']['input']>;
  contentStyle?: InputMaybe<ContentStyle>;
  language?: InputMaybe<ScriptLanguage>;
  lengthSeconds?: InputMaybe<Scalars['Int']['input']>;
  platform?: InputMaybe<Platform>;
  problem?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['ID']['input'];
  selectedAngle?: InputMaybe<SelectedAngleInput>;
  tone?: InputMaybe<Tone>;
};

export type UpdateVideoEditInput = {
  adTag?: InputMaybe<Scalars['Boolean']['input']>;
  captions?: InputMaybe<CaptionsInput>;
  clipSounds?: InputMaybe<Array<ClipSoundInput>>;
  consistentItems?: InputMaybe<Array<ConsistentItemInput>>;
  endCardEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  endLine?: InputMaybe<Scalars['String']['input']>;
  musicLevelPercent?: InputMaybe<Scalars['Int']['input']>;
  postCaption?: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['ID']['input'];
  sceneDurations?: InputMaybe<Array<SceneDurationInput>>;
  sceneMedia?: InputMaybe<Array<SceneMediaInput>>;
  sceneOrder?: InputMaybe<Array<Scalars['ID']['input']>>;
  sceneText?: InputMaybe<Array<SceneTextInput>>;
  sceneTransitions?: InputMaybe<Array<SceneTransitionInput>>;
  voice?: InputMaybe<VoiceSettingsInput>;
};

export enum UserRole {
  Admin = 'ADMIN',
  SuperAdmin = 'SUPER_ADMIN',
  User = 'USER',
}

export enum VideoEditBlocker {
  FlaggedLines = 'FLAGGED_LINES',
  MediaIncomplete = 'MEDIA_INCOMPLETE',
  VoiceNotSettled = 'VOICE_NOT_SETTLED',
  VoiceOutdated = 'VOICE_OUTDATED',
}

export type VoiceJobInput = {
  idempotencyKey: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};

export type VoiceSettingsInput = {
  pronunciations?: InputMaybe<Array<PronunciationRuleInput>>;
  source?: InputMaybe<VoiceSource>;
  speed?: InputMaybe<Scalars['Float']['input']>;
  voiceId?: InputMaybe<Scalars['String']['input']>;
};

export enum VoiceSource {
  Ai = 'AI',
  None = 'NONE',
  Recording = 'RECORDING',
  Scene = 'SCENE',
}

export type WriteScriptInput = {
  idempotencyKey: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
};

export type ClipPromptFlagsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
  prompt: Scalars['String']['input'];
}>;

export type ClipPromptFlagsQuery = {
  clipPromptFlags: Array<{
    category: ClaimFlagCategory;
    lead: string;
    reason: string;
    claim: string;
  }>;
};

export type GenerateSceneClipsMutationVariables = Exact<{
  input: GenerateSceneClipsInput;
}>;

export type GenerateSceneClipsMutation = {
  generateSceneClips: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type CheckAiClipMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type CheckAiClipMutation = {
  checkAiClip: {
    id: string;
    projectId: string;
    kind: AssetKind;
    purpose: AssetPurpose;
    origin: AssetOrigin;
    status: AssetStatus;
    fileName: string;
    sizeBytes: number;
    durationSeconds?: number | null;
    previewUrl?: string | null;
    createdAt: string;
    aiClip?: {
      jobId: string;
      sceneId: string;
      sourceAssetId?: string | null;
      mode: SceneClipMode;
      endAssetId?: string | null;
      referenceAssetIds: Array<string>;
      continuitySceneId?: string | null;
      continuityAssetId?: string | null;
      label: string;
      prompt: string;
      checkedAt?: string | null;
    } | null;
  };
};

export type DiscardAiClipsMutationVariables = Exact<{
  jobId: Scalars['ID']['input'];
}>;

export type DiscardAiClipsMutation = { discardAiClips: boolean };

export type ProjectAssetRecordFragment = {
  id: string;
  projectId: string;
  kind: AssetKind;
  purpose: AssetPurpose;
  origin: AssetOrigin;
  status: AssetStatus;
  fileName: string;
  sizeBytes: number;
  durationSeconds?: number | null;
  previewUrl?: string | null;
  createdAt: string;
  aiClip?: {
    jobId: string;
    sceneId: string;
    sourceAssetId?: string | null;
    mode: SceneClipMode;
    endAssetId?: string | null;
    referenceAssetIds: Array<string>;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    label: string;
    prompt: string;
    checkedAt?: string | null;
  } | null;
};

export type ProjectAssetsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;

export type ProjectAssetsQuery = {
  projectAssets: Array<{
    id: string;
    projectId: string;
    kind: AssetKind;
    purpose: AssetPurpose;
    origin: AssetOrigin;
    status: AssetStatus;
    fileName: string;
    sizeBytes: number;
    durationSeconds?: number | null;
    previewUrl?: string | null;
    createdAt: string;
    aiClip?: {
      jobId: string;
      sceneId: string;
      sourceAssetId?: string | null;
      mode: SceneClipMode;
      endAssetId?: string | null;
      referenceAssetIds: Array<string>;
      continuitySceneId?: string | null;
      continuityAssetId?: string | null;
      label: string;
      prompt: string;
      checkedAt?: string | null;
    } | null;
  }>;
};

export type CreateAssetUploadMutationVariables = Exact<{
  input: CreateAssetUploadInput;
}>;

export type CreateAssetUploadMutation = {
  createAssetUpload: {
    uploadUrl: string;
    asset: {
      id: string;
      projectId: string;
      kind: AssetKind;
      purpose: AssetPurpose;
      origin: AssetOrigin;
      status: AssetStatus;
      fileName: string;
      sizeBytes: number;
      durationSeconds?: number | null;
      previewUrl?: string | null;
      createdAt: string;
      aiClip?: {
        jobId: string;
        sceneId: string;
        sourceAssetId?: string | null;
        mode: SceneClipMode;
        endAssetId?: string | null;
        referenceAssetIds: Array<string>;
        continuitySceneId?: string | null;
        continuityAssetId?: string | null;
        label: string;
        prompt: string;
        checkedAt?: string | null;
      } | null;
    };
  };
};

export type CompleteAssetUploadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type CompleteAssetUploadMutation = {
  completeAssetUpload: {
    id: string;
    projectId: string;
    kind: AssetKind;
    purpose: AssetPurpose;
    origin: AssetOrigin;
    status: AssetStatus;
    fileName: string;
    sizeBytes: number;
    durationSeconds?: number | null;
    previewUrl?: string | null;
    createdAt: string;
    aiClip?: {
      jobId: string;
      sceneId: string;
      sourceAssetId?: string | null;
      mode: SceneClipMode;
      endAssetId?: string | null;
      referenceAssetIds: Array<string>;
      continuitySceneId?: string | null;
      continuityAssetId?: string | null;
      label: string;
      prompt: string;
      checkedAt?: string | null;
    } | null;
  };
};

export type RemoveAssetMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type RemoveAssetMutation = { removeAsset: boolean };

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

export type LoginWithGoogleMutationVariables = Exact<{
  input: GoogleAuthInput;
}>;

export type LoginWithGoogleMutation = {
  loginWithGoogle: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: { id: string; email: string; role: UserRole; isActive: boolean };
  };
};

export type LinkGoogleAccountMutationVariables = Exact<{
  input: GoogleAuthInput;
}>;

export type LinkGoogleAccountMutation = {
  linkGoogleAccount: { id: string; email: string; googleLinked: boolean };
};

export type UnlinkGoogleAccountMutationVariables = Exact<{
  [key: string]: never;
}>;

export type UnlinkGoogleAccountMutation = {
  unlinkGoogleAccount: { id: string; email: string; googleLinked: boolean };
};

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  me: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: UserRole;
    organizationId?: string | null;
    isActive: boolean;
    googleLinked: boolean;
  };
};

export type MyCreditsQueryVariables = Exact<{ [key: string]: never }>;

export type MyCreditsQuery = {
  myCredits: {
    balance: number;
    held: number;
    recentUsage: Array<{
      id: string;
      label: string;
      projectTitle?: string | null;
      amount: number;
      kind: CreditEntryKind;
      createdAt: string;
    }>;
  };
};

export type ExportRecordFragment = {
  id: string;
  number: number;
  preset: ExportPreset;
  durationMs: number;
  width: number;
  height: number;
  sizeBytes: number;
  posterUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
  downloadedAt?: string | null;
  snapshot: {
    scriptVersionNumber: number;
    voice: string;
    captions: string;
    music: string;
    endCard: boolean;
    postCaption: string;
    adTag: boolean;
    studio: StudioType;
    scenes: Array<{
      order: number;
      purpose: ScenePurpose;
      media: string;
      durationSeconds: number;
      onScreenText: string;
      transitionIn: SceneTransition;
      clipSound: { on: boolean; levelPercent: number };
    }>;
  };
};

export type ProjectExportsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;

export type ProjectExportsQuery = {
  projectExports: {
    changedSinceLatest: boolean;
    exports: Array<{
      id: string;
      number: number;
      preset: ExportPreset;
      durationMs: number;
      width: number;
      height: number;
      sizeBytes: number;
      posterUrl?: string | null;
      videoUrl?: string | null;
      createdAt: string;
      downloadedAt?: string | null;
      snapshot: {
        scriptVersionNumber: number;
        voice: string;
        captions: string;
        music: string;
        endCard: boolean;
        postCaption: string;
        adTag: boolean;
        studio: StudioType;
        scenes: Array<{
          order: number;
          purpose: ScenePurpose;
          media: string;
          durationSeconds: number;
          onScreenText: string;
          transitionIn: SceneTransition;
          clipSound: { on: boolean; levelPercent: number };
        }>;
      };
    }>;
  };
};

export type RenderVideoMutationVariables = Exact<{
  input: RenderVideoInput;
}>;

export type RenderVideoMutation = {
  renderVideo: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type CreateExportDownloadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type CreateExportDownloadMutation = {
  createExportDownload: { url: string; fileName: string };
};

export type ProductFactRecordFragment = {
  id: string;
  projectId: string;
  text: string;
  source: FactSource;
  sourceUrl?: string | null;
  sourceNote?: string | null;
  status: FactStatus;
  note?: string | null;
  removable: boolean;
  createdAt: string;
  updatedAt: string;
  flag?: {
    category: ClaimFlagCategory;
    lead: string;
    reason: string;
    claim: string;
  } | null;
};

export type ProductFactsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;

export type ProductFactsQuery = {
  productFacts: Array<{
    id: string;
    projectId: string;
    text: string;
    source: FactSource;
    sourceUrl?: string | null;
    sourceNote?: string | null;
    status: FactStatus;
    note?: string | null;
    removable: boolean;
    createdAt: string;
    updatedAt: string;
    flag?: {
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    } | null;
  }>;
};

export type ContinueToFactsMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;

export type ContinueToFactsMutation = {
  continueToFacts: {
    hasApprovedScript: boolean;
    hasScript: boolean;
    assetCount: number;
    updatedAt: string;
    id: string;
    title: string;
    studio: StudioType;
    status: ProjectStatus;
    stage: ProjectStage;
    productTitle?: string | null;
    thumbnailUrl?: string | null;
    lastEditedAt: string;
    exportCount: number;
    latestExportAt?: string | null;
    latestExportDownloaded: boolean;
    currentStep: ProjectStepKey;
    product: {
      title?: string | null;
      category?: string | null;
      pricePhp?: number | null;
      description?: string | null;
      affiliateUrl?: string | null;
      importUrl?: string | null;
      features: Array<{ id: string; text: string; source: FieldSource }>;
      fieldSources: Array<{ field: ProductField; source: FieldSource }>;
      lastImport?: {
        outcome: ImportOutcome;
        host: string;
        filled: Array<ProductField>;
        missing: Array<ProductField>;
        at: string;
      } | null;
    };
    strategy: {
      buyer?: string | null;
      problem?: string | null;
      benefit?: string | null;
      platform: Platform;
      language: ScriptLanguage;
      lengthSeconds: number;
      tone: Tone;
      contentStyle: ContentStyle;
      selectedAngle?: {
        kind: AngleKind;
        suggestionId?: string | null;
        text: string;
      } | null;
    };
    angleSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        type: AngleType;
        title: string;
        pitch: string;
        factIds: Array<string>;
      }>;
    } | null;
    audienceSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        buyer: string;
        problem: string;
        benefit: string;
        factIds: Array<string>;
      }>;
    } | null;
    story?: {
      genre?: StoryGenre | null;
      detail: string;
      storytelling: Storytelling;
      language: ScriptLanguage;
      lengthSeconds: number;
      premise?: {
        kind: PremiseKind;
        suggestionId?: string | null;
        title: string;
        logline: string;
      } | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    } | null;
    premiseSuggestionSet?: {
      genre: StoryGenre;
      detail: string;
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        title: string;
        logline: string;
        cast: Array<{ id: string; name: string; role: string; look: string }>;
      }>;
    } | null;
    factsSummary: {
      total: number;
      unreviewed: number;
      approved: number;
      rejected: number;
      unknown: number;
    };
    approvedFacts: Array<{ id: string; text: string }>;
    steps: Array<{
      key: ProjectStepKey;
      status: ProjectStepStatus;
      lockedReason?: string | null;
    }>;
    failureNotice?: { kind: FailureNoticeKind } | null;
  };
};

export type AddProductFactMutationVariables = Exact<{
  input: AddProductFactInput;
}>;

export type AddProductFactMutation = {
  addProductFact: {
    id: string;
    projectId: string;
    text: string;
    source: FactSource;
    sourceUrl?: string | null;
    sourceNote?: string | null;
    status: FactStatus;
    note?: string | null;
    removable: boolean;
    createdAt: string;
    updatedAt: string;
    flag?: {
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    } | null;
  };
};

export type UpdateProductFactTextMutationVariables = Exact<{
  input: UpdateProductFactTextInput;
}>;

export type UpdateProductFactTextMutation = {
  updateProductFactText: {
    id: string;
    projectId: string;
    text: string;
    source: FactSource;
    sourceUrl?: string | null;
    sourceNote?: string | null;
    status: FactStatus;
    note?: string | null;
    removable: boolean;
    createdAt: string;
    updatedAt: string;
    flag?: {
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    } | null;
  };
};

export type SetProductFactStatusMutationVariables = Exact<{
  input: SetProductFactStatusInput;
}>;

export type SetProductFactStatusMutation = {
  setProductFactStatus: {
    id: string;
    projectId: string;
    text: string;
    source: FactSource;
    sourceUrl?: string | null;
    sourceNote?: string | null;
    status: FactStatus;
    note?: string | null;
    removable: boolean;
    createdAt: string;
    updatedAt: string;
    flag?: {
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    } | null;
  };
};

export type RemoveProductFactMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type RemoveProductFactMutation = { removeProductFact: boolean };

export type GenerationJobRecordFragment = {
  id: string;
  projectId: string;
  type: GenerationJobType;
  status: GenerationJobStatus;
  step: number;
  stepCount: number;
  creditCost: number;
  versionId?: string | null;
  hookId?: string | null;
  sceneId?: string | null;
  sourceAssetId?: string | null;
  prompt?: string | null;
  clipMode?: SceneClipMode | null;
  clipCount?: number | null;
  clipSeconds?: number | null;
  endAssetId?: string | null;
  referenceAssetIds?: Array<string> | null;
  continuitySceneId?: string | null;
  continuityAssetId?: string | null;
  resultVersionId?: string | null;
  failureCode?: GenerationFailureCode | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export type GenerationJobQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GenerationJobQuery = {
  generationJob: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type ProjectJobsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
  active?: InputMaybe<Scalars['Boolean']['input']>;
}>;

export type ProjectJobsQuery = {
  projectJobs: Array<{
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  }>;
};

export type RetryGenerationJobMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type RetryGenerationJobMutation = {
  retryGenerationJob: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type ProjectCardFragment = {
  id: string;
  title: string;
  studio: StudioType;
  status: ProjectStatus;
  stage: ProjectStage;
  productTitle?: string | null;
  thumbnailUrl?: string | null;
  lastEditedAt: string;
  exportCount: number;
  latestExportAt?: string | null;
  latestExportDownloaded: boolean;
  currentStep: ProjectStepKey;
  failureNotice?: { kind: FailureNoticeKind } | null;
  story?: { genre?: StoryGenre | null } | null;
};

export type ProjectDetailFragment = {
  hasApprovedScript: boolean;
  hasScript: boolean;
  assetCount: number;
  updatedAt: string;
  id: string;
  title: string;
  studio: StudioType;
  status: ProjectStatus;
  stage: ProjectStage;
  productTitle?: string | null;
  thumbnailUrl?: string | null;
  lastEditedAt: string;
  exportCount: number;
  latestExportAt?: string | null;
  latestExportDownloaded: boolean;
  currentStep: ProjectStepKey;
  product: {
    title?: string | null;
    category?: string | null;
    pricePhp?: number | null;
    description?: string | null;
    affiliateUrl?: string | null;
    importUrl?: string | null;
    features: Array<{ id: string; text: string; source: FieldSource }>;
    fieldSources: Array<{ field: ProductField; source: FieldSource }>;
    lastImport?: {
      outcome: ImportOutcome;
      host: string;
      filled: Array<ProductField>;
      missing: Array<ProductField>;
      at: string;
    } | null;
  };
  strategy: {
    buyer?: string | null;
    problem?: string | null;
    benefit?: string | null;
    platform: Platform;
    language: ScriptLanguage;
    lengthSeconds: number;
    tone: Tone;
    contentStyle: ContentStyle;
    selectedAngle?: {
      kind: AngleKind;
      suggestionId?: string | null;
      text: string;
    } | null;
  };
  angleSuggestionSet?: {
    isStale: boolean;
    createdAt: string;
    suggestions: Array<{
      id: string;
      type: AngleType;
      title: string;
      pitch: string;
      factIds: Array<string>;
    }>;
  } | null;
  audienceSuggestionSet?: {
    isStale: boolean;
    createdAt: string;
    suggestions: Array<{
      id: string;
      buyer: string;
      problem: string;
      benefit: string;
      factIds: Array<string>;
    }>;
  } | null;
  story?: {
    genre?: StoryGenre | null;
    detail: string;
    storytelling: Storytelling;
    language: ScriptLanguage;
    lengthSeconds: number;
    premise?: {
      kind: PremiseKind;
      suggestionId?: string | null;
      title: string;
      logline: string;
    } | null;
    cast: Array<{ id: string; name: string; role: string; look: string }>;
  } | null;
  premiseSuggestionSet?: {
    genre: StoryGenre;
    detail: string;
    isStale: boolean;
    createdAt: string;
    suggestions: Array<{
      id: string;
      title: string;
      logline: string;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    }>;
  } | null;
  factsSummary: {
    total: number;
    unreviewed: number;
    approved: number;
    rejected: number;
    unknown: number;
  };
  approvedFacts: Array<{ id: string; text: string }>;
  steps: Array<{
    key: ProjectStepKey;
    status: ProjectStepStatus;
    lockedReason?: string | null;
  }>;
  failureNotice?: { kind: FailureNoticeKind } | null;
};

export type ProjectsQueryVariables = Exact<{
  filter?: InputMaybe<ProjectFilterInput>;
  sort?: InputMaybe<ProjectSortInput>;
  pagination?: InputMaybe<CursorPaginationInput>;
}>;

export type ProjectsQuery = {
  projects: {
    totalCount: number;
    edges: Array<{
      cursor: string;
      node: {
        id: string;
        title: string;
        studio: StudioType;
        status: ProjectStatus;
        stage: ProjectStage;
        productTitle?: string | null;
        thumbnailUrl?: string | null;
        lastEditedAt: string;
        exportCount: number;
        latestExportAt?: string | null;
        latestExportDownloaded: boolean;
        currentStep: ProjectStepKey;
        failureNotice?: { kind: FailureNoticeKind } | null;
        story?: { genre?: StoryGenre | null } | null;
      };
    }>;
    pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  };
};

export type ProjectCountsQueryVariables = Exact<{ [key: string]: never }>;

export type ProjectCountsQuery = {
  projectCounts: {
    all: number;
    inProgress: number;
    ready: number;
    exported: number;
  };
};

export type ProjectQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type ProjectQuery = {
  project: {
    hasApprovedScript: boolean;
    hasScript: boolean;
    assetCount: number;
    updatedAt: string;
    id: string;
    title: string;
    studio: StudioType;
    status: ProjectStatus;
    stage: ProjectStage;
    productTitle?: string | null;
    thumbnailUrl?: string | null;
    lastEditedAt: string;
    exportCount: number;
    latestExportAt?: string | null;
    latestExportDownloaded: boolean;
    currentStep: ProjectStepKey;
    product: {
      title?: string | null;
      category?: string | null;
      pricePhp?: number | null;
      description?: string | null;
      affiliateUrl?: string | null;
      importUrl?: string | null;
      features: Array<{ id: string; text: string; source: FieldSource }>;
      fieldSources: Array<{ field: ProductField; source: FieldSource }>;
      lastImport?: {
        outcome: ImportOutcome;
        host: string;
        filled: Array<ProductField>;
        missing: Array<ProductField>;
        at: string;
      } | null;
    };
    strategy: {
      buyer?: string | null;
      problem?: string | null;
      benefit?: string | null;
      platform: Platform;
      language: ScriptLanguage;
      lengthSeconds: number;
      tone: Tone;
      contentStyle: ContentStyle;
      selectedAngle?: {
        kind: AngleKind;
        suggestionId?: string | null;
        text: string;
      } | null;
    };
    angleSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        type: AngleType;
        title: string;
        pitch: string;
        factIds: Array<string>;
      }>;
    } | null;
    audienceSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        buyer: string;
        problem: string;
        benefit: string;
        factIds: Array<string>;
      }>;
    } | null;
    story?: {
      genre?: StoryGenre | null;
      detail: string;
      storytelling: Storytelling;
      language: ScriptLanguage;
      lengthSeconds: number;
      premise?: {
        kind: PremiseKind;
        suggestionId?: string | null;
        title: string;
        logline: string;
      } | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    } | null;
    premiseSuggestionSet?: {
      genre: StoryGenre;
      detail: string;
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        title: string;
        logline: string;
        cast: Array<{ id: string; name: string; role: string; look: string }>;
      }>;
    } | null;
    factsSummary: {
      total: number;
      unreviewed: number;
      approved: number;
      rejected: number;
      unknown: number;
    };
    approvedFacts: Array<{ id: string; text: string }>;
    steps: Array<{
      key: ProjectStepKey;
      status: ProjectStepStatus;
      lockedReason?: string | null;
    }>;
    failureNotice?: { kind: FailureNoticeKind } | null;
  };
};

export type StudiosQueryVariables = Exact<{ [key: string]: never }>;

export type StudiosQuery = {
  studios: Array<{
    type: StudioType;
    area: string;
    title: string;
    description: string;
  }>;
};

export type CreateProjectMutationVariables = Exact<{
  input?: InputMaybe<CreateProjectInput>;
}>;

export type CreateProjectMutation = {
  createProject: {
    hasApprovedScript: boolean;
    hasScript: boolean;
    assetCount: number;
    updatedAt: string;
    id: string;
    title: string;
    studio: StudioType;
    status: ProjectStatus;
    stage: ProjectStage;
    productTitle?: string | null;
    thumbnailUrl?: string | null;
    lastEditedAt: string;
    exportCount: number;
    latestExportAt?: string | null;
    latestExportDownloaded: boolean;
    currentStep: ProjectStepKey;
    product: {
      title?: string | null;
      category?: string | null;
      pricePhp?: number | null;
      description?: string | null;
      affiliateUrl?: string | null;
      importUrl?: string | null;
      features: Array<{ id: string; text: string; source: FieldSource }>;
      fieldSources: Array<{ field: ProductField; source: FieldSource }>;
      lastImport?: {
        outcome: ImportOutcome;
        host: string;
        filled: Array<ProductField>;
        missing: Array<ProductField>;
        at: string;
      } | null;
    };
    strategy: {
      buyer?: string | null;
      problem?: string | null;
      benefit?: string | null;
      platform: Platform;
      language: ScriptLanguage;
      lengthSeconds: number;
      tone: Tone;
      contentStyle: ContentStyle;
      selectedAngle?: {
        kind: AngleKind;
        suggestionId?: string | null;
        text: string;
      } | null;
    };
    angleSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        type: AngleType;
        title: string;
        pitch: string;
        factIds: Array<string>;
      }>;
    } | null;
    audienceSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        buyer: string;
        problem: string;
        benefit: string;
        factIds: Array<string>;
      }>;
    } | null;
    story?: {
      genre?: StoryGenre | null;
      detail: string;
      storytelling: Storytelling;
      language: ScriptLanguage;
      lengthSeconds: number;
      premise?: {
        kind: PremiseKind;
        suggestionId?: string | null;
        title: string;
        logline: string;
      } | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    } | null;
    premiseSuggestionSet?: {
      genre: StoryGenre;
      detail: string;
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        title: string;
        logline: string;
        cast: Array<{ id: string; name: string; role: string; look: string }>;
      }>;
    } | null;
    factsSummary: {
      total: number;
      unreviewed: number;
      approved: number;
      rejected: number;
      unknown: number;
    };
    approvedFacts: Array<{ id: string; text: string }>;
    steps: Array<{
      key: ProjectStepKey;
      status: ProjectStepStatus;
      lockedReason?: string | null;
    }>;
    failureNotice?: { kind: FailureNoticeKind } | null;
  };
};

export type RenameProjectMutationVariables = Exact<{
  input: RenameProjectInput;
}>;

export type RenameProjectMutation = {
  renameProject: {
    hasApprovedScript: boolean;
    hasScript: boolean;
    assetCount: number;
    updatedAt: string;
    id: string;
    title: string;
    studio: StudioType;
    status: ProjectStatus;
    stage: ProjectStage;
    productTitle?: string | null;
    thumbnailUrl?: string | null;
    lastEditedAt: string;
    exportCount: number;
    latestExportAt?: string | null;
    latestExportDownloaded: boolean;
    currentStep: ProjectStepKey;
    product: {
      title?: string | null;
      category?: string | null;
      pricePhp?: number | null;
      description?: string | null;
      affiliateUrl?: string | null;
      importUrl?: string | null;
      features: Array<{ id: string; text: string; source: FieldSource }>;
      fieldSources: Array<{ field: ProductField; source: FieldSource }>;
      lastImport?: {
        outcome: ImportOutcome;
        host: string;
        filled: Array<ProductField>;
        missing: Array<ProductField>;
        at: string;
      } | null;
    };
    strategy: {
      buyer?: string | null;
      problem?: string | null;
      benefit?: string | null;
      platform: Platform;
      language: ScriptLanguage;
      lengthSeconds: number;
      tone: Tone;
      contentStyle: ContentStyle;
      selectedAngle?: {
        kind: AngleKind;
        suggestionId?: string | null;
        text: string;
      } | null;
    };
    angleSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        type: AngleType;
        title: string;
        pitch: string;
        factIds: Array<string>;
      }>;
    } | null;
    audienceSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        buyer: string;
        problem: string;
        benefit: string;
        factIds: Array<string>;
      }>;
    } | null;
    story?: {
      genre?: StoryGenre | null;
      detail: string;
      storytelling: Storytelling;
      language: ScriptLanguage;
      lengthSeconds: number;
      premise?: {
        kind: PremiseKind;
        suggestionId?: string | null;
        title: string;
        logline: string;
      } | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    } | null;
    premiseSuggestionSet?: {
      genre: StoryGenre;
      detail: string;
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        title: string;
        logline: string;
        cast: Array<{ id: string; name: string; role: string; look: string }>;
      }>;
    } | null;
    factsSummary: {
      total: number;
      unreviewed: number;
      approved: number;
      rejected: number;
      unknown: number;
    };
    approvedFacts: Array<{ id: string; text: string }>;
    steps: Array<{
      key: ProjectStepKey;
      status: ProjectStepStatus;
      lockedReason?: string | null;
    }>;
    failureNotice?: { kind: FailureNoticeKind } | null;
  };
};

export type DuplicateProjectMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type DuplicateProjectMutation = {
  duplicateProject: {
    id: string;
    title: string;
    studio: StudioType;
    status: ProjectStatus;
    stage: ProjectStage;
    productTitle?: string | null;
    thumbnailUrl?: string | null;
    lastEditedAt: string;
    exportCount: number;
    latestExportAt?: string | null;
    latestExportDownloaded: boolean;
    currentStep: ProjectStepKey;
    failureNotice?: { kind: FailureNoticeKind } | null;
    story?: { genre?: StoryGenre | null } | null;
  };
};

export type UpdateProductMutationVariables = Exact<{
  input: UpdateProductInput;
}>;

export type UpdateProductMutation = {
  updateProduct: {
    hasApprovedScript: boolean;
    hasScript: boolean;
    assetCount: number;
    updatedAt: string;
    id: string;
    title: string;
    studio: StudioType;
    status: ProjectStatus;
    stage: ProjectStage;
    productTitle?: string | null;
    thumbnailUrl?: string | null;
    lastEditedAt: string;
    exportCount: number;
    latestExportAt?: string | null;
    latestExportDownloaded: boolean;
    currentStep: ProjectStepKey;
    product: {
      title?: string | null;
      category?: string | null;
      pricePhp?: number | null;
      description?: string | null;
      affiliateUrl?: string | null;
      importUrl?: string | null;
      features: Array<{ id: string; text: string; source: FieldSource }>;
      fieldSources: Array<{ field: ProductField; source: FieldSource }>;
      lastImport?: {
        outcome: ImportOutcome;
        host: string;
        filled: Array<ProductField>;
        missing: Array<ProductField>;
        at: string;
      } | null;
    };
    strategy: {
      buyer?: string | null;
      problem?: string | null;
      benefit?: string | null;
      platform: Platform;
      language: ScriptLanguage;
      lengthSeconds: number;
      tone: Tone;
      contentStyle: ContentStyle;
      selectedAngle?: {
        kind: AngleKind;
        suggestionId?: string | null;
        text: string;
      } | null;
    };
    angleSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        type: AngleType;
        title: string;
        pitch: string;
        factIds: Array<string>;
      }>;
    } | null;
    audienceSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        buyer: string;
        problem: string;
        benefit: string;
        factIds: Array<string>;
      }>;
    } | null;
    story?: {
      genre?: StoryGenre | null;
      detail: string;
      storytelling: Storytelling;
      language: ScriptLanguage;
      lengthSeconds: number;
      premise?: {
        kind: PremiseKind;
        suggestionId?: string | null;
        title: string;
        logline: string;
      } | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    } | null;
    premiseSuggestionSet?: {
      genre: StoryGenre;
      detail: string;
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        title: string;
        logline: string;
        cast: Array<{ id: string; name: string; role: string; look: string }>;
      }>;
    } | null;
    factsSummary: {
      total: number;
      unreviewed: number;
      approved: number;
      rejected: number;
      unknown: number;
    };
    approvedFacts: Array<{ id: string; text: string }>;
    steps: Array<{
      key: ProjectStepKey;
      status: ProjectStepStatus;
      lockedReason?: string | null;
    }>;
    failureNotice?: { kind: FailureNoticeKind } | null;
  };
};

export type ImportProductMutationVariables = Exact<{
  input: ImportProductInput;
}>;

export type ImportProductMutation = {
  importProduct: {
    outcome: ImportOutcome;
    host: string;
    filled: Array<ProductField>;
    missing: Array<ProductField>;
    project: {
      hasApprovedScript: boolean;
      hasScript: boolean;
      assetCount: number;
      updatedAt: string;
      id: string;
      title: string;
      studio: StudioType;
      status: ProjectStatus;
      stage: ProjectStage;
      productTitle?: string | null;
      thumbnailUrl?: string | null;
      lastEditedAt: string;
      exportCount: number;
      latestExportAt?: string | null;
      latestExportDownloaded: boolean;
      currentStep: ProjectStepKey;
      product: {
        title?: string | null;
        category?: string | null;
        pricePhp?: number | null;
        description?: string | null;
        affiliateUrl?: string | null;
        importUrl?: string | null;
        features: Array<{ id: string; text: string; source: FieldSource }>;
        fieldSources: Array<{ field: ProductField; source: FieldSource }>;
        lastImport?: {
          outcome: ImportOutcome;
          host: string;
          filled: Array<ProductField>;
          missing: Array<ProductField>;
          at: string;
        } | null;
      };
      strategy: {
        buyer?: string | null;
        problem?: string | null;
        benefit?: string | null;
        platform: Platform;
        language: ScriptLanguage;
        lengthSeconds: number;
        tone: Tone;
        contentStyle: ContentStyle;
        selectedAngle?: {
          kind: AngleKind;
          suggestionId?: string | null;
          text: string;
        } | null;
      };
      angleSuggestionSet?: {
        isStale: boolean;
        createdAt: string;
        suggestions: Array<{
          id: string;
          type: AngleType;
          title: string;
          pitch: string;
          factIds: Array<string>;
        }>;
      } | null;
      audienceSuggestionSet?: {
        isStale: boolean;
        createdAt: string;
        suggestions: Array<{
          id: string;
          buyer: string;
          problem: string;
          benefit: string;
          factIds: Array<string>;
        }>;
      } | null;
      story?: {
        genre?: StoryGenre | null;
        detail: string;
        storytelling: Storytelling;
        language: ScriptLanguage;
        lengthSeconds: number;
        premise?: {
          kind: PremiseKind;
          suggestionId?: string | null;
          title: string;
          logline: string;
        } | null;
        cast: Array<{ id: string; name: string; role: string; look: string }>;
      } | null;
      premiseSuggestionSet?: {
        genre: StoryGenre;
        detail: string;
        isStale: boolean;
        createdAt: string;
        suggestions: Array<{
          id: string;
          title: string;
          logline: string;
          cast: Array<{ id: string; name: string; role: string; look: string }>;
        }>;
      } | null;
      factsSummary: {
        total: number;
        unreviewed: number;
        approved: number;
        rejected: number;
        unknown: number;
      };
      approvedFacts: Array<{ id: string; text: string }>;
      steps: Array<{
        key: ProjectStepKey;
        status: ProjectStepStatus;
        lockedReason?: string | null;
      }>;
      failureNotice?: { kind: FailureNoticeKind } | null;
    };
  };
};

export type ClearImportedProductValuesMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;

export type ClearImportedProductValuesMutation = {
  clearImportedProductValues: {
    hasApprovedScript: boolean;
    hasScript: boolean;
    assetCount: number;
    updatedAt: string;
    id: string;
    title: string;
    studio: StudioType;
    status: ProjectStatus;
    stage: ProjectStage;
    productTitle?: string | null;
    thumbnailUrl?: string | null;
    lastEditedAt: string;
    exportCount: number;
    latestExportAt?: string | null;
    latestExportDownloaded: boolean;
    currentStep: ProjectStepKey;
    product: {
      title?: string | null;
      category?: string | null;
      pricePhp?: number | null;
      description?: string | null;
      affiliateUrl?: string | null;
      importUrl?: string | null;
      features: Array<{ id: string; text: string; source: FieldSource }>;
      fieldSources: Array<{ field: ProductField; source: FieldSource }>;
      lastImport?: {
        outcome: ImportOutcome;
        host: string;
        filled: Array<ProductField>;
        missing: Array<ProductField>;
        at: string;
      } | null;
    };
    strategy: {
      buyer?: string | null;
      problem?: string | null;
      benefit?: string | null;
      platform: Platform;
      language: ScriptLanguage;
      lengthSeconds: number;
      tone: Tone;
      contentStyle: ContentStyle;
      selectedAngle?: {
        kind: AngleKind;
        suggestionId?: string | null;
        text: string;
      } | null;
    };
    angleSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        type: AngleType;
        title: string;
        pitch: string;
        factIds: Array<string>;
      }>;
    } | null;
    audienceSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        buyer: string;
        problem: string;
        benefit: string;
        factIds: Array<string>;
      }>;
    } | null;
    story?: {
      genre?: StoryGenre | null;
      detail: string;
      storytelling: Storytelling;
      language: ScriptLanguage;
      lengthSeconds: number;
      premise?: {
        kind: PremiseKind;
        suggestionId?: string | null;
        title: string;
        logline: string;
      } | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    } | null;
    premiseSuggestionSet?: {
      genre: StoryGenre;
      detail: string;
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        title: string;
        logline: string;
        cast: Array<{ id: string; name: string; role: string; look: string }>;
      }>;
    } | null;
    factsSummary: {
      total: number;
      unreviewed: number;
      approved: number;
      rejected: number;
      unknown: number;
    };
    approvedFacts: Array<{ id: string; text: string }>;
    steps: Array<{
      key: ProjectStepKey;
      status: ProjectStepStatus;
      lockedReason?: string | null;
    }>;
    failureNotice?: { kind: FailureNoticeKind } | null;
  };
};

export type UpdateStrategyMutationVariables = Exact<{
  input: UpdateStrategyInput;
}>;

export type UpdateStrategyMutation = {
  updateStrategy: {
    hasApprovedScript: boolean;
    hasScript: boolean;
    assetCount: number;
    updatedAt: string;
    id: string;
    title: string;
    studio: StudioType;
    status: ProjectStatus;
    stage: ProjectStage;
    productTitle?: string | null;
    thumbnailUrl?: string | null;
    lastEditedAt: string;
    exportCount: number;
    latestExportAt?: string | null;
    latestExportDownloaded: boolean;
    currentStep: ProjectStepKey;
    product: {
      title?: string | null;
      category?: string | null;
      pricePhp?: number | null;
      description?: string | null;
      affiliateUrl?: string | null;
      importUrl?: string | null;
      features: Array<{ id: string; text: string; source: FieldSource }>;
      fieldSources: Array<{ field: ProductField; source: FieldSource }>;
      lastImport?: {
        outcome: ImportOutcome;
        host: string;
        filled: Array<ProductField>;
        missing: Array<ProductField>;
        at: string;
      } | null;
    };
    strategy: {
      buyer?: string | null;
      problem?: string | null;
      benefit?: string | null;
      platform: Platform;
      language: ScriptLanguage;
      lengthSeconds: number;
      tone: Tone;
      contentStyle: ContentStyle;
      selectedAngle?: {
        kind: AngleKind;
        suggestionId?: string | null;
        text: string;
      } | null;
    };
    angleSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        type: AngleType;
        title: string;
        pitch: string;
        factIds: Array<string>;
      }>;
    } | null;
    audienceSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        buyer: string;
        problem: string;
        benefit: string;
        factIds: Array<string>;
      }>;
    } | null;
    story?: {
      genre?: StoryGenre | null;
      detail: string;
      storytelling: Storytelling;
      language: ScriptLanguage;
      lengthSeconds: number;
      premise?: {
        kind: PremiseKind;
        suggestionId?: string | null;
        title: string;
        logline: string;
      } | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    } | null;
    premiseSuggestionSet?: {
      genre: StoryGenre;
      detail: string;
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        title: string;
        logline: string;
        cast: Array<{ id: string; name: string; role: string; look: string }>;
      }>;
    } | null;
    factsSummary: {
      total: number;
      unreviewed: number;
      approved: number;
      rejected: number;
      unknown: number;
    };
    approvedFacts: Array<{ id: string; text: string }>;
    steps: Array<{
      key: ProjectStepKey;
      status: ProjectStepStatus;
      lockedReason?: string | null;
    }>;
    failureNotice?: { kind: FailureNoticeKind } | null;
  };
};

export type SuggestAudiencesMutationVariables = Exact<{
  input: SuggestAudiencesInput;
}>;

export type SuggestAudiencesMutation = {
  suggestAudiences: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type UpdateStoryMutationVariables = Exact<{
  input: UpdateStoryInput;
}>;

export type UpdateStoryMutation = {
  updateStory: {
    hasApprovedScript: boolean;
    hasScript: boolean;
    assetCount: number;
    updatedAt: string;
    id: string;
    title: string;
    studio: StudioType;
    status: ProjectStatus;
    stage: ProjectStage;
    productTitle?: string | null;
    thumbnailUrl?: string | null;
    lastEditedAt: string;
    exportCount: number;
    latestExportAt?: string | null;
    latestExportDownloaded: boolean;
    currentStep: ProjectStepKey;
    product: {
      title?: string | null;
      category?: string | null;
      pricePhp?: number | null;
      description?: string | null;
      affiliateUrl?: string | null;
      importUrl?: string | null;
      features: Array<{ id: string; text: string; source: FieldSource }>;
      fieldSources: Array<{ field: ProductField; source: FieldSource }>;
      lastImport?: {
        outcome: ImportOutcome;
        host: string;
        filled: Array<ProductField>;
        missing: Array<ProductField>;
        at: string;
      } | null;
    };
    strategy: {
      buyer?: string | null;
      problem?: string | null;
      benefit?: string | null;
      platform: Platform;
      language: ScriptLanguage;
      lengthSeconds: number;
      tone: Tone;
      contentStyle: ContentStyle;
      selectedAngle?: {
        kind: AngleKind;
        suggestionId?: string | null;
        text: string;
      } | null;
    };
    angleSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        type: AngleType;
        title: string;
        pitch: string;
        factIds: Array<string>;
      }>;
    } | null;
    audienceSuggestionSet?: {
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        buyer: string;
        problem: string;
        benefit: string;
        factIds: Array<string>;
      }>;
    } | null;
    story?: {
      genre?: StoryGenre | null;
      detail: string;
      storytelling: Storytelling;
      language: ScriptLanguage;
      lengthSeconds: number;
      premise?: {
        kind: PremiseKind;
        suggestionId?: string | null;
        title: string;
        logline: string;
      } | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    } | null;
    premiseSuggestionSet?: {
      genre: StoryGenre;
      detail: string;
      isStale: boolean;
      createdAt: string;
      suggestions: Array<{
        id: string;
        title: string;
        logline: string;
        cast: Array<{ id: string; name: string; role: string; look: string }>;
      }>;
    } | null;
    factsSummary: {
      total: number;
      unreviewed: number;
      approved: number;
      rejected: number;
      unknown: number;
    };
    approvedFacts: Array<{ id: string; text: string }>;
    steps: Array<{
      key: ProjectStepKey;
      status: ProjectStepStatus;
      lockedReason?: string | null;
    }>;
    failureNotice?: { kind: FailureNoticeKind } | null;
  };
};

export type SuggestPremisesMutationVariables = Exact<{
  input: SuggestPremisesInput;
}>;

export type SuggestPremisesMutation = {
  suggestPremises: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type SuggestAnglesMutationVariables = Exact<{
  input: SuggestAnglesInput;
}>;

export type SuggestAnglesMutation = {
  suggestAngles: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type ClaimFlagRecordFragment = {
  category: ClaimFlagCategory;
  lead: string;
  reason: string;
  claim: string;
};

export type ScriptVersionRecordFragment = {
  id: string;
  projectId: string;
  number: number;
  status: ScriptVersionStatus;
  angleTitle?: string | null;
  language: ScriptLanguage;
  lengthSeconds: number;
  contentStyle?: ContentStyle | null;
  studio: StudioType;
  selectedHookId?: string | null;
  caption: string;
  spokenSeconds: number;
  totalSeconds: number;
  usedFactIds: Array<string>;
  createdAt: string;
  approvedAt?: string | null;
  origin: { kind: ScriptOriginKind; fromNumber?: number | null };
  hooks: Array<{
    id: string;
    type: HookType;
    text: string;
    openingShot: string;
    flags: Array<{
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    }>;
  }>;
  scenes: Array<{
    id: string;
    order: number;
    purpose: ScenePurpose;
    durationSeconds: number;
    narration: string;
    sound?: string | null;
    onScreenText: string;
    visual: string;
    transitionIn?: SceneTransition | null;
    cta?: string | null;
    factIds: Array<string>;
    lines: Array<{
      speaker: string;
      text: string;
      shot: string;
      reaction: string;
      pauseSeconds: number;
      delivery: string;
    }>;
    direction?: {
      inFrame: ShotSubject;
      framing: ShotFraming;
      setting: string;
      props: string;
    } | null;
    flags: Array<{
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    }>;
  }>;
  shoot?: { scenario: string; presenter?: string | null } | null;
  captionFlags: Array<{
    category: ClaimFlagCategory;
    lead: string;
    reason: string;
    claim: string;
  }>;
};

export type ScriptVersionsQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;

export type ScriptVersionsQuery = {
  scriptVersions: Array<{
    id: string;
    projectId: string;
    number: number;
    status: ScriptVersionStatus;
    angleTitle?: string | null;
    language: ScriptLanguage;
    lengthSeconds: number;
    contentStyle?: ContentStyle | null;
    studio: StudioType;
    selectedHookId?: string | null;
    caption: string;
    spokenSeconds: number;
    totalSeconds: number;
    usedFactIds: Array<string>;
    createdAt: string;
    approvedAt?: string | null;
    origin: { kind: ScriptOriginKind; fromNumber?: number | null };
    hooks: Array<{
      id: string;
      type: HookType;
      text: string;
      openingShot: string;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    scenes: Array<{
      id: string;
      order: number;
      purpose: ScenePurpose;
      durationSeconds: number;
      narration: string;
      sound?: string | null;
      onScreenText: string;
      visual: string;
      transitionIn?: SceneTransition | null;
      cta?: string | null;
      factIds: Array<string>;
      lines: Array<{
        speaker: string;
        text: string;
        shot: string;
        reaction: string;
        pauseSeconds: number;
        delivery: string;
      }>;
      direction?: {
        inFrame: ShotSubject;
        framing: ShotFraming;
        setting: string;
        props: string;
      } | null;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    shoot?: { scenario: string; presenter?: string | null } | null;
    captionFlags: Array<{
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    }>;
  }>;
};

export type CreatorBriefQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;

export type CreatorBriefQuery = {
  creatorBrief: {
    text: string;
    fileName: string;
    versionNumber: number;
    approvedAt: string;
    newerDraft?: { number: number; hasNewClaim: boolean } | null;
  };
};

export type WriteScriptMutationVariables = Exact<{
  input: WriteScriptInput;
}>;

export type WriteScriptMutation = {
  writeScript: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type RewriteHookMutationVariables = Exact<{
  input: RewriteHookInput;
}>;

export type RewriteHookMutation = {
  rewriteHook: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type RewriteSceneMutationVariables = Exact<{
  input: RewriteSceneInput;
}>;

export type RewriteSceneMutation = {
  rewriteScene: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type UpdateScriptVersionMutationVariables = Exact<{
  input: UpdateScriptVersionInput;
}>;

export type UpdateScriptVersionMutation = {
  updateScriptVersion: {
    id: string;
    projectId: string;
    number: number;
    status: ScriptVersionStatus;
    angleTitle?: string | null;
    language: ScriptLanguage;
    lengthSeconds: number;
    contentStyle?: ContentStyle | null;
    studio: StudioType;
    selectedHookId?: string | null;
    caption: string;
    spokenSeconds: number;
    totalSeconds: number;
    usedFactIds: Array<string>;
    createdAt: string;
    approvedAt?: string | null;
    origin: { kind: ScriptOriginKind; fromNumber?: number | null };
    hooks: Array<{
      id: string;
      type: HookType;
      text: string;
      openingShot: string;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    scenes: Array<{
      id: string;
      order: number;
      purpose: ScenePurpose;
      durationSeconds: number;
      narration: string;
      sound?: string | null;
      onScreenText: string;
      visual: string;
      transitionIn?: SceneTransition | null;
      cta?: string | null;
      factIds: Array<string>;
      lines: Array<{
        speaker: string;
        text: string;
        shot: string;
        reaction: string;
        pauseSeconds: number;
        delivery: string;
      }>;
      direction?: {
        inFrame: ShotSubject;
        framing: ShotFraming;
        setting: string;
        props: string;
      } | null;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    shoot?: { scenario: string; presenter?: string | null } | null;
    captionFlags: Array<{
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    }>;
  };
};

export type ApproveScriptVersionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type ApproveScriptVersionMutation = {
  approveScriptVersion: {
    id: string;
    projectId: string;
    number: number;
    status: ScriptVersionStatus;
    angleTitle?: string | null;
    language: ScriptLanguage;
    lengthSeconds: number;
    contentStyle?: ContentStyle | null;
    studio: StudioType;
    selectedHookId?: string | null;
    caption: string;
    spokenSeconds: number;
    totalSeconds: number;
    usedFactIds: Array<string>;
    createdAt: string;
    approvedAt?: string | null;
    origin: { kind: ScriptOriginKind; fromNumber?: number | null };
    hooks: Array<{
      id: string;
      type: HookType;
      text: string;
      openingShot: string;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    scenes: Array<{
      id: string;
      order: number;
      purpose: ScenePurpose;
      durationSeconds: number;
      narration: string;
      sound?: string | null;
      onScreenText: string;
      visual: string;
      transitionIn?: SceneTransition | null;
      cta?: string | null;
      factIds: Array<string>;
      lines: Array<{
        speaker: string;
        text: string;
        shot: string;
        reaction: string;
        pauseSeconds: number;
        delivery: string;
      }>;
      direction?: {
        inFrame: ShotSubject;
        framing: ShotFraming;
        setting: string;
        props: string;
      } | null;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    shoot?: { scenario: string; presenter?: string | null } | null;
    captionFlags: Array<{
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    }>;
  };
};

export type CopyScriptVersionMutationVariables = Exact<{
  input: CopyScriptVersionInput;
}>;

export type CopyScriptVersionMutation = {
  copyScriptVersion: {
    id: string;
    projectId: string;
    number: number;
    status: ScriptVersionStatus;
    angleTitle?: string | null;
    language: ScriptLanguage;
    lengthSeconds: number;
    contentStyle?: ContentStyle | null;
    studio: StudioType;
    selectedHookId?: string | null;
    caption: string;
    spokenSeconds: number;
    totalSeconds: number;
    usedFactIds: Array<string>;
    createdAt: string;
    approvedAt?: string | null;
    origin: { kind: ScriptOriginKind; fromNumber?: number | null };
    hooks: Array<{
      id: string;
      type: HookType;
      text: string;
      openingShot: string;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    scenes: Array<{
      id: string;
      order: number;
      purpose: ScenePurpose;
      durationSeconds: number;
      narration: string;
      sound?: string | null;
      onScreenText: string;
      visual: string;
      transitionIn?: SceneTransition | null;
      cta?: string | null;
      factIds: Array<string>;
      lines: Array<{
        speaker: string;
        text: string;
        shot: string;
        reaction: string;
        pauseSeconds: number;
        delivery: string;
      }>;
      direction?: {
        inFrame: ShotSubject;
        framing: ShotFraming;
        setting: string;
        props: string;
      } | null;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    shoot?: { scenario: string; presenter?: string | null } | null;
    captionFlags: Array<{
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    }>;
  };
};

export type VideoEditRecordFragment = {
  id: string;
  projectId: string;
  studio: StudioType;
  totalSeconds: number;
  aiClipsEnabled: boolean;
  updatedAt: string;
  scriptVersion: { id: string; number: number; approvedAt?: string | null };
  newerApprovedVersion?: { id: string; number: number } | null;
  shoot?: { scenario: string; presenter?: string | null } | null;
  clipContext: {
    language: ScriptLanguage;
    tone: Tone;
    openingShot?: string | null;
    genre?: StoryGenre | null;
    cast: Array<{ id: string; name: string; role: string; look: string }>;
  };
  scenes: Array<{
    sceneId: string;
    order: number;
    purpose: ScenePurpose;
    narration: string;
    sound?: string | null;
    visual: string;
    onScreenText: string;
    transitionIn: SceneTransition;
    cta?: string | null;
    durationSeconds: number;
    startSeconds: number;
    lines: Array<{
      speaker: string;
      text: string;
      shot: string;
      reaction: string;
      pauseSeconds: number;
      delivery: string;
    }>;
    clipSound: { on: boolean; levelPercent: number };
    direction?: {
      inFrame: ShotSubject;
      framing: ShotFraming;
      setting: string;
      props: string;
    } | null;
    media?: {
      kind: SceneMediaKind;
      motion: PhotoMotion;
      clipStartSeconds: number;
      asset?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    } | null;
    flags: Array<{
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    }>;
  }>;
  voice: {
    source: VoiceSource;
    voiceId?: string | null;
    speed: number;
    outdated: boolean;
    settingsChanged: boolean;
    pronunciations: Array<{ word: string; sayAs: string }>;
    recording?: {
      id: string;
      projectId: string;
      kind: AssetKind;
      purpose: AssetPurpose;
      origin: AssetOrigin;
      status: AssetStatus;
      fileName: string;
      sizeBytes: number;
      durationSeconds?: number | null;
      previewUrl?: string | null;
      createdAt: string;
      aiClip?: {
        jobId: string;
        sceneId: string;
        sourceAssetId?: string | null;
        mode: SceneClipMode;
        endAssetId?: string | null;
        referenceAssetIds: Array<string>;
        continuitySceneId?: string | null;
        continuityAssetId?: string | null;
        label: string;
        prompt: string;
        checkedAt?: string | null;
      } | null;
    } | null;
    track?: {
      id: string;
      source: VoiceSource;
      voiceName?: string | null;
      speed: number;
      scriptVersionNumber: number;
      recordingFileName?: string | null;
      durationMs: number;
      createdAt: string;
      segments: Array<{
        sceneId: string;
        audioUrl?: string | null;
        offsetMs: number;
        durationMs: number;
      }>;
    } | null;
  };
  captions: {
    enabled: boolean;
    style: CaptionStyle;
    editable: boolean;
    lines: Array<{
      id: string;
      sceneId: string;
      startMs: number;
      endMs: number;
      text: string;
      edited: boolean;
      words: Array<{ text: string; startMs: number; endMs: number }>;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
  };
  music: {
    levelPercent: number;
    asset?: {
      id: string;
      projectId: string;
      kind: AssetKind;
      purpose: AssetPurpose;
      origin: AssetOrigin;
      status: AssetStatus;
      fileName: string;
      sizeBytes: number;
      durationSeconds?: number | null;
      previewUrl?: string | null;
      createdAt: string;
      aiClip?: {
        jobId: string;
        sceneId: string;
        sourceAssetId?: string | null;
        mode: SceneClipMode;
        endAssetId?: string | null;
        referenceAssetIds: Array<string>;
        continuitySceneId?: string | null;
        continuityAssetId?: string | null;
        label: string;
        prompt: string;
        checkedAt?: string | null;
      } | null;
    } | null;
  };
  endCard: {
    enabled: boolean;
    durationSeconds: number;
    productTitle?: string | null;
    cta?: string | null;
    storyTitle?: string | null;
    endLine?: string | null;
  };
  postCaption: {
    text: string;
    adTag: boolean;
    flags: Array<{
      category: ClaimFlagCategory;
      lead: string;
      reason: string;
      claim: string;
    }>;
  };
  readiness: {
    mediaComplete: boolean;
    missingMediaCount: number;
    voiceSettled: boolean;
    voiceOutdated: boolean;
    blocking: Array<VideoEditBlocker>;
  };
  consistentItems: Array<{
    id: string;
    kind: ConsistentItemKind;
    name: string;
    sceneIds: Array<string>;
    likenessConfirmed: boolean;
    photo?: {
      id: string;
      projectId: string;
      kind: AssetKind;
      purpose: AssetPurpose;
      origin: AssetOrigin;
      status: AssetStatus;
      fileName: string;
      sizeBytes: number;
      durationSeconds?: number | null;
      previewUrl?: string | null;
      createdAt: string;
      aiClip?: {
        jobId: string;
        sceneId: string;
        sourceAssetId?: string | null;
        mode: SceneClipMode;
        endAssetId?: string | null;
        referenceAssetIds: Array<string>;
        continuitySceneId?: string | null;
        continuityAssetId?: string | null;
        label: string;
        prompt: string;
        checkedAt?: string | null;
      } | null;
    } | null;
  }>;
};

export type VideoEditQueryVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;

export type VideoEditQuery = {
  videoEdit?: {
    id: string;
    projectId: string;
    studio: StudioType;
    totalSeconds: number;
    aiClipsEnabled: boolean;
    updatedAt: string;
    scriptVersion: { id: string; number: number; approvedAt?: string | null };
    newerApprovedVersion?: { id: string; number: number } | null;
    shoot?: { scenario: string; presenter?: string | null } | null;
    clipContext: {
      language: ScriptLanguage;
      tone: Tone;
      openingShot?: string | null;
      genre?: StoryGenre | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    };
    scenes: Array<{
      sceneId: string;
      order: number;
      purpose: ScenePurpose;
      narration: string;
      sound?: string | null;
      visual: string;
      onScreenText: string;
      transitionIn: SceneTransition;
      cta?: string | null;
      durationSeconds: number;
      startSeconds: number;
      lines: Array<{
        speaker: string;
        text: string;
        shot: string;
        reaction: string;
        pauseSeconds: number;
        delivery: string;
      }>;
      clipSound: { on: boolean; levelPercent: number };
      direction?: {
        inFrame: ShotSubject;
        framing: ShotFraming;
        setting: string;
        props: string;
      } | null;
      media?: {
        kind: SceneMediaKind;
        motion: PhotoMotion;
        clipStartSeconds: number;
        asset?: {
          id: string;
          projectId: string;
          kind: AssetKind;
          purpose: AssetPurpose;
          origin: AssetOrigin;
          status: AssetStatus;
          fileName: string;
          sizeBytes: number;
          durationSeconds?: number | null;
          previewUrl?: string | null;
          createdAt: string;
          aiClip?: {
            jobId: string;
            sceneId: string;
            sourceAssetId?: string | null;
            mode: SceneClipMode;
            endAssetId?: string | null;
            referenceAssetIds: Array<string>;
            continuitySceneId?: string | null;
            continuityAssetId?: string | null;
            label: string;
            prompt: string;
            checkedAt?: string | null;
          } | null;
        } | null;
      } | null;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    voice: {
      source: VoiceSource;
      voiceId?: string | null;
      speed: number;
      outdated: boolean;
      settingsChanged: boolean;
      pronunciations: Array<{ word: string; sayAs: string }>;
      recording?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
      track?: {
        id: string;
        source: VoiceSource;
        voiceName?: string | null;
        speed: number;
        scriptVersionNumber: number;
        recordingFileName?: string | null;
        durationMs: number;
        createdAt: string;
        segments: Array<{
          sceneId: string;
          audioUrl?: string | null;
          offsetMs: number;
          durationMs: number;
        }>;
      } | null;
    };
    captions: {
      enabled: boolean;
      style: CaptionStyle;
      editable: boolean;
      lines: Array<{
        id: string;
        sceneId: string;
        startMs: number;
        endMs: number;
        text: string;
        edited: boolean;
        words: Array<{ text: string; startMs: number; endMs: number }>;
        flags: Array<{
          category: ClaimFlagCategory;
          lead: string;
          reason: string;
          claim: string;
        }>;
      }>;
    };
    music: {
      levelPercent: number;
      asset?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    };
    endCard: {
      enabled: boolean;
      durationSeconds: number;
      productTitle?: string | null;
      cta?: string | null;
      storyTitle?: string | null;
      endLine?: string | null;
    };
    postCaption: {
      text: string;
      adTag: boolean;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    };
    readiness: {
      mediaComplete: boolean;
      missingMediaCount: number;
      voiceSettled: boolean;
      voiceOutdated: boolean;
      blocking: Array<VideoEditBlocker>;
    };
    consistentItems: Array<{
      id: string;
      kind: ConsistentItemKind;
      name: string;
      sceneIds: Array<string>;
      likenessConfirmed: boolean;
      photo?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    }>;
  } | null;
};

export type StartVideoEditMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;

export type StartVideoEditMutation = {
  startVideoEdit: {
    id: string;
    projectId: string;
    studio: StudioType;
    totalSeconds: number;
    aiClipsEnabled: boolean;
    updatedAt: string;
    scriptVersion: { id: string; number: number; approvedAt?: string | null };
    newerApprovedVersion?: { id: string; number: number } | null;
    shoot?: { scenario: string; presenter?: string | null } | null;
    clipContext: {
      language: ScriptLanguage;
      tone: Tone;
      openingShot?: string | null;
      genre?: StoryGenre | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    };
    scenes: Array<{
      sceneId: string;
      order: number;
      purpose: ScenePurpose;
      narration: string;
      sound?: string | null;
      visual: string;
      onScreenText: string;
      transitionIn: SceneTransition;
      cta?: string | null;
      durationSeconds: number;
      startSeconds: number;
      lines: Array<{
        speaker: string;
        text: string;
        shot: string;
        reaction: string;
        pauseSeconds: number;
        delivery: string;
      }>;
      clipSound: { on: boolean; levelPercent: number };
      direction?: {
        inFrame: ShotSubject;
        framing: ShotFraming;
        setting: string;
        props: string;
      } | null;
      media?: {
        kind: SceneMediaKind;
        motion: PhotoMotion;
        clipStartSeconds: number;
        asset?: {
          id: string;
          projectId: string;
          kind: AssetKind;
          purpose: AssetPurpose;
          origin: AssetOrigin;
          status: AssetStatus;
          fileName: string;
          sizeBytes: number;
          durationSeconds?: number | null;
          previewUrl?: string | null;
          createdAt: string;
          aiClip?: {
            jobId: string;
            sceneId: string;
            sourceAssetId?: string | null;
            mode: SceneClipMode;
            endAssetId?: string | null;
            referenceAssetIds: Array<string>;
            continuitySceneId?: string | null;
            continuityAssetId?: string | null;
            label: string;
            prompt: string;
            checkedAt?: string | null;
          } | null;
        } | null;
      } | null;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    voice: {
      source: VoiceSource;
      voiceId?: string | null;
      speed: number;
      outdated: boolean;
      settingsChanged: boolean;
      pronunciations: Array<{ word: string; sayAs: string }>;
      recording?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
      track?: {
        id: string;
        source: VoiceSource;
        voiceName?: string | null;
        speed: number;
        scriptVersionNumber: number;
        recordingFileName?: string | null;
        durationMs: number;
        createdAt: string;
        segments: Array<{
          sceneId: string;
          audioUrl?: string | null;
          offsetMs: number;
          durationMs: number;
        }>;
      } | null;
    };
    captions: {
      enabled: boolean;
      style: CaptionStyle;
      editable: boolean;
      lines: Array<{
        id: string;
        sceneId: string;
        startMs: number;
        endMs: number;
        text: string;
        edited: boolean;
        words: Array<{ text: string; startMs: number; endMs: number }>;
        flags: Array<{
          category: ClaimFlagCategory;
          lead: string;
          reason: string;
          claim: string;
        }>;
      }>;
    };
    music: {
      levelPercent: number;
      asset?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    };
    endCard: {
      enabled: boolean;
      durationSeconds: number;
      productTitle?: string | null;
      cta?: string | null;
      storyTitle?: string | null;
      endLine?: string | null;
    };
    postCaption: {
      text: string;
      adTag: boolean;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    };
    readiness: {
      mediaComplete: boolean;
      missingMediaCount: number;
      voiceSettled: boolean;
      voiceOutdated: boolean;
      blocking: Array<VideoEditBlocker>;
    };
    consistentItems: Array<{
      id: string;
      kind: ConsistentItemKind;
      name: string;
      sceneIds: Array<string>;
      likenessConfirmed: boolean;
      photo?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    }>;
  };
};

export type UpdateVideoEditMutationVariables = Exact<{
  input: UpdateVideoEditInput;
}>;

export type UpdateVideoEditMutation = {
  updateVideoEdit: {
    id: string;
    projectId: string;
    studio: StudioType;
    totalSeconds: number;
    aiClipsEnabled: boolean;
    updatedAt: string;
    scriptVersion: { id: string; number: number; approvedAt?: string | null };
    newerApprovedVersion?: { id: string; number: number } | null;
    shoot?: { scenario: string; presenter?: string | null } | null;
    clipContext: {
      language: ScriptLanguage;
      tone: Tone;
      openingShot?: string | null;
      genre?: StoryGenre | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    };
    scenes: Array<{
      sceneId: string;
      order: number;
      purpose: ScenePurpose;
      narration: string;
      sound?: string | null;
      visual: string;
      onScreenText: string;
      transitionIn: SceneTransition;
      cta?: string | null;
      durationSeconds: number;
      startSeconds: number;
      lines: Array<{
        speaker: string;
        text: string;
        shot: string;
        reaction: string;
        pauseSeconds: number;
        delivery: string;
      }>;
      clipSound: { on: boolean; levelPercent: number };
      direction?: {
        inFrame: ShotSubject;
        framing: ShotFraming;
        setting: string;
        props: string;
      } | null;
      media?: {
        kind: SceneMediaKind;
        motion: PhotoMotion;
        clipStartSeconds: number;
        asset?: {
          id: string;
          projectId: string;
          kind: AssetKind;
          purpose: AssetPurpose;
          origin: AssetOrigin;
          status: AssetStatus;
          fileName: string;
          sizeBytes: number;
          durationSeconds?: number | null;
          previewUrl?: string | null;
          createdAt: string;
          aiClip?: {
            jobId: string;
            sceneId: string;
            sourceAssetId?: string | null;
            mode: SceneClipMode;
            endAssetId?: string | null;
            referenceAssetIds: Array<string>;
            continuitySceneId?: string | null;
            continuityAssetId?: string | null;
            label: string;
            prompt: string;
            checkedAt?: string | null;
          } | null;
        } | null;
      } | null;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    voice: {
      source: VoiceSource;
      voiceId?: string | null;
      speed: number;
      outdated: boolean;
      settingsChanged: boolean;
      pronunciations: Array<{ word: string; sayAs: string }>;
      recording?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
      track?: {
        id: string;
        source: VoiceSource;
        voiceName?: string | null;
        speed: number;
        scriptVersionNumber: number;
        recordingFileName?: string | null;
        durationMs: number;
        createdAt: string;
        segments: Array<{
          sceneId: string;
          audioUrl?: string | null;
          offsetMs: number;
          durationMs: number;
        }>;
      } | null;
    };
    captions: {
      enabled: boolean;
      style: CaptionStyle;
      editable: boolean;
      lines: Array<{
        id: string;
        sceneId: string;
        startMs: number;
        endMs: number;
        text: string;
        edited: boolean;
        words: Array<{ text: string; startMs: number; endMs: number }>;
        flags: Array<{
          category: ClaimFlagCategory;
          lead: string;
          reason: string;
          claim: string;
        }>;
      }>;
    };
    music: {
      levelPercent: number;
      asset?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    };
    endCard: {
      enabled: boolean;
      durationSeconds: number;
      productTitle?: string | null;
      cta?: string | null;
      storyTitle?: string | null;
      endLine?: string | null;
    };
    postCaption: {
      text: string;
      adTag: boolean;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    };
    readiness: {
      mediaComplete: boolean;
      missingMediaCount: number;
      voiceSettled: boolean;
      voiceOutdated: boolean;
      blocking: Array<VideoEditBlocker>;
    };
    consistentItems: Array<{
      id: string;
      kind: ConsistentItemKind;
      name: string;
      sceneIds: Array<string>;
      likenessConfirmed: boolean;
      photo?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    }>;
  };
};

export type AutoFillSceneMediaMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;

export type AutoFillSceneMediaMutation = {
  autoFillSceneMedia: {
    id: string;
    projectId: string;
    studio: StudioType;
    totalSeconds: number;
    aiClipsEnabled: boolean;
    updatedAt: string;
    scriptVersion: { id: string; number: number; approvedAt?: string | null };
    newerApprovedVersion?: { id: string; number: number } | null;
    shoot?: { scenario: string; presenter?: string | null } | null;
    clipContext: {
      language: ScriptLanguage;
      tone: Tone;
      openingShot?: string | null;
      genre?: StoryGenre | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    };
    scenes: Array<{
      sceneId: string;
      order: number;
      purpose: ScenePurpose;
      narration: string;
      sound?: string | null;
      visual: string;
      onScreenText: string;
      transitionIn: SceneTransition;
      cta?: string | null;
      durationSeconds: number;
      startSeconds: number;
      lines: Array<{
        speaker: string;
        text: string;
        shot: string;
        reaction: string;
        pauseSeconds: number;
        delivery: string;
      }>;
      clipSound: { on: boolean; levelPercent: number };
      direction?: {
        inFrame: ShotSubject;
        framing: ShotFraming;
        setting: string;
        props: string;
      } | null;
      media?: {
        kind: SceneMediaKind;
        motion: PhotoMotion;
        clipStartSeconds: number;
        asset?: {
          id: string;
          projectId: string;
          kind: AssetKind;
          purpose: AssetPurpose;
          origin: AssetOrigin;
          status: AssetStatus;
          fileName: string;
          sizeBytes: number;
          durationSeconds?: number | null;
          previewUrl?: string | null;
          createdAt: string;
          aiClip?: {
            jobId: string;
            sceneId: string;
            sourceAssetId?: string | null;
            mode: SceneClipMode;
            endAssetId?: string | null;
            referenceAssetIds: Array<string>;
            continuitySceneId?: string | null;
            continuityAssetId?: string | null;
            label: string;
            prompt: string;
            checkedAt?: string | null;
          } | null;
        } | null;
      } | null;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    voice: {
      source: VoiceSource;
      voiceId?: string | null;
      speed: number;
      outdated: boolean;
      settingsChanged: boolean;
      pronunciations: Array<{ word: string; sayAs: string }>;
      recording?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
      track?: {
        id: string;
        source: VoiceSource;
        voiceName?: string | null;
        speed: number;
        scriptVersionNumber: number;
        recordingFileName?: string | null;
        durationMs: number;
        createdAt: string;
        segments: Array<{
          sceneId: string;
          audioUrl?: string | null;
          offsetMs: number;
          durationMs: number;
        }>;
      } | null;
    };
    captions: {
      enabled: boolean;
      style: CaptionStyle;
      editable: boolean;
      lines: Array<{
        id: string;
        sceneId: string;
        startMs: number;
        endMs: number;
        text: string;
        edited: boolean;
        words: Array<{ text: string; startMs: number; endMs: number }>;
        flags: Array<{
          category: ClaimFlagCategory;
          lead: string;
          reason: string;
          claim: string;
        }>;
      }>;
    };
    music: {
      levelPercent: number;
      asset?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    };
    endCard: {
      enabled: boolean;
      durationSeconds: number;
      productTitle?: string | null;
      cta?: string | null;
      storyTitle?: string | null;
      endLine?: string | null;
    };
    postCaption: {
      text: string;
      adTag: boolean;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    };
    readiness: {
      mediaComplete: boolean;
      missingMediaCount: number;
      voiceSettled: boolean;
      voiceOutdated: boolean;
      blocking: Array<VideoEditBlocker>;
    };
    consistentItems: Array<{
      id: string;
      kind: ConsistentItemKind;
      name: string;
      sceneIds: Array<string>;
      likenessConfirmed: boolean;
      photo?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    }>;
  };
};

export type SwitchVideoEditVersionMutationVariables = Exact<{
  input: SwitchVideoEditVersionInput;
}>;

export type SwitchVideoEditVersionMutation = {
  switchVideoEditVersion: {
    id: string;
    projectId: string;
    studio: StudioType;
    totalSeconds: number;
    aiClipsEnabled: boolean;
    updatedAt: string;
    scriptVersion: { id: string; number: number; approvedAt?: string | null };
    newerApprovedVersion?: { id: string; number: number } | null;
    shoot?: { scenario: string; presenter?: string | null } | null;
    clipContext: {
      language: ScriptLanguage;
      tone: Tone;
      openingShot?: string | null;
      genre?: StoryGenre | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    };
    scenes: Array<{
      sceneId: string;
      order: number;
      purpose: ScenePurpose;
      narration: string;
      sound?: string | null;
      visual: string;
      onScreenText: string;
      transitionIn: SceneTransition;
      cta?: string | null;
      durationSeconds: number;
      startSeconds: number;
      lines: Array<{
        speaker: string;
        text: string;
        shot: string;
        reaction: string;
        pauseSeconds: number;
        delivery: string;
      }>;
      clipSound: { on: boolean; levelPercent: number };
      direction?: {
        inFrame: ShotSubject;
        framing: ShotFraming;
        setting: string;
        props: string;
      } | null;
      media?: {
        kind: SceneMediaKind;
        motion: PhotoMotion;
        clipStartSeconds: number;
        asset?: {
          id: string;
          projectId: string;
          kind: AssetKind;
          purpose: AssetPurpose;
          origin: AssetOrigin;
          status: AssetStatus;
          fileName: string;
          sizeBytes: number;
          durationSeconds?: number | null;
          previewUrl?: string | null;
          createdAt: string;
          aiClip?: {
            jobId: string;
            sceneId: string;
            sourceAssetId?: string | null;
            mode: SceneClipMode;
            endAssetId?: string | null;
            referenceAssetIds: Array<string>;
            continuitySceneId?: string | null;
            continuityAssetId?: string | null;
            label: string;
            prompt: string;
            checkedAt?: string | null;
          } | null;
        } | null;
      } | null;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    voice: {
      source: VoiceSource;
      voiceId?: string | null;
      speed: number;
      outdated: boolean;
      settingsChanged: boolean;
      pronunciations: Array<{ word: string; sayAs: string }>;
      recording?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
      track?: {
        id: string;
        source: VoiceSource;
        voiceName?: string | null;
        speed: number;
        scriptVersionNumber: number;
        recordingFileName?: string | null;
        durationMs: number;
        createdAt: string;
        segments: Array<{
          sceneId: string;
          audioUrl?: string | null;
          offsetMs: number;
          durationMs: number;
        }>;
      } | null;
    };
    captions: {
      enabled: boolean;
      style: CaptionStyle;
      editable: boolean;
      lines: Array<{
        id: string;
        sceneId: string;
        startMs: number;
        endMs: number;
        text: string;
        edited: boolean;
        words: Array<{ text: string; startMs: number; endMs: number }>;
        flags: Array<{
          category: ClaimFlagCategory;
          lead: string;
          reason: string;
          claim: string;
        }>;
      }>;
    };
    music: {
      levelPercent: number;
      asset?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    };
    endCard: {
      enabled: boolean;
      durationSeconds: number;
      productTitle?: string | null;
      cta?: string | null;
      storyTitle?: string | null;
      endLine?: string | null;
    };
    postCaption: {
      text: string;
      adTag: boolean;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    };
    readiness: {
      mediaComplete: boolean;
      missingMediaCount: number;
      voiceSettled: boolean;
      voiceOutdated: boolean;
      blocking: Array<VideoEditBlocker>;
    };
    consistentItems: Array<{
      id: string;
      kind: ConsistentItemKind;
      name: string;
      sceneIds: Array<string>;
      likenessConfirmed: boolean;
      photo?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    }>;
  };
};

export type VoiceOptionsQueryVariables = Exact<{ [key: string]: never }>;

export type VoiceOptionsQuery = {
  voiceOptions: Array<{
    id: string;
    name: string;
    descriptor: string;
    sampleUrl?: string | null;
  }>;
};

export type GenerateVoiceoverMutationVariables = Exact<{
  input: VoiceJobInput;
}>;

export type GenerateVoiceoverMutation = {
  generateVoiceover: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type AlignRecordingMutationVariables = Exact<{
  input: VoiceJobInput;
}>;

export type AlignRecordingMutation = {
  alignRecording: {
    id: string;
    projectId: string;
    type: GenerationJobType;
    status: GenerationJobStatus;
    step: number;
    stepCount: number;
    creditCost: number;
    versionId?: string | null;
    hookId?: string | null;
    sceneId?: string | null;
    sourceAssetId?: string | null;
    prompt?: string | null;
    clipMode?: SceneClipMode | null;
    clipCount?: number | null;
    clipSeconds?: number | null;
    endAssetId?: string | null;
    referenceAssetIds?: Array<string> | null;
    continuitySceneId?: string | null;
    continuityAssetId?: string | null;
    resultVersionId?: string | null;
    failureCode?: GenerationFailureCode | null;
    createdAt: string;
    startedAt?: string | null;
    finishedAt?: string | null;
  };
};

export type ResetCaptionsMutationVariables = Exact<{
  projectId: Scalars['ID']['input'];
}>;

export type ResetCaptionsMutation = {
  resetCaptions: {
    id: string;
    projectId: string;
    studio: StudioType;
    totalSeconds: number;
    aiClipsEnabled: boolean;
    updatedAt: string;
    scriptVersion: { id: string; number: number; approvedAt?: string | null };
    newerApprovedVersion?: { id: string; number: number } | null;
    shoot?: { scenario: string; presenter?: string | null } | null;
    clipContext: {
      language: ScriptLanguage;
      tone: Tone;
      openingShot?: string | null;
      genre?: StoryGenre | null;
      cast: Array<{ id: string; name: string; role: string; look: string }>;
    };
    scenes: Array<{
      sceneId: string;
      order: number;
      purpose: ScenePurpose;
      narration: string;
      sound?: string | null;
      visual: string;
      onScreenText: string;
      transitionIn: SceneTransition;
      cta?: string | null;
      durationSeconds: number;
      startSeconds: number;
      lines: Array<{
        speaker: string;
        text: string;
        shot: string;
        reaction: string;
        pauseSeconds: number;
        delivery: string;
      }>;
      clipSound: { on: boolean; levelPercent: number };
      direction?: {
        inFrame: ShotSubject;
        framing: ShotFraming;
        setting: string;
        props: string;
      } | null;
      media?: {
        kind: SceneMediaKind;
        motion: PhotoMotion;
        clipStartSeconds: number;
        asset?: {
          id: string;
          projectId: string;
          kind: AssetKind;
          purpose: AssetPurpose;
          origin: AssetOrigin;
          status: AssetStatus;
          fileName: string;
          sizeBytes: number;
          durationSeconds?: number | null;
          previewUrl?: string | null;
          createdAt: string;
          aiClip?: {
            jobId: string;
            sceneId: string;
            sourceAssetId?: string | null;
            mode: SceneClipMode;
            endAssetId?: string | null;
            referenceAssetIds: Array<string>;
            continuitySceneId?: string | null;
            continuityAssetId?: string | null;
            label: string;
            prompt: string;
            checkedAt?: string | null;
          } | null;
        } | null;
      } | null;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    }>;
    voice: {
      source: VoiceSource;
      voiceId?: string | null;
      speed: number;
      outdated: boolean;
      settingsChanged: boolean;
      pronunciations: Array<{ word: string; sayAs: string }>;
      recording?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
      track?: {
        id: string;
        source: VoiceSource;
        voiceName?: string | null;
        speed: number;
        scriptVersionNumber: number;
        recordingFileName?: string | null;
        durationMs: number;
        createdAt: string;
        segments: Array<{
          sceneId: string;
          audioUrl?: string | null;
          offsetMs: number;
          durationMs: number;
        }>;
      } | null;
    };
    captions: {
      enabled: boolean;
      style: CaptionStyle;
      editable: boolean;
      lines: Array<{
        id: string;
        sceneId: string;
        startMs: number;
        endMs: number;
        text: string;
        edited: boolean;
        words: Array<{ text: string; startMs: number; endMs: number }>;
        flags: Array<{
          category: ClaimFlagCategory;
          lead: string;
          reason: string;
          claim: string;
        }>;
      }>;
    };
    music: {
      levelPercent: number;
      asset?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    };
    endCard: {
      enabled: boolean;
      durationSeconds: number;
      productTitle?: string | null;
      cta?: string | null;
      storyTitle?: string | null;
      endLine?: string | null;
    };
    postCaption: {
      text: string;
      adTag: boolean;
      flags: Array<{
        category: ClaimFlagCategory;
        lead: string;
        reason: string;
        claim: string;
      }>;
    };
    readiness: {
      mediaComplete: boolean;
      missingMediaCount: number;
      voiceSettled: boolean;
      voiceOutdated: boolean;
      blocking: Array<VideoEditBlocker>;
    };
    consistentItems: Array<{
      id: string;
      kind: ConsistentItemKind;
      name: string;
      sceneIds: Array<string>;
      likenessConfirmed: boolean;
      photo?: {
        id: string;
        projectId: string;
        kind: AssetKind;
        purpose: AssetPurpose;
        origin: AssetOrigin;
        status: AssetStatus;
        fileName: string;
        sizeBytes: number;
        durationSeconds?: number | null;
        previewUrl?: string | null;
        createdAt: string;
        aiClip?: {
          jobId: string;
          sceneId: string;
          sourceAssetId?: string | null;
          mode: SceneClipMode;
          endAssetId?: string | null;
          referenceAssetIds: Array<string>;
          continuitySceneId?: string | null;
          continuityAssetId?: string | null;
          label: string;
          prompt: string;
          checkedAt?: string | null;
        } | null;
      } | null;
    }>;
  };
};
