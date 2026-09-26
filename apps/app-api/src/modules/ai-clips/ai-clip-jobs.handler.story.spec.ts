import { ConfigService } from '@nestjs/config';
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
import type { VideoTaskRequest } from '../video/video.types';
import { AiClipJobsHandler } from './ai-clip-jobs.handler';

const PROJECT_ID = 'b'.repeat(24);
const ANA_PHOTO = 'a'.repeat(24);
const FIRST_CLIP = 'e'.repeat(24);
const CREATED_AT = new Date('2026-09-26T03:00:00Z');

/** A Describe only job (§3.23): a description and no photo. */
const describeJob = {
  id: 'j'.repeat(24),
  ownerId: 'user-1',
  organizationId: 'org-a',
  projectId: PROJECT_ID,
  type: GenerationJobType.GENERATE_SCENE_CLIPS,
  status: GenerationJobStatus.RUNNING,
  creditCost: 4,
  createdAt: CREATED_AT,
  input: {
    versionId: null,
    hookId: null,
    sceneId: 's1',
    prompt: 'Medium shot. Ana (20s, yellow raincoat) grabs the umbrella.',
    clipCount: 1,
    clipSeconds: 9,
    clipMode: SceneClipMode.DESCRIBE,
    sourceAssetId: null,
    endAssetId: null,
    continuitySceneId: null,
    continuityAssetId: null,
    continuitySeconds: null,
  },
} as unknown as GenerationJobRecord;

function setup() {
  const provider = {
    isConfigured: () => true,
    model: () => 'MiniMax-H3-Max',
    createTask: jest.fn(async (_request: VideoTaskRequest) => 'task-1'),
    getTask: jest.fn(async () => ({
      status: 'succeeded' as const,
      url: 'https://cdn.example/a.mp4',
    })),
    download: jest.fn(async (_url: string, path: string) => {
      await writeFile(path, 'mp4');
      return 3;
    }),
  };
  const s3 = {
    downloadObjectToFile: jest.fn(async (_key: string, path: string) => {
      await writeFile(path, 'jpg');
      return true;
    }),
    putObjectFromFile: jest.fn(async () => undefined),
    createPresignedGetUrl: jest.fn(
      async (key: string) => `https://signed.example/${key.split('/').pop()}`,
    ),
    deleteObject: jest.fn(async () => undefined),
  };
  const render = {
    portraitFrame: jest.fn(async () => undefined),
    portraitStill: jest.fn(async () => undefined),
    probe: jest.fn(async () => ({ videoCodec: 'h264', durationMs: 9000 })),
  };
  const assets = {
    mediaRecords: jest.fn(async () => [
      {
        id: ANA_PHOTO,
        kind: AssetKind.PHOTO,
        storageKey: `projects/${PROJECT_ID}/assets/${ANA_PHOTO}.jpg`,
        rightsConfirmedAt: new Date(1000),
      },
      {
        id: FIRST_CLIP,
        kind: AssetKind.CLIP,
        origin: AssetOrigin.AI_CLIP,
        storageKey: `projects/${PROJECT_ID}/ai-clips/${FIRST_CLIP}.mp4`,
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

describe('AiClipJobsHandler — stories (§3.23)', () => {
  it('makes a Describe only clip as text to video, dated by the request', async () => {
    const { handler, provider, s3, assets, render } = setup();

    await expect(handler.run(describeJob, context)).resolves.toEqual({
      creditsUsed: 4,
    });

    expect(provider.createTask).toHaveBeenCalledWith({
      images: [],
      prompt: describeJob.input.prompt,
      durationSeconds: 9,
      resolution: '480P',
    });
    expect(s3.downloadObjectToFile).not.toHaveBeenCalled();
    expect(render.portraitFrame).not.toHaveBeenCalled();
    expect(assets.createGeneratedClip).toHaveBeenCalledWith(
      expect.objectContaining({
        rightsConfirmedAt: CREATED_AT,
        aiClip: expect.objectContaining({
          mode: SceneClipMode.DESCRIBE,
          // No photo was sent, so there is no source photo.
          sourceAssetId: null,
          referenceAssetIds: [],
          continuityAssetId: null,
        }),
      }),
    );
  });

  it('never sends an image with a Describe only job, even one naming a photo', async () => {
    const { handler, provider } = setup();

    await handler.run(
      {
        ...describeJob,
        input: {
          ...describeJob.input,
          referenceAssetIds: [ANA_PHOTO],
          continuityAssetId: FIRST_CLIP,
        },
      } as GenerationJobRecord,
      context,
    );

    expect(provider.createTask.mock.calls[0][0].images).toEqual([]);
  });

  it('sends a story’s one-click clip with only the still of the scene before', async () => {
    const { handler, provider, assets, render } = setup();

    await handler.run(
      {
        ...describeJob,
        input: {
          ...describeJob.input,
          sceneId: 's2',
          clipMode: SceneClipMode.CONSISTENT,
          referenceAssetIds: [],
          continuitySceneId: 's1',
          continuityAssetId: FIRST_CLIP,
          continuitySeconds: 9,
        },
      } as GenerationJobRecord,
      context,
    );

    expect(provider.createTask.mock.calls[0][0].images).toEqual([
      {
        url: `https://signed.example/${describeJob.id}-frame-0.jpg`,
        role: 'reference_image',
      },
    ]);
    expect(render.portraitStill).toHaveBeenCalledWith(
      expect.stringContaining('source-0'),
      9,
      expect.stringContaining('frame-0.jpg'),
    );
    expect(assets.createGeneratedClip).toHaveBeenCalledWith(
      expect.objectContaining({
        rightsConfirmedAt: new Date(5000),
        aiClip: expect.objectContaining({
          mode: SceneClipMode.CONSISTENT,
          continuityAssetId: FIRST_CLIP,
        }),
      }),
    );
  });

  it('still refuses a photo mode with nothing to send', async () => {
    const { handler, provider } = setup();

    await expect(
      handler.run(
        {
          ...describeJob,
          input: { ...describeJob.input, clipMode: SceneClipMode.CONSISTENT },
        } as GenerationJobRecord,
        context,
      ),
    ).rejects.toMatchObject({ code: GenerationFailureCode.INTERNAL });
    expect(provider.createTask).not.toHaveBeenCalled();
  });
});
