import { Types } from 'mongoose';
import { z } from 'zod';
import {
  ContentStyle,
  HookType,
  ScenePurpose,
  SceneTransition,
  ShotFraming,
  ShotSubject,
  type ScriptLanguage,
  type StoryGenre,
  type Storytelling,
} from 'src/graphql/generated/graphql';
import { studioFor, type StudioDefinition } from '../studios/studios';
import type { TextGenerationMessage } from '../text-generation/text-generation.service';
import type {
  SceneDirectionRecord,
  SceneLineRecord,
  ScriptHookRecord,
  ScriptSceneRecord,
  ShootPlanRecord,
} from './repositories/scripts.repository';

/**
 * Prompts, output schemas and coercion for script writing. Model output is
 * untrusted input: it is parsed with zod, rebuilt field by field from
 * allowlists, length-capped, and its fact references are kept only when they
 * point at approved facts. It never sets an approval.
 */

export const LIMITS = {
  hookText: 160,
  openingShot: 200,
  narration: 600,
  onScreenText: 60,
  visual: 200,
  setting: 80,
  props: 120,
  prop: 40,
  maxProps: 4,
  scenario: 300,
  presenter: 160,
  cta: 80,
  caption: 300,
  claim: 160,
  claims: 5,
  speaker: 24,
  /** As long as a hook, since scene 1's first line can be the chosen hook. */
  line: 160,
  maxLines: 3,
  shot: 60,
  reaction: 80,
  delivery: 60,
  maxPause: 3,
  sound: 80,
  minDuration: 2,
  maxDuration: 15,
  minScenes: 3,
  maxScenes: 7,
} as const;

export interface WritingFact {
  id: string;
  text: string;
}

/**
 * What an episode 2+ continues from (§3.25): the series premise, a recap of
 * each earlier episode, and the previous episode's approved scenes in full.
 */
export interface StoryContinuity {
  episodeNumber: number;
  seriesPremise: string;
  earlier: Array<{ episodeNumber: number; recap: string }>;
  previous: {
    projectId: string;
    episodeNumber: number;
    versionNumber: number;
    scenes: Array<{
      purpose: ScenePurpose;
      narration: string;
      lines: Array<{ speaker: string; text: string }>;
    }>;
  };
}

/** A story studio's intake as the prompts read it (Product Specification §3.23). */
export interface WritingStory {
  genre: StoryGenre | null;
  premise: { title: string; logline: string } | null;
  cast: Array<{ name: string; role: string; look: string }>;
  storytelling: Storytelling;
  /** Episode 2+ (§3.25); absent otherwise, so Episode 1's prompts are unchanged. */
  continuity?: StoryContinuity | null;
  /** A series' final episode ends the story instead of on a cliffhanger (§3.25). */
  endsSeries?: boolean;
}

export interface WritingContext {
  product: {
    title: string | null;
    category: string | null;
    description: string | null;
  };
  facts: WritingFact[];
  strategy: {
    buyer: string | null;
    problem: string | null;
    benefit: string | null;
    platform: string;
    language: ScriptLanguage;
    lengthSeconds: number;
    tone: string;
    contentStyle: ContentStyle;
    angle: string | null;
  };
  /** The story a story studio writes from; absent for product videos. */
  story?: WritingStory | null;
}

export const LANGUAGE_GUIDE: Record<ScriptLanguage, string> = {
  ENGLISH: 'Write narration, on-screen text, CTA and caption in English.',
  FILIPINO: 'Write narration, on-screen text, CTA and caption in Filipino.',
  TAGLISH:
    'Write narration, on-screen text, CTA and caption in natural Taglish (mixed Filipino and English), the way Filipino creators speak.',
};

/** Who should appear on camera for each content style. */
const STYLE_GUIDE: Record<ContentStyle, string> = {
  VOICEOVER_PRODUCT_SHOTS:
    'The creator is heard but not seen: shoot the product and hands (HANDS or PRODUCT_ONLY), never CREATOR.',
  TALKING_TO_CAMERA:
    'The creator talks to the camera: use CREATOR for most scenes and cut to HANDS or PRODUCT_ONLY for close product detail.',
  TEXT_ONLY:
    'There is no voice on camera: use PRODUCT_ONLY or HANDS shots that read clearly under on-screen text.',
  HANDS_ON_DEMO:
    'Show the product being used: use HANDS for most scenes, with PRODUCT_ONLY for detail shots.',
  SKIT: 'People act the scene out on camera: use CREATOR for most scenes (anyone from the cast), and HANDS or PRODUCT_ONLY for close product detail.',
  // Stories only (Strategy never offers it): PRODUCT_ONLY is read as “no one in frame”.
  NARRATION:
    'A narrator tells the story over the scenes: use CREATOR for most scenes (anyone from the cast on camera), HANDS for a close-up of hands or an object someone holds, and PRODUCT_ONLY for a shot with no one in frame (a place, an object, the weather). The narration tells the story and never talks about or sells a product.',
};

