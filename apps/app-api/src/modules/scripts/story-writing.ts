import { z } from 'zod';
import {
  ContentStyle,
  HookType,
  ScenePurpose,
  SceneTransition,
  ScriptLanguage,
  Storytelling,
} from 'src/graphql/generated/graphql';
import {
  ACTED_STORY_RULES,
  castLine,
  GENRE_LABELS,
  GENRE_NOTES,
  STORY_CONTINUITY_RULE,
  STORY_ENDING_RULE,
  STORY_FINAL_RULE,
  STORY_RULES,
} from '../studios/story';
import type { TextGenerationMessage } from '../text-generation/text-generation.service';
import type {
  ScriptSceneRecord,
  ShootPlanRecord,
} from './repositories/scripts.repository';
import {
  directionOutput,
  hookSceneRule,
  isSkit,
  LIMITS,
  lineOutput,
  NARRATED_HOOK,
  sceneLengthRule,
  SKIT_BEAT_CLAUSES,
  SKIT_LINES,
  SKIT_NO_NARRATOR,
  SKIT_SOUND,
  styleGuide,
  writingSchemas,
  type DraftOutput,
  type HookOutput,
  type SceneOutput,
  type StudioValues,
  type WritingContext,
  type WritingStory,
} from './script-writing';

/**
 * Story prompts, schemas and parsing (Product Specification §3.23, “Write
 * script” and “Story rules in prompts”). A story has no product, no facts
 * and no claims: its schemas have no claims, fact or CTA fields, and parsing
 * fills them empty, so the shared coercion and checks read a story like any
 * other version. The cast is written into the shoot plan by the server.
 */

/** Acted stories reuse the skit engine; narrated ones the narrated one. */
export const STORYTELLING_STYLE: Record<Storytelling, ContentStyle> = {
  [Storytelling.ACTED]: ContentStyle.SKIT,
  [Storytelling.NARRATED]: ContentStyle.NARRATION,
};

/** What each scene purpose is for, as the story prompt explains it. */
export const PURPOSE_NOTES: Record<ScenePurpose, string> = {
  [ScenePurpose.HOOK]: 'the opening that makes viewers stay',
  [ScenePurpose.PROBLEM]: 'the problem the viewer has',
  [ScenePurpose.DEMO]: 'the thing in use',
  [ScenePurpose.FEATURE]: 'one detail and what it does',
  [ScenePurpose.PROOF]: 'something that shows it works',
  [ScenePurpose.CALL_TO_ACTION]: 'what to do next',
  [ScenePurpose.SETUP]: 'who, where and what they want',
  [ScenePurpose.BUILD]: 'the trouble grows',
  [ScenePurpose.TURN]: 'the surprise or the choice',
  [ScenePurpose.PAYOFF]:
    'the cliffhanger: the moment the story built to, with something left open',
};

/** What each hook type does, as the story prompt explains it. */
export const HOOK_NOTES: Record<HookType, string> = {
  [HookType.PROBLEM_FIRST]: 'opens on the problem',
  [HookType.QUESTION]: 'asks the viewer something the video answers',
  [HookType.SHOW_DONT_TELL]: 'shows it before anyone says anything',
  [HookType.RELATABLE_MOMENT]:
    'a moment viewers recognise from their own lives',
  [HookType.DIRECT_PITCH]: 'says what it is straight away',
  [HookType.COLD_OPEN]: 'opens in the middle of the action',
  [HookType.FLASH_FORWARD]: 'shows a moment from the end first',
  [HookType.MYSTERY]: 'opens on something the viewer needs explained',
};

const STORY_WRITER =
  'You write short vertical story videos for small creators: fiction told in a few scenes and filmed with a phone.';

/** §3.23 “Story rules in prompts”: the D6 rules plus the cast and testimony rules. */
const STORY_EXTRA_RULES = [
  'Characters are fictional and are called only by their cast names: only the cast speaks, and no one else is named.',
  'No line reads like a testimonial or a review: nobody says they used, tried or recommend a product or service.',
].join(' ');

