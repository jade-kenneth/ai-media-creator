import { ConflictError } from 'src/common/errors/app.error';
import {
  ContentStyle,
  HookType,
  ProjectStepKey,
  SceneClipMode,
  ScenePurpose,
  StudioType,
  type StudioInfo,
} from 'src/graphql/generated/graphql';

/**
 * What a studio is (Product Specification §3.23, “The studio contract”).
 * Shared code reads these values instead of branching on a studio by name,
 * so a new studio is a new entry here plus its own intake step and prompts.
 */
export interface StudioDefinition {
  type: StudioType;
  /** The rail caption, e.g. “Affiliate Studio”. */
  name: string;
  /** The brief's area (§3), shown on the New video card. */
  area: string;
  /** The New video card title and description. */
  title: string;
  description: string;
  /** The title a new project starts with. */
  untitled: string;
  /** What the project is, for the wrong-studio refusal. */
  isA: string;
  /** Steps before Script, in rail order. */
  intakeSteps: ProjectStepKey[];
  /** The Script step's locked reason while the intake isn't done. */
  scriptLockedReason: string;
  scenePurposes: ScenePurpose[];
  /**
   * The purpose a script's last scene always has, and what an earlier scene
   * with it becomes (R29: a story ends on its cliffhanger); null leaves the
   * purposes as written.
   */
  lastScene: { purpose: ScenePurpose; earlier: ScenePurpose } | null;
  /** The content styles a project of this studio can be written in. */
  contentStyles: ContentStyle[];
  hookTypes: HookType[];
  /** Claim-check every line a viewer reads against the approved facts. */
  claimCheck: boolean;
  keepConsistent: {
    /** The product is the first, required item. */
    product: boolean;
    /** The cast's characters lead the list. */
    characters: boolean;
    /** One-click clips need a photo for every item. */
    photosRequired: boolean;
  };
  clipModes: SceneClipMode[];
  /** The end card is on when a video edit starts. */
  endCardDefault: boolean;
  /** The post caption can start with #ad. */
  adTag: boolean;
}

const AFFILIATE: StudioDefinition = {
  type: StudioType.AFFILIATE,
  name: 'Affiliate Studio',
  area: 'Marketing',
  title: 'Affiliate video',
  description:
    'Turn a product into a short video that sells, from facts you approve.',
  untitled: 'Untitled project',
  isA: 'This project is an affiliate video.',
  intakeSteps: [
    ProjectStepKey.PRODUCT,
    ProjectStepKey.FACTS,
    ProjectStepKey.STRATEGY,
  ],
  scriptLockedReason: 'Choose an angle first.',
  scenePurposes: [
    ScenePurpose.HOOK,
    ScenePurpose.PROBLEM,
    ScenePurpose.DEMO,
    ScenePurpose.FEATURE,
    ScenePurpose.PROOF,
    ScenePurpose.CALL_TO_ACTION,
  ],
  lastScene: null,
  contentStyles: [
    ContentStyle.VOICEOVER_PRODUCT_SHOTS,
    ContentStyle.TALKING_TO_CAMERA,
    ContentStyle.TEXT_ONLY,
    ContentStyle.HANDS_ON_DEMO,
    ContentStyle.SKIT,
  ],
  hookTypes: [
    HookType.PROBLEM_FIRST,
    HookType.QUESTION,
    HookType.SHOW_DONT_TELL,
    HookType.RELATABLE_MOMENT,
    HookType.DIRECT_PITCH,
  ],
  claimCheck: true,
  keepConsistent: { product: true, characters: false, photosRequired: true },
  clipModes: [
    SceneClipMode.FIRST_FRAME,
    SceneClipMode.FIRST_LAST_FRAME,
    SceneClipMode.REFERENCES,
    SceneClipMode.CONSISTENT,
  ],
  endCardDefault: true,
  adTag: true,
};

const ENTERTAINMENT: StudioDefinition = {
  type: StudioType.ENTERTAINMENT,
  name: 'Entertainment Studio',
  area: 'Entertainment',
  title: 'Story',
  description:
    'A short drama, action or comedy scene with a cast, lines and sound.',
  untitled: 'Untitled story',
  isA: 'This project is a story.',
  intakeSteps: [ProjectStepKey.STORY],
  scriptLockedReason: 'Finish the story first.',
  scenePurposes: [
    ScenePurpose.HOOK,
    ScenePurpose.SETUP,
    ScenePurpose.BUILD,
    ScenePurpose.TURN,
    ScenePurpose.PAYOFF,
  ],
  lastScene: { purpose: ScenePurpose.PAYOFF, earlier: ScenePurpose.TURN },
  // Acted stories are written as skits; narrated ones as NARRATION.
  contentStyles: [ContentStyle.SKIT, ContentStyle.NARRATION],
  hookTypes: [
    HookType.COLD_OPEN,
    HookType.FLASH_FORWARD,
    HookType.QUESTION,
    HookType.RELATABLE_MOMENT,
    HookType.MYSTERY,
  ],
  claimCheck: false,
  keepConsistent: { product: false, characters: true, photosRequired: false },
  clipModes: [
    SceneClipMode.DESCRIBE,
    SceneClipMode.FIRST_FRAME,
    SceneClipMode.FIRST_LAST_FRAME,
    SceneClipMode.REFERENCES,
    SceneClipMode.CONSISTENT,
  ],
  endCardDefault: false,
  adTag: false,
};

/** Every studio, keyed by type; the Record makes a missing one a type error. */
export const STUDIOS: Record<StudioType, StudioDefinition> = {
  [StudioType.AFFILIATE]: AFFILIATE,
  [StudioType.ENTERTAINMENT]: ENTERTAINMENT,
};

/** The New video chooser's order. */
export const STUDIO_ORDER: readonly StudioType[] = [
  StudioType.AFFILIATE,
  StudioType.ENTERTAINMENT,
];

/** A stored studio value; records from before studios existed are Affiliate. */
export function studioOf(value: string | null | undefined): StudioType {
  return value && value in STUDIOS
    ? (value as StudioType)
    : StudioType.AFFILIATE;
}

export function studioFor(record: {
  studioType?: string | null;
}): StudioDefinition {
  return STUDIOS[studioOf(record.studioType)];
}

/** Refuses a studio-specific write on a project of another studio. */
export function assertStudio(
  record: { studioType?: string | null },
  studio: StudioType,
): void {
  const actual = studioFor(record);

  if (actual.type !== studio) {
    throw new ConflictError(actual.isA, { code: 'WRONG_STUDIO' });
  }
}

export function studioInfos(): StudioInfo[] {
  return STUDIO_ORDER.map((type) => {
    const studio = STUDIOS[type];

    return {
      type,
      area: studio.area,
      title: studio.title,
      description: studio.description,
    };
  });
}