/** A skit is acted out by a cast, with spoken lines and live sound and no narrator. */
export function isSkit(style: ContentStyle | null | undefined): boolean {
  return style === ContentStyle.SKIT;
}

const directionJson = {
  type: 'object',
  additionalProperties: false,
  required: ['inFrame', 'framing', 'setting', 'props'],
  properties: {
    inFrame: { type: 'string', enum: Object.values(ShotSubject) },
    framing: { type: 'string', enum: Object.values(ShotFraming) },
    setting: { type: 'string' },
    props: { type: 'array', items: { type: 'string' } },
  },
};

const shootJson = {
  type: 'object',
  additionalProperties: false,
  required: ['scenario', 'presenter'],
  properties: {
    scenario: { type: 'string' },
    presenter: { type: ['string', 'null'] },
  },
};

/** The values a studio's scripts may use (its registry allowlists and ending). */
export type StudioValues = Pick<
  StudioDefinition,
  'scenePurposes' | 'hookTypes' | 'lastScene'
>;

function hookJsonFor(hookTypes: HookType[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'text', 'openingShot', 'claims'],
    properties: {
      type: { type: 'string', enum: hookTypes },
      text: { type: 'string' },
      openingShot: { type: 'string' },
      claims: { type: 'array', items: { type: 'string' } },
    },
  };
}

function sceneJsonFor(scenePurposes: ScenePurpose[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'purpose',
      'durationSeconds',
      'narration',
      'onScreenText',
      'visual',
      'direction',
      'transitionIn',
      'cta',
      'factIds',
      'claims',
    ],
    properties: {
      purpose: { type: 'string', enum: scenePurposes },
      durationSeconds: { type: 'integer' },
      narration: { type: 'string' },
      onScreenText: { type: 'string' },
      visual: { type: 'string' },
      direction: directionJson,
      transitionIn: { type: 'string', enum: Object.values(SceneTransition) },
      cta: { type: ['string', 'null'] },
      factIds: { type: 'array', items: { type: 'string' } },
      claims: { type: 'array', items: { type: 'string' } },
    },
  };
}

/** A line acted as a beat: the camera, the reaction and its pause, then the line. */
const lineJson = {
  type: 'object',
  additionalProperties: false,
  required: ['speaker', 'shot', 'reaction', 'pauseSeconds', 'delivery', 'text'],
  properties: {
    speaker: { type: 'string' },
    shot: { type: 'string' },
    reaction: { type: 'string' },
    pauseSeconds: { type: 'number' },
    delivery: { type: 'string' },
    text: { type: 'string' },
  },
};

/**
 * The output schemas for one studio: the hook types and scene purposes are
 * the studio's own (per-studio allowlists), so a model can't pick another
 * studio's values. Every other part is shared.
 */
export function writingSchemas({
  scenePurposes,
  hookTypes,
}: Pick<StudioValues, 'scenePurposes' | 'hookTypes'>) {
  const hookJson = hookJsonFor(hookTypes);
  const sceneJson = sceneJsonFor(scenePurposes);
  /** A skit scene: a narrated scene plus spoken lines and a sound cue. */
  const skitSceneJson = {
    ...sceneJson,
    required: [...sceneJson.required, 'lines', 'sound'],
    properties: {
      ...sceneJson.properties,
      lines: { type: 'array', items: lineJson },
      sound: { type: ['string', 'null'] },
    },
  };
  const script = {
    type: 'object',
    additionalProperties: false,
    required: ['hooks', 'shoot', 'scenes', 'caption'],
    properties: {
      shoot: shootJson,
      hooks: { type: 'array', minItems: 3, maxItems: 3, items: hookJson },
      scenes: {
        type: 'array',
        minItems: LIMITS.minScenes,
        maxItems: LIMITS.maxScenes,
        items: sceneJson,
      },
      caption: { type: 'string' },
    },
  };
  const scene = {
    type: 'object',
    additionalProperties: false,
    required: ['scene'],
    properties: { scene: sceneJson },
  };

  return {
    script,
    hook: {
      type: 'object',
      additionalProperties: false,
      required: ['hook'],
      properties: { hook: hookJson },
    },
    scene,
    skitScript: {
      ...script,
      properties: {
        ...script.properties,
        scenes: { ...script.properties.scenes, items: skitSceneJson },
      },
    },
    skitScene: {
      ...scene,
      properties: { scene: skitSceneJson },
    },
  };
}

/** The schemas of a record without a studio (read as the default studio). */
const LEGACY_SCHEMAS = writingSchemas(studioFor({}));

export const SCRIPT_SCHEMA = LEGACY_SCHEMAS.script;
export const HOOK_SCHEMA = LEGACY_SCHEMAS.hook;
export const SCENE_SCHEMA = LEGACY_SCHEMAS.scene;
export const SKIT_SCRIPT_SCHEMA = LEGACY_SCHEMAS.skitScript;
export const SKIT_SCENE_SCHEMA = LEGACY_SCHEMAS.skitScene;

export const hookOutput = z.object({
  type: z.enum(HookType),
  text: z.string(),
  openingShot: z.string(),
  claims: z.array(z.string()),
});

