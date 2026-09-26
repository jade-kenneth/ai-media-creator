import { Injectable, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { z } from 'zod';
import {
  GenerationFailureCode,
  GenerationJobType,
  Storytelling,
} from 'src/graphql/generated/graphql';
import { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import {
  GenerationJobError,
  type GenerationJobContext,
  type GenerationJobHandler,
  type GenerationJobResult,
} from '../generation-jobs/generation-jobs.types';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import {
  GENRE_LABELS,
  GENRE_NOTES,
  STORY_LIMITS,
  STORY_RULES,
} from '../studios/story';
import { TextGenerationService } from '../text-generation/text-generation.service';
import { ProjectsService, readStory } from './projects.service';
import type {
  PremiseSuggestionRecord,
  StoryCharacterRecord,
} from './repositories/projects.repository';

const characterSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'role', 'look'],
  properties: {
    name: { type: 'string' },
    role: { type: 'string' },
    look: { type: 'string' },
  },
};

const premiseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['premises'],
  properties: {
    premises: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'logline', 'cast'],
        properties: {
          title: { type: 'string' },
          logline: { type: 'string' },
          cast: {
            type: 'array',
            minItems: 1,
            maxItems: STORY_LIMITS.cast,
            items: characterSchema,
          },
        },
      },
    },
  },
};

const premiseOutput = z.object({
  premises: z
    .array(
      z.object({
        title: z.string(),
        logline: z.string(),
        cast: z.array(
          z.object({ name: z.string(), role: z.string(), look: z.string() }),
        ),
      }),
    )
    .min(3),
});

const INCOMPLETE = 'The draft came back incomplete, so we didn’t use it.';

/** Collapses whitespace and cuts an over-long text at its last word that fits. */
export function clip(value: string, max: number): string {
  const text = value.replace(/\s+/g, ' ').trim();

  if (text.length <= max) return text;

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');

  return (lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut)
    .replace(/[\s,;:.-]+$/, '')
    .trim();
}

/** A suggestion's cast: names clipped, deduped case-insensitively, at most 4. */
export function coerceCast(
  cast: Array<{ name: string; role: string; look: string }>,
): StoryCharacterRecord[] {
  const seen = new Set<string>();

  return cast
    .map((character) => ({
      id: new Types.ObjectId().toHexString(),
      name: clip(character.name, STORY_LIMITS.name),
      role: clip(character.role, STORY_LIMITS.role),
      look: clip(character.look, STORY_LIMITS.look),
    }))
    .filter((character) => {
      const key = character.name.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, STORY_LIMITS.cast);
}

/**
 * Suggests three story premises for the story's genre (Product Specification
 * §3.23). Model output is untrusted: text is collapsed and length-capped, the
 * cast is deduped and capped, and fewer than three usable premises fail.
 */
@Injectable()
export class PremiseSuggestionsHandler
  implements GenerationJobHandler, OnModuleInit
{
  constructor(
    private readonly handlers: GenerationJobHandlers,
    private readonly projectsService: ProjectsService,
    private readonly textGeneration: TextGenerationService,
  ) {}

  onModuleInit(): void {
    this.handlers.register(GenerationJobType.SUGGEST_PREMISES, this);
  }

  async run(
    job: GenerationJobRecord,
    context: GenerationJobContext,
  ): Promise<GenerationJobResult> {
    const owner = { ownerId: job.ownerId, organizationId: job.organizationId };
    const project = await this.projectsService.getRecord(job.projectId, owner);
    const story = readStory(project);
    const genre = story.genre;

    if (!genre) {
      throw new GenerationJobError(
        GenerationFailureCode.INVALID_OUTPUT,
        INCOMPLETE,
      );
    }

    await context.setStep(1);

    const raw = await this.textGeneration.generateJson({
      schemaName: 'story_premises',
      schema: premiseSchema,
      messages: [
        {
          role: 'system',
          content: [
            'You suggest premises for short vertical story videos (30 to 60 seconds) made by one creator.',
            'Suggest exactly three clearly different premises in the given genre, each small enough to play out in a few scenes.',
            `Write each title in at most ${STORY_LIMITS.premiseTitle} characters and each logline as one sentence of at most ${STORY_LIMITS.logline} characters, in plain English.`,
            `Give each premise a cast of 1 to ${STORY_LIMITS.cast} fictional characters: a first name (at most ${STORY_LIMITS.name} characters), who they are and how they look (each at most ${STORY_LIMITS.role} characters).`,
            story.storytelling === Storytelling.ACTED
              ? 'The cast acts the story out on camera, so every premise needs at least one character who speaks.'
              : 'A narrator tells the story over the scenes.',
            'Every story ends on a cliffhanger, so end each logline on the open question, reveal or twist the story leaves hanging.',
            'When the creator gives one small story detail, use it as a constraint and develop three complete, clearly different premises and casts around it. Do not merely paraphrase the detail.',
            'When the creator already named characters, use them.',
            'When the creator described their own idea, suggest three takes on it.',
            STORY_RULES,
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify({
            genre: GENRE_LABELS[genre],
            genreNote: GENRE_NOTES[genre],
            detail: story.detail || null,
            storytelling: story.storytelling,
            language: story.language,
            lengthSeconds: story.lengthSeconds,
            cast: story.cast.map(({ name, role, look }) => ({
              name,
              role,
              look,
            })),
            ownIdea:
              story.premise?.kind === 'OWN' ? story.premise.logline : null,
          }),
        },
      ],
    });

    await context.setStep(2);

    const parsed = premiseOutput.safeParse(raw);

    if (!parsed.success) {
      throw new GenerationJobError(
        GenerationFailureCode.INVALID_OUTPUT,
        INCOMPLETE,
      );
    }

    const suggestions: PremiseSuggestionRecord[] = parsed.data.premises
      .slice(0, 3)
      .map((premise) => ({
        id: new Types.ObjectId().toHexString(),
        title: clip(premise.title, STORY_LIMITS.premiseTitle),
        logline: clip(premise.logline, STORY_LIMITS.logline),
        cast: coerceCast(premise.cast),
      }))
      .filter(
        (premise) =>
          premise.title && premise.logline && premise.cast.length > 0,
      );

    if (suggestions.length < 3) {
      throw new GenerationJobError(
        GenerationFailureCode.INVALID_OUTPUT,
        INCOMPLETE,
      );
    }

    await this.projectsService.setPremiseSuggestions(project.id, owner, {
      suggestions,
      genre,
      detail: story.detail,
      createdAt: new Date(),
    });

    return {};
  }
}
