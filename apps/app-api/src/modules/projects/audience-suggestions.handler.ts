import { Injectable, OnModuleInit } from '@nestjs/common';
import { Types } from 'mongoose';
import { z } from 'zod';
import {
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
import type { AudienceSuggestionRecord } from './repositories/projects.repository';

/** The Strategy Audience field limits (Design Reference §5.7). */
export const AUDIENCE_LIMITS = { buyer: 120, problem: 160, benefit: 160 };

export const AUDIENCE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['audiences'],
  properties: {
    audiences: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['buyer', 'problem', 'benefit', 'factIds'],
        properties: {
          buyer: { type: 'string' },
          problem: { type: 'string' },
          benefit: { type: 'string' },
          factIds: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

const audienceOutput = z.object({
  audiences: z
    .array(
      z.object({
        buyer: z.string(),
        problem: z.string(),
        benefit: z.string(),
        factIds: z.array(z.string()),
      }),
    )
    .min(3),
});

const INCOMPLETE = 'The draft came back incomplete, so we didn’t use it.';

/**
 * Suggests three distinct audiences (who buys, their problem, what they want
 * instead) grounded in the approved facts. Model output is untrusted: fact
 * ids are kept only when they are approved facts, and text is trimmed and
 * capped at the Audience field limits. Picking one is a normal strategy edit.
 */
@Injectable()
export class AudienceSuggestionsHandler
  implements GenerationJobHandler, OnModuleInit
{
  constructor(
    private readonly handlers: GenerationJobHandlers,
    private readonly projectsService: ProjectsService,
    private readonly textGeneration: TextGenerationService,
  ) {}

  onModuleInit(): void {
    this.handlers.register(GenerationJobType.SUGGEST_AUDIENCES, this);
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
      schemaName: 'audiences',
      schema: AUDIENCE_SCHEMA,
      messages: audienceMessages(project),
    });

    await context.setStep(2);

    const parsed = audienceOutput.safeParse(raw);

    if (!parsed.success) {
      throw new GenerationJobError(
        GenerationFailureCode.INVALID_OUTPUT,
        INCOMPLETE,
      );
    }

    const approvedIds = new Set(facts.map((fact) => fact.id));
    const clip = (text: string, max: number) =>
      text.replace(/\s+/g, ' ').trim().slice(0, max);
    const suggestions: AudienceSuggestionRecord[] = parsed.data.audiences
      .slice(0, 3)
      .map((audience) => ({
        id: new Types.ObjectId().toHexString(),
        buyer: clip(audience.buyer, AUDIENCE_LIMITS.buyer),
        problem: clip(audience.problem, AUDIENCE_LIMITS.problem),
        benefit: clip(audience.benefit, AUDIENCE_LIMITS.benefit),
        factIds: [...new Set(audience.factIds)].filter((id) =>
          approvedIds.has(id),
        ),
      }))
      .filter((audience) => audience.buyer);

    if (suggestions.length < 3) {
      throw new GenerationJobError(
        GenerationFailureCode.INVALID_OUTPUT,
        INCOMPLETE,
      );
    }

    await this.projectsService.setAudienceSuggestions(project.id, owner, {
      suggestions,
      factsFingerprint: factsFingerprint(facts),
      createdAt: new Date(),
    });

    return {};
  }
}

export function audienceMessages(
  project: Awaited<ReturnType<ProjectsService['getRecord']>>,
) {
  return [
    {
      role: 'system' as const,
      content: [
        'You suggest target audiences for short vertical affiliate videos.',
        'Suggest exactly three clearly different audiences who would plausibly buy this product, each grounded only in the approved facts provided.',
        'For each, write "buyer" (who they are, at most 120 characters, e.g. "Office workers who skip breakfast"), "problem" (the everyday problem they have that the product helps with, at most 160 characters) and "benefit" (what they want instead, at most 160 characters).',
        'Describe people and everyday situations in plain English; do not name real people, brands other than the product, or sensitive traits such as health conditions, age below 18, religion or ethnicity.',
        'Never imply performance, health, price, stock, guarantee or testimonial claims that are not in the approved facts.',
        'Write the problem and benefit in the buyer’s own terms. Mention a product detail only in the words of an approved fact; never infer uses, sizes or abilities the facts do not state.',
        'List the ids of the approved facts each audience relies on.',
      ].join(' '),
    },
    {
      role: 'user' as const,
      content: JSON.stringify({
        product: {
          title: project.product.title,
          category: project.product.category,
          description: project.product.description,
        },
        approvedFacts: project.approvedFacts.map((fact) => ({
          id: fact.id,
          text: fact.text,
        })),
        platform: project.strategy.platform,
      }),
    },
  ];
}