export const directionOutput = z.object({
  inFrame: z.enum(ShotSubject),
  framing: z.enum(ShotFraming),
  setting: z.string(),
  props: z.array(z.string()),
});

const shootOutput = z.object({
  scenario: z.string(),
  presenter: z.string().nullable(),
});

export const sceneOutput = z.object({
  purpose: z.enum(ScenePurpose),
  durationSeconds: z.number(),
  narration: z.string(),
  onScreenText: z.string(),
  visual: z.string(),
  direction: directionOutput,
  transitionIn: z.enum(SceneTransition),
  cta: z.string().nullable(),
  factIds: z.array(z.string()),
  claims: z.array(z.string()),
});

export const scriptOutput = z.object({
  shoot: shootOutput,
  hooks: z.array(hookOutput).min(3),
  scenes: z.array(sceneOutput).min(LIMITS.minScenes),
  caption: z.string(),
});

export const hookRewriteOutput = z.object({ hook: hookOutput });
export const sceneRewriteOutput = z.object({ scene: sceneOutput });

/** Beat directions default to none, so a line without them still reads. */
export const lineOutput = z.object({
  speaker: z.string(),
  text: z.string(),
  shot: z.string().default(''),
  reaction: z.string().default(''),
  pauseSeconds: z.number().default(0),
  delivery: z.string().default(''),
});

const skitSceneOutput = sceneOutput.extend({
  lines: z.array(lineOutput),
  sound: z.string().nullable(),
});

export const skitScriptOutput = scriptOutput.extend({
  scenes: z.array(skitSceneOutput).min(LIMITS.minScenes),
});
export const skitSceneRewriteOutput = z.object({ scene: skitSceneOutput });

export type HookOutput = z.infer<typeof hookOutput>;

/** A generated scene; skit scenes also carry lines and a sound cue. */
export type SceneOutput = z.infer<typeof sceneOutput> & {
  lines?: z.input<typeof lineOutput>[];
  sound?: string | null;
};

/** A parsed draft, whichever studio wrote it. */
export interface DraftOutput {
  shoot: z.infer<typeof shootOutput>;
  hooks: HookOutput[];
  scenes: SceneOutput[];
  caption: string;
  /** Episode 2+ (§3.25): what happened in the previous episode, for later episodes. */
  previousRecap?: string | null;
}

const RULES = [
  'You write short vertical affiliate video scripts for small creators.',
  'Use only the approved facts provided. Do not introduce any other product claim: no performance or speed results, health outcomes, guarantees, superlatives, prices, discounts, stock levels or reviews unless an approved fact states it.',
  'For every hook and scene, list in "claims" the exact phrases you wrote that state something about the product, copied word for word from your text.',
  'For every scene, list in "factIds" the ids of the approved facts it relies on.',
  'Keep on-screen text under 60 characters. Only the CALL_TO_ACTION scene has a cta; every other scene sets cta to null.',
  'Direct every scene so a creator can film it with a phone: "visual" says what happens in the shot, from how it opens to how it ends (for example "Starts on the closed box, ends on the blender in hand"), "direction" says who or what is in frame, the framing, a short setting (where, and the time of day or light) and up to 4 props besides the product. Settings and props must be ordinary places and things the buyer would have; no shot may show the product doing something an approved fact does not state.',
  'Choose how each scene comes in with "transitionIn". CUT is the default. Use PUNCH_IN for the key benefit or demo payoff. Use WHIP at most once, at the turn from hook to problem or problem to demo. Use DISSOLVE only when time passes, such as before to after. Scene 1 must be CUT. Never place a non-cut transition directly after another non-cut transition.',
].join(' ');

/** Skit clauses that hold for any acted scene, product or not. */
export const SKIT_NO_NARRATOR =
  'There is no narrator: set "narration" to an empty string in every scene.';
export const SKIT_LINES = `Each scene has 0 to 3 "lines": "speaker" is a first name from the cast and "text" is what they say out loud, in the same language as the rest, under ${LIMITS.line} characters.`;
export const SKIT_SOUND =
  'Set "sound" to the natural sound the scene\'s action makes and when it happens, in a few words (for example "sandals slapping on the pavement with each step"), or null when nothing is heard but the lines.';

const SKIT_RULES = [
  "This video is a skit, not an ad: a short scene with a setup, a turn and a payoff that plays out in the shoot plan's scenario. The product is part of the story, and people talk the way real people do, in the chosen language and tone.",
  SKIT_NO_NARRATOR,
  SKIT_LINES,
  SKIT_SOUND,
  'No character says they have used the product before, that they got a result from it, or that they recommend it from experience: they react to what they see and state only approved facts.',
  'When a line states a product detail, use the approved fact\'s own words inside the line (a fact "Weighs 180 g per pair" is said as "...weighs 180 g per pair..."), and list just those words in "claims", without the words around them.',
  'The CALL_TO_ACTION scene ends the story with its cta on screen; a character may say it in their own words.',
].join(' ');

