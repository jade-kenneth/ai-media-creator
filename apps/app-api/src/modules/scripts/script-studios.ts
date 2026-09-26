import { ConflictError } from 'src/common/errors/app.error';
import {
  StudioType,
  Storytelling,
  type ContentStyle,
} from 'src/graphql/generated/graphql';
import { readEpisode, readStory } from '../projects/projects.service';
import type { ProjectRecord } from '../projects/repositories/projects.repository';
import { STUDIOS, studioOf, type StudioDefinition } from '../studios/studios';
import type { TextGenerationMessage } from '../text-generation/text-generation.service';
import type {
  ScriptSceneRecord,
  ScriptVersionRecord,
  ShootPlanRecord,
} from './repositories/scripts.repository';
import {
  hookRewriteMessages,
  hookRewriteOutput,
  isSkit,
  sceneRewriteMessages,
  sceneRewriteOutput,
  scriptMessages,
  scriptOutput,
  skitSceneRewriteOutput,
  skitScriptOutput,
  writingSchemas,
  type DraftOutput,
  type HookOutput,
  type SceneOutput,
  type WritingContext,
} from './script-writing';
import {
  parseStoryDraft,
  parseStoryHook,
  parseStoryScene,
  storyHookRewriteMessages,
  storySceneRewriteMessages,
  storySchemas,
  storyScriptMessages,
  STORYTELLING_STYLE,
  withPreviousRecap,
} from './story-writing';

/** One provider call: the schema, the prompt, and how to read the answer. */
export interface ModelRequest<T> {
  schema: Record<string, unknown>;
  messages: TextGenerationMessage[];
  /** The parsed answer, or null when it doesn't match the schema. */
  parse(raw: unknown): T | null;
}

type VersionSource = Pick<
  ScriptVersionRecord,
  'angleTitle' | 'language' | 'lengthSeconds'
> &
  Partial<Pick<ScriptVersionRecord, 'endsSeries'>>;

/**
 * The scripts half of a studio's definition (Product Specification §3.23,
 * “The studio contract”): what writing needs, what the model is told and how
 * its answer is read. Shared code (the service, the job handler) reads this
 * and the registry's `StudioDefinition`, never a studio's name, so a new
 * studio is a new entry here (the Record makes a missing one a type error).
 */
export interface ScriptStudio {
  /** Refuses a write until the intake has what the prompt needs (the footer's reasons). */
  assertReady(project: ProjectRecord): void;
  /** The model's inputs, from the project's intake. */
  context(project: ProjectRecord): WritingContext;
  /** What a written version records about what it was written from. */
  source(project: ProjectRecord): VersionSource;
  script(
    context: WritingContext,
    studio: StudioDefinition,
  ): ModelRequest<DraftOutput>;
  hook(
    context: WritingContext,
    studio: StudioDefinition,
    otherHooks: string[],
    current: string,
  ): ModelRequest<HookOutput>;
  scene(
    context: WritingContext,
    studio: StudioDefinition,
    scenes: ScriptSceneRecord[],
    current: ScriptSceneRecord,
    shoot: ShootPlanRecord | null,
    openingHook: string | null,
  ): ModelRequest<SceneOutput>;
}

function parsed<T>(result: { success: boolean; data?: T }): T | null {
  return result.success ? (result.data ?? null) : null;
}

/** Affiliate Studio: written from the product, approved facts and strategy (unchanged). */
const PRODUCT_SCRIPTS: ScriptStudio = {
  assertReady(project) {
    if (project.approvedFacts.length === 0) {
      throw new ConflictError('Approve at least one fact first.', {
        code: 'NO_APPROVED_FACTS',
      });
    }

    if (!project.strategy.buyer) {
      throw new ConflictError('Add who the buyer is.', { code: 'NO_BUYER' });
    }

    if (!project.strategy.selectedAngle?.text) {
      throw new ConflictError('Choose or write an angle.', {
        code: 'NO_ANGLE',
      });
    }
  },

  context(project) {
    const { strategy, product } = project;

    return {
      product: {
        title: product.title,
        category: product.category,
        description: product.description,
      },
      facts: project.approvedFacts,
      strategy: {
        buyer: strategy.buyer,
        problem: strategy.problem,
        benefit: strategy.benefit,
        platform: strategy.platform,
        language: strategy.language,
        lengthSeconds: strategy.lengthSeconds,
        tone: strategy.tone,
        contentStyle: strategy.contentStyle,
        angle: strategy.selectedAngle?.text || null,
      },
    };
  },

  source(project) {
    return {
      angleTitle: project.strategy.selectedAngle?.text || null,
      language: project.strategy.language,
      lengthSeconds: project.strategy.lengthSeconds,
    };
  },

  script(context, studio) {
    const skit = isSkit(context.strategy.contentStyle);
    const schemas = writingSchemas(studio);

    return {
      schema: skit ? schemas.skitScript : schemas.script,
      messages: scriptMessages(context),
      parse: (raw) =>
        parsed((skit ? skitScriptOutput : scriptOutput).safeParse(raw)),
    };
  },

  hook(context, studio, otherHooks, current) {
    return {
      schema: writingSchemas(studio).hook,
      messages: hookRewriteMessages(context, otherHooks, current),
      parse: (raw) => parsed(hookRewriteOutput.safeParse(raw))?.hook ?? null,
    };
  },

  scene(context, studio, scenes, current, shoot, openingHook) {
    const skit = isSkit(context.strategy.contentStyle);
    const schemas = writingSchemas(studio);

    return {
      schema: skit ? schemas.skitScene : schemas.scene,
      messages: sceneRewriteMessages(
        context,
        scenes,
        current,
        shoot,
        openingHook,
      ),
      parse: (raw) =>
        parsed(
          (skit ? skitSceneRewriteOutput : sceneRewriteOutput).safeParse(raw),
        )?.scene ?? null,
    };
  },
};

