import type { ConfigService } from '@nestjs/config';
import { writeFile } from 'node:fs/promises';
import { fakeRepository } from '../../../test/fake-repository';
import { ConflictError, NotFoundError } from 'src/common/errors/app.error';
import {
  CaptionStyle,
  GenerationFailureCode,
  GenerationJobStatus,
  ProjectStatus,
  ScenePurpose,
  SceneTransition,
  StudioType,
  VideoEditBlocker,
} from 'src/graphql/generated/graphql';
import { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import type { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import type { ProjectsService } from '../projects/projects.service';
import type { RenderService } from '../render/render.service';
import { renderErrors } from '../render/render.types';
import type { S3Service } from '../s3/s3.service';
import {
  videoFingerprint,
  type VideoEditsService,
  type VideoRenderSource,
} from '../video-edits/video-edits.service';
import { endCardOf, ExportsService } from './exports.service';
import type {
  ExportRecord,
  ExportsRepository,
} from './repositories/exports.repository';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';
const owner = { ownerId: 'user-1', organizationId: TENANT_A };
const PROJECT_ID = 'a'.repeat(24);

function video(
  blocking: VideoEditBlocker[] = [],
  fingerprintText = 'Hook',
  transitionIn = SceneTransition.CUT,
  clipSound = { on: false, levelPercent: 100 },
) {
  return {
    id: 'e'.repeat(24),
    projectId: PROJECT_ID,
    scriptVersion: { id: 'v'.repeat(24), number: 3 },
    scenes: [
      {
        sceneId: 's1',
        order: 1,
        purpose: ScenePurpose.HOOK,
        durationSeconds: 5,
        onScreenText: fingerprintText,
        transitionIn,
        clipSound,
        media: null,
      },
    ],
    voice: { source: 'NONE', track: null },
    captions: { enabled: true, style: CaptionStyle.BOXED, lines: [] },
    music: { asset: null, levelPercent: 20 },
    endCard: {
      enabled: true,
      durationSeconds: 2,
      productTitle: 'BlendGo',
      cta: 'Tap the cart',
    },
    readiness: { blocking },
  } as never;
}

function setup() {
  const repository = fakeRepository<ExportRecord>();
  const project = {
    id: PROJECT_ID,
    title: 'Portable Blender, Morning Smoothie Hook',
    status: ProjectStatus.MEDIA_REVIEW,
    videoSummary: {
      scriptVersionId: 'v'.repeat(24),
      mediaComplete: true,
      voiceSettled: true,
      exportCount: 0,
      latestExportAt: null,
    },
  };
  const state = { video: video(), stored: new Set<string>() };
  const projectsService = {
    getRecord: jest.fn(async (_id: string, caller: typeof owner) => {
      if (caller.organizationId !== TENANT_A)
        throw new NotFoundError('We can’t find that project.');
      return project;
    }),
    setStatus: jest.fn(
      async (_id: string, _owner: unknown, status: ProjectStatus) => {
        project.status = status;
      },
    ),
    syncVideo: jest.fn(
      async (
        _id: string,
        _owner: unknown,
        summary: typeof project.videoSummary,
      ) => {
        project.videoSummary = summary;
      },
    ),
  };
  const source = (): VideoRenderSource =>
    ({
      video: state.video,
      fingerprint: videoFingerprint(state.video),
      scenes: [
        {
          durationMs: 5000,
          kind: 'text',
          storageKey: null,
          slowZoom: false,
          clipStartSeconds: 0,
          onScreenText: 'Hook',
          transitionIn: SceneTransition.CUT,
          sound: null,
        },
      ],
      voice: [null],
      music: null,
      snapshot: {
        scriptVersionNumber: 3,
        scenes: [
          {
            order: 1,
            purpose: ScenePurpose.HOOK,
            media: 'Text card',
            durationSeconds: 5,
            onScreenText: 'Hook',
            transitionIn: SceneTransition.CUT,
          },
        ],
        voice: 'None',
        captions: 'Boxed captions',
        music: 'No music',
        endCard: true,
        postCaption: '',
        adTag: true,
      },
    }) as never;
  const videoEditsService = {
    get: jest.fn(async () => state.video),
    renderSource: jest.fn(async () => source()),
  };
  const jobsService = {
    create: jest.fn(async (params: Record<string, unknown>) => ({
      id: 'job-1',
      status: GenerationJobStatus.QUEUED,
      ...params,
    })),
  };
  const renderService = {
    render: jest.fn(
      async (
        _plan: unknown,
        dir: string,
        progress: (step: string) => Promise<void>,
      ) => {
        for (const step of ['media', 'audio', 'captions', 'encode'])
          await progress(step);
        await writeFile(`${dir}/export.mp4`, 'mp4');
        await writeFile(`${dir}/poster.jpg`, 'jpg');
        return {
          videoPath: `${dir}/export.mp4`,
          posterPath: `${dir}/poster.jpg`,
          durationMs: 7000,
          width: 1080,
          height: 1920,
          sizeBytes: 3,
        };
      },
    ),
  };
  const s3 = {
    putObjectFromFile: jest.fn(async (key: string) => {
      state.stored.add(key);
    }),
    deleteObject: jest.fn(async (key: string) => {
      state.stored.delete(key);
    }),
    downloadObjectToFile: jest.fn(async (_key: string, path: string) => {
      await writeFile(path, 'file');
      return true;
    }),
    createPresignedGetUrl: jest.fn(
      async (key: string) => `https://signed.example/${key}`,
    ),
    createPresignedDownloadUrl: jest.fn(
      async (key: string) => `https://download.example/${key}`,
    ),
  };
  const handlers = new GenerationJobHandlers();
  const service = new ExportsService(
    repository as unknown as ExportsRepository,
    { get: () => undefined } as unknown as ConfigService,
    projectsService as unknown as ProjectsService,
    videoEditsService as unknown as VideoEditsService,
    jobsService as unknown as GenerationJobsService,
    handlers,
    renderService as unknown as RenderService,
    s3 as unknown as S3Service,
  );
  service.onModuleInit();

  const job = {
    id: 'job-1',
    ...owner,
    projectId: PROJECT_ID,
  } as unknown as GenerationJobRecord;
  const context = { setStep: jest.fn(async () => undefined) };

  return {
    service,
    repository,
    project,
    state,
    jobsService,
    renderService,
    s3,
    handlers,
    job,
    context,
    videoEditsService,
  };
}

describe('ExportsService', () => {
  it('refuses to render while anything blocks it', async () => {
    const { service, state } = setup();
    state.video = video([VideoEditBlocker.FLAGGED_LINES]);

    await expect(
      service.renderVideo(
        { projectId: PROJECT_ID, idempotencyKey: 'key-00000001' },
        owner,
      ),
    ).rejects.toThrow(new ConflictError('Fix the flagged lines first.'));
  });

  it('starts a paid render and marks the project generating', async () => {
    const { service, jobsService, project } = setup();

    await service.renderVideo(
      { projectId: PROJECT_ID, idempotencyKey: 'key-00000001' },
      owner,
    );

    expect(jobsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RENDER_VIDEO',
        creditCost: 2,
        stepCount: 4,
      }),
    );
    expect(project.status).toBe(ProjectStatus.GENERATING);
  });

  it('does not move the project back to generating for an idempotent completed job', async () => {
    const { service, jobsService, project } = setup();
    project.status = ProjectStatus.READY;
    jobsService.create.mockResolvedValueOnce({
      id: 'job-1',
      status: GenerationJobStatus.COMPLETED,
    });

    await service.renderVideo(
      { projectId: PROJECT_ID, idempotencyKey: 'key-00000001' },
      owner,
    );

    expect(project.status).toBe(ProjectStatus.READY);
  });

  it('renders, stores the MP4 and poster as export 1, and readies the project', async () => {
    const { service, repository, project, state, job, context, handlers } =
      setup();

    const handler = handlers.get('RENDER_VIDEO' as never);
    if (!handler) throw new Error('Render handler was not registered.');
    await handler.run(job, context);

    expect(context.setStep.mock.calls).toEqual([[0], [1], [2], [3]]);
    expect(repository.records).toHaveLength(1);
    expect(repository.records[0]).toMatchObject({
      number: 1,
      jobId: 'job-1',
      width: 1080,
      height: 1920,
    });
    expect([...state.stored].sort()).toEqual([
      `projects/${PROJECT_ID}/exports/${repository.records[0].id}.jpg`,
      `projects/${PROJECT_ID}/exports/${repository.records[0].id}.mp4`,
    ]);
    expect(project.status).toBe(ProjectStatus.READY);
    expect(project.videoSummary).toMatchObject({
      exportCount: 1,
      latestExportDownloaded: false,
    });

    await service.runRender(job, context);
    expect(repository.records).toHaveLength(1);
  });

  it('restores the project and stores nothing when a render fails', async () => {
    const { service, repository, project, state, job, context, renderService } =
      setup();
    renderService.render.mockRejectedValueOnce(renderErrors.timeout());

    await expect(service.runRender(job, context)).rejects.toMatchObject({
      code: GenerationFailureCode.RENDER_TIMEOUT,
    });
    expect(repository.records).toHaveLength(0);
    expect(state.stored.size).toBe(0);
    expect(project.status).toBe(ProjectStatus.MEDIA_REVIEW);
  });

  it('removes a partially uploaded export when storing its poster fails', async () => {
    const { service, repository, project, state, job, context, s3 } = setup();
    s3.putObjectFromFile
      .mockImplementationOnce(async (key: string) => {
        state.stored.add(key);
      })
      .mockRejectedValueOnce(new Error('poster upload failed'));

    await expect(service.runRender(job, context)).rejects.toThrow(
      'poster upload failed',
    );

    expect(repository.records).toHaveLength(0);
    expect(state.stored.size).toBe(0);
    expect(project.status).toBe(ProjectStatus.MEDIA_REVIEW);
  });

  it('marks the project exported on the first download and names the file', async () => {
    const { service, repository, project, job, context } = setup();
    await service.runRender(job, context);
    const id = repository.records[0].id;

    const download = await service.createDownload(id, owner);

    expect(download.fileName).toBe(
      'portable-blender-morning-smoothie-hook-v3-export-1.mp4',
    );
    expect(project.status).toBe(ProjectStatus.EXPORTED);
    expect(project.videoSummary).toMatchObject({
      latestExportDownloaded: true,
    });
    expect(repository.records[0].downloadedAt).not.toBeNull();
  });

  it('tells when the video changed after the latest export', async () => {
    const { service, state, job, context } = setup();
    await service.runRender(job, context);

    const same = await service.overview(PROJECT_ID, owner);
    state.video = video([], 'Edited on-screen text');
    const changed = await service.overview(PROJECT_ID, owner);

    expect(same.exports[0]).toMatchObject({
      number: 1,
      posterUrl: expect.stringContaining('.jpg'),
    });
    expect(same.changedSinceLatest).toBe(false);
    expect(changed.changedSinceLatest).toBe(true);
  });

  it('includes transitions in the fingerprint and defaults legacy snapshots to Cut', async () => {
    const { service, state, repository, job, context } = setup();
    await service.runRender(job, context);

    state.video = video([], 'Hook', SceneTransition.WHIP);
    expect((await service.overview(PROJECT_ID, owner)).changedSinceLatest).toBe(
      true,
    );

    repository.records[0].snapshot.scenes =
      repository.records[0].snapshot.scenes.map(
        ({ transitionIn: _transitionIn, ...scene }) => scene,
      ) as never;
    expect(
      (await service.overview(PROJECT_ID, owner)).exports[0].snapshot.scenes[0]
        .transitionIn,
    ).toBe(SceneTransition.CUT);
  });

  it('adds clip sound to the fingerprint only when a scene plays it, and reads legacy snapshots as off', async () => {
    const { service, state, repository, job, context } = setup();
    await service.runRender(job, context);

    // Off at another level renders the same video, so nothing changed.
    state.video = video([], 'Hook', SceneTransition.CUT, {
      on: false,
      levelPercent: 40,
    });
    expect((await service.overview(PROJECT_ID, owner)).changedSinceLatest).toBe(
      false,
    );

    state.video = video([], 'Hook', SceneTransition.CUT, {
      on: true,
      levelPercent: 80,
    });
    expect((await service.overview(PROJECT_ID, owner)).changedSinceLatest).toBe(
      true,
    );

    expect(
      (await service.overview(PROJECT_ID, owner)).exports[0].snapshot.scenes[0]
        .clipSound,
    ).toEqual({ on: false, levelPercent: 100 });
    expect(repository.records[0].snapshot.scenes[0].clipSound).toBeUndefined();
  });

  it('treats an export from another tenant as not found', async () => {
    const { service, repository, job, context } = setup();
    await service.runRender(job, context);
    const id = repository.records[0].id;

    await expect(
      service.createDownload(id, { ...owner, organizationId: TENANT_B }),
    ).rejects.toThrow(NotFoundError);
    await expect(service.createDownload(id, owner)).resolves.toMatchObject({
      url: expect.stringContaining(id),
    });
  });
});

