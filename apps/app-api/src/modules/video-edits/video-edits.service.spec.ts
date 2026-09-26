import { ConfigService } from '@nestjs/config';
import { fakeRepository } from '../../../test/fake-repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from 'src/common/errors/app.error';
import {
  AssetKind,
  AssetOrigin,
  ContentStyle,
  AssetPurpose,
  AssetStatus,
  PhotoMotion,
  ProjectStatus,
  SceneMediaKind,
  ScenePurpose,
  SceneTransition,
  SceneClipMode,
  ShotFraming,
  ShotSubject,
  CaptionStyle,
  VideoEditBlocker,
  VoiceSource,
  type ProjectAsset,
} from 'src/graphql/generated/graphql';
import type { AssetsService } from '../assets/assets.service';
import { ClaimCheckService } from '../facts/claim-check.service';
import type { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { ProjectsService } from '../projects/projects.service';
import type { ProjectRecord } from '../projects/repositories/projects.repository';
import type { ScriptVersionRecord } from '../scripts/repositories/scripts.repository';
import type { ScriptsService } from '../scripts/scripts.service';
import type { VoiceService } from '../voice/voice.service';
import type { VoiceTrackRecord } from '../voice-tracks/repositories/voice-tracks.repository';
import type { VoiceTracksService } from '../voice-tracks/voice-tracks.service';
import type {
  VideoEditRecord,
  VideoEditsRepository,
} from './repositories/video-edits.repository';
import { VideoEditsService, voiceSettingsKey } from './video-edits.service';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';
const owner = { ownerId: 'user-1', organizationId: TENANT_A };
const PROJECT_ID = 'a'.repeat(24);

function version(
  number: number,
  purposes: ScenePurpose[] = [
    ScenePurpose.HOOK,
    ScenePurpose.DEMO,
    ScenePurpose.CALL_TO_ACTION,
  ],
): ScriptVersionRecord {
  return {
    id: `v${number}`.padEnd(24, '0'),
    ownerId: owner.ownerId,
    organizationId: TENANT_A,
    projectId: PROJECT_ID,
    number,
    status: 'APPROVED',
    origin: { kind: 'WRITTEN' as never, fromNumber: null },
    angleTitle: 'Breakfast that fits in your bag',
    language: 'TAGLISH' as never,
    lengthSeconds: 30,
    hooks: [],
    selectedHookId: null,
    scenes: purposes.map((purpose, index) => ({
      id: `v${number}-scene-${index + 1}`,
      order: index + 1,
      purpose,
      durationSeconds: 6,
      narration: `Narration ${index + 1}`,
      onScreenText: index === 0 ? 'Breakfast, pero portable' : '',
      visual: 'Hand pulling the blender out of a tote bag',
      transitionIn:
        index === 1
          ? SceneTransition.WHIP
          : index === 2
            ? SceneTransition.PUNCH_IN
            : SceneTransition.CUT,
      direction:
        index === 0
          ? {
              inFrame: ShotSubject.HANDS,
              framing: ShotFraming.CLOSE_UP,
              setting: `Bus stop, v${number}`,
              props: 'Tote bag',
            }
          : null,
      cta:
        purpose === ScenePurpose.CALL_TO_ACTION ? 'Tap the orange cart' : null,
      factIds: [],
      reportedClaims: [],
    })),
    caption: '',
    approvedAt: new Date(),
    approvedFactSnapshot: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function asset(
  id: string,
  kind: AssetKind,
  durationSeconds: number | null = null,
): ProjectAsset {
  return {
    id: id.padEnd(24, '0'),
    projectId: PROJECT_ID,
    kind,
    purpose: AssetPurpose.MEDIA,
    origin: AssetOrigin.UPLOAD,
    aiClip: null,
    status: AssetStatus.READY,
    fileName: `${id}.jpg`,
    sizeBytes: 1000,
    durationSeconds,
    previewUrl: 'https://signed.example/preview',
    createdAt: new Date(),
  };
}

function setup({
  approved = [version(3)],
  assets = [asset('a1', AssetKind.PHOTO), asset('c1', AssetKind.CLIP, 8)],
  status = ProjectStatus.SCRIPT_REVIEW,
}: {
  approved?: ScriptVersionRecord[];
  assets?: ProjectAsset[];
  status?: ProjectStatus;
} = {}) {
  const repository = fakeRepository<VideoEditRecord>();
  const project = {
    id: PROJECT_ID,
    status,
    approvedFacts: [{ id: 'f1', text: 'Holds 380 ml' }],
    product: { title: 'BlendGo Mini Portable Blender' },
    strategy: { language: 'TAGLISH', tone: 'ENERGETIC' },
    videoSummary: null,
  } as unknown as ProjectRecord;
  const state: {
    approved: ScriptVersionRecord[];
    /** Versions that exist but are no longer current approvals. */
    others: ScriptVersionRecord[];
    assets: ProjectAsset[];
    recording: ProjectAsset | null;
  } = { approved, others: [], assets, recording: null };
  const projectsService = {
    getRecord: jest.fn(async (id: string, caller: typeof owner) => {
      if (id !== PROJECT_ID || caller.organizationId !== TENANT_A) {
        throw new NotFoundError('We can’t find that project.');
      }
      return project;
    }),
    setStatus: jest.fn(
      async (_id: string, _owner: unknown, next: ProjectStatus) => {
        project.status = next;
      },
    ),
    syncVideo: jest.fn(async (_id: string, _owner: unknown, summary) => {
      project.videoSummary = summary;
    }),
  };
  const scriptsService = {
    currentApproved: jest.fn(async () =>
      [...state.approved].sort((a, b) => b.number - a.number),
    ),
    getRecord: jest.fn(async (id: string) => {
      const found = [...state.approved, ...state.others].find(
        (item) => item.id === id,
      );
      if (!found) throw new NotFoundError('We can’t find that version.');
      return found;
    }),
  };
  const assetsService = {
    list: jest.fn(async () => state.assets),
    mediaRecords: jest.fn(async () => []),
    currentAudio: jest.fn(async (_projectId: string, purpose: string) =>
      purpose === 'RECORDING' ? state.recording : null,
    ),
    currentAudioRecord: jest.fn(async () =>
      state.recording ? { id: state.recording.id } : null,
    ),
  };
  const jobsService = {
    create: jest.fn(async (params: Record<string, unknown>) => ({
      id: 'job-1',
      ...params,
    })),
  };
  const voiceService = {
    isAllowed: jest.fn((id: string) => ['voice-ava', 'voice-leo'].includes(id)),
  };
  const tracks = new Map<string, VoiceTrackRecord>();
  const voiceTracksService = {
    findRecord: jest.fn(async (id: string) => tracks.get(id) ?? null),
    present: jest.fn(async (track: VoiceTrackRecord) => ({
      id: track.id,
      source: track.source,
      voiceName: track.voiceName,
      speed: track.speed,
      scriptVersionNumber: track.scriptVersionNumber,
      recordingFileName: track.recordingFileName,
      durationMs: track.durationMs,
      segments: [],
      createdAt: track.createdAt,
    })),
  };
  const service = new VideoEditsService(
    repository as unknown as VideoEditsRepository,
    projectsService as unknown as ProjectsService,
    scriptsService as unknown as ScriptsService,
    assetsService as unknown as AssetsService,
    new ClaimCheckService(),
    jobsService as unknown as GenerationJobsService,
    voiceService as unknown as VoiceService,
    voiceTracksService as unknown as VoiceTracksService,
    new ConfigService({}),
  );

  return {
    service,
    repository,
    project,
    projectsService,
    state,
    tracks,
    jobsService,
    scriptsService,
    assetsService,
  };
}

const PHOTO = asset('a1', AssetKind.PHOTO).id;
const CLIP = asset('c1', AssetKind.CLIP, 8).id;

describe('VideoEditsService', () => {
  it('starts once from the newest approval and moves the project to media', async () => {
    const { service, repository, project } = setup({
      approved: [version(2), version(3)],
    });

    const edit = await service.start(PROJECT_ID, owner);
    const again = await service.start(PROJECT_ID, owner);

    expect(edit.scriptVersion.number).toBe(3);
    expect(again.id).toBe(edit.id);
    expect(repository.records).toHaveLength(1);
    expect(project.status).toBe(ProjectStatus.MEDIA_REVIEW);
    expect(edit.scenes.map((scene) => scene.startSeconds)).toEqual([0, 6, 12]);
    expect(edit.totalSeconds).toBe(18);
    expect(edit.scenes.map((scene) => scene.transitionIn)).toEqual([
      SceneTransition.CUT,
      SceneTransition.WHIP,
      SceneTransition.PUNCH_IN,
    ]);
    expect(edit.readiness).toMatchObject({
      mediaComplete: false,
      missingMediaCount: 3,
      blocking: [
        VideoEditBlocker.MEDIA_INCOMPLETE,
        VideoEditBlocker.VOICE_NOT_SETTLED,
      ],
    });
  });

  it('refuses to start without a current approval', async () => {
    const { service } = setup({ approved: [] });

    await expect(service.start(PROJECT_ID, owner)).rejects.toThrow(
      'Approve a script first.',
    );
  });

  it('keeps a later project status when the video starts', async () => {
    const { service, project } = setup({ status: ProjectStatus.EXPORTED });

    await service.start(PROJECT_ID, owner);

    expect(project.status).toBe(ProjectStatus.EXPORTED);
  });

  it('edits transitions, defaults legacy edits to Cut and rejects unknown scenes', async () => {
    const { service, repository } = setup();
    const edit = await service.start(PROJECT_ID, owner);

    const updated = await service.update(
      {
        projectId: PROJECT_ID,
        sceneTransitions: [
          {
            sceneId: edit.scenes[1].sceneId,
            transitionIn: SceneTransition.DISSOLVE,
          },
        ],
      },
      owner,
    );

    expect(updated.scenes[1].transitionIn).toBe(SceneTransition.DISSOLVE);
    await expect(
      service.update(
        {
          projectId: PROJECT_ID,
          sceneTransitions: [
            {
              sceneId: 'missing',
              transitionIn: SceneTransition.WHIP,
            },
          ],
        },
        owner,
      ),
    ).rejects.toThrow(ValidationError);

    repository.records[0].scenes = repository.records[0].scenes.map(
      ({ transitionIn: _transitionIn, ...scene }) => scene,
    );
    expect(
      (await service.get(PROJECT_ID, owner))?.scenes.map(
        (scene) => scene.transitionIn,
      ),
    ).toEqual([SceneTransition.CUT, SceneTransition.CUT, SceneTransition.CUT]);
  });

  it('copies shot direction and reads it from the pinned version for older edits', async () => {
    const { service, repository, state, scriptsService } = setup();
    const edit = await service.start(PROJECT_ID, owner);

    expect(edit.scenes.map((scene) => scene.direction)).toEqual([
      {
        inFrame: ShotSubject.HANDS,
        framing: ShotFraming.CLOSE_UP,
        setting: 'Bus stop, v3',
        props: 'Tote bag',
      },
      null,
      null,
    ]);
    expect(repository.records[0].scenes[0].direction?.setting).toBe(
      'Bus stop, v3',
    );
    expect(scriptsService.getRecord).not.toHaveBeenCalled();

    // An edit stored before directions were copied has no `direction` key.
    repository.records[0].scenes = repository.records[0].scenes.map(
      ({ direction: _direction, ...scene }) => scene,
    );
    expect(
      (await service.get(PROJECT_ID, owner))?.scenes[0].direction?.setting,
    ).toBe('Bus stop, v3');
    expect(scriptsService.getRecord).not.toHaveBeenCalled();

    // Its pinned version needs review, so it is not a current approval.
    state.others = state.approved;
    state.approved = [];
    const legacy = await service.get(PROJECT_ID, owner);
    expect(scriptsService.getRecord).toHaveBeenCalledTimes(1);
    expect(
      legacy?.scenes.map((scene) => scene.direction?.setting ?? null),
    ).toEqual(['Bus stop, v3', null, null]);
  });

  it('reads the shoot plan from the pinned version', async () => {
    const shoot = {
      scenario: 'An office worker running late grabs the blender.',
      presenter: 'Office worker in their 20s, smart-casual sleeves',
    };
    const { service, state } = setup({
      approved: [{ ...version(3), shoot }],
    });

    expect((await service.start(PROJECT_ID, owner)).shoot).toEqual(shoot);

    // Its pinned version needs review, so it is read by id.
    state.others = state.approved;
    state.approved = [];
    expect((await service.get(PROJECT_ID, owner))?.shoot).toEqual(shoot);

    // A version written before shot direction has none.
    state.others = [version(3)];
    expect((await service.get(PROJECT_ID, owner))?.shoot).toBeNull();
  });

  it('sets photo, clip and text card media, and syncs the project summary', async () => {
    const { service, project } = setup();
    const edit = await service.start(PROJECT_ID, owner);
    const [hook, demo, cta] = edit.scenes;

    const updated = await service.update(
      {
        projectId: PROJECT_ID,
        sceneMedia: [
          {
            sceneId: hook.sceneId,
            media: { kind: SceneMediaKind.ASSET, assetId: PHOTO },
          },
          {
            sceneId: demo.sceneId,
            media: {
              kind: SceneMediaKind.ASSET,
              assetId: CLIP,
              clipStartSeconds: 2,
            },
          },
          { sceneId: cta.sceneId, media: { kind: SceneMediaKind.TEXT_CARD } },
        ],
      },
      owner,
    );

    expect(updated.scenes.map((scene) => scene.media)).toEqual([
      expect.objectContaining({
        kind: SceneMediaKind.ASSET,
        motion: PhotoMotion.SLOW_ZOOM,
      }),
      expect.objectContaining({ clipStartSeconds: 2 }),
      expect.objectContaining({ kind: SceneMediaKind.TEXT_CARD, asset: null }),
    ]);
    expect(updated.readiness.mediaComplete).toBe(true);
    expect(project.videoSummary).toMatchObject({
      scriptVersionId: edit.scriptVersion.id,
      mediaComplete: true,
      voiceSettled: false,
    });
  });

  it('snapshots transitions and appends non-cut labels to export media text', async () => {
    const { service } = setup();
    const edit = await service.start(PROJECT_ID, owner);
    await service.update(
      {
        projectId: PROJECT_ID,
        sceneMedia: edit.scenes.map((scene) => ({
          sceneId: scene.sceneId,
          media: { kind: SceneMediaKind.TEXT_CARD },
        })),
      },
      owner,
    );

    const source = await service.renderSource(PROJECT_ID, owner);

    expect(source?.snapshot.scenes).toEqual([
      expect.objectContaining({
        media: 'Text card',
        transitionIn: SceneTransition.CUT,
      }),
      expect.objectContaining({
        media: 'Text card · Whip in',
        transitionIn: SceneTransition.WHIP,
      }),
      expect.objectContaining({
        media: 'Text card · Punch-in',
        transitionIn: SceneTransition.PUNCH_IN,
      }),
    ]);
  });

  it('enforces the clip start rule, half-second steps and known files', async () => {
    const { service } = setup({
      assets: [asset('c1', AssetKind.CLIP, 8), asset('c2', AssetKind.CLIP, 4)],
    });
    const edit = await service.start(PROJECT_ID, owner);
    const sceneId = edit.scenes[1].sceneId;
    const clip = (assetId: string, clipStartSeconds: number) =>
      service.update(
        {
          projectId: PROJECT_ID,
          sceneMedia: [
            {
              sceneId,
              media: { kind: SceneMediaKind.ASSET, assetId, clipStartSeconds },
            },
          ],
        },
        owner,
      );

    await expect(clip(CLIP, 2.5)).rejects.toThrow(
      'Start earlier. This clip is 8 s and the scene needs 6 s.',
    );
    await expect(clip(CLIP, 0.3)).rejects.toThrow(ValidationError);
    await expect(clip(asset('c2', AssetKind.CLIP).id, 1)).rejects.toThrow(
      'This clip is shorter than the scene, so it starts at 0 s.',
    );
    await expect(clip(asset('zz', AssetKind.CLIP).id, 0)).rejects.toThrow(
      NotFoundError,
    );
    await expect(
      clip(asset('c2', AssetKind.CLIP).id, 0),
    ).resolves.toBeDefined();
  });

  it('uses an AI clip only after its check, and never fills scenes with one', async () => {
    const aiClip = (id: string, checkedAt: Date | null): ProjectAsset => ({
      ...asset(id, AssetKind.CLIP, 6),
      origin: AssetOrigin.AI_CLIP,
      aiClip: {
        jobId: 'j'.repeat(24),
        sceneId: 's1',
        sourceAssetId: PHOTO,
        mode: SceneClipMode.FIRST_FRAME,
        endAssetId: null,
        referenceAssetIds: [],
        label: 'A',
        prompt: 'Close-up, hands only.',
        checkedAt,
      },
    });
    const { service } = setup({
      assets: [aiClip('x1', null), aiClip('x2', new Date())],
    });
    const edit = await service.start(PROJECT_ID, owner);
    const use = (id: string) =>
      service.update(
        {
          projectId: PROJECT_ID,
          sceneMedia: [
            {
              sceneId: edit.scenes[0].sceneId,
              media: {
                kind: SceneMediaKind.ASSET,
                assetId: id.padEnd(24, '0'),
              },
            },
          ],
        },
        owner,
      );

    await expect(use('x1')).rejects.toThrow(
      'Check this clip before you use it.',
    );
    await expect(use('x2')).resolves.toBeDefined();

    const filled = await service.autoFill(PROJECT_ID, owner);

    // Only the scene the creator filled has media; AI clips aren't autofilled.
    expect(filled.scenes.filter((scene) => scene.media)).toHaveLength(1);
    expect(filled.aiClipsEnabled).toBe(false);
  });

  it('fills only empty scenes, in upload order, skipping used files', async () => {
    const { service } = setup({
      assets: [
        asset('a1', AssetKind.PHOTO),
        asset('a2', AssetKind.PHOTO),
        asset('a3', AssetKind.PHOTO),
      ],
    });
    const edit = await service.start(PROJECT_ID, owner);
    await service.update(
      {
        projectId: PROJECT_ID,
        sceneMedia: [
          {
            sceneId: edit.scenes[1].sceneId,
            media: {
              kind: SceneMediaKind.ASSET,
              assetId: asset('a1', AssetKind.PHOTO).id,
              motion: PhotoMotion.STILL,
            },
          },
        ],
      },
      owner,
    );

    const filled = await service.autoFill(PROJECT_ID, owner);

    expect(filled.scenes.map((scene) => scene.media?.asset?.fileName)).toEqual([
      'a2.jpg',
      'a1.jpg',
      'a3.jpg',
    ]);
    expect(filled.scenes[1].media?.motion).toBe(PhotoMotion.STILL);
  });

  it('reads a scene as empty again when its file was removed', async () => {
    const { service, state, project } = setup();
    const edit = await service.start(PROJECT_ID, owner);
    await service.update(
      {
        projectId: PROJECT_ID,
        sceneMedia: edit.scenes.map((scene) => ({
          sceneId: scene.sceneId,
          media: { kind: SceneMediaKind.ASSET, assetId: PHOTO },
        })),
      },
      owner,
    );
    state.assets = [];

    const reread = await service.get(PROJECT_ID, owner);

    expect(reread?.readiness.missingMediaCount).toBe(3);
    expect(project.videoSummary).toMatchObject({ mediaComplete: false });
  });

  it('offers a newer approval and keeps media where position and purpose match', async () => {
    const { service, state } = setup();
    const edit = await service.start(PROJECT_ID, owner);
    await service.update(
      {
        projectId: PROJECT_ID,
        sceneMedia: edit.scenes.map((scene) => ({
          sceneId: scene.sceneId,
          media: { kind: SceneMediaKind.TEXT_CARD },
        })),
      },
      owner,
    );
    const v4 = version(4, [
      ScenePurpose.HOOK,
      ScenePurpose.PROBLEM,
      ScenePurpose.CALL_TO_ACTION,
    ]);
    v4.scenes[1].transitionIn = SceneTransition.DISSOLVE;
    state.approved = [version(3), v4];

    expect(
      (await service.get(PROJECT_ID, owner))?.newerApprovedVersion,
    ).toEqual({ id: v4.id, number: 4 });

    const switched = await service.switchVersion(
      { projectId: PROJECT_ID, scriptVersionId: v4.id },
      owner,
    );

    expect(switched.scriptVersion.number).toBe(4);
    expect(switched.newerApprovedVersion).toBeNull();
    expect(switched.scenes.map((scene) => Boolean(scene.media))).toEqual([
      true,
      false,
      true,
    ]);
    expect(switched.scenes[1].transitionIn).toBe(SceneTransition.DISSOLVE);
    expect(switched.scenes[0].direction?.setting).toBe('Bus stop, v4');
    await expect(
      service.switchVersion(
        { projectId: PROJECT_ID, scriptVersionId: 'x'.repeat(24) },
        owner,
      ),
    ).rejects.toThrow(ConflictError);
  });

  it('flags claims in on-screen text', async () => {
    const { service } = setup({
      approved: [
        {
          ...version(3),
          scenes: version(3).scenes.map((scene, index) =>
            index === 0 ? { ...scene, onScreenText: 'The #1 blender' } : scene,
          ),
        },
      ],
    });

    const edit = await service.start(PROJECT_ID, owner);

    expect(edit.scenes[0].flags.length).toBeGreaterThan(0);
    expect(edit.readiness.blocking).toContain(VideoEditBlocker.FLAGGED_LINES);
  });

  it('treats a video from another tenant as not found', async () => {
    const { service } = setup();
    await service.start(PROJECT_ID, owner);

    await expect(
      service.get(PROJECT_ID, { ...owner, organizationId: TENANT_B }),
    ).rejects.toThrow(NotFoundError);
    await expect(service.get(PROJECT_ID, owner)).resolves.toMatchObject({
      projectId: PROJECT_ID,
    });
  });

  describe('voice', () => {
    async function withMedia() {
      const context = setup();
      const edit = await context.service.start(PROJECT_ID, owner);
      await context.service.update(
        {
          projectId: PROJECT_ID,
          sceneMedia: edit.scenes.map((scene) => ({
            sceneId: scene.sceneId,
            media: { kind: SceneMediaKind.TEXT_CARD },
          })),
        },
        owner,
      );
      return { ...context, edit };
    }

    function track(
      edit: {
        scriptVersion: { id: string; number: number };
        scenes: { sceneId: string }[];
      },
      overrides: Partial<VoiceTrackRecord> = {},
    ): VoiceTrackRecord {
      return {
        id: 't'.repeat(24),
        ownerId: owner.ownerId,
        organizationId: TENANT_A,
        projectId: PROJECT_ID,
        source: VoiceSource.AI,
        scriptVersionId: edit.scriptVersion.id,
        scriptVersionNumber: edit.scriptVersion.number,
        voiceId: 'voice-ava',
        voiceName: 'Ava',
        speed: 1,
        settingsKey: voiceSettingsKey({
          voiceId: 'voice-ava',
          speed: 1,
          pronunciations: [],
        }),
        recordingAssetId: null,
        recordingFileName: null,
        alignmentLoss: null,
        segments: edit.scenes.map((scene, index) => ({
          sceneId: scene.sceneId,
          audioKey: `projects/${PROJECT_ID}/voice/${'t'.repeat(24)}/${String(index).padStart(24, '0')}.mp3`,
          offsetMs: 0,
          durationMs: 4200,
          words: [
            { text: 'Late', startMs: 0, endMs: 400 },
            { text: 'ka.', startMs: 400, endMs: 900 },
          ],
        })),
        durationMs: 12600,
        createdAt: new Date(),
        ...overrides,
      };
    }

    it('validates voice, speed and pronunciations', async () => {
      const { service } = await withMedia();
      const voice = (voiceInput: Record<string, unknown>) =>
        service.update({ projectId: PROJECT_ID, voice: voiceInput }, owner);

      await expect(voice({ voiceId: 'voice-unknown' })).rejects.toThrow(
        'That voice isn’t available.',
      );
      await expect(voice({ speed: 1.3 })).rejects.toThrow(
        'Choose 0.9×, 1.0× or 1.1×.',
      );
      await expect(
        voice({
          pronunciations: Array.from({ length: 21 }, () => ({
            word: 'a',
            sayAs: 'b',
          })),
        }),
      ).rejects.toThrow('You can add up to 20 words.');

      const saved = await voice({
        voiceId: 'voice-ava',
        speed: 1.1,
        pronunciations: [{ word: ' BlendGo ', sayAs: 'BLEND-go' }],
      });

      expect(saved.voice).toMatchObject({
        source: VoiceSource.AI,
        voiceId: 'voice-ava',
        speed: 1.1,
        pronunciations: [{ word: 'BlendGo', sayAs: 'BLEND-go' }],
      });
    });

    it('gates paid voice jobs on media, source and a chosen voice', async () => {
      const bare = setup();
      await bare.service.start(PROJECT_ID, owner);
      await expect(
        bare.service.generateVoiceover(
          { projectId: PROJECT_ID, idempotencyKey: 'key-00000001' },
          owner,
        ),
      ).rejects.toThrow('Choose media for every scene first.');

      const { service, jobsService } = await withMedia();
      const job = { projectId: PROJECT_ID, idempotencyKey: 'key-00000002' };

      await expect(service.generateVoiceover(job, owner)).rejects.toThrow(
        'Pick a voice first.',
      );
      await service.update(
        { projectId: PROJECT_ID, voice: { voiceId: 'voice-ava' } },
        owner,
      );
      await service.generateVoiceover(job, owner);

      expect(jobsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GENERATE_VOICEOVER',
          creditCost: 2,
          stepCount: 3,
        }),
      );
      await expect(service.alignRecording(job, owner)).rejects.toThrow(
        'Choose My recording first.',
      );
      await service.update(
        { projectId: PROJECT_ID, voice: { source: VoiceSource.RECORDING } },
        owner,
      );
      await expect(service.alignRecording(job, owner)).rejects.toThrow(
        'Upload your recording first.',
      );
    });

    it('settles on an applied track, times scenes and captions from it', async () => {
      const { service, tracks, edit, project } = await withMedia();
      await service.update(
        { projectId: PROJECT_ID, voice: { voiceId: 'voice-ava' } },
        owner,
      );
      const made = track(edit);
      tracks.set(made.id, made);

      await service.applyTrack(made, owner);
      const video = await service.get(PROJECT_ID, owner);

      expect(video?.readiness).toMatchObject({
        voiceSettled: true,
        voiceOutdated: false,
        blocking: [],
      });
      expect(video?.scenes.map((scene) => scene.durationSeconds)).toEqual([
        5, 5, 5,
      ]);
      expect(
        video?.captions.lines.map((line) => [line.startMs, line.text]),
      ).toEqual([
        [0, 'Late ka.'],
        [5000, 'Late ka.'],
        [10000, 'Late ka.'],
      ]);
      expect(project.videoSummary).toMatchObject({ voiceSettled: true });
    });

    it('marks settings changes and an older version without losing the track', async () => {
      const { service, tracks, edit, state } = await withMedia();
      await service.update(
        { projectId: PROJECT_ID, voice: { voiceId: 'voice-ava' } },
        owner,
      );
      const made = track(edit);
      tracks.set(made.id, made);
      await service.applyTrack(made, owner);

      const faster = await service.update(
        { projectId: PROJECT_ID, voice: { speed: 1.1 } },
        owner,
      );
      expect(faster.voice.settingsChanged).toBe(true);
      expect(faster.readiness.voiceSettled).toBe(true);

      const v4 = version(4);
      state.approved = [version(3), v4];
      const switched = await service.switchVersion(
        { projectId: PROJECT_ID, scriptVersionId: v4.id },
        owner,
      );

      expect(switched.voice.outdated).toBe(true);
      expect(switched.readiness.voiceSettled).toBe(false);
      expect(switched.readiness.blocking).toContain(
        VideoEditBlocker.VOICE_OUTDATED,
      );
    });

    it('settles No voiceover with script timing and on-screen text captions', async () => {
      const { service } = await withMedia();

      const video = await service.update(
        { projectId: PROJECT_ID, voice: { source: VoiceSource.NONE } },
        owner,
      );

      expect(video.readiness.voiceSettled).toBe(true);
      expect(video.scenes.map((scene) => scene.durationSeconds)).toEqual([
        6, 6, 6,
      ]);
      expect(video.captions.lines).toEqual([
        expect.objectContaining({
          startMs: 0,
          endMs: 6000,
          text: 'Breakfast, pero portable',
        }),
      ]);
    });

    it('needs a new timing when the recording is replaced', async () => {
      const { service, tracks, edit, state } = await withMedia();
      state.recording = {
        ...asset('r1', AssetKind.AUDIO),
        purpose: AssetPurpose.RECORDING,
      };
      await service.update(
        { projectId: PROJECT_ID, voice: { source: VoiceSource.RECORDING } },
        owner,
      );
      const timed = track(edit, {
        source: VoiceSource.RECORDING,
        recordingAssetId: state.recording.id,
      });
      tracks.set(timed.id, timed);
      await service.applyTrack(timed, owner);

      expect(
        (await service.get(PROJECT_ID, owner))?.readiness.voiceSettled,
      ).toBe(true);

      state.recording = {
        ...asset('r2', AssetKind.AUDIO),
        purpose: AssetPurpose.RECORDING,
      };

      expect(
        (await service.get(PROJECT_ID, owner))?.readiness.voiceSettled,
      ).toBe(false);
    });
  });

  describe('edit and preview', () => {
    async function voiced() {
      const context = setup();
      const edit = await context.service.start(PROJECT_ID, owner);
      await context.service.update(
        {
          projectId: PROJECT_ID,
          sceneMedia: edit.scenes.map((scene) => ({
            sceneId: scene.sceneId,
            media: { kind: SceneMediaKind.TEXT_CARD },
          })),
          voice: { voiceId: 'voice-ava' },
        },
        owner,
      );
      const made: VoiceTrackRecord = {
        id: 't'.repeat(24),
        ownerId: owner.ownerId,
        organizationId: TENANT_A,
        projectId: PROJECT_ID,
        source: VoiceSource.AI,
        scriptVersionId: edit.scriptVersion.id,
        scriptVersionNumber: edit.scriptVersion.number,
        voiceId: 'voice-ava',
        voiceName: 'Ava',
        speed: 1,
        settingsKey: voiceSettingsKey({
          voiceId: 'voice-ava',
          speed: 1,
          pronunciations: [],
        }),
        recordingAssetId: null,
        recordingFileName: null,
        alignmentLoss: null,
        segments: edit.scenes.map((scene, index) => ({
          sceneId: scene.sceneId,
          audioKey: `projects/${PROJECT_ID}/voice/${'t'.repeat(24)}/${String(index).padStart(24, '0')}.mp3`,
          offsetMs: 0,
          durationMs: (index + 3) * 1000,
          words: [{ text: `Scene${index + 1}.`, startMs: 0, endMs: 500 }],
        })),
        durationMs: 12000,
        createdAt: new Date(),
      };
      context.tracks.set(made.id, made);
      await context.service.applyTrack(made, owner);
      return { ...context, edit };
    }

    it('reorders scenes and moves their voice and captions with them', async () => {
      const { service, edit } = await voiced();
      const [first, second, third] = edit.scenes.map((scene) => scene.sceneId);

      const moved = await service.update(
        { projectId: PROJECT_ID, sceneOrder: [third, first, second] },
        owner,
      );

      expect(
        moved.scenes.map((scene) => [
          scene.sceneId,
          scene.order,
          scene.durationSeconds,
        ]),
      ).toEqual([
        [third, 1, 5],
        [first, 2, 3],
        [second, 3, 4],
      ]);
      expect(
        moved.captions.lines.map((line) => [line.text, line.startMs]),
      ).toEqual([
        ['Scene3.', 0],
        ['Scene1.', 5000],
        ['Scene2.', 8000],
      ]);
      expect(moved.readiness.voiceSettled).toBe(true);
      await expect(
        service.update(
          { projectId: PROJECT_ID, sceneOrder: [first, first, second] },
          owner,
        ),
      ).rejects.toThrow('List every scene once to reorder them.');
    });

    it('edits caption wording within 2 lines of 32 characters and flags new claims', async () => {
      const { service } = await voiced();
      const video = await service.get(PROJECT_ID, owner);
      const line = video!.captions.lines[0];
      const caption = (text: string) =>
        service.update(
          {
            projectId: PROJECT_ID,
            captions: { lines: [{ id: line.id, text }] },
          },
          owner,
        );

      await expect(caption('one\ntwo\nthree')).rejects.toThrow(
        'Keep each caption to 2 lines.',
      );
      await expect(caption('x'.repeat(33))).rejects.toThrow(
        'Use 32 characters or fewer per line.',
      );

      const edited = await caption('The #1 blender,\n guaranteed ');

      expect(edited.captions.lines[0]).toMatchObject({
        text: 'The #1 blender,\nguaranteed',
        edited: true,
      });
      expect(edited.captions.lines[0].flags.length).toBeGreaterThan(0);
      expect(edited.readiness.blocking).toContain(
        VideoEditBlocker.FLAGGED_LINES,
      );

      const reset = await service.resetCaptions(PROJECT_ID, owner);

      expect(reset.captions.lines[0]).toMatchObject({
        text: 'Scene1.',
        edited: false,
        flags: [],
      });
    });

    it('changes style, visibility, music level and the end card', async () => {
      const { service } = await voiced();

      const video = await service.update(
        {
          projectId: PROJECT_ID,
          captions: { enabled: false, style: CaptionStyle.WORD_HIGHLIGHT },
          musicLevelPercent: 35,
          endCardEnabled: false,
        },
        owner,
      );

      expect(video.captions).toMatchObject({
        enabled: false,
        style: CaptionStyle.WORD_HIGHLIGHT,
        editable: true,
      });
      expect(video.music.levelPercent).toBe(35);
      expect(video.endCard).toMatchObject({
        enabled: false,
        durationSeconds: 2,
      });
      await expect(
        service.update({ projectId: PROJECT_ID, musicLevelPercent: 33 }, owner),
      ).rejects.toThrow('Use 0 to 100% in steps of 5.');
    });

    it('edits durations only without a voiceover, and on-screen text up to 60 characters', async () => {
      const { service, edit } = await voiced();
      const sceneId = edit.scenes[0].sceneId;

      await expect(
        service.update(
          {
            projectId: PROJECT_ID,
            sceneDurations: [{ sceneId, durationSeconds: 8 }],
          },
          owner,
        ),
      ).rejects.toThrow('Scene lengths follow the voiceover.');

      const silent = await service.update(
        {
          projectId: PROJECT_ID,
          voice: { source: VoiceSource.NONE },
          sceneDurations: [{ sceneId, durationSeconds: 8 }],
          sceneText: [{ sceneId, onScreenText: 'Kasya sa bag' }],
        },
        owner,
      );

      expect(silent.scenes[0]).toMatchObject({
        durationSeconds: 8,
        onScreenText: 'Kasya sa bag',
      });
      expect(silent.captions).toMatchObject({ editable: false });
      expect(silent.captions.lines[0]).toMatchObject({
        text: 'Kasya sa bag',
        endMs: 8000,
      });
      await expect(
        service.update(
          {
            projectId: PROJECT_ID,
            sceneDurations: [{ sceneId, durationSeconds: 16 }],
          },
          owner,
        ),
      ).rejects.toThrow('Use 2 to 15 seconds.');
      await expect(
        service.update(
          {
            projectId: PROJECT_ID,
            sceneText: [{ sceneId, onScreenText: 'x'.repeat(61) }],
          },
          owner,
        ),
      ).rejects.toThrow('Use 60 characters or fewer.');
    });
  });
});

describe('VideoEditsService keep consistent (§3.21)', () => {
  it('starts with the product and the script’s props, stored with the video', async () => {
    const { service, repository } = setup();
    const edit = await service.start(PROJECT_ID, owner);
    const scenes = edit.scenes.map((scene) => scene.sceneId);

    expect(edit.consistentItems).toEqual([
      {
        id: 'product',
        kind: 'PRODUCT',
        name: 'BlendGo Mini Portable Blender',
        sceneIds: scenes,
        photo: null,
        likenessConfirmed: false,
      },
      {
        id: 'script-tote-bag',
        kind: 'PROP',
        name: 'Tote bag',
        sceneIds: [scenes[0]],
        photo: null,
        likenessConfirmed: false,
      },
    ]);
    expect(repository.records[0].consistentItems).toHaveLength(2);
  });

  it('saves the creator’s list: photos, scenes, renames and new items', async () => {
    const { service, repository } = setup();
    const edit = await service.start(PROJECT_ID, owner);
    const [s1, s2] = edit.scenes.map((scene) => scene.sceneId);

    const saved = await service.update(
      {
        projectId: PROJECT_ID,
        consistentItems: [
          // The product's name is ignored: it reads the product's title.
          { id: 'product', name: 'Renamed', sceneIds: [s1], assetId: PHOTO },
          { id: 'script-tote-bag', name: 'Canvas tote', sceneIds: [s1, s2] },
          { id: 'new-item-0001', name: '  Travel   cup ', sceneIds: [s2] },
        ],
      },
      owner,
    );

    expect(
      saved.consistentItems.map(({ id, name, sceneIds, photo }) => ({
        id,
        name,
        sceneIds,
        photo: photo?.id ?? null,
      })),
    ).toEqual([
      {
        id: 'product',
        name: 'BlendGo Mini Portable Blender',
        sceneIds: [s1],
        photo: PHOTO,
      },
      {
        id: 'script-tote-bag',
        name: 'Canvas tote',
        sceneIds: [s1, s2],
        photo: null,
      },
      { id: 'new-item-0001', name: 'Travel cup', sceneIds: [s2], photo: null },
    ]);
    // A renamed script prop is the creator's now.
    expect(
      repository.records[0].consistentItems?.map((item) => item.origin),
    ).toEqual(['SCRIPT', 'CREATOR', 'CREATOR']);
  });

  it.each([
    [
      'a missing product',
      () => [{ id: 'script-tote-bag', name: 'Tote bag', sceneIds: [] }],
      'input.consistentItems',
    ],
    [
      'a product with no scene',
      () => [{ id: 'product', name: 'x', sceneIds: [] }],
      'input.consistentItems.0.sceneIds',
    ],
    [
      'an empty name',
      () => [
        { id: 'product', name: 'x', sceneIds: ['v3-scene-1'] },
        { name: '   ', sceneIds: [] },
      ],
      'input.consistentItems.1.name',
    ],
    [
      'a name over 60 characters',
      () => [
        { id: 'product', name: 'x', sceneIds: ['v3-scene-1'] },
        { name: 'x'.repeat(61), sceneIds: [] },
      ],
      'input.consistentItems.1.name',
    ],
    [
      'a duplicate name',
      () => [
        { id: 'product', name: 'x', sceneIds: ['v3-scene-1'] },
        { name: 'Keys', sceneIds: [] },
        { name: 'keys', sceneIds: [] },
      ],
      'input.consistentItems.2.name',
    ],
    [
      'a scene outside the video',
      () => [{ id: 'product', name: 'x', sceneIds: ['elsewhere'] }],
      'input.consistentItems.0.sceneIds',
    ],
    [
      'a clip as the photo',
      () => [
        { id: 'product', name: 'x', sceneIds: ['v3-scene-1'], assetId: CLIP },
      ],
      'input.consistentItems.0.assetId',
    ],
    [
      'more than 8 items',
      () => [
        { id: 'product', name: 'x', sceneIds: ['v3-scene-1'] },
        ...'ABCDEFGH'.split('').map((name) => ({ name, sceneIds: [] })),
      ],
      'input.consistentItems',
    ],
  ])('rejects %s', async (_label, items, field) => {
    const { service, repository } = setup();
    await service.start(PROJECT_ID, owner);

    await expect(
      service.update(
        { projectId: PROJECT_ID, consistentItems: items() },
        owner,
      ),
    ).rejects.toMatchObject({
      constructor: ValidationError,
      details: { field },
    });
    expect(repository.records[0].consistentItems).toHaveLength(2);
  });

  it('refuses an AI clip as an item photo', async () => {
    const aiClip = {
      ...asset('ai', AssetKind.PHOTO),
      origin: AssetOrigin.AI_CLIP,
    };
    const { service } = setup({ assets: [aiClip] });
    await service.start(PROJECT_ID, owner);

    await expect(
      service.update(
        {
          projectId: PROJECT_ID,
          consistentItems: [
            {
              id: 'product',
              name: 'x',
              sceneIds: ['v3-scene-1'],
              assetId: aiClip.id,
            },
          ],
        },
        owner,
      ),
    ).rejects.toThrow('Pick one of this project’s photos.');
  });

  it('reads an older video’s list from its version without storing it, and stores it on change', async () => {
    const { service, repository } = setup();
    await service.start(PROJECT_ID, owner);
    delete repository.records[0].consistentItems;

    const first = await service.get(PROJECT_ID, owner);
    const second = await service.get(PROJECT_ID, owner);

    expect(first?.consistentItems.map((item) => item.id)).toEqual([
      'product',
      'script-tote-bag',
    ]);
    expect(second?.consistentItems).toEqual(first?.consistentItems);
    expect(repository.records[0].consistentItems).toBeUndefined();

    await service.update(
      {
        projectId: PROJECT_ID,
        consistentItems: [
          {
            id: 'product',
            name: 'x',
            sceneIds: ['v3-scene-1'],
            assetId: PHOTO,
          },
        ],
      },
      owner,
    );
    expect(repository.records[0].consistentItems).toEqual([
      expect.objectContaining({ itemId: 'product', assetId: PHOTO }),
    ]);
  });

  it('keeps photos by name when the video switches to a newer version', async () => {
    const { service, state } = setup();
    const edit = await service.start(PROJECT_ID, owner);
    await service.update(
      {
        projectId: PROJECT_ID,
        consistentItems: [
          {
            id: 'product',
            name: 'x',
            sceneIds: [edit.scenes[0].sceneId],
            assetId: PHOTO,
          },
          {
            id: 'script-tote-bag',
            name: 'Tote bag',
            sceneIds: [],
            assetId: PHOTO,
          },
        ],
      },
      owner,
    );
    const v4 = version(4);
    v4.scenes[2].direction = {
      inFrame: ShotSubject.PRODUCT_ONLY,
      framing: ShotFraming.CLOSE_UP,
      setting: 'Desk',
      props: 'TOTE BAG, Banana',
    };
    state.approved = [version(3), v4];

    const switched = await service.switchVersion(
      { projectId: PROJECT_ID, scriptVersionId: v4.id },
      owner,
    );

    expect(
      switched.consistentItems.map(({ id, sceneIds, photo }) => ({
        id,
        sceneIds,
        photo: photo?.id ?? null,
      })),
    ).toEqual([
      {
        id: 'product',
        sceneIds: switched.scenes.map((scene) => scene.sceneId),
        photo: PHOTO,
      },
      {
        id: 'script-tote-bag',
        sceneIds: ['v4-scene-1', 'v4-scene-3'],
        photo: PHOTO,
      },
      { id: 'script-banana', sceneIds: ['v4-scene-3'], photo: null },
    ]);
  });
});

describe('VideoEditsService skits and clip sound (§3.22)', () => {
  function skitVersion(number: number): ScriptVersionRecord {
    const base = version(number);

    return {
      ...base,
      contentStyle: ContentStyle.SKIT,
      scenes: base.scenes.map((scene, index) => ({
        ...scene,
        narration: '',
        lines:
          index === 0
            ? [
                { speaker: 'Ben', text: "Uy, bago 'yan ah?" },
                { speaker: 'Ana', text: 'Oo, kakabili ko lang.' },
              ]
            : [],
        sound: index === 0 ? 'Sandals slapping on the pavement' : null,
      })),
    };
  }

  async function started(approved: ScriptVersionRecord[]) {
    const context = setup({ approved });
    const edit = await context.service.start(PROJECT_ID, owner);
    await context.service.update(
      {
        projectId: PROJECT_ID,
        sceneMedia: edit.scenes.map((scene) => ({
          sceneId: scene.sceneId,
          media: { kind: SceneMediaKind.ASSET, assetId: CLIP },
        })),
      },
      owner,
    );
    return { ...context, edit };
  }

  it('starts a skit with clip sound on and its lines copied; narrated and older videos read off', async () => {
    const skit = await setup({ approved: [skitVersion(3)] }).service.start(
      PROJECT_ID,
      owner,
    );
    const { service, repository } = setup();
    const narrated = await service.start(PROJECT_ID, owner);

    expect(skit.voice.source).toBe(VoiceSource.SCENE);
    expect(narrated.voice.source).toBe(VoiceSource.AI);
    expect(skit.scenes.map((scene) => scene.clipSound)).toEqual([
      { on: true, levelPercent: 100 },
      { on: true, levelPercent: 100 },
      { on: true, levelPercent: 100 },
    ]);
    expect(skit.scenes[0]).toMatchObject({
      narration: '',
      lines: [
        { speaker: 'Ben', text: "Uy, bago 'yan ah?" },
        { speaker: 'Ana', text: 'Oo, kakabili ko lang.' },
      ],
      sound: 'Sandals slapping on the pavement',
    });
    expect(narrated.scenes[0]).toMatchObject({
      lines: [],
      sound: null,
      clipSound: { on: false, levelPercent: 100 },
    });

    for (const scene of repository.records[0].scenes) delete scene.clipSound;
    expect((await service.get(PROJECT_ID, owner))?.scenes[0].clipSound).toEqual(
      { on: false, levelPercent: 100 },
    );
  });

  it('saves clip sound per scene in steps of 5 and rejects unknown scenes', async () => {
    const { service, edit } = await started([version(3)]);
    const sceneId = edit.scenes[1].sceneId;

    const saved = await service.update(
      {
        projectId: PROJECT_ID,
        clipSounds: [{ sceneId, on: true, levelPercent: 35 }],
      },
      owner,
    );

    expect(saved.scenes[1].clipSound).toEqual({ on: true, levelPercent: 35 });
    await expect(
      service.update(
        {
          projectId: PROJECT_ID,
          clipSounds: [{ sceneId, on: true, levelPercent: 33 }],
        },
        owner,
      ),
    ).rejects.toThrow('Use 0 to 100% in steps of 5.');
    await expect(
      service.update(
        {
          projectId: PROJECT_ID,
          clipSounds: [{ sceneId: 'nope', on: true, levelPercent: 50 }],
        },
        owner,
      ),
    ).rejects.toThrow(ValidationError);
  });

  it('settles Sound from your clips for free, turns clip sound on and lets scene lengths change', async () => {
    const { service, edit, jobsService } = await started([version(3)]);
    const [first, second] = edit.scenes.map((scene) => scene.sceneId);
    await service.update(
      {
        projectId: PROJECT_ID,
        clipSounds: [{ sceneId: second, on: false, levelPercent: 40 }],
      },
      owner,
    );

    const video = await service.update(
      { projectId: PROJECT_ID, voice: { source: VoiceSource.SCENE } },
      owner,
    );
    const longer = await service.update(
      {
        projectId: PROJECT_ID,
        sceneDurations: [{ sceneId: first, durationSeconds: 9 }],
      },
      owner,
    );

    expect(video.readiness).toMatchObject({ voiceSettled: true, blocking: [] });
    expect(video.scenes.map((scene) => scene.clipSound)).toEqual([
      { on: true, levelPercent: 100 },
      { on: true, levelPercent: 40 },
      { on: true, levelPercent: 100 },
    ]);
    expect(longer.scenes[0].durationSeconds).toBe(9);
    expect(jobsService.create).not.toHaveBeenCalled();
  });

  it('captions the spoken lines, keeps edited wording by place and resets it', async () => {
    const { service, edit, repository } = await started([skitVersion(3)]);
    const sceneId = edit.scenes[0].sceneId;

    const video = await service.update(
      { projectId: PROJECT_ID, voice: { source: VoiceSource.SCENE } },
      owner,
    );

    expect(video.captions.editable).toBe(true);
    // 4 + 4 words share scene 1's 6 s. Scenes 2 and 3 say nothing and have
    // no on-screen text, so they have no captions.
    expect(
      video.captions.lines.map((line) => [
        line.id,
        line.startMs,
        line.endMs,
        line.text,
      ]),
    ).toEqual([
      [`${sceneId}~0`, 0, 3000, "Uy, bago 'yan ah?"],
      [`${sceneId}~1`, 3000, 6000, 'Oo, kakabili ko lang.'],
    ]);
    expect(video.captions.lines[1].words[0]).toEqual({
      text: 'Oo,',
      startMs: 3000,
      endMs: 3750,
    });

    const edited = await service.update(
      {
        projectId: PROJECT_ID,
        captions: { lines: [{ id: `${sceneId}~1`, text: 'Oo, bagong bili!' }] },
        sceneDurations: [{ sceneId, durationSeconds: 8 }],
      },
      owner,
    );
    expect(edited.captions.lines[1]).toMatchObject({
      text: 'Oo, bagong bili!',
      edited: true,
      startMs: 4000,
      endMs: 8000,
    });
    await expect(
      service.update(
        {
          projectId: PROJECT_ID,
          captions: { lines: [{ id: `${sceneId}~5`, text: 'Hi' }] },
        },
        owner,
      ),
    ).rejects.toThrow('These captions can’t be edited.');

    const reset = await service.resetCaptions(PROJECT_ID, owner);
    expect(reset.captions.lines[1]).toMatchObject({
      text: 'Oo, kakabili ko lang.',
      edited: false,
    });
    expect(repository.records[0].captions?.sceneEdits).toEqual([]);
  });

  it('captions a narrated scene from its narration with Sound from your clips', async () => {
    const { service } = await started([version(3)]);

    const video = await service.update(
      { projectId: PROJECT_ID, voice: { source: VoiceSource.SCENE } },
      owner,
    );

    expect(video.captions.lines.map((line) => line.text)).toEqual([
      'Narration 1',
      'Narration 2',
      'Narration 3',
    ]);
  });

  it('refuses a voiceover or a recording timing when no scene has narration', async () => {
    const { service, state } = await started([skitVersion(3)]);
    const job = { projectId: PROJECT_ID, idempotencyKey: 'key-00000003' };

    await service.update(
      {
        projectId: PROJECT_ID,
        voice: { source: VoiceSource.AI, voiceId: 'voice-ava' },
      },
      owner,
    );
    await expect(service.generateVoiceover(job, owner)).rejects.toThrow(
      'This script has no narration to read.',
    );

    state.recording = {
      ...asset('r1', AssetKind.AUDIO),
      purpose: AssetPurpose.RECORDING,
    };
    await service.update(
      { projectId: PROJECT_ID, voice: { source: VoiceSource.RECORDING } },
      owner,
    );
    await expect(service.alignRecording(job, owner)).rejects.toThrow(
      'This script has no narration to read.',
    );
  });

  it('plays clip sound in the render on clip scenes only, and notes it in the snapshot', async () => {
    const { service, edit, assetsService } = await started([skitVersion(3)]);
    await service.update(
      {
        projectId: PROJECT_ID,
        voice: { source: VoiceSource.SCENE },
        sceneMedia: [
          {
            sceneId: edit.scenes[2].sceneId,
            media: { kind: SceneMediaKind.TEXT_CARD },
          },
        ],
        clipSounds: [
          { sceneId: edit.scenes[1].sceneId, on: true, levelPercent: 0 },
        ],
      },
      owner,
    );
    assetsService.mediaRecords.mockResolvedValue([
      { id: CLIP, kind: AssetKind.CLIP, storageKey: 'clip-key' },
    ] as never);

    const source = await service.renderSource(PROJECT_ID, owner);

    expect(source?.scenes.map((scene) => scene.sound)).toEqual([
      { levelPercent: 100 },
      null,
      null,
    ]);
    expect(source?.snapshot.scenes[0]).toMatchObject({
      media: 'c1.jpg, from 0 s · sound 100%',
      clipSound: { on: true, levelPercent: 100 },
    });
    expect(source?.snapshot.scenes[1].media).toBe('c1.jpg, from 0 s · Whip in');
    expect(source?.snapshot.voice).toBe('Sound from your clips');
  });

  it('reads lines, sound and clip sound from the script for a skit saved while the schema dropped them', async () => {
    const context = setup({ approved: [skitVersion(3)] });
    await context.service.start(PROJECT_ID, owner);

    // What Mongo kept before the fix: no lines, sound or clip sound.
    for (const scene of context.repository.records[0].scenes) {
      delete scene.lines;
      delete scene.sound;
      delete scene.clipSound;
    }
    const video = await context.service.get(PROJECT_ID, owner);

    expect(video?.scenes[0]).toMatchObject({
      lines: [
        expect.objectContaining({ speaker: 'Ben', text: "Uy, bago 'yan ah?" }),
        expect.objectContaining({ speaker: 'Ana' }),
      ],
      sound: 'Sandals slapping on the pavement',
      clipSound: { on: true, levelPercent: 100 },
    });
    expect(video?.scenes[1]).toMatchObject({ lines: [], sound: null });
  });

  it("gives AI clips the version's language, the project's tone and the chosen hook's opening shot", async () => {
    const approved = skitVersion(3);
    approved.hooks = [
      {
        id: 'h1',
        type: 'QUESTION' as never,
        text: "Uy, bago 'yan?",
        openingShot: ' Ben points at her feet. ',
        reportedClaims: [],
      },
    ];
    approved.selectedHookId = 'h1';

    const video = await setup({ approved: [approved] }).service.start(
      PROJECT_ID,
      owner,
    );
    const plain = await setup().service.start(PROJECT_ID, owner);

    expect(video.clipContext).toEqual({
      language: 'TAGLISH',
      tone: 'ENERGETIC',
      openingShot: 'Ben points at her feet.',
      genre: null,
      cast: [],
    });
    expect(plain.clipContext.openingShot).toBeNull();
  });

  it("carries each line's beat into the video, and reads older lines with none", async () => {
    const beat = {
      shot: 'close-up on Ben',
      reaction: 'stops, looks down at the sandals',
      pauseSeconds: 1,
      delivery: 'half laughing',
    };
    const approved = skitVersion(3);
    approved.scenes[0].lines = [
      { speaker: 'Ben', text: "Uy, bago 'yan ah?", ...beat },
      { speaker: 'Ana', text: 'Oo, kakabili ko lang.' },
    ];

    const video = await setup({ approved: [approved] }).service.start(
      PROJECT_ID,
      owner,
    );

    // The Media step builds the AI clip description from these lines.
    expect(video.scenes[0].lines).toEqual([
      { speaker: 'Ben', text: "Uy, bago 'yan ah?", ...beat },
      {
        speaker: 'Ana',
        text: 'Oo, kakabili ko lang.',
        shot: '',
        reaction: '',
        pauseSeconds: 0,
        delivery: '',
      },
    ]);
  });

  it('keeps clip sound across a switch between skits, and takes the new default between styles', async () => {
    const { service, state, edit } = await started([skitVersion(3)]);
    await service.update(
      {
        projectId: PROJECT_ID,
        clipSounds: [
          { sceneId: edit.scenes[0].sceneId, on: true, levelPercent: 60 },
        ],
      },
      owner,
    );
    const v4 = skitVersion(4);
    const v5 = version(5);
    state.approved = [skitVersion(3), v4, v5];

    const skit = await service.switchVersion(
      { projectId: PROJECT_ID, scriptVersionId: v4.id },
      owner,
    );
    const narrated = await service.switchVersion(
      { projectId: PROJECT_ID, scriptVersionId: v5.id },
      owner,
    );

    expect(skit.scenes[0].clipSound).toEqual({ on: true, levelPercent: 60 });
    expect(narrated.scenes[0]).toMatchObject({
      lines: [],
      clipSound: { on: false, levelPercent: 100 },
    });
  });
});