/** The beat directions, in order; the acting clause is the product's own. */
export const SKIT_BEAT_CLAUSES = {
  lead: 'Act every line out as a beat, so the skit plays like a real moment and not like people trading lines. Write the beat directions in plain English, whatever the language of the lines.',
  shot: `"shot" is where the camera is for the beat, picked for whose face the viewer should watch, under ${LIMITS.shot} characters: the speaker in close-up for a reveal or a punchline, the listener's face for a reaction, over one person's shoulder onto the other for back-and-forth, a two-shot when both react, POV when the viewer stands in for someone (for example "close-up on Ben" or "over Ana's shoulder onto Ben"). It stays within the scene's framing and who is in frame.`,
  reaction: `"reaction" is what the speaker does silently just before speaking, under ${LIMITS.reaction} characters: how their face and body take in what was just said or seen (for example "stops, looks down at the sandals, then back up at Ana"). Leave it empty only when the line cuts straight in.`,
  pause: `"pauseSeconds" is how long that reaction holds before the first word, 0 to ${LIMITS.maxPause} in steps of 0.5: an answer to a surprise, a question or a reveal gets a real beat of 1 to 1.5, a punchline can wait 2, and quick back-and-forth stays at 0 or 0.5.`,
  delivery: `"delivery" is the speaker's facial expression and voice while saying the line, in a few words that fit the moment and the tone, under ${LIMITS.delivery} characters (for example "half laughing, eyebrows up" or "deadpan, flat voice").`,
  acting:
    'Keep the acting natural, never theatrical: each answer reacts to what was just said, expressions build with the story (doubt or curiosity at the setup, surprise at the turn, delight or satisfaction at the payoff), nobody talks over anyone, and nobody looks into the camera unless the shot is POV or the line is the call to action. A reaction never shows a result an approved fact does not state.',
  end: 'End each scene\'s "visual" on the moment after its last line lands (for example "ends on Ana smirking as Ben tries them on").',
} as const;

/**
 * Lines acted as beats (camera, reaction, pause, delivery), so a skit plays
 * like a moment between people rather than lines read back to back.
 */
const SKIT_BEATS = [
  SKIT_BEAT_CLAUSES.lead,
  SKIT_BEAT_CLAUSES.shot,
  SKIT_BEAT_CLAUSES.reaction,
  SKIT_BEAT_CLAUSES.pause,
  SKIT_BEAT_CLAUSES.delivery,
  SKIT_BEAT_CLAUSES.acting,
  SKIT_BEAT_CLAUSES.end,
].join(' ');

const NARRATED_SHOOT =
  'First write the shoot plan: "scenario" is the situation the whole video plays out, in one or two sentences, and "presenter" describes who appears on camera (who they are, and what they wear) or is null when nobody does.';
const SKIT_SHOOT =
  'First write the shoot plan: "scenario" is the situation the whole skit plays out, in one or two sentences, and "presenter" names the cast: 1 to 3 people, each with a first name, who they are and what they wear (for example "Ana, 20s, yellow shirt; Ben, her brother, denim jacket"), under 160 characters.';
export const NARRATED_HOOK =
  'Each hook\'s "text" is the narrator\'s opening line, said out loud, and "openingShot" is how the first scene is filmed.';
const SKIT_HOOK = `Each hook is the skit's opening line, said out loud on camera by someone in the cast (never a narrator's line), under ${LIMITS.line} characters, and "openingShot" is how that moment is filmed.`;

/**
 * The video opens with the chosen hook: scene 1 says it and is filmed as its
 * opening shot. A draft starts with the first hook there, and picking,
 * editing or rewriting the chosen hook puts it there (`ScriptsService`).
 */
export function hookSceneRule(skit: boolean): string {
  return `The first scene is the HOOK scene and opens with the first hook: its ${skit ? 'first line says' : 'narration is'} that hook's text word for word, and its visual is that hook's opening shot.`;
}

/**
 * The scene the chosen hook opens: the first scene, when it is the hook
 * scene. A script whose first scene has another purpose has none, so no
 * other scene's words are replaced.
 */
export function hookScene<T extends { order: number; purpose: ScenePurpose }>(
  scenes: T[],
): T | null {
  const first = [...scenes].sort((a, b) => a.order - b.order)[0];

  return first?.purpose === ScenePurpose.HOOK ? first : null;
}

export function styleGuide(context: WritingContext): string {
  return (
    STYLE_GUIDE[context.strategy.contentStyle] ??
    STYLE_GUIDE.VOICEOVER_PRODUCT_SHOTS
  );
}

function contextMessage(context: WritingContext): TextGenerationMessage {
  return {
    role: 'user',
    content: JSON.stringify({
      product: context.product,
      approvedFacts: context.facts,
      audience: {
        buyer: context.strategy.buyer,
        problem: context.strategy.problem,
        benefit: context.strategy.benefit,
      },
      platform: context.strategy.platform,
      tone: context.strategy.tone,
      contentStyle: context.strategy.contentStyle,
      sellingAngle: context.strategy.angle,
      targetLengthSeconds: context.strategy.lengthSeconds,
    }),
  };
}