const STORY_LANGUAGE: Record<ScriptLanguage, string> = {
  [ScriptLanguage.ENGLISH]:
    'Write the lines, narration, on-screen text and caption in English.',
  [ScriptLanguage.FILIPINO]:
    'Write the lines, narration, on-screen text and caption in Filipino.',
  [ScriptLanguage.TAGLISH]:
    'Write the lines, narration, on-screen text and caption in natural Taglish (mixed Filipino and English), the way Filipino creators speak.',
};

/** Who is in frame in an acted story: the skit's guide without product shots. */
const ACTED_FRAME =
  'The cast acts the story out on camera: use CREATOR for most scenes (anyone from the cast), HANDS for a close-up of hands or an object someone holds, and PRODUCT_ONLY for a shot with no one in frame (a place, an object, the weather).';

const STORY_DIRECTION = [
  'Keep on-screen text under 60 characters; it may be empty.',
  `Direct every scene so a creator can film it with a phone: "visual" says what happens in the shot in under ${LIMITS.visual} characters, from how it opens to how it ends (for example "Starts on the empty bench, ends on Ana holding the umbrella up"), and "direction" says who or what is in frame, the framing, a short setting (where, and the time of day or light) and up to 4 props. Settings and props are ordinary places and things a creator can find; fights, falls and stunts are faked with angles and cuts, never real danger.`,
  'Choose how each scene comes in with "transitionIn". CUT is the default. Use PUNCH_IN for a reveal or a reaction that lands. Use WHIP at most once, into the turn. Use DISSOLVE only when time passes. Scene 1 must be CUT. Never place a non-cut transition directly after another non-cut transition.',
].join(' ');

/** The skit's acting clause without the product and call-to-action parts. */
const STORY_ACTING =
  'Keep the acting natural, never theatrical: each answer reacts to what was just said, expressions build with the story from the setup through the turn to the cliffhanger, nobody talks over anyone, and nobody looks into the camera unless the shot is POV.';

/** §3.22 skit rules with the product clauses replaced by the acted story rules. */
const ACTED_RULES = [
  ACTED_STORY_RULES,
  SKIT_NO_NARRATOR,
  SKIT_LINES,
  SKIT_SOUND,
  SKIT_BEAT_CLAUSES.lead,
  SKIT_BEAT_CLAUSES.shot,
  SKIT_BEAT_CLAUSES.reaction,
  SKIT_BEAT_CLAUSES.pause,
  SKIT_BEAT_CLAUSES.delivery,
  STORY_ACTING,
  SKIT_BEAT_CLAUSES.end,
].join(' ');

const STORY_SHOOT =
  'First write the shoot plan: "scenario" is the situation the whole story plays out, in one or two sentences, true to the premise, and "presenter" names the cast as given, first names only. The cast is given; don\'t add anyone to it.';
const ACTED_HOOK = `Each hook is the story's opening line, said out loud on camera by someone in the cast (never a narrator's line), under ${LIMITS.line} characters, and "openingShot" is how that moment is filmed.`;
const STORY_CAPTION =
  'The caption is a short line for posting that fits the story; it never sells anything.';

/** R29: a rewrite of the last scene is told it is the cliffhanger. */
const LAST_SCENE_REWRITE =
  "This is the story's last scene, the cliffhanger scene: it must end on a cliffhanger as the rule above says.";

/** §3.25: in a final episode, the last scene ends the story instead. */
const FINAL_SCENE_REWRITE =
  "This is the story's last scene, the ending scene: it must end the story as the rule above says.";

/** §3.25: the payoff's note in a final episode's scene order. */
const FINAL_PAYOFF_NOTE =
  'the ending: the moment the series built to, with the main question resolved';

/** §3.25: episode 2+'s script also recaps the previous episode for later ones. */
const PREVIOUS_RECAP = `Also write "previousRecap": what happened in the previous episode ("continuity.previous"), in one or two plain sentences under 300 characters that name the characters.`;

