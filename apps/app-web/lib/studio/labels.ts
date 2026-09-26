import {
  AngleType,
  ContentStyle,
  FactSource,
  FactStatus,
  FieldSource,
  GenerationFailureCode,
  GenerationJobType,
  HookType,
  Platform,
  ProjectStage,
  ProjectStepKey,
  ScenePurpose,
  SceneTransition,
  ScriptLanguage,
  ScriptVersionStatus,
  ShotFraming,
  ShotSubject,
  Tone,
} from '@/react-query/generated__types';

/** Readable copy for API enums, per the Design Reference. */

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export const STAGE_BADGE: Record<
  ProjectStage,
  { label: string; tone: BadgeTone }
> = {
  [ProjectStage.Draft]: { label: 'Draft', tone: 'neutral' },
  [ProjectStage.ReviewingFacts]: { label: 'Reviewing facts', tone: 'info' },
  [ProjectStage.WritingScript]: { label: 'Writing script', tone: 'info' },
  [ProjectStage.ScriptApproved]: { label: 'Script approved', tone: 'success' },
  [ProjectStage.ChoosingMedia]: { label: 'Choosing media', tone: 'info' },
  [ProjectStage.Generating]: { label: 'Generating', tone: 'neutral' },
  [ProjectStage.ReadyToExport]: { label: 'Ready to export', tone: 'success' },
  [ProjectStage.Exported]: { label: 'Exported', tone: 'success' },
};

export const STEP_LABEL: Record<ProjectStepKey, string> = {
  [ProjectStepKey.Story]: 'Story',
  [ProjectStepKey.Product]: 'Product',
  [ProjectStepKey.Facts]: 'Facts',
  [ProjectStepKey.Strategy]: 'Strategy',
  [ProjectStepKey.Script]: 'Script',
  [ProjectStepKey.Media]: 'Media',
  [ProjectStepKey.Voice]: 'Voice',
  [ProjectStepKey.Edit]: 'Edit & preview',
  [ProjectStepKey.Brief]: 'Creator brief',
  [ProjectStepKey.Export]: 'Export video',
};

export const STEP_PATH: Record<ProjectStepKey, string> = {
  [ProjectStepKey.Story]: 'story',
  [ProjectStepKey.Product]: 'product',
  [ProjectStepKey.Facts]: 'facts',
  [ProjectStepKey.Strategy]: 'strategy',
  [ProjectStepKey.Script]: 'script',
  [ProjectStepKey.Media]: 'media',
  [ProjectStepKey.Voice]: 'voice',
  [ProjectStepKey.Edit]: 'edit',
  [ProjectStepKey.Brief]: 'brief',
  [ProjectStepKey.Export]: 'export',
};

export const STEP_FOR_PATH: Record<string, ProjectStepKey | undefined> = {
  story: ProjectStepKey.Story,
  product: ProjectStepKey.Product,
  facts: ProjectStepKey.Facts,
  strategy: ProjectStepKey.Strategy,
  script: ProjectStepKey.Script,
  media: ProjectStepKey.Media,
  voice: ProjectStepKey.Voice,
  edit: ProjectStepKey.Edit,
  brief: ProjectStepKey.Brief,
  export: ProjectStepKey.Export,
};

export const FIELD_SOURCE_BADGE: Record<
  FieldSource,
  { label: string; tone: BadgeTone }
> = {
  [FieldSource.Imported]: { label: 'Imported', tone: 'info' },
  [FieldSource.Creator]: { label: 'You entered', tone: 'neutral' },
  [FieldSource.Edited]: { label: 'Edited', tone: 'warning' },
};

export const FACT_STATUS_BADGE: Record<
  FactStatus,
  { label: string; tone: BadgeTone }
> = {
  [FactStatus.Unreviewed]: { label: 'Needs review', tone: 'warning' },
  [FactStatus.Approved]: { label: 'Approved', tone: 'success' },
  [FactStatus.Rejected]: { label: 'Rejected', tone: 'danger' },
  [FactStatus.Unknown]: { label: 'Unknown', tone: 'neutral' },
};