export function scriptMessages(
  context: WritingContext,
): TextGenerationMessage[] {
  const skit = isSkit(context.strategy.contentStyle);

  return [
    {
      role: 'system',
      content: [
        RULES,
        LANGUAGE_GUIDE[context.strategy.language],
        styleGuide(context),
        ...(skit ? [SKIT_RULES, SKIT_BEATS] : []),
        skit ? SKIT_SHOOT : NARRATED_SHOOT,
        'Write three clearly different hooks, each with the opening shot that goes with it.',
        skit ? SKIT_HOOK : NARRATED_HOOK,
        `Then write 4 to 6 scenes whose durations add up to about ${context.strategy.lengthSeconds} seconds, ending with a CALL_TO_ACTION scene, and a caption under 300 characters.`,
        hookSceneRule(skit),
        sceneLengthRule(skit),
      ].join(' '),
    },
    contextMessage(context),
  ];
}

export function hookRewriteMessages(
  context: WritingContext,
  otherHooks: string[],
  current: string,
): TextGenerationMessage[] {
  return [
    {
      role: 'system',
      content: [
        RULES,
        LANGUAGE_GUIDE[context.strategy.language],
        'Rewrite one opening hook. Make it clearly different from the current hook and from the other hooks.',
        isSkit(context.strategy.contentStyle) ? SKIT_HOOK : NARRATED_HOOK,
      ].join(' '),
    },
    contextMessage(context),
    {
      role: 'user',
      content: JSON.stringify({ currentHook: current, otherHooks }),
    },
  ];
}

export function sceneRewriteMessages(
  context: WritingContext,
  scenes: Array<
    Pick<ScriptSceneRecord, 'purpose' | 'narration' | 'transitionIn' | 'lines'>
  >,
  current: ScriptSceneRecord,
  shoot: ShootPlanRecord | null,
  /** The chosen hook's text, when this scene is the one it opens. */
  openingHook: string | null = null,
): TextGenerationMessage[] {
  const skit = isSkit(context.strategy.contentStyle);

  return [
    {
      role: 'system',
      content: [
        RULES,
        LANGUAGE_GUIDE[context.strategy.language],
        styleGuide(context),
        ...(skit ? [SKIT_RULES, SKIT_BEATS] : []),
        `Rewrite one scene of the script. Keep its purpose (${current.purpose}) and about the same duration (${current.durationSeconds} seconds) so it fits between the scenes around it, and keep it within the shoot plan's scenario and presenter.`,
        ...(openingHook
          ? [
              `This scene opens the video with the chosen hook ("openingHook"): keep its ${skit ? "first line's text" : 'narration'} exactly as that hook reads.`,
            ]
          : []),
        sceneLengthRule(skit),
      ].join(' '),
    },
    contextMessage(context),
    {
      role: 'user',
      content: JSON.stringify({
        script: scenes.map((scene) => ({
          purpose: scene.purpose,
          narration: scene.narration,
          ...(skit ? { lines: scene.lines ?? [] } : {}),
          transitionIn: scene.transitionIn ?? SceneTransition.CUT,
        })),
        shootPlan: shoot,
        ...(openingHook ? { openingHook } : {}),
        sceneToRewrite: {
          purpose: current.purpose,
          narration: current.narration,
          ...(skit
            ? { lines: current.lines ?? [], sound: current.sound ?? null }
            : {}),
          onScreenText: current.onScreenText,
        },
      }),
    },
  ];
}

// ── Coercion ────────────────────────────────────────────────────────────────