/** A final episode ends the story; every other story ends on a cliffhanger (R29). */
function endingRule(story: WritingStory): string {
  return story.endsSeries ? STORY_FINAL_RULE : STORY_ENDING_RULE;
}

/** Episode 2+ only, so Episode 1's prompts stay unchanged. */
function continuityRules(story: WritingStory): string[] {
  return story.continuity ? [STORY_CONTINUITY_RULE] : [];
}

/** The scene with the highest order is the story's last. */
function isLastScene(
  current: Pick<ScriptSceneRecord, 'id' | 'order'>,
  scenes: Array<Partial<Pick<ScriptSceneRecord, 'id' | 'order'>>>,
): boolean {
  return scenes.every(
    (scene) => scene.id === current.id || (scene.order ?? 0) < current.order,
  );
}

function storyOf(context: WritingContext): WritingStory {
  return (
    context.story ?? {
      genre: null,
      premise: null,
      cast: [],
      storytelling: Storytelling.NARRATED,
    }
  );
}

function hookTypesRule(studio: StudioValues, count: 'three' | 'one'): string {
  const types = studio.hookTypes
    .map((type) => `${type} (${HOOK_NOTES[type]})`)
    .join(', ');

  return count === 'three'
    ? `Write three clearly different hooks, each with the opening shot that goes with it, and give each a different "type" from: ${types}.`
    : `Give it a "type" from: ${types}.`;
}

function scenesRule(context: WritingContext, studio: StudioValues): string {
  const purposes = studio.scenePurposes;
  const final = storyOf(context).endsSeries;
  const order = purposes
    .map(
      (purpose) =>
        `${purpose} (${final && purpose === ScenePurpose.PAYOFF ? FINAL_PAYOFF_NOTE : PURPOSE_NOTES[purpose]})`,
    )
    .join(', ');

  return `Then write 4 to ${LIMITS.maxScenes} scenes whose durations add up to about ${context.strategy.lengthSeconds} seconds. Give each scene a "purpose" from the story's purposes, in story order: ${order}. The first scene is ${purposes[0]} and the last is ${purposes[purposes.length - 1]}; a purpose in between may span two scenes.`;
}

function storyStyle(context: WritingContext, skit: boolean): string {
  return skit ? ACTED_FRAME : styleGuide(context);
}

function contextMessage(context: WritingContext): TextGenerationMessage {
  const story = storyOf(context);

  return {
    role: 'user',
    content: JSON.stringify({
      genre: story.genre ? GENRE_LABELS[story.genre] : null,
      genreNote: story.genre ? GENRE_NOTES[story.genre] : null,
      premise: story.premise
        ? { title: story.premise.title || null, logline: story.premise.logline }
        : null,
      cast: story.cast.map(({ name, role, look }) => ({ name, role, look })),
      storytelling: story.storytelling,
      language: context.strategy.language,
      targetLengthSeconds: context.strategy.lengthSeconds,
      ...(story.continuity
        ? {
            continuity: {
              episode: story.continuity.episodeNumber,
              finalEpisode: Boolean(story.endsSeries),
              seriesPremise: story.continuity.seriesPremise,
              earlierEpisodes: story.continuity.earlier.map((item) => ({
                episode: item.episodeNumber,
                recap: item.recap,
              })),
              previous: {
                episode: story.continuity.previous.episodeNumber,
                scenes: story.continuity.previous.scenes,
              },
            },
          }
        : {}),
    }),
  };
}

export function storyScriptMessages(
  context: WritingContext,
  studio: StudioValues,
): TextGenerationMessage[] {
  const skit = isSkit(context.strategy.contentStyle);
  const story = storyOf(context);

  return [
    {
      role: 'system',
      content: [
        STORY_WRITER,
        STORY_RULES,
        STORY_EXTRA_RULES,
        STORY_LANGUAGE[context.strategy.language],
        storyStyle(context, skit),
        STORY_DIRECTION,
        ...(skit ? [ACTED_RULES] : []),
        ...continuityRules(story),
        STORY_SHOOT,
        hookTypesRule(studio, 'three'),
        skit ? ACTED_HOOK : NARRATED_HOOK,
        scenesRule(context, studio),
        endingRule(story),
        STORY_CAPTION,
        ...(story.continuity ? [PREVIOUS_RECAP] : []),
        hookSceneRule(skit),
        sceneLengthRule(skit),
      ].join(' '),
    },
    contextMessage(context),
  ];
}

