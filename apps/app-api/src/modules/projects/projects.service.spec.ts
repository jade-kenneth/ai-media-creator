import { fakeRepository } from '../../../test/fake-repository';
import { NotFoundError, ValidationError } from 'src/common/errors/app.error';
import {
  AngleKind,
  ContentStyle,
  FieldSource,
  ImportOutcome,
  Platform,
  ProductField,
  ProjectStage,
  ProjectStatus,
  ProjectStepKey,
  ProjectStepStatus,
  ScriptLanguage,
  StudioType,
  Tone,
} from 'src/graphql/generated/graphql';
import type { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { S3Service } from '../s3/s3.service';
import type { ProductImportService } from './product-import.service';
import { ConfigService } from '@nestjs/config';
import {
  computeProgress,
  ProjectsService,
  type ProgressOptions,
} from './projects.service';
import type {
  ProjectRecord,
  ProjectsRepository,
} from './repositories/projects.repository';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';
const owner = { ownerId: 'user-1', organizationId: TENANT_A };

function setup(
  importAttempt = {
    outcome: ImportOutcome.PARTIAL,
    host: 'shop.example',
    data: {
      title: 'BlendGo Mini Portable Blender',
      category: null,
      pricePhp: 899,
      description: null,
    },
  },
) {
  const repository = fakeRepository<ProjectRecord>();
  const service = new ProjectsService(
    repository as unknown as ProjectsRepository,
    {
      latestByProject: jest.fn(async () => new Map()),
    } as unknown as GenerationJobsService,
    {
      fetchProduct: jest.fn(async () => importAttempt),
    } as unknown as ProductImportService,
    {
      createPresignedGetUrl: jest.fn(
        async () => 'https://signed.example/thumb',
      ),
    } as unknown as S3Service,
    { get: () => false } as unknown as ConfigService,
  );

  return { service, repository };
}

function progressOf(
  overrides: Partial<ProjectRecord>,
  options: ProgressOptions = {},
) {
  const base: ProjectRecord = {
    id: 'a'.repeat(24),
    ownerId: owner.ownerId,
    organizationId: TENANT_A,
    studioType: StudioType.AFFILIATE,
    title: 'Portable Blender, Morning Smoothie Hook',
    titleSort: 'portable blender, morning smoothie hook',
    status: ProjectStatus.DRAFT,
    product: {
      title: null,
      category: null,
      pricePhp: null,
      description: null,
      affiliateUrl: null,
      features: [],
      fieldSources: {},
      importUrl: null,
      lastImport: null,
    },
    strategy: {
      buyer: null,
      problem: null,
      benefit: null,
      platform: Platform.TIKTOK_SHOP,
      language: ScriptLanguage.TAGLISH,
      lengthSeconds: 30,
      tone: Tone.FRIENDLY,
      contentStyle: ContentStyle.VOICEOVER_PRODUCT_SHOTS,
      selectedAngle: null,
    },
    angleSuggestionSet: null,
    factsSummary: {
      total: 0,
      unreviewed: 0,
      approved: 0,
      rejected: 0,
      unknown: 0,
    },
    approvedFacts: [],
    scriptSummary: {
      versionCount: 0,
      latestNumber: 0,
      latestIsDraft: false,
      approved: [],
    },
    thumbnailKey: null,
    assetCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return computeProgress({ ...base, ...overrides }, options);
}

describe('ProjectsService', () => {
  it('creates an untitled draft that opens on the product step', async () => {
    const { service } = setup();

    const project = await service.create(owner);

    expect(project).toMatchObject({
      title: 'Untitled project',
      status: ProjectStatus.DRAFT,
      stage: ProjectStage.DRAFT,
      currentStep: ProjectStepKey.PRODUCT,
    });
  });

  it('validates a project name', async () => {
    const { service } = setup();
    const project = await service.create(owner);

    await expect(
      service.rename(owner, { id: project.id, title: '   ' }),
    ).rejects.toThrow(ValidationError);
    await expect(
      service.rename(owner, { id: project.id, title: 'x'.repeat(81) }),
    ).rejects.toThrow('Use 80 characters or fewer.');
    await expect(
      service.rename(owner, {
        id: project.id,
        title: 'LED Desk Lamp, WFH Setup',
      }),
    ).resolves.toMatchObject({ title: 'LED Desk Lamp, WFH Setup' });
  });

  it('tracks where each product value came from', async () => {
    const { service } = setup();
    const project = await service.create(owner);

    await service.importProduct(owner, {
      projectId: project.id,
      url: 'https://shop.example/listing/blendgo-mini-380',
    });
    const edited = await service.updateProduct(owner, {
      projectId: project.id,
      title: 'BlendGo Mini Blender',
      category: 'Kitchen & Dining',
    });

    const sources = Object.fromEntries(
      edited.product.fieldSources.map(({ field, source }) => [field, source]),
    );
    expect(sources[ProductField.TITLE]).toBe(FieldSource.EDITED);
    expect(sources[ProductField.PRICE]).toBe(FieldSource.IMPORTED);
    expect(sources[ProductField.CATEGORY]).toBe(FieldSource.CREATOR);
  });

  it('reads a stored project whose empty field sources were not saved', async () => {
    const { service, repository } = setup();
    const project = await service.create(owner);
    // Mongo drops an empty object on save, so the stored record lacks it.
    for (const record of repository.records) {
      delete (record.product as Partial<ProjectRecord['product']>).fieldSources;
    }

    const page = await service.list(owner, null, null, null);
    expect(page.edges[0]?.node.product.fieldSources).toEqual([]);

    const edited = await service.updateProduct(owner, {
      projectId: project.id,
      title: 'BlendGo Mini Blender',
    });
    expect(edited.product.fieldSources).toEqual([
      { field: ProductField.TITLE, source: FieldSource.CREATOR },
    ]);
  });

  it('imports into empty fields only and names what was not found', async () => {
    const { service } = setup();
    const project = await service.create(owner);
    await service.updateProduct(owner, {
      projectId: project.id,
      title: 'My own title',
    });

    const result = await service.importProduct(owner, {
      projectId: project.id,
      url: 'https://shop.example/listing/blendgo-mini-380',
    });

    expect(result.outcome).toBe(ImportOutcome.PARTIAL);
    expect(result.filled).toEqual([ProductField.PRICE]);
    expect(result.missing).toEqual([
      ProductField.CATEGORY,
      ProductField.DESCRIPTION,
      ProductField.FEATURES,
    ]);
    expect(result.project.product.title).toBe('My own title');
  });

  it('requires an https affiliate link', async () => {
    const { service } = setup();
    const project = await service.create(owner);

    await expect(
      service.updateProduct(owner, {
        projectId: project.id,
        affiliateUrl: 'http://shop.example/blendgo-mini',
      }),
    ).rejects.toThrow('Enter a full link that starts with https://');
  });

  it('treats a project from another tenant as not found', async () => {
    const { service } = setup();
    const project = await service.create(owner);

    await expect(
      service.get(project.id, { ...owner, organizationId: TENANT_B }),
    ).rejects.toThrow(NotFoundError);
    await expect(service.get(project.id, owner)).resolves.toMatchObject({
      id: project.id,
    });
    await expect(service.get('not-an-id', owner)).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe('computeProgress', () => {
  const approvedFacts = [{ id: 'f1', text: 'Holds 380 ml' }];

  it('locks later steps with their reasons', () => {
    const progress = progressOf({});

    expect(progress.steps.map((step) => [step.key, step.status])).toEqual([
      [ProjectStepKey.PRODUCT, ProjectStepStatus.OPEN],
      [ProjectStepKey.FACTS, ProjectStepStatus.LOCKED],
      [ProjectStepKey.STRATEGY, ProjectStepStatus.LOCKED],
      [ProjectStepKey.SCRIPT, ProjectStepStatus.LOCKED],
      [ProjectStepKey.BRIEF, ProjectStepStatus.LOCKED],
    ]);
    expect(progress.steps[1].lockedReason).toBe(
      'Add the product title and link first.',
    );
  });

  it('resumes at strategy once every fact is reviewed', () => {
    const progress = progressOf({
      status: ProjectStatus.FACTS_REVIEW,
      factsSummary: {
        total: 2,
        unreviewed: 0,
        approved: 1,
        rejected: 1,
        unknown: 0,
      },
      approvedFacts,
    });

    expect(progress.currentStep).toBe(ProjectStepKey.STRATEGY);
    expect(progress.steps[2].status).toBe(ProjectStepStatus.OPEN);
  });

  it('opens the brief when an approved script is current', () => {
    const progress = progressOf({
      status: ProjectStatus.SCRIPT_REVIEW,
      factsSummary: {
        total: 1,
        unreviewed: 0,
        approved: 1,
        rejected: 0,
        unknown: 0,
      },
      approvedFacts,
      strategy: {
        buyer: 'Office workers who skip breakfast',
        problem: null,
        benefit: null,
        platform: Platform.TIKTOK_SHOP,
        language: ScriptLanguage.TAGLISH,
        lengthSeconds: 30,
        tone: Tone.FRIENDLY,
        contentStyle: ContentStyle.VOICEOVER_PRODUCT_SHOTS,
        selectedAngle: {
          kind: AngleKind.OWN,
          suggestionId: null,
          text: 'Breakfast that fits in your bag',
        },
      },
      scriptSummary: {
        versionCount: 3,
        latestNumber: 3,
        latestIsDraft: false,
        approved: [{ versionId: 'v3', number: 3, usedFacts: approvedFacts }],
      },
    });

    expect(progress.hasApprovedScript).toBe(true);
    expect(progress.stage).toBe(ProjectStage.SCRIPT_APPROVED);
    expect(progress.currentStep).toBe(ProjectStepKey.BRIEF);
    expect(progress.steps[4].status).toBe(ProjectStepStatus.OPEN);
  });

  it('stops counting an approval when a fact it used changed', () => {
    const progress = progressOf({
      status: ProjectStatus.SCRIPT_REVIEW,
      factsSummary: {
        total: 1,
        unreviewed: 0,
        approved: 1,
        rejected: 0,
        unknown: 0,
      },
      approvedFacts: [{ id: 'f1', text: 'Holds 400 ml' }],
      scriptSummary: {
        versionCount: 3,
        latestNumber: 3,
        latestIsDraft: false,
        approved: [{ versionId: 'v3', number: 3, usedFacts: approvedFacts }],
      },
    });

    expect(progress.hasApprovedScript).toBe(false);
    expect(progress.stage).toBe(ProjectStage.WRITING_SCRIPT);
    expect(progress.steps[4].status).toBe(ProjectStepStatus.LOCKED);
    expect(progress.currentStep).toBe(ProjectStepKey.SCRIPT);
  });
});

describe('computeProgress with the video beta', () => {
  const approvedFacts = [{ id: 'f1', text: 'Holds 380 ml' }];
  const approved = {
    status: ProjectStatus.SCRIPT_REVIEW,
    factsSummary: {
      total: 1,
      unreviewed: 0,
      approved: 1,
      rejected: 0,
      unknown: 0,
    },
    approvedFacts,
    scriptSummary: {
      versionCount: 3,
      latestNumber: 3,
      latestIsDraft: false,
      approved: [{ versionId: 'v3', number: 3, usedFacts: approvedFacts }],
    },
  };
  const video = (overrides: Record<string, unknown>) => ({
    scriptVersionId: 'v3',
    mediaComplete: false,
    voiceSettled: false,
    exportCount: 0,
    latestExportAt: null,
    ...overrides,
  });
  const beta = { videoBeta: true };

  it('keeps the Batch 1 steps exactly while the beta is off', () => {
    const progress = progressOf(approved);

    expect(progress.steps.map((step) => step.key)).toEqual([
      ProjectStepKey.PRODUCT,
      ProjectStepKey.FACTS,
      ProjectStepKey.STRATEGY,
      ProjectStepKey.SCRIPT,
      ProjectStepKey.BRIEF,
    ]);
    expect(progress.currentStep).toBe(ProjectStepKey.BRIEF);
  });

  it('adds the video steps in rail order and resumes at Media', () => {
    const progress = progressOf(approved, beta);

    expect(progress.steps.map((step) => [step.key, step.status])).toEqual([
      [ProjectStepKey.PRODUCT, ProjectStepStatus.DONE],
      [ProjectStepKey.FACTS, ProjectStepStatus.DONE],
      [ProjectStepKey.STRATEGY, ProjectStepStatus.OPEN],
      [ProjectStepKey.SCRIPT, ProjectStepStatus.DONE],
      [ProjectStepKey.MEDIA, ProjectStepStatus.OPEN],
      [ProjectStepKey.VOICE, ProjectStepStatus.LOCKED],
      [ProjectStepKey.EDIT, ProjectStepStatus.LOCKED],
      [ProjectStepKey.BRIEF, ProjectStepStatus.OPEN],
      [ProjectStepKey.EXPORT, ProjectStepStatus.LOCKED],
    ]);
    expect(progress.steps[5].lockedReason).toBe(
      'Choose media for every scene first.',
    );
    expect(progress.currentStep).toBe(ProjectStepKey.MEDIA);
  });

  it.each([
    [video({ mediaComplete: true }), ProjectStepKey.VOICE],
    [video({ mediaComplete: true, voiceSettled: true }), ProjectStepKey.EDIT],
    [
      video({ mediaComplete: true, voiceSettled: true, exportCount: 1 }),
      ProjectStepKey.EXPORT,
    ],
  ])('resumes at the first unfinished video step', (videoSummary, step) => {
    expect(progressOf({ ...approved, videoSummary }, beta).currentStep).toBe(
      step,
    );
  });

  it('locks Media again when the approval stops being current', () => {
    const progress = progressOf(
      {
        ...approved,
        approvedFacts: [{ id: 'f1', text: 'Holds 400 ml' }],
        videoSummary: video({ mediaComplete: true, voiceSettled: true }),
      },
      beta,
    );

    expect(progress.steps[4]).toMatchObject({
      key: ProjectStepKey.MEDIA,
      status: ProjectStepStatus.LOCKED,
      lockedReason: 'Approve a script first.',
    });
  });
});