function clip(value: string, max: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function claimsFrom(claims: string[]): string[] {
  return [
    ...new Set(
      claims.map((claim) => clip(claim, LIMITS.claim)).filter(Boolean),
    ),
  ].slice(0, LIMITS.claims);
}

export function coerceHook(
  hook: z.infer<typeof hookOutput>,
  id: string = new Types.ObjectId().toHexString(),
): ScriptHookRecord | null {
  const text = clip(hook.text, LIMITS.hookText);

  if (!text) return null;

  return {
    id,
    type: hook.type,
    text,
    openingShot: clip(hook.openingShot, LIMITS.openingShot),
    reportedClaims: claimsFrom(hook.claims),
  };
}

/**
 * A skit scene has no narration; it is kept when it has a line, a sound or
 * on-screen text. A narrated scene still needs its narration.
 */
export function coerceScene(
  scene: SceneOutput,
  order: number,
  approvedFactIds: Set<string>,
  id: string = new Types.ObjectId().toHexString(),
  skit = false,
): ScriptSceneRecord | null {
  const narration = skit ? '' : clip(scene.narration, LIMITS.narration);
  const lines = skit ? coerceLines(scene.lines ?? []) : [];
  const sound = skit ? clip(scene.sound ?? '', LIMITS.sound) || null : null;
  const onScreenText = clip(scene.onScreenText, LIMITS.onScreenText);

  if (skit ? !lines.length && !sound && !onScreenText : !narration) {
    return null;
  }

  const isCta = scene.purpose === ScenePurpose.CALL_TO_ACTION;

  return {
    id,
    order,
    purpose: scene.purpose,
    durationSeconds: fitDuration(
      scene.durationSeconds,
      spokenText({ narration, lines }),
      linePauses({ lines }),
    ),
    narration,
    ...(skit ? { lines, sound } : {}),
    onScreenText,
    visual: clip(scene.visual, LIMITS.visual),
    direction: coerceDirection(scene.direction),
    transitionIn: scene.transitionIn,
    cta: isCta ? clip(scene.cta ?? '', LIMITS.cta) || null : null,
    factIds: [...new Set(scene.factIds)].filter((factId) =>
      approvedFactIds.has(factId),
    ),
    reportedClaims: claimsFrom(scene.claims),
  };
}

/**
 * Per-studio allowlist for scene purposes: a purpose the studio doesn't use
 * (another studio's, e.g. DEMO in a story) becomes the studio's purpose at
 * the scene's place in the script, so the first scene reads as the first
 * purpose (HOOK) and the last as the last. Allowed purposes are kept as
 * written, so a studio's valid output is unchanged.
 */
export function allowPurposes<T extends { purpose: ScenePurpose }>(
  scenes: T[],
  allowed: readonly ScenePurpose[],
): T[] {
  return scenes.map((scene, index) =>
    allowed.includes(scene.purpose)
      ? scene
      : {
          ...scene,
          purpose:
            allowed[
              scenes.length > 1
                ? Math.round(
                    (index * (allowed.length - 1)) / (scenes.length - 1),
                  )
                : 0
            ],
        },
  );
}

/**
 * Per-studio allowlist for hook types: a type the studio doesn't use becomes
 * its first type no other hook has (or its first), keeping hooks distinct.
 */
export function allowHookTypes<T extends { type: HookType }>(
  hooks: T[],
  allowed: readonly HookType[],
  /** Types the hooks around a rewritten one already use. */
  taken: readonly HookType[] = [],
): T[] {
  const used = new Set<HookType>([
    ...taken,
    ...hooks.map((hook) => hook.type).filter((type) => allowed.includes(type)),
  ]);

  return hooks.map((hook) => {
    if (allowed.includes(hook.type)) return hook;

    const type =
      allowed.find((candidate) => !used.has(candidate)) ?? allowed[0];
    used.add(type);

    return { ...hook, type };
  });
}

/**
 * A studio's ending rule (R29): the last scene always has the studio's last
 * purpose (a story's PAYOFF, its cliffhanger), and an earlier scene with that
 * purpose takes the one before it (TURN). Corrected, never failed. Studios
 * without one keep their purposes as written.
 */
export function endOnLastScene<
  T extends { purpose: ScenePurpose; cta: string | null },
>(scenes: T[], lastScene: StudioValues['lastScene']): T[] {
  if (!lastScene) return scenes;

  return scenes.map((scene, index) => {
    const purpose =
      index === scenes.length - 1
        ? lastScene.purpose
        : scene.purpose === lastScene.purpose
          ? lastScene.earlier
          : scene.purpose;

    if (purpose === scene.purpose) return scene;

    // Only the call-to-action scene has a cta.
    return {
      ...scene,
      purpose,
      cta: purpose === ScenePurpose.CALL_TO_ACTION ? scene.cta : null,
    };
  });
}

/** A scene's purpose under the studio's ending rule, in its place in the script. */
export function purposeInPlace(
  scene: { id: string; purpose: ScenePurpose },
  scenes: Array<{ id: string; order: number; purpose: ScenePurpose }>,
  lastScene: StudioValues['lastScene'],
): ScenePurpose {
  const ordered = [...scenes]
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ ...item, cta: null }));

  return (
    endOnLastScene(ordered, lastScene).find((item) => item.id === scene.id)
      ?.purpose ?? scene.purpose
  );
}

/** A written draft as stored: hooks, scenes and the shoot plan, all coerced. */
export interface CoercedDraft {
  hooks: ScriptHookRecord[];
  scenes: ScriptSceneRecord[];
  shoot: ShootPlanRecord | null;
  caption: string;
}

/**
 * Rebuilds a parsed draft for storage: at most 3 hooks and 7 scenes, the
 * studio's allowlists and ending rule, fact references kept only when
 * approved, transitions within the pacing rules. Null when fewer than 3
 * hooks or scenes survive.
 */
export function coerceDraft(
  draft: DraftOutput,
  studio: StudioValues,
  approvedFactIds: Set<string>,
  skit: boolean,
): CoercedDraft | null {
  const hooks = allowHookTypes(
    draft.hooks.slice(0, 3).flatMap((hook) => coerceHook(hook) ?? []),
    studio.hookTypes,
  );
  const scenes = normalizeTransitions(
    endOnLastScene(
      allowPurposes(draft.scenes.slice(0, 7), studio.scenePurposes).flatMap(
        (scene, index) =>
          coerceScene(scene, index + 1, approvedFactIds, undefined, skit) ?? [],
      ),
      studio.lastScene,
    ),
  );

  if (hooks.length < 3 || scenes.length < 3) return null;

  return {
    hooks,
    scenes,
    shoot: coerceShoot(draft.shoot),
    caption: draft.caption.replace(/\s+/g, ' ').trim().slice(0, 300),
  };
}

