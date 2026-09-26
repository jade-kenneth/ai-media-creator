import { GenerationFailureCode } from 'src/graphql/generated/graphql';
import { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import type { TextGenerationService } from '../text-generation/text-generation.service';
import {
  AUDIENCE_LIMITS,
  AudienceSuggestionsHandler,
} from './audience-suggestions.handler';
import { factsFingerprint, type ProjectsService } from './projects.service';

const facts = [
  { id: 'f1', text: 'Holds 380 ml' },
  { id: 'f2', text: 'Charges by USB-C' },
];
const project = {
  id: 'p1',
  product: { title: 'BlendGo Mini', category: 'Kitchen', description: '' },
  approvedFacts: facts,
  strategy: { platform: 'TIKTOK_SHOP' },
};
const job = {
  id: 'j1',
  ownerId: 'user-1',
  organizationId: 'org-a',
  projectId: 'p1',
} as GenerationJobRecord;
const context = { setStep: jest.fn(async () => undefined) };
const audience = (buyer: string, factIds = ['f1']) => ({
  buyer,
  problem: '  No   time to eat before the commute ',
  benefit: 'A filling breakfast they can take along',
  factIds,
});

function setup(output: unknown) {
  const projectsService = {
    getRecord: jest.fn(async () => project),
    setAudienceSuggestions: jest.fn(async () => undefined),
  };
  const textGeneration = {
    generateJson: jest.fn(
      async (_request: { messages: { content: string }[] }) => output,
    ),
  };
  const handler = new AudienceSuggestionsHandler(
    new GenerationJobHandlers(),
    projectsService as unknown as ProjectsService,
    textGeneration as unknown as TextGenerationService,
  );

  return { handler, projectsService, textGeneration };
}

describe('AudienceSuggestionsHandler', () => {
  it('stores three audiences grounded in approved facts, trimmed to the field limits', async () => {
    const { handler, projectsService, textGeneration } = setup({
      audiences: [
        audience('Office workers who skip breakfast', ['f1', 'f1', 'nope']),
        audience('Students with early classes', ['f2']),
        audience('x'.repeat(200)),
      ],
    });

    await handler.run(job, context);

    const [, , set] = projectsService.setAudienceSuggestions.mock
      .calls[0] as unknown as [
      string,
      unknown,
      {
        suggestions: { buyer: string; problem: string; factIds: string[] }[];
        factsFingerprint: string;
      },
    ];
    expect(set.suggestions).toHaveLength(3);
    // Unknown and repeated fact ids are dropped.
    expect(set.suggestions[0].factIds).toEqual(['f1']);
    expect(set.suggestions[0].problem).toBe(
      'No time to eat before the commute',
    );
    expect(set.suggestions[2].buyer).toHaveLength(AUDIENCE_LIMITS.buyer);
    expect(set.factsFingerprint).toBe(factsFingerprint(facts));
    // The model sees the approved facts and product, not earlier audience text.
    const prompt = JSON.parse(
      textGeneration.generateJson.mock.calls[0]?.[0].messages[1].content ??
        '{}',
    );
    expect(prompt.approvedFacts).toEqual(facts);
    expect(prompt.audience).toBeUndefined();
  });

  it('fails as incomplete when the model returns too few or blank audiences', async () => {
    for (const output of [
      { audiences: [audience('A'), audience('B')] },
      { audiences: [audience('A'), audience('B'), audience('   ')] },
      { nope: true },
    ]) {
      const { handler, projectsService } = setup(output);

      await expect(handler.run(job, context)).rejects.toMatchObject({
        code: GenerationFailureCode.INVALID_OUTPUT,
      });
      expect(projectsService.setAudienceSuggestions).not.toHaveBeenCalled();
    }
  });
});