/** Entertainment Studio: written from the story (genre, premise, cast, format). */
const STORY_SCRIPTS: ScriptStudio = {
  assertReady(project) {
    const story = readStory(project);

    if (!story.genre) {
      throw new ConflictError('Pick a genre', { code: 'NO_GENRE' });
    }

    if (!story.premise?.logline.trim()) {
      throw new ConflictError('Choose or write a premise', {
        code: 'NO_PREMISE',
      });
    }

    if (story.storytelling === Storytelling.ACTED && story.cast.length === 0) {
      throw new ConflictError('Add a character, or switch to Narrated', {
        code: 'NO_CAST',
      });
    }
  },

  context(project) {
    const story = readStory(project);
    const contentStyle: ContentStyle = STORYTELLING_STYLE[story.storytelling];

    return {
      product: { title: null, category: null, description: null },
      facts: [],
      strategy: {
        buyer: null,
        problem: null,
        benefit: null,
        platform: project.strategy.platform,
        language: story.language,
        lengthSeconds: story.lengthSeconds,
        tone: project.strategy.tone,
        contentStyle,
        angle: story.premise?.title || null,
      },
      story: {
        genre: story.genre,
        premise: story.premise
          ? { title: story.premise.title, logline: story.premise.logline }
          : null,
        cast: story.cast.map(({ name, role, look }) => ({ name, role, look })),
        storytelling: story.storytelling,
        ...(readEpisode(project).isFinal ? { endsSeries: true } : {}),
      },
    };
  },

  source(project) {
    const story = readStory(project);

    return {
      angleTitle: story.premise?.title || null,
      language: story.language,
      lengthSeconds: story.lengthSeconds,
      ...(readEpisode(project).isFinal ? { endsSeries: true } : {}),
    };
  },

  script(context, studio) {
    const schemas = storySchemas(studio);
    const schema = isSkit(context.strategy.contentStyle)
      ? schemas.skitScript
      : schemas.script;

    return {
      schema: context.story?.continuity ? withPreviousRecap(schema) : schema,
      messages: storyScriptMessages(context, studio),
      parse: (raw) => parseStoryDraft(raw, context),
    };
  },

  hook(context, studio, otherHooks, current) {
    return {
      schema: storySchemas(studio).hook,
      messages: storyHookRewriteMessages(context, studio, otherHooks, current),
      parse: parseStoryHook,
    };
  },

  scene(context, studio, scenes, current, shoot, openingHook) {
    const skit = isSkit(context.strategy.contentStyle);
    const schemas = storySchemas(studio);

    return {
      schema: skit ? schemas.skitScene : schemas.scene,
      messages: storySceneRewriteMessages(
        context,
        scenes,
        current,
        shoot,
        openingHook,
      ),
      parse: (raw) => parseStoryScene(raw, skit),
    };
  },
};

export const SCRIPT_STUDIOS: Record<StudioType, ScriptStudio> = {
  [StudioType.AFFILIATE]: PRODUCT_SCRIPTS,
  [StudioType.ENTERTAINMENT]: STORY_SCRIPTS,
};

/** A studio's definition and its scripts half, from a stored studio value. */
export function scriptStudioOf(value: string | null | undefined): {
  definition: StudioDefinition;
  scripts: ScriptStudio;
} {
  const type = studioOf(value);

  return { definition: STUDIOS[type], scripts: SCRIPT_STUDIOS[type] };
}

/** A project's studio, for writing a new version. */
export function scriptStudioFor(project: { studioType?: string | null }) {
  return scriptStudioOf(project.studioType);
}

/** A version's studio (stamped on write; versions from before studios read Affiliate). */
export function versionStudio(version: { studio?: string | null }) {
  return scriptStudioOf(version.studio);
}