/**
 * Keeps generated transitions inside the product's pacing rules. With a
 * target id, only that rewritten scene is corrected; unchanged creator edits
 * keep winning.
 */
export function normalizeTransitions(
  scenes: ScriptSceneRecord[],
  targetSceneId?: string,
): ScriptSceneRecord[] {
  const ordered = [...scenes].sort((a, b) => a.order - b.order);

  if (targetSceneId) {
    const index = ordered.findIndex((scene) => scene.id === targetSceneId);
    if (index < 0) return scenes;

    const target = ordered[index];
    let transition = target.transitionIn ?? SceneTransition.CUT;
    const previous = ordered[index - 1]?.transitionIn ?? SceneTransition.CUT;
    const next = ordered[index + 1]?.transitionIn ?? SceneTransition.CUT;

    if (
      index === 0 ||
      (transition === SceneTransition.WHIP &&
        ordered.some(
          (scene) =>
            scene.id !== target.id &&
            scene.transitionIn === SceneTransition.WHIP,
        )) ||
      (transition === SceneTransition.DISSOLVE &&
        ordered.some(
          (scene) =>
            scene.id !== target.id &&
            scene.transitionIn === SceneTransition.DISSOLVE,
        )) ||
      (transition !== SceneTransition.CUT &&
        (previous !== SceneTransition.CUT || next !== SceneTransition.CUT))
    ) {
      transition = SceneTransition.CUT;
    }

    return scenes.map((scene) =>
      scene.id === target.id ? { ...scene, transitionIn: transition } : scene,
    );
  }

  let previous = SceneTransition.CUT;
  let usedWhip = false;
  let usedDissolve = false;
  const normalized = new Map<string, SceneTransition>();

  ordered.forEach((scene, index) => {
    let transition = scene.transitionIn ?? SceneTransition.CUT;

    if (
      index === 0 ||
      (transition === SceneTransition.WHIP && usedWhip) ||
      (transition === SceneTransition.DISSOLVE && usedDissolve) ||
      (transition !== SceneTransition.CUT && previous !== SceneTransition.CUT)
    ) {
      transition = SceneTransition.CUT;
    }

    if (transition === SceneTransition.WHIP) usedWhip = true;
    if (transition === SceneTransition.DISSOLVE) usedDissolve = true;
    previous = transition;
    normalized.set(scene.id, transition);
  });

  return scenes.map((scene) => ({
    ...scene,
    transitionIn: normalized.get(scene.id) ?? SceneTransition.CUT,
  }));
}

/**
 * Spoken lines: whitespace collapsed, clipped, empty ones dropped, at most 3.
 * Each keeps its beat: the shot, the reaction and its pause (snapped to
 * 0 to 3 s in steps of 0.5), and the delivery.
 */
export function coerceLines(
  lines: z.input<typeof lineOutput>[],
): SceneLineRecord[] {
  return lines
    .map((line) => ({
      speaker: clip(line.speaker, LIMITS.speaker),
      text: clip(line.text, LIMITS.line),
      shot: clip(line.shot ?? '', LIMITS.shot),
      reaction: clip(line.reaction ?? '', LIMITS.reaction),
      pauseSeconds: snapPause(line.pauseSeconds ?? 0),
      delivery: clip(line.delivery ?? '', LIMITS.delivery),
    }))
    .filter((line) => line.text)
    .slice(0, LIMITS.maxLines);
}

/** A stored line as the API returns it: lines from before beats read with none. */
export function readLine(line: SceneLineRecord): Required<SceneLineRecord> {
  return {
    speaker: line.speaker,
    text: line.text,
    shot: line.shot ?? '',
    reaction: line.reaction ?? '',
    pauseSeconds: snapPause(line.pauseSeconds ?? 0),
    delivery: line.delivery ?? '',
  };
}

/** A reaction's hold in seconds: 0 to 3, to the nearest half second. */
export function snapPause(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.min(LIMITS.maxPause, Math.max(0, Math.round(value * 2) / 2));
}

/** Every reaction hold in a scene, together (skits; 0 for narrated scenes). */
export function linePauses(scene: {
  lines?: { pauseSeconds?: number | null }[] | null;
}): number {
  return (scene.lines ?? []).reduce(
    (sum, line) => sum + snapPause(line.pauseSeconds ?? 0),
    0,
  );
}

/** When one line plays in its scene, in seconds from the scene's start. */
export interface LineBeat {
  /** The reaction starts (the camera is on the beat's shot). */
  startSeconds: number;
  /** The first word is said. */
  speakSeconds: number;
  /** The last word ends. */
  endSeconds: number;
}

/**
 * The one timeline a skit scene's lines follow, shared by the brief, the
 * clip description and the captions (mirrored in the web's spoken-length.ts).
 * With any pause, each line waits out its reaction and is said at about 2.5
 * words per second, and whatever time is left follows the last line (the
 * moment it lands); a scene shorter than that squeezes every beat evenly.
 * Lines with no pause at all, as written before beats existed, share the
 * scene by word count, as they always have.
 */
