import { ConfigService } from '@nestjs/config';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
import {
  AssetKind,
  AssetOrigin,
  ClaimFlagCategory,
  ConsistentItemKind,
  GenerationJobType,
  SceneClipMode,
  SceneMediaKind,
} from 'src/graphql/generated/graphql';
import type { AssetsService } from '../assets/assets.service';
import type { AssetRecord } from '../assets/repositories/assets.repository';
import { ClaimCheckService } from '../facts/claim-check.service';
import type { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { ProjectsService } from '../projects/projects.service';
import type { VideoEditsService } from '../video-edits/video-edits.service';
import { AiClipsService } from './ai-clips.service';

const owner = { ownerId: 'user-1', organizationId: 'org-a' };
const PROJECT_ID = 'b'.repeat(24);
const PHOTO_ID = 'a'.repeat(24);
const PHOTO_2 = 'f'.repeat(24);
const PHOTO_3 = '1'.repeat(24);
const PHOTO_4 = '2'.repeat(24);
const PHOTO_5 = '3'.repeat(24);

function record(id: string, overrides: Partial<AssetRecord> = {}): AssetRecord {
  return {
    id,
    ownerId: owner.ownerId,
    organizationId: owner.organizationId,
    projectId: PROJECT_ID,
    kind: AssetKind.PHOTO,
    status: 'READY' as AssetRecord['status'],
    fileName: `${id}.jpg`,
    contentType: 'image/jpeg',
    sizeBytes: 1000,
    durationSeconds: null,
    storageKey: `projects/${PROJECT_ID}/assets/${id}.jpg`,
    rightsConfirmedAt: new Date(0),
    replacesAssetId: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

function setup({ enabled = true } = {}) {
  const config = new ConfigService({
    VIDEO_BETA_ENABLED: enabled,
    AI_CLIPS_ENABLED: enabled,
    MINIMAX_API_KEY: enabled ? 'configured' : undefined,
  });
  const clip = record('c'.repeat(24), {
    kind: AssetKind.CLIP,
    origin: AssetOrigin.AI_CLIP,
  });
  const usedClip = record('d'.repeat(24), {
    kind: AssetKind.CLIP,
    origin: AssetOrigin.AI_CLIP,
  });
  const projectsService = {
    getRecord: jest.fn(async () => ({
      id: PROJECT_ID,
      title: 'Portable Blender, Morning Smoothie Hook',
      approvedFacts: [{ id: 'f1', text: 'Holds 380 ml' }],
    })),
  };
  const videoEditsService = {
    // The presented edit: scene lengths follow the voiceover when there is one.
    get: jest.fn(async () => ({
      scenes: [
        { sceneId: 's1', durationSeconds: 7 },
        { sceneId: 's2', durationSeconds: 3 },
        { sceneId: 's3', durationSeconds: 15 },
      ],
    })),
    recordFor: jest.fn(async () => ({
      scenes: [
        { sceneId: 's1', media: null },
        { sceneId: 's2', media: { assetId: usedClip.id } },
      ],
    })),
  };
  const assetsService = {
    mediaRecords: jest.fn(async () => [
      ...[PHOTO_ID, PHOTO_2, PHOTO_3, PHOTO_4, PHOTO_5].map((id) => record(id)),
      clip,
    ]),
    generatedClipsFor: jest.fn(async () => [clip, usedClip]),
    remove: jest.fn(async () => true),
    checkGeneratedClip: jest.fn(),
  };
  const jobsService = {
    create: jest.fn(async (params) => ({ id: 'j'.repeat(24), ...params })),
    get: jest.fn(async () => ({
      id: 'j'.repeat(24),
      projectId: PROJECT_ID,
      type: GenerationJobType.GENERATE_SCENE_CLIPS,
    })),
  };
  const service = new AiClipsService(
    config,
    projectsService as unknown as ProjectsService,
    videoEditsService as unknown as VideoEditsService,
    assetsService as unknown as AssetsService,
    jobsService as unknown as GenerationJobsService,
    new ClaimCheckService(),
  );

  return {
    service,
    assetsService,
    jobsService,
    videoEditsService,
    clip,
    usedClip,
  };
}

const input = {
  projectId: PROJECT_ID,
  sceneId: 's1',
  sourceAssetId: PHOTO_ID,
  prompt: '  Close-up, hands only,   bus stop.  ',
  idempotencyKey: 'key-00000001',
};

describe('AiClipsService', () => {
  it('starts a one-clip, 4-credit job by default from an own photo with a trimmed description', async () => {
    const { service, jobsService } = setup();

    await service.generate(input, owner);

    expect(jobsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: GenerationJobType.GENERATE_SCENE_CLIPS,
        label: 'Generate 1 clip',
        creditCost: 4,
        stepCount: 3,
        input: {
          sceneId: 's1',
          sourceAssetId: PHOTO_ID,
          prompt: 'Close-up, hands only, bus stop.',
          clipCount: 1,
          clipSeconds: 7,
          clipMode: SceneClipMode.FIRST_FRAME,
          endAssetId: null,
          referenceAssetIds: undefined,
          continuitySceneId: null,
          continuityAssetId: null,
          continuitySeconds: null,
        },
      }),
    );
  });

  it('makes clips as long as their scene, within the model’s 5 to 15 seconds', async () => {
    const { service, jobsService } = setup();
    const seconds = async (sceneId: string) => {
      await service.generate({ ...input, sceneId }, owner);
      return jobsService.create.mock.calls.at(-1)?.[0].input.clipSeconds;
    };

    await expect(seconds('s1')).resolves.toBe(7);
    // A 3 s scene gets the shortest clip the model makes and plays part of it.
    await expect(seconds('s2')).resolves.toBe(5);
    await expect(seconds('s3')).resolves.toBe(15);
  });

  it('holds 8 credits for two clips and refuses other counts', async () => {
    const { service, jobsService } = setup();

    await service.generate({ ...input, clipCount: 2 }, owner);

    expect(jobsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ creditCost: 8, label: 'Generate 2 clips' }),
    );
    for (const clipCount of [0, 3, 1.5]) {
      await expect(
        service.generate({ ...input, clipCount }, owner),
      ).rejects.toThrow('Ask for 1 or 2 clips.');
    }
  });

  it('records the start and end photos for Move between two', async () => {
    const { service, jobsService } = setup();

    await service.generate(
      {
        ...input,
        mode: SceneClipMode.FIRST_LAST_FRAME,
        endAssetId: PHOTO_2,
      },
      owner,
    );

    expect(jobsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          clipMode: SceneClipMode.FIRST_LAST_FRAME,
          sourceAssetId: PHOTO_ID,
          endAssetId: PHOTO_2,
        }),
      }),
    );
    await expect(
      service.generate(
        { ...input, mode: SceneClipMode.FIRST_LAST_FRAME },
        owner,
      ),
    ).rejects.toThrow('Pick the end photo.');
    await expect(
      service.generate(
        {
          ...input,
          mode: SceneClipMode.FIRST_LAST_FRAME,
          endAssetId: PHOTO_ID,
        },
        owner,
      ),
    ).rejects.toThrow('Pick different photos.');
    await expect(
      service.generate({ ...input, endAssetId: PHOTO_2 }, owner),
    ).rejects.toThrow('An end photo needs Move between two.');
  });

  it('takes 2 to 4 distinct reference photos for Match my photos, and nothing else', async () => {
    const { service, jobsService } = setup();
    const refs = {
      ...input,
      sourceAssetId: undefined,
      mode: SceneClipMode.REFERENCES,
    };

    await service.generate(
      { ...refs, referenceAssetIds: [PHOTO_2, PHOTO_ID, PHOTO_3] },
      owner,
    );

    expect(jobsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          clipMode: SceneClipMode.REFERENCES,
          sourceAssetId: PHOTO_2,
          endAssetId: null,
          referenceAssetIds: [PHOTO_2, PHOTO_ID, PHOTO_3],
        }),
      }),
    );
    await expect(
      service.generate({ ...refs, referenceAssetIds: [PHOTO_ID] }, owner),
    ).rejects.toThrow('Pick 2 to 4 photos.');
    await expect(
      service.generate(
        {
          ...refs,
          referenceAssetIds: [PHOTO_ID, PHOTO_2, PHOTO_3, PHOTO_4, PHOTO_5],
        },
        owner,
      ),
    ).rejects.toThrow('Pick 2 to 4 photos.');
    await expect(
      service.generate(
        { ...refs, referenceAssetIds: [PHOTO_ID, PHOTO_ID] },
        owner,
      ),
    ).rejects.toThrow('Pick different photos.');
    await expect(
      service.generate(
        {
          ...refs,
          sourceAssetId: PHOTO_ID,
          referenceAssetIds: [PHOTO_ID, PHOTO_2],
        },
        owner,
      ),
    ).rejects.toThrow('Match my photos uses reference photos only.');
    // An AI clip is never a reference.
    await expect(
      service.generate(
        { ...refs, referenceAssetIds: [PHOTO_ID, 'c'.repeat(24)] },
        owner,
      ),
    ).rejects.toThrow(NotFoundError);
    await expect(
      service.generate({ ...input, referenceAssetIds: [PHOTO_2] }, owner),
    ).rejects.toThrow('Reference photos need Match my photos.');
  });

  it('refuses when disabled, and checks the scene, photo and description', async () => {
    await expect(
      setup({ enabled: false }).service.generate(input, owner),
    ).rejects.toThrow(ConflictError);

    const { service } = setup();

    await expect(
      service.generate({ ...input, prompt: '   ' }, owner),
    ).rejects.toThrow('Describe the motion first.');
    await expect(
      service.generate({ ...input, prompt: 'x'.repeat(2001) }, owner),
    ).rejects.toThrow('Use 2000 characters or fewer.');
    await expect(
      service.generate({ ...input, sceneId: 'nope' }, owner),
    ).rejects.toThrow(ValidationError);
    // An AI clip can't be the source, and neither can another tenant's photo
    // (mediaRecords is owner- and tenant-scoped, so it isn't listed).
    await expect(
      service.generate({ ...input, sourceAssetId: 'c'.repeat(24) }, owner),
    ).rejects.toThrow(NotFoundError);
    await expect(
      service.generate({ ...input, sourceAssetId: 'e'.repeat(24) }, owner),
    ).rejects.toThrow(NotFoundError);
  });

  it('discards only the clips no scene uses', async () => {
    const { service, assetsService, clip } = setup();

    await service.discard('j'.repeat(24), owner);

    expect(assetsService.remove).toHaveBeenCalledTimes(1);
    expect(assetsService.remove).toHaveBeenCalledWith(clip.id, owner);
  });

  it('flags a description that claims more than the approved facts', async () => {
    const { service } = setup();

    const flags = await service.promptFlags(
      PROJECT_ID,
      'The best blender ever, blending ice in seconds.',
      owner,
    );

    expect(flags.map((flag) => flag.category)).toContain(
      ClaimFlagCategory.SUPERLATIVE,
    );
    await expect(service.promptFlags(PROJECT_ID, '  ', owner)).resolves.toEqual(
      [],
    );
  });
});

