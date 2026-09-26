import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { writeFile } from 'node:fs/promises';
import {
  AssetKind,
  AssetOrigin,
  GenerationFailureCode,
  GenerationJobStatus,
  GenerationJobType,
  SceneClipMode,
} from 'src/graphql/generated/graphql';
import type { AssetsService } from '../assets/assets.service';
import { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import type { RenderService } from '../render/render.service';
import type { S3Service } from '../s3/s3.service';
import type { MiniMaxVideoProvider } from '../video/providers/minimax-video.provider';
import type { VideoTaskState } from '../video/video.types';
import { AiClipJobsHandler } from './ai-clip-jobs.handler';

const PROJECT_ID = 'b'.repeat(24);
const PHOTO_ID = 'a'.repeat(24);
const PHOTO_2 = 'c'.repeat(24);
const PHOTO_3 = 'd'.repeat(24);
const EARLIER_CLIP = 'e'.repeat(24);

const job = {
  id: 'j'.repeat(24),
  ownerId: 'user-1',
  organizationId: 'org-a',
  projectId: PROJECT_ID,
  type: GenerationJobType.GENERATE_SCENE_CLIPS,
  status: GenerationJobStatus.RUNNING,
  creditCost: 8,
  input: {
    versionId: null,
    hookId: null,
    sceneId: 's1',
    sourceAssetId: PHOTO_ID,
    prompt: 'Close-up, hands only.',
  },
} as unknown as GenerationJobRecord;

function setup(states: VideoTaskState[][], photoPresent = true) {
  const polls = states.map((sequence) => [...sequence]);
  const provider = {
    isConfigured: () => true,
    model: () => 'MiniMax-H3-Max',
    createTask: jest.fn(
      async () => `task-${provider.createTask.mock.calls.length}`,
    ),
    getTask: jest.fn(async (taskId: string) => {
      const sequence = polls[Number(taskId.split('-')[1]) - 1];
      return sequence.length > 1 ? sequence.shift()! : sequence[0];
    }),
    download: jest.fn(async (_url: string, path: string) => {
      await writeFile(path, 'mp4');
      return 3;
    }),
  };
  const s3 = {
    downloadObjectToFile: jest.fn(async (_key: string, path: string) => {
      if (photoPresent) await writeFile(path, 'jpg');
      return photoPresent;
    }),
    putObjectFromFile: jest.fn(async () => undefined),
    createPresignedGetUrl: jest.fn(
      async (key: string) => `https://signed.example/${key.split('/').pop()}`,
    ),
    deleteObject: jest.fn(async (_key: string) => undefined),
  };
  const render = {
    portraitFrame: jest.fn(async () => undefined),
    portraitStill: jest.fn(async () => undefined),
    probe: jest.fn(async () => ({ videoCodec: 'h264', durationMs: 6000 })),
  };
  const assets = {
    mediaRecords: jest.fn(async () => [
      ...[PHOTO_ID, PHOTO_2, PHOTO_3].map((id, index) => ({
        id,
        kind: AssetKind.PHOTO,
        storageKey: `projects/${PROJECT_ID}/assets/${id}.jpg`,
        rightsConfirmedAt: new Date(index * 1000),
      })),
      // An earlier scene's AI clip, the still a one-click clip follows.
      {
        id: EARLIER_CLIP,
        kind: AssetKind.CLIP,
        origin: AssetOrigin.AI_CLIP,
        storageKey: `projects/${PROJECT_ID}/ai-clips/${EARLIER_CLIP}.mp4`,
        rightsConfirmedAt: new Date(5000),
      },
    ]),
    createGeneratedClip: jest.fn(async () => undefined),
  };
  const handler = new AiClipJobsHandler(
    new GenerationJobHandlers(),
    assets as unknown as AssetsService,
    s3 as unknown as S3Service,
    render as unknown as RenderService,
    new ConfigService({}),
    provider as unknown as MiniMaxVideoProvider,
  );
  handler.pollMs = 1;
  handler.timeoutMs = 50;

  return { handler, provider, s3, assets, render };
}

const context = { setStep: jest.fn(async () => undefined) };
const done = (url: string): VideoTaskState => ({ status: 'succeeded', url });

describe('AiClipJobsHandler', () => {
  it('makes two clips from a 9:16 frame and charges for both', async () => {
    const { handler, provider, s3, assets } = setup([
      [{ status: 'pending' }, done('https://cdn.example/a.mp4')],
      [done('https://cdn.example/b.mp4')],
    ]);

    const result = await handler.run(job, context);

    expect(result.creditsUsed).toBe(8);
    expect(provider.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [
          {
            url: `https://signed.example/${job.id}-frame-0.jpg`,
            role: 'first_frame',
          },
        ],
        durationSeconds: 6,
        resolution: '480P',
      }),
    );
    expect(assets.createGeneratedClip).toHaveBeenCalledTimes(2);
    expect(assets.createGeneratedClip).toHaveBeenCalledWith(
      expect.objectContaining({
        aiClip: expect.objectContaining({
          label: 'A',
          providerTaskId: 'task-1',
        }),
      }),
    );
    // The temporary frame is removed afterwards.
    expect(s3.deleteObject).toHaveBeenCalledWith(
      `projects/${PROJECT_ID}/ai-clips/${job.id}-frame-0.jpg`,
    );
  });

  it('asks the model for the scene’s length, and 6 s for older jobs', async () => {
    const { handler, provider } = setup([[done('https://cdn.example/a.mp4')]]);
    const sized = {
      ...job,
      creditCost: 4,
      input: { ...job.input, clipCount: 1, clipSeconds: 9 },
    } as GenerationJobRecord;

    await handler.run(sized, context);

    expect(provider.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ durationSeconds: 9 }),
    );
  });

  it('makes one clip by default and charges for one', async () => {
    const { handler, provider, assets } = setup([
      [done('https://cdn.example/a.mp4')],
    ]);
    const single = {
      ...job,
      creditCost: 4,
      input: { ...job.input, clipCount: 1 },
    } as GenerationJobRecord;

    await expect(handler.run(single, context)).resolves.toEqual({
      creditsUsed: 4,
    });
    expect(provider.createTask).toHaveBeenCalledTimes(1);
    expect(assets.createGeneratedClip).toHaveBeenCalledTimes(1);
  });

  it('sends a start and an end frame for Move between two', async () => {
    const { handler, provider, s3, assets } = setup([
      [done('https://cdn.example/a.mp4')],
    ]);
    const between = {
      ...job,
      creditCost: 4,
      input: {
        ...job.input,
        clipCount: 1,
        clipMode: SceneClipMode.FIRST_LAST_FRAME,
        endAssetId: PHOTO_2,
      },
    } as GenerationJobRecord;

    await handler.run(between, context);

    expect(provider.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [
          {
            url: `https://signed.example/${job.id}-frame-0.jpg`,
            role: 'first_frame',
          },
          {
            url: `https://signed.example/${job.id}-frame-1.jpg`,
            role: 'last_frame',
          },
        ],
      }),
    );
    expect(assets.createGeneratedClip).toHaveBeenCalledWith(
      expect.objectContaining({
        // The latest rights confirmation of the two photos.
        rightsConfirmedAt: new Date(1000),
        aiClip: expect.objectContaining({
          mode: SceneClipMode.FIRST_LAST_FRAME,
          sourceAssetId: PHOTO_ID,
          endAssetId: PHOTO_2,
        }),
      }),
    );
    expect(s3.deleteObject).toHaveBeenCalledTimes(2);
  });

  it('sends every photo as a reference for Match my photos and cleans up each frame', async () => {
    const { handler, provider, s3 } = setup([[{ status: 'failed' }]]);
    const refs = {
      ...job,
      creditCost: 4,
      input: {
        ...job.input,
        clipCount: 1,
        clipMode: SceneClipMode.REFERENCES,
        referenceAssetIds: [PHOTO_ID, PHOTO_2, PHOTO_3],
      },
    } as GenerationJobRecord;

    await expect(handler.run(refs, context)).rejects.toMatchObject({
      code: GenerationFailureCode.PROVIDER_REJECTED,
    });
    expect(
      provider.createTask.mock.calls[0][0].images.map(
        (image: { role: string }) => image.role,
      ),
    ).toEqual(['reference_image', 'reference_image', 'reference_image']);
    expect(s3.deleteObject.mock.calls.map(([key]) => key)).toEqual(
      [0, 1, 2].map(
        (index) =>
          `projects/${PROJECT_ID}/ai-clips/${job.id}-frame-${index}.jpg`,
      ),
    );
  });

  it('sends a one-click clip’s item photos, then the earlier scene’s still, all as references', async () => {
    const { handler, provider, s3, assets, render } = setup([
      [done('https://cdn.example/a.mp4')],
    ]);
    const oneClick = {
      ...job,
      creditCost: 4,
      input: {
        ...job.input,
        clipCount: 1,
        clipMode: SceneClipMode.CONSISTENT,
        referenceAssetIds: [PHOTO_ID, PHOTO_2],
        continuitySceneId: 's0',
        continuityAssetId: EARLIER_CLIP,
        continuitySeconds: 7.5,
      },
    } as GenerationJobRecord;

    await expect(handler.run(oneClick, context)).resolves.toEqual({
      creditsUsed: 4,
    });

    expect(provider.createTask.mock.calls[0][0].images).toEqual(
      [0, 1, 2].map((index) => ({
        url: `https://signed.example/${job.id}-frame-${index}.jpg`,
        role: 'reference_image',
      })),
    );
    // Photos are cropped; the clip gives its frame at the cut.
    expect(render.portraitFrame).toHaveBeenCalledTimes(2);
    expect(render.portraitStill).toHaveBeenCalledWith(
      expect.stringContaining('source-2'),
      7.5,
      expect.stringContaining('frame-2.jpg'),
    );
    expect(assets.createGeneratedClip).toHaveBeenCalledWith(
      expect.objectContaining({
        // The earlier clip's rights confirmation is the latest input.
        rightsConfirmedAt: new Date(5000),
        aiClip: expect.objectContaining({
          mode: SceneClipMode.CONSISTENT,
          referenceAssetIds: [PHOTO_ID, PHOTO_2],
          continuitySceneId: 's0',
          continuityAssetId: EARLIER_CLIP,
        }),
      }),
    );
    expect(s3.deleteObject).toHaveBeenCalledTimes(3);
  });

  it('sends only the item photos for the first scene, and fails when the earlier media is gone', async () => {
    const first = setup([[done('https://cdn.example/a.mp4')]]);
    const oneClick = {
      ...job,
      creditCost: 4,
      input: {
        ...job.input,
        clipCount: 1,
        clipMode: SceneClipMode.CONSISTENT,
        referenceAssetIds: [PHOTO_ID],
      },
    } as GenerationJobRecord;

    await first.handler.run(oneClick, context);

    expect(first.provider.createTask.mock.calls[0][0].images).toHaveLength(1);
    expect(first.render.portraitStill).not.toHaveBeenCalled();

    const gone = setup([[done('https://cdn.example/a.mp4')]]);

    await expect(
      gone.handler.run(
        {
          ...oneClick,
          input: { ...oneClick.input, continuityAssetId: 'f'.repeat(24) },
        } as GenerationJobRecord,
        context,
      ),
    ).rejects.toMatchObject({ code: GenerationFailureCode.MEDIA_MISSING });
    expect(gone.provider.createTask).not.toHaveBeenCalled();
  });

  it('charges only for the clip that finished', async () => {
    const { handler, assets } = setup([
      [done('https://cdn.example/a.mp4')],
      [{ status: 'failed' }],
    ]);

    await expect(handler.run(job, context)).resolves.toEqual({
      creditsUsed: 4,
    });
    expect(assets.createGeneratedClip).toHaveBeenCalledTimes(1);
  });

  it('fails as rejected when both clips fail, and as timed out when they never finish', async () => {
    await expect(
      setup([[{ status: 'failed' }], [{ status: 'failed' }]]).handler.run(
        job,
        context,
      ),
    ).rejects.toMatchObject({ code: GenerationFailureCode.PROVIDER_REJECTED });
    await expect(
      setup([[{ status: 'pending' }], [{ status: 'pending' }]]).handler.run(
        job,
        context,
      ),
    ).rejects.toMatchObject({ code: GenerationFailureCode.PROVIDER_TIMEOUT });
  });

  it('keeps nothing when a result is not a playable clip', async () => {
    const { handler } = setup([
      [done('https://cdn.example/a.mp4')],
      [done('https://cdn.example/b.mp4')],
    ]);
    (
      handler as unknown as { renderService: { probe: jest.Mock } }
    ).renderService.probe.mockResolvedValue({
      videoCodec: null,
      durationMs: 0,
    });

    await expect(handler.run(job, context)).rejects.toMatchObject({
      code: GenerationFailureCode.INVALID_OUTPUT,
    });
  });

  it('fails with media missing when the source photo is gone', async () => {
    await expect(
      setup(
        [[{ status: 'failed' }], [{ status: 'failed' }]],
        false,
      ).handler.run(job, context),
    ).rejects.toMatchObject({ code: GenerationFailureCode.MEDIA_MISSING });
  });

  it('maps a storage failure before the provider call to an internal job failure', async () => {
    const { handler, provider, s3 } = setup([
      [done('https://cdn.example/a.mp4')],
      [done('https://cdn.example/b.mp4')],
    ]);
    s3.putObjectFromFile.mockRejectedValueOnce(
      new BadRequestException('Invalid storage key.'),
    );

    await expect(handler.run(job, context)).rejects.toMatchObject({
      code: GenerationFailureCode.INTERNAL,
    });
    expect(provider.createTask).not.toHaveBeenCalled();
  });
});