export function lineTimeline(
  lines: { text: string; pauseSeconds?: number | null }[],
  sceneSeconds: number,
): LineBeat[] {
  const counts = lines.map((line) => wordCount(line.text));
  const pauses = lines.map((line) => snapPause(line.pauseSeconds ?? 0));
  const words = counts.reduce((sum, count) => sum + count, 0);
  let cursor = 0;

  if (!pauses.some(Boolean)) {
    return counts.map((count) => {
      const start = cursor;
      cursor += words ? (sceneSeconds * count) / words : 0;
      return { startSeconds: start, speakSeconds: start, endSeconds: cursor };
    });
  }

  const natural =
    pauses.reduce((sum, pause) => sum + pause, 0) + words / WORDS_PER_SECOND;
  const scale = natural > sceneSeconds ? sceneSeconds / natural : 1;

  return counts.map((count, index) => {
    const start = cursor;
    const speak = start + pauses[index] * scale;
    cursor = speak + (count / WORDS_PER_SECOND) * scale;
    return { startSeconds: start, speakSeconds: speak, endSeconds: cursor };
  });
}

export function coerceDirection(
  direction: z.infer<typeof directionOutput>,
): SceneDirectionRecord {
  return {
    inFrame: direction.inFrame,
    framing: direction.framing,
    setting: clip(direction.setting, LIMITS.setting),
    props: joinProps(direction.props),
  };
}

export function coerceShoot(
  shoot: z.infer<typeof shootOutput>,
): ShootPlanRecord | null {
  const scenario = clip(shoot.scenario, LIMITS.scenario);

  if (!scenario) return null;

  return {
    scenario,
    presenter: clip(shoot.presenter ?? '', LIMITS.presenter) || null,
  };
}

/** Props as one comma-separated line: deduped, each clipped, at most 4. */
export function joinProps(props: string[]): string {
  const seen = new Set<string>();
  const kept: string[] = [];

  for (const prop of props) {
    const text = clip(prop.replace(/,/g, ' '), LIMITS.prop);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    kept.push(text);
  }

  return kept.slice(0, LIMITS.maxProps).join(', ').slice(0, LIMITS.props);
}

/** Splits a props line back into items, as the brief's checklist shows them. */
export function splitProps(props: string): string[] {
  return props
    .split(',')
    .map((prop) => prop.trim())
    .filter(Boolean);
}

export function clampDuration(value: number): number {
  if (!Number.isFinite(value)) return 5;

  return Math.min(
    LIMITS.maxDuration,
    Math.max(LIMITS.minDuration, Math.round(value)),
  );
}

/** The spoken pace every length estimate uses (the spoken-length card). */
export const WORDS_PER_SECOND = 2.5;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Everything said out loud in a scene: the narration and, in a skit, every
 * line. Scene lengths and the spoken-length estimate measure this.
 */
export function spokenText(scene: {
  narration: string;
  lines?: { text: string }[] | null;
}): string {
  return [scene.narration, ...(scene.lines ?? []).map((line) => line.text)]
    .filter(Boolean)
    .join(' ');
}

/** Words at about 2.5 per second, as shown in the spoken-length card. */
export function spokenSeconds(narrations: string[]): number {
  return Math.round(wordCount(narrations.join(' ')) / WORDS_PER_SECOND);
}

/** Whole seconds one scene's narration takes to say. */
export function narrationSeconds(narration: string): number {
  return Math.ceil(wordCount(narration) / WORDS_PER_SECOND);
}

/**
 * A scene is never shorter than its narration takes to say, so the scene
 * timeline the script shows is the one the voiceover will need. In a skit
 * that is the lines plus every reaction's pause. It can be longer (a pause on
 * the product); it stays within 2 to 15 seconds.
 */
export function fitDuration(
  value: number,
  narration: string,
  pauseSeconds = 0,
): number {
  return Math.min(
    LIMITS.maxDuration,
    Math.max(
      clampDuration(value),
      Math.ceil(wordCount(narration) / WORDS_PER_SECOND + pauseSeconds),
    ),
  );
}

export function sceneLengthRule(skit = false): string {
  if (skit) {
    return `Each scene plays its beats in order: a line's pause, then its words at about ${WORDS_PER_SECOND} words per second, then the next line's pause. Each scene's lines and pauses, all of them together, must fit within its durationSeconds, with about a second left after the last line for the final reaction and the action's sound: a 6-second scene whose pauses add up to 1.5 seconds holds about ${Math.floor((6 - 1.5 - 1) * WORDS_PER_SECOND)} words. Set durationSeconds from the lines and pauses you wrote, never shorter.`;
  }

  return `Each scene's narration must be sayable within its durationSeconds at about ${WORDS_PER_SECOND} words per second: a 4-second scene has at most ${4 * WORDS_PER_SECOND} words and a 6-second scene at most ${6 * WORDS_PER_SECOND}. Set durationSeconds from the narration you wrote, never shorter.`;
}