describe('AiClipsService one-click clips (§3.21)', () => {
  const photo = (id: string) => ({
    id,
    kind: AssetKind.PHOTO,
    origin: AssetOrigin.UPLOAD,
  });
  const firstClip = {
    id: 'c'.repeat(24),
    kind: AssetKind.CLIP,
    origin: AssetOrigin.AI_CLIP,
  };

  /** A presented edit: s1 holds an AI clip, s2 a text card, s3 nothing yet. */
  function edit({
    first = firstClip as { id: string; kind: AssetKind; origin: AssetOrigin },
    itemPhoto = true,
  } = {}) {
    return {
      scenes: [
        // Listed out of order: edit order is `order`, as after a reorder.
        { sceneId: 's3', order: 3, durationSeconds: 15, media: null },
        {
          sceneId: 's1',
          order: 1,
          durationSeconds: 7,
          media: {
            kind: SceneMediaKind.ASSET,
            asset: first,
            clipStartSeconds: 0.5,
          },
        },
        {
          sceneId: 's2',
          order: 2,
          durationSeconds: 3,
          media: {
            kind: SceneMediaKind.TEXT_CARD,
            asset: null,
            clipStartSeconds: 0,
          },
        },
      ],
      consistentItems: [
        {
          id: 'product',
          kind: ConsistentItemKind.PRODUCT,
          sceneIds: ['s1', 's3'],
          photo: photo(PHOTO_ID),
        },
        {
          id: 'script-tote-bag',
          kind: ConsistentItemKind.PROP,
          sceneIds: ['s1', 's3'],
          photo: itemPhoto ? photo(PHOTO_2) : null,
        },
        {
          id: 'script-keys',
          kind: ConsistentItemKind.PROP,
          sceneIds: ['s3'],
          // The same photo as the product: sent once.
          photo: photo(PHOTO_ID),
        },
      ],
    };
  }

  const oneClick = {
    projectId: PROJECT_ID,
    mode: SceneClipMode.CONSISTENT,
    prompt: 'Close-up, hands only, bus stop.',
    idempotencyKey: 'key-00000002',
  };

  it('starts the first scene from its item photos, product first, with no still', async () => {
    const { service, jobsService, videoEditsService } = setup();
    videoEditsService.get.mockResolvedValue(edit() as never);

    await service.generate({ ...oneClick, sceneId: 's1' }, owner);

    expect(jobsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        creditCost: 4,
        input: expect.objectContaining({
          clipMode: SceneClipMode.CONSISTENT,
          clipSeconds: 7,
          sourceAssetId: PHOTO_ID,
          referenceAssetIds: [PHOTO_ID, PHOTO_2],
          continuitySceneId: null,
          continuityAssetId: null,
          continuitySeconds: null,
        }),
      }),
    );
  });

  it('follows the nearest earlier scene with media, skipping a text card, at the frame before the cut', async () => {
    const { service, jobsService, videoEditsService } = setup();
    videoEditsService.get.mockResolvedValue(edit() as never);

    await service.generate({ ...oneClick, sceneId: 's3' }, owner);

    expect(jobsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          clipSeconds: 15,
          referenceAssetIds: [PHOTO_ID, PHOTO_2],
          continuitySceneId: 's1',
          continuityAssetId: firstClip.id,
          continuitySeconds: 7.5,
        }),
      }),
    );
  });

  it('sends the product photo for a scene no item is in', async () => {
    const { service, jobsService, videoEditsService } = setup();
    videoEditsService.get.mockResolvedValue(edit() as never);

    await service.generate({ ...oneClick, sceneId: 's2' }, owner);

    expect(jobsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          referenceAssetIds: [PHOTO_ID],
          continuitySceneId: 's1',
        }),
      }),
    );
  });

  it('waits until every item has a photo', async () => {
    const { service, jobsService, videoEditsService } = setup();
    videoEditsService.get.mockResolvedValue(
      edit({ itemPhoto: false }) as never,
    );

    await expect(
      service.generate({ ...oneClick, sceneId: 's1' }, owner),
    ).rejects.toMatchObject({
      status: 409,
      details: { code: 'CONSISTENT_ITEMS_INCOMPLETE' },
    });
    expect(jobsService.create).not.toHaveBeenCalled();
  });

  it('waits for the first scene in edit order to hold an AI clip', async () => {
    const { service, jobsService, videoEditsService } = setup();
    videoEditsService.get.mockResolvedValue(
      edit({ first: photo(PHOTO_3) }) as never,
    );

    await expect(
      service.generate({ ...oneClick, sceneId: 's3' }, owner),
    ).rejects.toMatchObject({
      status: 409,
      details: { code: 'FIRST_SCENE_CLIP_NEEDED' },
    });
    // The first scene itself can always be made; its still would be a photo.
    await expect(
      service.generate({ ...oneClick, sceneId: 's1' }, owner),
    ).resolves.toBeDefined();
    expect(jobsService.create).toHaveBeenCalledTimes(1);
  });

  it('refuses photos chosen by the caller', async () => {
    const { service, videoEditsService } = setup();
    videoEditsService.get.mockResolvedValue(edit() as never);

    await expect(
      service.generate(
        { ...oneClick, sceneId: 's1', referenceAssetIds: [PHOTO_3, PHOTO_4] },
        owner,
      ),
    ).rejects.toThrow(ValidationError);
  });
});