describe('ExportsService — Entertainment Studio stories (§3.23)', () => {
  /** The shared fixture with a story's end card and snapshot. */
  function story(endLine: string | null = 'Part 2 tomorrow') {
    const base = video() as unknown as Record<string, unknown>;

    return {
      ...base,
      endCard: {
        enabled: true,
        durationSeconds: 2,
        productTitle: null,
        cta: null,
        storyTitle: 'The Umbrella Standoff',
        endLine,
      },
      postCaption: { text: 'Last umbrella. #comedy', adTag: false },
    } as never;
  }

  it('renders a story’s end card with its title and end line, and an affiliate one as before', () => {
    expect(endCardOf((story() as VideoRenderSource['video']).endCard)).toEqual({
      durationMs: 2000,
      title: 'The Umbrella Standoff',
      cta: 'Part 2 tomorrow',
    });
    expect(
      endCardOf((story(null) as VideoRenderSource['video']).endCard),
    ).toEqual({ durationMs: 2000, title: 'The Umbrella Standoff', cta: null });
    expect(endCardOf((video() as VideoRenderSource['video']).endCard)).toEqual({
      durationMs: 2000,
      title: 'BlendGo',
      cta: 'Tap the cart',
    });
  });

  it('passes the story’s end card to the render and records the studio without #ad', async () => {
    const {
      service,
      repository,
      state,
      job,
      context,
      renderService,
      videoEditsService,
    } = setup();
    state.video = story();
    const source = {
      video: state.video,
      fingerprint: videoFingerprint(state.video),
      scenes: [],
      voice: [],
      music: null,
      snapshot: {
        scriptVersionNumber: 1,
        scenes: [],
        voice: 'Sound from your clips',
        captions: 'Boxed captions',
        music: 'No music',
        endCard: true,
        postCaption: 'Last umbrella. #comedy',
        adTag: false,
        studio: StudioType.ENTERTAINMENT,
      },
    } as VideoRenderSource;
    videoEditsService.renderSource.mockResolvedValueOnce(source as never);

    await service.runRender(job, context);

    expect(renderService.render).toHaveBeenCalledWith(
      expect.objectContaining({
        endCard: {
          durationMs: 2000,
          title: 'The Umbrella Standoff',
          cta: 'Part 2 tomorrow',
        },
      }),
      expect.any(String),
      expect.any(Function),
    );
    expect(repository.records[0].snapshot).toMatchObject({
      studio: StudioType.ENTERTAINMENT,
      adTag: false,
    });
    expect(
      (await service.overview(PROJECT_ID, owner)).exports[0].snapshot,
    ).toMatchObject({ studio: StudioType.ENTERTAINMENT, adTag: false });
  });

  it('reads an export stored before studios as Affiliate', async () => {
    const { service, repository, job, context } = setup();
    await service.runRender(job, context);

    expect(repository.records[0].snapshot.studio).toBeUndefined();
    expect(
      (await service.overview(PROJECT_ID, owner)).exports[0].snapshot.studio,
    ).toBe(StudioType.AFFILIATE);
  });

  it('marks a story changed when its end line changes after an export', async () => {
    const { service, state, job, context } = setup();
    state.video = story('Part 2 tomorrow');
    await service.runRender(job, context);

    expect((await service.overview(PROJECT_ID, owner)).changedSinceLatest).toBe(
      false,
    );
    state.video = story('Part 3 next week');
    expect((await service.overview(PROJECT_ID, owner)).changedSinceLatest).toBe(
      true,
    );
  });
});
