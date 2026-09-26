import { ConfigService } from '@nestjs/config';
import { NotFoundError, ValidationError } from 'src/common/errors/app.error';
import {
  AssetKind,
  AssetOrigin,
  ConsistentItemKind,
  SceneClipMode,
  SceneMediaKind,
  StudioType,
} from 'src/graphql/generated/graphql';
import type { AssetsService } from '../assets/assets.service';
import { ClaimCheckService } from '../facts/claim-check.service';
import type { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { ProjectsService } from '../projects/projects.service';
import type { VideoEditsService } from '../video-edits/video-edits.service';
import { AiClipsService } from './ai-clips.service';

const owner = { ownerId: 'user-1', organizationId: 'org-a' };
const otherTenant = { ownerId: 'user-1', organizationId: 'org-b' };
const PROJECT_ID = 'b'.repeat(24);
const ANA_PHOTO = 'a'.repeat(24);
const PROP_PHOTO = 'f'.repeat(24);
const FIRST_CLIP = 'c'.repeat(24);

const photo = (id: string) => ({
  id,
  kind: AssetKind.PHOTO,
  origin: AssetOrigin.UPLOAD,
});

/**
 * A story's presented edit: two scenes, Ana in both, Ben only in s2, and an
 * umbrella in s2. Only the items passed in `photos` have one.
 */
function storyEdit({
  photos = [] as string[],
  firstClip = false,
}: { photos?: string[]; firstClip?: boolean } = {}) {
  const item = (
    id: string,
    kind: ConsistentItemKind,
    sceneIds: string[],
    file: string,
  ) => ({
    id,
    kind,
    sceneIds,
    photo: photos.includes(id) ? photo(file) : null,
  });

  return {
    scenes: [
      {
        sceneId: 's1',
        order: 1,
        durationSeconds: 9,
        media: firstClip
          ? {
              kind: SceneMediaKind.ASSET,
              asset: {
                id: FIRST_CLIP,
                kind: AssetKind.CLIP,
                origin: AssetOrigin.AI_CLIP,
              },
              clipStartSeconds: 0,
            }
          : null,
      },
      { sceneId: 's2', order: 2, durationSeconds: 4, media: null },
    ],
    consistentItems: [
      item(
        'character-ana',
        ConsistentItemKind.CHARACTER,
        ['s1', 's2'],
        ANA_PHOTO,
      ),
      item('character-ben', ConsistentItemKind.CHARACTER, ['s2'], ANA_PHOTO),
      item('script-umbrella', ConsistentItemKind.PROP, ['s2'], PROP_PHOTO),
    ],
  };
}

function setup({ story = true } = {}) {
  const projectsService = {
    getRecord: jest.fn(async (_id: string, caller: typeof owner) => {
      if (caller.organizationId !== owner.organizationId) {
        throw new NotFoundError('We can’t find that project.');
      }
      return {
        id: PROJECT_ID,
        title: story ? 'The Umbrella Standoff' : 'Portable Blender',
        ...(story ? { studioType: StudioType.ENTERTAINMENT } : {}),
        approvedFacts: story ? [] : [{ id: 'f1', text: 'Holds 380 ml' }],
      };
    }),
  };
  const videoEditsService = {
    get: jest.fn(async () => storyEdit()),
  };
  const assetsService = {
    mediaRecords: jest.fn(async () => [
      {
        id: ANA_PHOTO,
        kind: AssetKind.PHOTO,
        origin: AssetOrigin.UPLOAD,
      },
    ]),
  };
  const jobsService = {
    create: jest.fn(async (params) => ({ id: 'j'.repeat(24), ...params })),
  };
  const service = new AiClipsService(
    new ConfigService({
      VIDEO_BETA_ENABLED: true,
      AI_CLIPS_ENABLED: true,
      MINIMAX_API_KEY: 'configured',
    }),
    projectsService as unknown as ProjectsService,
    videoEditsService as unknown as VideoEditsService,
    assetsService as unknown as AssetsService,
    jobsService as unknown as GenerationJobsService,
    new ClaimCheckService(),
  );

  return { service, jobsService, videoEditsService };
}

const describeOnly = {
  projectId: PROJECT_ID,
  sceneId: 's1',
  mode: SceneClipMode.DESCRIBE,
  prompt:
    'Medium shot. Ana (20s, yellow raincoat, short hair) grabs the umbrella.',
  idempotencyKey: 'key-00000011',
};

const noPhotos = {
  sourceAssetId: null,
  endAssetId: null,
  referenceAssetIds: undefined,
  continuitySceneId: null,
  continuityAssetId: null,
  continuitySeconds: null,
};

describe('AiClipsService — Entertainment Studio stories (§3.23)', () => {
  it('makes a Describe only clip from the description alone, at the usual price', async () => {
    const { service, jobsService } = setup();

    await service.generate(describeOnly, owner);

    expect(jobsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        creditCost: 4,
        label: 'Generate 1 clip',
        input: {
          sceneId: 's1',
          prompt: describeOnly.prompt,
          clipCount: 1,
          clipSeconds: 9,
          clipMode: SceneClipMode.DESCRIBE,
          ...noPhotos,
        },
      }),
    );
  });

  it('refuses Describe only for an affiliate video, and with any photo', async () => {
    const affiliate = setup({ story: false });

    await expect(
      affiliate.service.generate(describeOnly, owner),
    ).rejects.toThrow(new ValidationError('Describe only is for stories.'));

    const { service, jobsService } = setup();

    for (const photos of [
      { sourceAssetId: ANA_PHOTO },
      { endAssetId: ANA_PHOTO },
      { referenceAssetIds: [ANA_PHOTO, PROP_PHOTO] },
    ]) {
      await expect(
        service.generate({ ...describeOnly, ...photos }, owner),
      ).rejects.toThrow(new ValidationError('Describe only uses no photos.'));
    }
    expect(jobsService.create).not.toHaveBeenCalled();
    expect(affiliate.jobsService.create).not.toHaveBeenCalled();
  });

  it('sends a photo-less first scene’s one-click clip as Describe only', async () => {
    const { service, jobsService } = setup();

    await service.generate(
      { ...describeOnly, mode: SceneClipMode.CONSISTENT },
      owner,
    );

    expect(jobsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          clipMode: SceneClipMode.DESCRIBE,
          ...noPhotos,
        }),
      }),
    );
  });

  it('sends the photos of the scene’s items that have one, without waiting for the rest', async () => {
    const { service, jobsService, videoEditsService } = setup();
    videoEditsService.get.mockResolvedValue(
      storyEdit({ photos: ['character-ana'] }),
    );

    await service.generate(
      { ...describeOnly, mode: SceneClipMode.CONSISTENT },
      owner,
    );

    expect(jobsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          clipMode: SceneClipMode.CONSISTENT,
          sourceAssetId: ANA_PHOTO,
          referenceAssetIds: [ANA_PHOTO],
          continuityAssetId: null,
        }),
      }),
    );
  });

  it('follows scene 1’s clip, with only the still when no item in the scene has a photo', async () => {
    const { service, jobsService, videoEditsService } = setup();
    const scene2 = {
      ...describeOnly,
      sceneId: 's2',
      mode: SceneClipMode.CONSISTENT,
    };

    videoEditsService.get.mockResolvedValue(storyEdit({ firstClip: false }));
    await expect(service.generate(scene2, owner)).rejects.toMatchObject({
      status: 409,
      details: { code: 'FIRST_SCENE_CLIP_NEEDED' },
    });

    videoEditsService.get.mockResolvedValue(storyEdit({ firstClip: true }));
    await service.generate(scene2, owner);

    videoEditsService.get.mockResolvedValue(
      storyEdit({ firstClip: true, photos: ['script-umbrella'] }),
    );
    await service.generate(scene2, owner);

    expect(jobsService.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        input: expect.objectContaining({
          clipMode: SceneClipMode.CONSISTENT,
          sourceAssetId: null,
          referenceAssetIds: [],
          continuitySceneId: 's1',
          continuityAssetId: FIRST_CLIP,
          continuitySeconds: 9,
        }),
      }),
    );
    expect(jobsService.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        input: expect.objectContaining({
          sourceAssetId: PROP_PHOTO,
          referenceAssetIds: [PROP_PHOTO],
          continuityAssetId: FIRST_CLIP,
        }),
      }),
    );
  });

  it('never flags a story’s clip description', async () => {
    const story = setup();
    const affiliate = setup({ story: false });
    const prompt = 'The best umbrella, guaranteed dry.';

    await expect(
      story.service.promptFlags(PROJECT_ID, prompt, owner),
    ).resolves.toEqual([]);
    expect(
      (await affiliate.service.promptFlags(PROJECT_ID, prompt, owner)).length,
    ).toBeGreaterThan(0);
  });

  it('refuses a clip request from another tenant', async () => {
    const { service, jobsService } = setup();

    await expect(service.generate(describeOnly, otherTenant)).rejects.toThrow(
      NotFoundError,
    );
    expect(jobsService.create).not.toHaveBeenCalled();
  });
});
