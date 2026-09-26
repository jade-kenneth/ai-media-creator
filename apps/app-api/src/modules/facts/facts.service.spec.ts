import { fakeRepository } from '../../../test/fake-repository';
import { ConflictError, NotFoundError } from 'src/common/errors/app.error';
import {
  FactSource,
  FactStatus,
  FieldSource,
  ProjectStatus,
} from 'src/graphql/generated/graphql';
import type { ProjectsService } from '../projects/projects.service';
import type { ProjectRecord } from '../projects/repositories/projects.repository';
import { ClaimCheckService } from './claim-check.service';
import { FactsService } from './facts.service';
import type {
  FactRecord,
  FactsRepository,
} from './repositories/facts.repository';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';
const owner = { ownerId: 'user-1', organizationId: TENANT_A };
const PROJECT_ID = 'b'.repeat(24);

function project(overrides: Partial<ProjectRecord['product']> = {}) {
  return {
    id: PROJECT_ID,
    status: ProjectStatus.DRAFT,
    product: {
      title: 'BlendGo Mini Portable Blender',
      affiliateUrl: 'https://shop.example/blendgo-mini',
      importUrl: 'https://shop.example/listing/blendgo-mini-380',
      features: [
        {
          id: 'c'.repeat(24),
          text: 'Holds 380 ml',
          source: FieldSource.IMPORTED,
        },
        {
          id: 'd'.repeat(24),
          text: 'Blends ice in 10 seconds',
          source: FieldSource.IMPORTED,
        },
        {
          id: 'e'.repeat(24),
          text: 'BPA-free cup',
          source: FieldSource.CREATOR,
        },
      ],
      ...overrides,
    },
  } as unknown as ProjectRecord;
}

function setup(record = project()) {
  const repository = fakeRepository<FactRecord>();
  const projectsService = {
    getRecord: jest.fn(async (_id: string, context: typeof owner) => {
      if (context.organizationId !== TENANT_A) throw new NotFoundError();
      return record;
    }),
    get: jest.fn(async () => ({ id: PROJECT_ID })),
    setStatus: jest.fn(async () => undefined),
    syncFacts: jest.fn(async () => undefined),
  };
  const service = new FactsService(
    repository as unknown as FactsRepository,
    projectsService as unknown as ProjectsService,
    new ClaimCheckService(),
  );

  return { service, repository, projectsService };
}

describe('FactsService', () => {
  it('requires a title and affiliate link before creating facts', async () => {
    const { service } = setup(project({ affiliateUrl: null }));

    await expect(service.continueToFacts(PROJECT_ID, owner)).rejects.toThrow(
      ConflictError,
    );
  });

  it('turns each key feature into one unreviewed fact with its source', async () => {
    const { service, repository, projectsService } = setup();

    await service.continueToFacts(PROJECT_ID, owner);
    await service.continueToFacts(PROJECT_ID, owner);

    expect(repository.records).toHaveLength(3);
    expect(repository.records.map((fact) => fact.source)).toEqual([
      FactSource.LISTING,
      FactSource.LISTING,
      FactSource.CREATOR,
    ]);
    expect(repository.records[0].sourceUrl).toBe(
      'https://shop.example/listing/blendgo-mini-380',
    );
    expect(repository.records[1].flag?.lead).toBe('Performance claim.');
    expect(projectsService.setStatus).toHaveBeenCalledWith(
      PROJECT_ID,
      owner,
      ProjectStatus.FACTS_REVIEW,
    );
    expect(projectsService.syncFacts).toHaveBeenLastCalledWith(
      PROJECT_ID,
      owner,
      { total: 3, unreviewed: 3, approved: 0, rejected: 0, unknown: 0 },
      [],
    );
  });

  it('asks for approval again after wording changes and marks listing facts edited', async () => {
    const { service, repository } = setup();
    await service.continueToFacts(PROJECT_ID, owner);
    const listingFact = repository.records[0];
    await service.setStatus(owner, {
      id: listingFact.id,
      status: FactStatus.APPROVED,
    });

    const edited = await service.updateText(owner, {
      id: listingFact.id,
      text: 'Holds 400 ml',
    });

    expect(edited).toMatchObject({
      source: FactSource.EDITED,
      status: FactStatus.UNREVIEWED,
    });
  });

  it('removes only facts the creator added', async () => {
    const { service, repository } = setup();
    await service.continueToFacts(PROJECT_ID, owner);

    await expect(
      service.remove(repository.records[0].id, owner),
    ).rejects.toThrow('Facts from the listing can be rejected, not removed.');
    await expect(service.remove(repository.records[2].id, owner)).resolves.toBe(
      true,
    );
    expect(repository.records).toHaveLength(2);
  });

  it('treats a fact from another tenant as not found', async () => {
    const { service, repository } = setup();
    await service.continueToFacts(PROJECT_ID, owner);
    const fact = repository.records[0];

    await expect(
      service.setStatus(
        { ...owner, organizationId: TENANT_B },
        { id: fact.id, status: FactStatus.APPROVED },
      ),
    ).rejects.toThrow(NotFoundError);
    await expect(
      service.setStatus(owner, { id: fact.id, status: FactStatus.APPROVED }),
    ).resolves.toMatchObject({ status: FactStatus.APPROVED });
  });
});