export const FACT_SOURCE_LABEL: Record<FactSource, string> = {
  [FactSource.Listing]: 'From the listing',
  [FactSource.Creator]: 'You entered',
  [FactSource.Edited]: 'Edited from the listing',
  [FactSource.NotStated]: 'Not stated in the listing',
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  [Platform.TiktokShop]: 'TikTok Shop',
  [Platform.ShopeeVideo]: 'Shopee Video',
  [Platform.Other]: 'Other',
};

export const LANGUAGE_LABEL: Record<ScriptLanguage, string> = {
  [ScriptLanguage.English]: 'English',
  [ScriptLanguage.Filipino]: 'Filipino',
  [ScriptLanguage.Taglish]: 'Taglish',
};

export const TONE_LABEL: Record<Tone, string> = {
  [Tone.Friendly]: 'Friendly',
  [Tone.Energetic]: 'Energetic',
  [Tone.Calm]: 'Calm',
  [Tone.StraightTalking]: 'Straight-talking',
};

export const CONTENT_STYLE_LABEL: Record<ContentStyle, string> = {
  [ContentStyle.VoiceoverProductShots]: 'Voiceover on product shots',
  [ContentStyle.TalkingToCamera]: 'Talking to camera',
  [ContentStyle.TextOnly]: 'Text-only captions',
  [ContentStyle.HandsOnDemo]: 'Hands-on demo',
  [ContentStyle.Skit]: 'Skit with live sound',
  [ContentStyle.Narration]: 'Narrated story',
};

/** Shown under the content style chips when Skit is picked (§3.22). */
export const SKIT_STYLE_HINT =
  'People act out a short scene. Viewers hear what they say and the real sound, not a narrator.';

export const ANGLE_TYPE_LABEL: Record<AngleType, string> = {
  [AngleType.UseCase]: 'Use case',
  [AngleType.FeatureDemo]: 'Feature demo',
  [AngleType.ProblemSolution]: 'Problem → solution',
  [AngleType.Routine]: 'Routine',
  [AngleType.GiftIdea]: 'Gift idea',
};

export const HOOK_TYPE_LABEL: Record<HookType, string> = {
  [HookType.ProblemFirst]: 'Problem first',
  [HookType.Question]: 'Question',
  [HookType.ShowDontTell]: 'Show, don’t tell',
  [HookType.RelatableMoment]: 'Relatable moment',
  [HookType.DirectPitch]: 'Direct pitch',
  [HookType.ColdOpen]: 'Cold open',
  [HookType.FlashForward]: 'Flash-forward',
  [HookType.Mystery]: 'Mystery',
};

export const SHOT_SUBJECT_LABEL: Record<ShotSubject, string> = {
  [ShotSubject.Creator]: 'You on camera',
  [ShotSubject.Hands]: 'Hands only',
  [ShotSubject.ProductOnly]: 'Product only',
};

export const SHOT_FRAMING_LABEL: Record<ShotFraming, string> = {
  [ShotFraming.CloseUp]: 'Close-up',
  [ShotFraming.Medium]: 'Medium',
  [ShotFraming.Wide]: 'Wide',
  [ShotFraming.Overhead]: 'Overhead',
  [ShotFraming.Pov]: 'POV',
};

export const SCENE_PURPOSE_LABEL: Record<ScenePurpose, string> = {
  [ScenePurpose.Hook]: 'Hook',
  [ScenePurpose.Problem]: 'Problem',
  [ScenePurpose.Demo]: 'Demo',
  [ScenePurpose.Feature]: 'Feature',
  [ScenePurpose.Proof]: 'Proof',
  [ScenePurpose.CallToAction]: 'Call to action',
  [ScenePurpose.Setup]: 'Setup',
  [ScenePurpose.Build]: 'Build-up',
  [ScenePurpose.Turn]: 'Turn',
  [ScenePurpose.Payoff]: 'Cliffhanger',
};

export const SCENE_TRANSITION_LABEL: Record<SceneTransition, string> = {
  [SceneTransition.Cut]: 'Cut',
  [SceneTransition.PunchIn]: 'Punch-in',
  [SceneTransition.Whip]: 'Whip',
  [SceneTransition.Dissolve]: 'Dissolve',
};

