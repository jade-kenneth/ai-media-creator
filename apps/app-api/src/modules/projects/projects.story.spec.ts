import { ConfigService } from '@nestjs/config';
import { fakeRepository } from '../../../test/fake-repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
import {
  ContentStyle,
  GenerationJobType,
  PremiseKind,
  ProjectStatus,
  ProjectStepKey,
  ProjectStepStatus,
  ScriptLanguage,
  StoryGenre,
  Storytelling,
  StudioType,
  type UpdateStoryInput,
} from 'src/graphql/generated/graphql';
import type { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { AssetsService } from '../assets/assets.service';
import type { FactsService } from '../facts/facts.service';
import { ProjectDuplicatesService } from '../project-duplicates/project-duplicates.service';
import type { S3Service } from '../s3/s3.service';
import type { ScriptsService } from '../scripts/scripts.service';
import type { ProductImportService } from './product-import.service';
import { ProjectsService } from './projects.service';
import type {
  ProjectRecord,
  ProjectsRepository,
} from './repositories/projects.repository';

const owner = { ownerId: 'user-1', organizationId: 'org-a' };
const otherTenant = { ownerId: 'user-1', organizationId: 'org-b' };

function setup(videoBeta = false) {
  const repository = fakeRepository<ProjectRecord>();
  const jobs = {
    latestByProject: jest.fn(async () => new Map()),
    create: jest.fn(async (input: { type: GenerationJobType }) => ({
      id: 'job-1',
      ...input,
    })),
  };
  const service = new ProjectsService(
    repository as unknown as ProjectsRepository,
    jobs as unknown as GenerationJobsService,
    {} as unknown as ProductImportService,
    {
      createPresignedGetUrl: jest.fn(async () => 'https://signed.example/x'),
    } as unknown as S3Service,
    { get: () => videoBeta } as unknown as ConfigService,
  );

  return { service, repository, jobs };
}

async function story(service: ProjectsService) {
  return service.create(owner, { studio: StudioType.ENTERTAINMENT });
}

describe('ProjectsService — Entertainment Studio stories', () => {
  it('creates an untitled story that opens on the Story step', async () => {
    const { service } = setup();

    const project = await story(service);

    expect(project).toMatchObject({
      title: 'Untitled story',
      studio: StudioType.ENTERTAINMENT,
      status: ProjectStatus.DRAFT,
      currentStep: ProjectStepKey.STORY,
      productTitle: null,
      story: {
        genre: null,
        detail: '',
        premise: null,
        cast: [],
        storytelling: Storytelling.ACTED,
        language: ScriptLanguage.TAGLISH,
        lengthSeconds: 45,
      },
    });
    expect(project.steps.map((step) => step.key)).toEqual([
      ProjectStepKey.STORY,
      ProjectStepKey.SCRIPT,
      ProjectStepKey.BRIEF,
    ]);
    expect(project.steps[1]).toMatchObject({
      status: ProjectStepStatus.LOCKED,
      lockedReason: 'Finish the story first.',
    });
  });

  it('still creates an affiliate project by default', async () => {
    const { service } = setup();

    const project = await service.create(owner);

    expect(project).toMatchObject({
      title: 'Untitled project',
      studio: StudioType.AFFILIATE,
      story: null,
      currentStep: ProjectStepKey.PRODUCT,
    });
  });

  it('shows the video steps after Script when the video beta is on', async () => {
    const { service } = setup(true);

    const project = await story(service);

    expect(project.steps.map((step) => step.key)).toEqual([
      ProjectStepKey.STORY,
      ProjectStepKey.SCRIPT,
      ProjectStepKey.MEDIA,
      ProjectStepKey.VOICE,
      ProjectStepKey.EDIT,
      ProjectStepKey.BRIEF,
      ProjectStepKey.EXPORT,
    ]);
  });

  it('opens Script once the story has a genre, a premise and a character', async () => {
    const { service } = setup();
    const { id } = await story(service);

    let project = await service.updateStory(owner, {
      projectId: id,
      genre: StoryGenre.COMEDY,
      premise: { kind: PremiseKind.OWN, text: '  Two strangers   fight. ' },
    });
    expect(project.story?.premise).toMatchObject({
      kind: PremiseKind.OWN,
      logline: 'Two strangers fight.',
    });
    // Acted needs a character.
    expect(project.steps[1].status).toBe(ProjectStepStatus.LOCKED);

    project = await service.updateStory(owner, {
      projectId: id,
      storytelling: Storytelling.NARRATED,
    });
    expect(project.steps[0].status).toBe(ProjectStepStatus.DONE);
    expect(project.steps[1].status).toBe(ProjectStepStatus.OPEN);

    project = await service.updateStory(owner, {
      projectId: id,
      storytelling: Storytelling.ACTED,
      cast: [{ id: 'client-id-1', name: ' Ana ', role: 'a nurse', look: '' }],
    });
    expect(project.story?.cast).toEqual([
      { id: 'client-id-1', name: 'Ana', role: 'a nurse', look: '' },
    ]);
    expect(project.steps[1].status).toBe(ProjectStepStatus.OPEN);
  });

  it('normalizes, clears and validates the optional story detail without completing Story', async () => {
    const { service } = setup();
    const { id } = await story(service);

    let project = await service.updateStory(owner, {
      projectId: id,
      detail: '  Two strangers\n reach   for the same umbrella.  ',
    });
    expect(project.story?.detail).toBe(
      'Two strangers reach for the same umbrella.',
    );
    expect(project.steps[0].status).toBe(ProjectStepStatus.OPEN);
    expect(project.steps[1].status).toBe(ProjectStepStatus.LOCKED);

    project = await service.updateStory(owner, {
      projectId: id,
      detail: '   ',
    });
    expect(project.story?.detail).toBe('');

    await expect(
      service.updateStory(owner, {
        projectId: id,
        detail: 'x'.repeat(161),
      }),
    ).rejects.toMatchObject({
      message: 'Use 160 characters or fewer.',
      details: { field: 'input.detail' },
    });
  });

  it('reads missing legacy story and suggestion-set details as empty', async () => {
    const { service, repository } = setup();
    const { id } = await story(service);
    await repository.updateOne(
      { id },
      {
        story: {
          genre: StoryGenre.COMEDY,
          premise: null,
          cast: [],
          storytelling: Storytelling.ACTED,
          language: ScriptLanguage.TAGLISH,
          lengthSeconds: 45,
        },
        premiseSuggestionSet: {
          genre: StoryGenre.COMEDY,
          createdAt: new Date(),
          suggestions: [],
        },
      },
    );

    const project = await service.get(id, owner);
    expect(project.story?.detail).toBe('');
    expect(project.premiseSuggestionSet).toMatchObject({
      detail: '',
      isStale: false,
    });
  });

  it('validates the cast, the premise and the length', async () => {
    const { service } = setup();
    const { id } = await story(service);
    const cast = (names: string[]) =>
      names.map((name) => ({ name, role: '', look: '' }));

    for (const [input, message] of [
      [{ cast: cast(['A', 'B', 'C', 'D', 'E']) }, 'Add at most 4 characters.'],
      [{ cast: cast(['  ']) }, 'Add a name.'],
      [{ cast: cast(['x'.repeat(25)]) }, 'Use 24 characters or fewer.'],
      [{ cast: cast(['Ana', 'ana']) }, 'You already have ana.'],
      [
        { cast: [{ name: 'Ana', role: 'x'.repeat(81), look: '' }] },
        'Use 80 characters or fewer.',
      ],
      [
        { premise: { kind: PremiseKind.OWN, text: 'x'.repeat(281) } },
        'Use 280 characters or fewer.',
      ],
      [
        { premise: { kind: PremiseKind.SUGGESTED, suggestionId: 'nope' } },
        'Choose one of the suggested premises.',
      ],
      [{ lengthSeconds: 40 }, 'Choose 30, 45 or 60 seconds.'],
    ] as const) {
      await expect(
        service.updateStory(owner, {
          projectId: id,
          ...(input as unknown as Partial<UpdateStoryInput>),
        }),
      ).rejects.toThrow(new ValidationError(message));
    }
  });

  it('fills the cast from a chosen premise only while the cast is empty', async () => {
    const { service, repository } = setup();
    const { id } = await story(service);
    await repository.updateOne(
      { id },
      {
        premiseSuggestionSet: {
          genre: StoryGenre.COMEDY,
          detail: '',
          createdAt: new Date(),
          suggestions: [
            {
              id: 's1',
              title: 'The Last Umbrella',
              logline: 'Two strangers fight over the last umbrella.',
              cast: [{ id: 'c1', name: 'Ana', role: 'a nurse', look: '' }],
            },
          ],
        },
      },
    );

    let project = await service.updateStory(owner, {
      projectId: id,
      premise: { kind: PremiseKind.SUGGESTED, suggestionId: 's1' },
    });
    expect(project.story?.premise).toMatchObject({
      title: 'The Last Umbrella',
      suggestionId: 's1',
    });
    expect(project.story?.cast.map((c) => c.name)).toEqual(['Ana']);
    // No genre on the story yet, so the suggestions read as stale.
    expect(project.premiseSuggestionSet?.isStale).toBe(true);

    project = await service.updateStory(owner, {
      projectId: id,
      genre: StoryGenre.COMEDY,
      cast: [{ name: 'Mika', role: '', look: '' }],
    });
    expect(project.premiseSuggestionSet?.isStale).toBe(false);
    project = await service.updateStory(owner, {
      projectId: id,
      detail: 'Rain at a bus stop.',
    });
    expect(project.premiseSuggestionSet?.isStale).toBe(true);
    project = await service.updateStory(owner, {
      projectId: id,
      detail: '',
    });
    expect(project.premiseSuggestionSet?.isStale).toBe(false);
    project = await service.updateStory(owner, {
      projectId: id,
      premise: { kind: PremiseKind.SUGGESTED, suggestionId: 's1' },
    });
    expect(project.story?.cast.map((c) => c.name)).toEqual(['Mika']);
  });

  it('refuses studio-specific writes on the other studio', async () => {
    const { service } = setup();
    const storyProject = await story(service);
    const affiliate = await service.create(owner);

    await expect(
      service.updateProduct(owner, {
        projectId: storyProject.id,
        title: 'BlendGo',
      }),
    ).rejects.toThrow(new ConflictError('This project is a story.'));
    await expect(
      service.updateStrategy(owner, {
        projectId: storyProject.id,
        buyer: 'x',
      }),
    ).rejects.toThrow('This project is a story.');
    await expect(
      service.suggestAngles(owner, storyProject.id, 'k1'),
    ).rejects.toThrow('This project is a story.');
    await expect(
      service.updateStory(owner, {
        projectId: affiliate.id,
        genre: StoryGenre.DRAMA,
      }),
    ).rejects.toThrow('This project is an affiliate video.');
    await expect(
      service.suggestPremises(owner, affiliate.id, 'k2'),
    ).rejects.toThrow('This project is an affiliate video.');
  });

  it('suggests premises only once a genre is picked, as a 1-credit job', async () => {
    const { service, jobs } = setup();
    const { id } = await story(service);

    await expect(service.suggestPremises(owner, id, 'k1')).rejects.toThrow(
      new ConflictError('Pick a genre first.'),
    );

    await service.updateStory(owner, {
      projectId: id,
      genre: StoryGenre.HORROR,
    });
    await service.suggestPremises(owner, id, 'k1');

    expect(jobs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: GenerationJobType.SUGGEST_PREMISES,
        label: 'Suggest premises',
        creditCost: 1,
        idempotencyKey: 'k1',
      }),
    );
  });

  it('keeps another tenant from reading or writing a story', async () => {
    const { service } = setup();
    const { id } = await story(service);

    await expect(
      service.updateStory(otherTenant, {
        projectId: id,
        detail: 'A detail the other tenant cannot change.',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('copies the normalized story detail when a story project is duplicated', async () => {
    const { service } = setup();
    const { id } = await story(service);
    await service.updateStory(owner, {
      projectId: id,
      genre: StoryGenre.COMEDY,
      detail: '  One umbrella, two strangers.  ',
    });
    const duplicates = new ProjectDuplicatesService(
      service,
      {
        copyToProject: jest.fn(async () => new Map<string, string>()),
      } as unknown as FactsService,
      {
        copyToProject: jest.fn(async () => undefined),
      } as unknown as AssetsService,
      {
        copyApprovedToProject: jest.fn(async () => undefined),
      } as unknown as ScriptsService,
    );

    const copy = await duplicates.duplicate(id, owner);

    expect(copy.story?.detail).toBe('One umbrella, two strangers.');
  });
});

describe('ProjectsService — content styles by studio', () => {
  it('refuses a story-only content style on an affiliate project', async () => {
    const { service } = setup();
    const affiliate = await service.create(owner);

    await expect(
      service.updateStrategy(owner, {
        projectId: affiliate.id,
        contentStyle: ContentStyle.NARRATION,
      }),
    ).rejects.toThrow(new ValidationError('Choose one of the content styles.'));
    await expect(
      service.updateStrategy(owner, {
        projectId: affiliate.id,
        contentStyle: ContentStyle.SKIT,
      }),
    ).resolves.toMatchObject({
      strategy: { contentStyle: ContentStyle.SKIT },
    });
  });
});
