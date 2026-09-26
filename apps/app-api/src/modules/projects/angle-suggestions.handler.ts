import { Injectable, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { z } from 'zod';
import {
  AngleKind,
  AngleType,
  GenerationFailureCode,
  GenerationJobType,
} from 'src/graphql/generated/graphql';
import { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import {
  GenerationJobError,
  type GenerationJobContext,
  type GenerationJobHandler,
  type GenerationJobResult,
} from '../generation-jobs/generation-jobs.types';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import { TextGenerationService } from '../text-generation/text-generation.service';
import { factsFingerprint, ProjectsService } from './projects.service';
import type { AngleSuggestionRecord } from './repositories/projects.repository';

const ANGLE_TYPES = Object.values(AngleType);

const angleSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['angles'],
  properties: {
    angles: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'title', 'pitch', 'factIds'],
        properties: {
          type: { type: 'string', enum: ANGLE_TYPES },
          title: { type: 'string' },
          pitch: { type: 'string' },
          factIds: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

const angleOutput = z.object({
  angles: z
    .array(
      z.object({
        type: z.enum(AngleType),
        title: z.string(),
        pitch: z.string(),
        factIds: z.array(z.string()),
      }),
    )
    .min(3),
});

/**
 * Suggests three distinct selling angles grounded in the approved facts.
 * Model output is untrusted: types come from an allowlist, fact ids are kept
 * only when they are approved facts, and text is trimmed and length-capped.
 */
@Injectable()
export class AngleSuggestionsHandler
  implements GenerationJobHandler, OnModuleInit
{
  constructor(
    private readonly handlers: GenerationJobHandlers,
    private readonly projectsService: ProjectsService,
    private readonly textGeneration: TextGenerationService,
  ) {}

  onModuleInit(): void {
    this.handlers.register(GenerationJobType.SUGGEST_ANGLES, this);
  }

  async run(
    job: GenerationJobRecord,
    context: GenerationJobContext,
  ): Promise<GenerationJobResult> {
    const owner = { ownerId: job.ownerId, organizationId: job.organizationId };
    const project = await this.projectsService.getRecord(job.projectId, owner);
    const facts = project.approvedFacts;

    await context.setStep(1);

    const raw = await this.textGeneration.generateJson({
      schemaName: 'selling_angles',
      schema: angleSchema,
      messages: [
        {
          role: 'system',
          content: [
            'You suggest selling angles for short vertical affiliate videos.',
            'Suggest exactly three clearly different angles, each grounded only in the approved facts provided.',
            'Never introduce performance, health, price, stock, guarantee or testimonial claims that are not in the approved facts.',
            'Write the title (at most 60 characters) and a one-sentence pitch (at most 160 characters) in plain English.',
            'List the ids of the approved facts each angle relies on.',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify({
            product: {
              title: project.product.title,
              category: project.product.category,
              description: project.product.description,
            },
            approvedFacts: facts.map((fact) => ({
              id: fact.id,
              text: fact.text,
            })),
            audience: {
              buyer: project.strategy.buyer,
              problem: project.strategy.problem,
              benefit: project.strategy.benefit,
            },
            platform: project.strategy.platform,
            tone: project.strategy.tone,
          }),
        },
      ],
    });

    await context.setStep(2);

    const parsed = angleOutput.safeParse(raw);

    if (!parsed.success) {
      throw new GenerationJobError(
        GenerationFailureCode.INVALID_OUTPUT,
        'The draft came back incomplete, so we didn’t use it.',
      );
    }

    const approvedIds = new Set(facts.map((fact) => fact.id));
    const suggestions: AngleSuggestionRecord[] = parsed.data.angles
      .slice(0, 3)
      .map((angle) => ({
        id: new Types.ObjectId().toHexString(),
        type: angle.type,
        title: angle.title.trim().slice(0, 60),
        pitch: angle.pitch.trim().slice(0, 160),
        factIds: [...new Set(angle.factIds)].filter((id) =>
          approvedIds.has(id),
        ),
      }))
      .filter((angle) => angle.title && angle.pitch);

    if (suggestions.length < 3) {
      throw new GenerationJobError(
        GenerationFailureCode.INVALID_OUTPUT,
        'The draft came back incomplete, so we didn’t use it.',
      );
    }

    // A chosen suggestion that is replaced is no longer selected; the
    // creator's own angle stays.
    const selected = project.strategy.selectedAngle;
    const strategy = {
      ...project.strategy,
      selectedAngle: selected?.kind === AngleKind.SUGGESTED ? null : selected,
    };

    await this.projectsService.setAngleSuggestions(
      project.id,
      owner,
      {
        suggestions,
        factsFingerprint: factsFingerprint(facts),
        createdAt: new Date(),
      },
      strategy,
    );

    return {};
  }
}