export const SCENE_TRANSITION_HINT: Record<SceneTransition, string> = {
  [SceneTransition.Cut]: 'Goes straight to this scene.',
  [SceneTransition.PunchIn]: 'Cuts in close, then eases back.',
  [SceneTransition.Whip]: 'Slides in fast from the side. Best used once.',
  [SceneTransition.Dissolve]:
    'Fades in slowly. For time passing, like before and after.',
};

export const VERSION_STATUS_BADGE: Record<
  ScriptVersionStatus,
  { label: string; tone: BadgeTone }
> = {
  [ScriptVersionStatus.Draft]: { label: 'Draft', tone: 'neutral' },
  [ScriptVersionStatus.Approved]: { label: 'Approved', tone: 'success' },
  [ScriptVersionStatus.NeedsReview]: { label: 'Needs review', tone: 'warning' },
};

const OTHER_CAUSE = 'Something went wrong on our side.';

/** Which service a job's provider failures name in their cause sentence. */
const SERVICE_BY_JOB: Record<
  GenerationJobType,
  'writing' | 'voice' | 'render' | 'video'
> = {
  [GenerationJobType.SuggestAngles]: 'writing',
  [GenerationJobType.SuggestAudiences]: 'writing',
  [GenerationJobType.SuggestPremises]: 'writing',
  [GenerationJobType.WriteScript]: 'writing',
  [GenerationJobType.RewriteHook]: 'writing',
  [GenerationJobType.RewriteScene]: 'writing',
  [GenerationJobType.GenerateVoiceover]: 'voice',
  [GenerationJobType.AlignRecording]: 'voice',
  [GenerationJobType.RenderVideo]: 'render',
  [GenerationJobType.GenerateSceneClips]: 'video',
};

/**
 * Cause sentence for a failed job (Design Reference §7 and the §5B Batch 2
 * failure copy). Provider failures name the service the job used; codes a job
 * type can't produce fall back to the shared “Other” sentence.
 */
export function failureCause(
  type: GenerationJobType,
  code: GenerationFailureCode | null | undefined,
): string {
  const service = SERVICE_BY_JOB[type];

  switch (code) {
    case GenerationFailureCode.ProviderTimeout:
      return service === 'render'
        ? OTHER_CAUSE
        : service === 'video'
          ? 'The video service timed out after 10 minutes.'
          : service === 'writing'
            ? 'The writing service timed out after 3 minutes.'
            : `The ${service} service timed out after 60 seconds.`;
    case GenerationFailureCode.ProviderRejected:
      return service === 'render'
        ? OTHER_CAUSE
        : service === 'video'
          ? 'The video service turned the request down. Try a different photo or description.'
          : `The ${service} service turned the request down.`;
    case GenerationFailureCode.ProviderNotConfigured:
      return service === 'render'
        ? OTHER_CAUSE
        : `The ${service} service isn’t set up yet.`;
    case GenerationFailureCode.InvalidOutput:
      return service === 'writing'
        ? 'The draft came back incomplete, so we didn’t use it.'
        : service === 'video'
          ? 'The clips came back unusable, so we didn’t keep them.'
          : OTHER_CAUSE;
    case GenerationFailureCode.RecordingMismatch:
      return 'Your recording doesn’t match the script closely enough. Re-record it, or edit the script to match what you said.';
    case GenerationFailureCode.UnreadableMedia:
      return 'We couldn’t read that audio file.';
    case GenerationFailureCode.MediaMissing:
      if (service === 'video')
        return 'The photo this clip starts from is missing.';
      return 'A photo, clip or track this video uses is missing. Check Media and Edit & preview.';
    case GenerationFailureCode.RenderTimeout:
      return 'Rendering took longer than 10 minutes.';
    case GenerationFailureCode.WorkerUnavailable:
      return 'It couldn’t start in time. Try again in a few minutes.';
    default:
      return code ? OTHER_CAUSE : '';
  }
}

/** Credit estimates shown before paid actions (open decision 11; demo values). */
export const CREDIT_COST = {
  suggestAngles: 1,
  suggestAudiences: 1,
  suggestPremises: 1,
  writeScript: 3,
  rewrite: 1,
  voiceover: 2,
  alignRecording: 1,
  render: 2,
  /** Per AI scene clip made (R20); one per request by default (R23). */
  aiClip: 4,
} as const;