export function storyHookRewriteMessages(
  context: WritingContext,
  studio: StudioValues,
  otherHooks: string[],
  current: string,
): TextGenerationMessage[] {
  return [
    {
      role: 'system',
      content: [
        STORY_WRITER,
        STORY_RULES,
        STORY_EXTRA_RULES,
        STORY_LANGUAGE[context.strategy.language],
        ...continuityRules(storyOf(context)),
        'Rewrite one opening hook. Make it clearly different from the current hook and from the other hooks.',
        hookTypesRule(studio, 'one'),
        isSkit(context.strategy.contentStyle) ? ACTED_HOOK : NARRATED_HOOK,
      ].join(' '),
    },
    contextMessage(context),
    {
      role: 'user',
      content: JSON.stringify({ currentHook: current, otherHooks }),
    },
  ];
}

export function storySceneRewriteMessages(
  context: WritingContext,
  scenes: Array<
    Pick<
      ScriptSceneRecord,
      'purpose' | 'narration' | 'transitionIn' | 'lines'
    > &
      Partial<Pick<ScriptSceneRecord, 'id' | 'order'>>
  >,
  current: ScriptSceneRecord,
  shoot: ShootPlanRecord | null,
  openingHook: string | null = null,
): TextGenerationMessage[] {
  const skit = isSkit(context.strategy.contentStyle);
  const last = isLastScene(current, scenes);
  const story = storyOf(context);

  return [
    {
      role: 'system',
      content: [
        STORY_WRITER,
        STORY_RULES,
        STORY_EXTRA_RULES,
        STORY_LANGUAGE[context.strategy.language],
        storyStyle(context, skit),
        STORY_DIRECTION,
        ...(skit ? [ACTED_RULES] : []),
        ...continuityRules(story),
        endingRule(story),
        `Rewrite one scene of the story. Keep its purpose (${current.purpose}: ${PURPOSE_NOTES[current.purpose]}) and about the same duration (${current.durationSeconds} seconds) so it fits between the scenes around it, and keep it within the shoot plan's scenario and cast.`,
        ...(openingHook
          ? [
              `This scene opens the video with the chosen hook ("openingHook"): keep its ${skit ? "first line's text" : 'narration'} exactly as that hook reads.`,
            ]
          : []),
        ...(last
          ? [story.endsSeries ? FINAL_SCENE_REWRITE : LAST_SCENE_REWRITE]
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

// ── Schemas and parsing ─────────────────────────────────────────────────────

/**
 * Fields a story never has: product claims, fact ids and a CTA. The shoot
 * plan keeps "presenter" (overwritten with the cast on parse): without it,
 * live runs leaked presenter-like text into the end of "scenario".
 */
const STORY_OMITTED = new Set(['claims', 'factIds', 'cta']);

/** Removes the fields a story never has from every object schema. */
function withoutStoryOmitted(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(withoutStoryOmitted);
  if (typeof schema !== 'object' || schema === null) return schema;

  const object = schema as Record<string, unknown>;
  const isObjectSchema =
    object.type === 'object' &&
    typeof object.properties === 'object' &&
    object.properties !== null;

  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => {
      if (isObjectSchema && key === 'properties') {
        return [
          key,
          Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
              .filter(([name]) => !STORY_OMITTED.has(name))
              .map(([name, child]) => [name, withoutStoryOmitted(child)]),
          ),
        ];
      }
      if (isObjectSchema && key === 'required' && Array.isArray(value)) {
        return [
          key,
          value.filter((name) => !STORY_OMITTED.has(name as string)),
        ];
      }

      return [key, withoutStoryOmitted(value)];
    }),
  );
}

export type StorySchemas = Record<
  'script' | 'skitScript' | 'hook' | 'scene' | 'skitScene',
  Record<string, unknown>
>;

/** §3.25: an episode 2+ draft also returns the previous episode's recap. */
export function withPreviousRecap(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...schema,
    required: [...(schema.required as string[]), 'previousRecap'],
    properties: {
      ...(schema.properties as Record<string, unknown>),
      previousRecap: { type: 'string' },
    },
  };
}

/** A story studio's schemas: its allowlists, without product fields. */
export function storySchemas(studio: StudioValues): StorySchemas {
  const schemas = writingSchemas(studio);

  return {
    script: withoutStoryOmitted(schemas.script) as Record<string, unknown>,
    skitScript: withoutStoryOmitted(schemas.skitScript) as Record<
      string,
      unknown
    >,
    hook: withoutStoryOmitted(schemas.hook) as Record<string, unknown>,
    scene: withoutStoryOmitted(schemas.scene) as Record<string, unknown>,
    skitScene: withoutStoryOmitted(schemas.skitScene) as Record<
      string,
      unknown
    >,
  };
}

const storyHookOutput = z.object({
  type: z.enum(HookType),
  text: z.string(),
  openingShot: z.string(),
});

const storySceneOutput = z.object({
  purpose: z.enum(ScenePurpose),
  durationSeconds: z.number(),
  narration: z.string(),
  onScreenText: z.string(),
  visual: z.string(),
  direction: directionOutput,
  transitionIn: z.enum(SceneTransition),
});

const storySkitSceneOutput = storySceneOutput.extend({
  lines: z.array(lineOutput),
  sound: z.string().nullable(),
});

const storyScriptOutput = z.object({
  shoot: z.object({
    scenario: z.string(),
    presenter: z.string().nullable().optional(),
  }),
  hooks: z.array(storyHookOutput).min(3),
  scenes: z.array(storySceneOutput).min(LIMITS.minScenes),
  caption: z.string(),
  previousRecap: z.string().optional(),
});

const storySkitScriptOutput = storyScriptOutput.extend({
  scenes: z.array(storySkitSceneOutput).min(LIMITS.minScenes),
});

/** A story hook read as a hook with no claims. */
function asHook(hook: z.infer<typeof storyHookOutput>): HookOutput {
  return { ...hook, claims: [] };
}

/** A story scene read as a scene with no claims, facts or CTA. */
function asScene(
  scene:
    z.infer<typeof storySceneOutput> | z.infer<typeof storySkitSceneOutput>,
): SceneOutput {
  return { ...scene, cta: null, factIds: [], claims: [] };
}

/**
 * Parses a story draft. The shoot plan's presenter is the story's cast,
 * written by the server (clipped to the presenter limit), never the model's.
 */
export function parseStoryDraft(
  raw: unknown,
  context: WritingContext,
): DraftOutput | null {
  const skit = isSkit(context.strategy.contentStyle);
  const parsed = (skit ? storySkitScriptOutput : storyScriptOutput).safeParse(
    raw,
  );

  if (!parsed.success) return null;

  return {
    shoot: {
      scenario: parsed.data.shoot.scenario,
      presenter: castLine(storyOf(context).cast, LIMITS.presenter),
    },
    hooks: parsed.data.hooks.map(asHook),
    scenes: parsed.data.scenes.map(asScene),
    caption: parsed.data.caption,
    ...(storyOf(context).continuity
      ? { previousRecap: parsed.data.previousRecap ?? null }
      : {}),
  };
}

export function parseStoryHook(raw: unknown): HookOutput | null {
  const parsed = z.object({ hook: storyHookOutput }).safeParse(raw);

  return parsed.success ? asHook(parsed.data.hook) : null;
}

export function parseStoryScene(
  raw: unknown,
  skit: boolean,
): SceneOutput | null {
  const parsed = z
    .object({ scene: skit ? storySkitSceneOutput : storySceneOutput })
    .safeParse(raw);

  return parsed.success ? asScene(parsed.data.scene) : null;
}
