import {
  GenerationFailureCode,
  ScriptLanguage,
  StoryGenre,
  Storytelling,
} from 'src/graphql/generated/graphql';
import { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import { STORY_LIMITS } from '../studios/story';
import type { TextGenerationService } from '../text-generation/text-generation.service';
import { clip, PremiseSuggestionsHandler } from './premise-suggestions.handler';
import type { ProjectsService } from './projects.service';

const story = {
  genre: StoryGenre.COMEDY,
  detail: 'Two strangers reach for the same umbrella.',
  premise: {
    kind: 'OWN',
    suggestionId: null,
    title: '',
    logline: 'Two strangers fight over the last umbrella.',
  },
  cast: [{ id: 'c1', name: 'Ana', role: 'a nurse', look: 'yellow raincoat' }],
  storytelling: Storytelling.ACTED,
  language: ScriptLanguage.TAGLISH,
  lengthSeconds: 45,
};
const job = {
  id: 'j1',
  ownerId: 'user-1',
  organizationId: 'org-a',
  projectId: 'p1',
} as GenerationJobRecord;
const context = { setStep: jest.fn(async () => undefined) };
const premise = (
  title: string,
  cast = [{ name: 'Ana', role: '', look: '' }],
) => ({
  title,
  logline: '  Two strangers   fight over the last umbrella. ',
  cast,
});

function setup(output: unknown, projectStory: unknown = story) {
  const projectsService = {
    getRecord: jest.fn(async () => ({ id: 'p1', story: projectStory })),
    setPremiseSuggestions: jest.fn(async () => undefined),
  };
  const textGeneration = {
    generateJson: jest.fn(
      async (_request: { messages: { content: string }[] }) => output,
    ),
  };
  const handler = new PremiseSuggestionsHandler(
    new GenerationJobHandlers(),
    projectsService as unknown as ProjectsService,
    textGeneration as unknown as TextGenerationService,
  );

  return { handler, projectsService, textGeneration };
}

describe('clip', () => {
  it('cuts an over-long text at a word boundary', () => {
    expect(clip('scuffed silver briefcase chained to his wrist', 34)).toBe(
      'scuffed silver briefcase chained',
    );
    expect(clip('  short   text ', 80)).toBe('short text');
    // One long word still fits the limit.
    expect(clip('x'.repeat(100), 60)).toHaveLength(60);
  });
});

describe('PremiseSuggestionsHandler', () => {
  it('stores three premises for the genre, clipped and with a deduped cast', async () => {
    const { handler, projectsService, textGeneration } = setup({
      premises: [
        premise('The Last Umbrella', [
          { name: 'Ana', role: 'a nurse', look: '20s' },
          { name: 'ana', role: 'duplicate', look: '' },
          { name: 'Ben', role: 'a rider', look: 'green jacket' },
        ]),
        premise('Wrong Delivery'),
        premise('x'.repeat(200)),
      ],
    });

    await handler.run(job, context);

    const [, , set] = projectsService.setPremiseSuggestions.mock
      .calls[0] as unknown as [
      string,
      unknown,
      {
        suggestions: {
          title: string;
          logline: string;
          cast: { name: string }[];
        }[];
        genre: StoryGenre;
        detail: string;
      },
    ];
    expect(set.genre).toBe(StoryGenre.COMEDY);
    expect(set.detail).toBe('Two strangers reach for the same umbrella.');
    expect(set.suggestions).toHaveLength(3);
    expect(set.suggestions[0].cast.map((c) => c.name)).toEqual(['Ana', 'Ben']);
    expect(set.suggestions[0].logline).toBe(
      'Two strangers fight over the last umbrella.',
    );
    expect(set.suggestions[2].title).toHaveLength(STORY_LIMITS.premiseTitle);

    const request = textGeneration.generateJson.mock.calls[0]?.[0];
    // The story rules (R28 D6) reach the model in the system prompt.
    expect(request?.messages[0].content).toContain('PG-13');
    expect(request?.messages[0].content).toContain('real public figure');
    // R29: every story ends on a cliffhanger, so the loglines end on the open question.
    expect(request?.messages[0].content).toContain('cliffhanger');
    expect(request?.messages[0].content).toContain(
      'Do not merely paraphrase the detail.',
    );
    const input = JSON.parse(request?.messages[1].content ?? '{}');
    expect(input.genre).toBe('Comedy');
    expect(input.detail).toBe('Two strangers reach for the same umbrella.');
    expect(input.cast).toEqual([
      { name: 'Ana', role: 'a nurse', look: 'yellow raincoat' },
    ]);
    expect(input.ownIdea).toBe('Two strangers fight over the last umbrella.');
  });

  it('keeps a missing optional detail valid and snapshots an empty string', async () => {
    const { handler, projectsService, textGeneration } = setup(
      {
        premises: [premise('A'), premise('B'), premise('C')],
      },
      { ...story, detail: undefined },
    );

    await handler.run(job, context);

    const request = textGeneration.generateJson.mock.calls[0]?.[0];
    const input = JSON.parse(request?.messages[1].content ?? '{}');
    expect(input.detail).toBeNull();
    expect(projectsService.setPremiseSuggestions).toHaveBeenCalledWith(
      'p1',
      expect.anything(),
      expect.objectContaining({ detail: '' }),
    );
  });

  it('fails as incomplete when too few premises are usable', async () => {
    for (const output of [
      { premises: [premise('A'), premise('B')] },
      { premises: [premise('A'), premise('B'), premise('C', [])] },
      { premises: [premise('A'), premise('B'), premise('   ')] },
      { nope: true },
    ]) {
      const { handler, projectsService } = setup(output);

      await expect(handler.run(job, context)).rejects.toMatchObject({
        code: GenerationFailureCode.INVALID_OUTPUT,
      });
      expect(projectsService.setPremiseSuggestions).not.toHaveBeenCalled();
    }
  });

  it('fails without calling the model when the story has no genre', async () => {
    const { handler, textGeneration } = setup(
      { premises: [] },
      { ...story, genre: null },
    );

    await expect(handler.run(job, context)).rejects.toMatchObject({
      code: GenerationFailureCode.INVALID_OUTPUT,
    });
    expect(textGeneration.generateJson).not.toHaveBeenCalled();
  });
});
