import { ConfigService } from '@nestjs/config';
import { fakeRepository } from '../../../test/fake-repository';
import { NotFoundError, ValidationError } from 'src/common/errors/app.error';
import {
  AssetKind,
  AssetOrigin,
  AssetPurpose,
  AssetStatus,
  ConsistentItemKind,
  ContentStyle,
  PremiseKind,
  ProjectStatus,
  ScenePurpose,
  SceneTransition,
  ScriptLanguage,
  ShotFraming,
  ShotSubject,
  StoryGenre,
  Storytelling,
  StudioType,
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
import type { VoiceTracksService } from '../voice-tracks/voice-tracks.service';
import { LIKENESS_REQUIRED } from './consistent-items';
import type {
  VideoEditRecord,
  VideoEditsRepository,
} from './repositories/video-edits.repository';
import { VideoEditsService } from './video-edits.service';

const TENANT_A = 'org-a';
const owner = { ownerId: 'user-1', organizationId: TENANT_A };
const otherTenant = { ownerId: 'user-1', organizationId: 'org-b' };
const PROJECT_ID = 'a'.repeat(24);
const CAST = [
  {
    id: 'ana-00001',
    name: 'Ana',
    role: 'A nurse heading home after a night shift',
    look: '20s, yellow raincoat, short hair',
  },
  {
    id: 'ben-00001',
    name: 'Ben',
    role: 'A delivery rider on a break',
    look: '20s, green rider jacket, helmet under his arm',
  },
  // Never speaks and isn't named: tagged in the Cast-on-camera scenes.
  { id: 'lola-0001', name: 'Lola', role: '', look: '' },
];

const direction = (inFrame: ShotSubject, props: string) => ({
  inFrame,
  framing: ShotFraming.MEDIUM,
  setting: 'Bus stop, rain',
  props,
});

/** An acted story version (a skit), as the story script writer stamps it. */
function storyVersion(number: number): ScriptVersionRecord {
  const scenes: Array<{
    purpose: ScenePurpose;
    lines: { speaker: string; text: string }[];
    visual: string;
    onScreenText: string;
    inFrame: ShotSubject;
    props: string;
  }> = [
    {
      purpose: ScenePurpose.HOOK,
      lines: [
        { speaker: 'Ana', text: 'Akin ’to.' },
        { speaker: 'ben', text: 'Ako nauna!' },
      ],
      visual: 'Two hands grab the last umbrella at the same time.',
      onScreenText: 'The best umbrella, guaranteed',
      inFrame: ShotSubject.CREATOR,
      props: 'Umbrella',
    },
    {
      purpose: ScenePurpose.SETUP,
      lines: [],
      visual: 'ANA hugs the umbrella and looks away.',
      onScreenText: '',
      inFrame: ShotSubject.CREATOR,
      props: 'Umbrella, Helmet',
    },
    {
      purpose: ScenePurpose.BUILD,
      lines: [{ speaker: 'Ben', text: 'Basang-basa na ako oh.' }],
      visual: 'Rain drips off his helmet.',
      onScreenText: '',
      inFrame: ShotSubject.CREATOR,
      props: 'Phone',
    },
    {
      purpose: ScenePurpose.TURN,
      lines: [],
      // “Ana” is not named in “banana”.
      visual: 'A banana peel by two matching house keys.',
      onScreenText: '',
      inFrame: ShotSubject.HANDS,
      props: 'House keys',
    },
    {
      purpose: ScenePurpose.PAYOFF,
      lines: [
        { speaker: 'Ana', text: 'Kapitbahay pala kita?' },
        { speaker: 'Ben', text: 'Share na lang tayo.' },
      ],
      visual: 'They walk off under one umbrella.',
      onScreenText: '',
      inFrame: ShotSubject.CREATOR,
      props: 'umbrella',
    },
  ];

  return {
    id: `v${number}`.padEnd(24, '0'),
    ownerId: owner.ownerId,
    organizationId: TENANT_A,
    projectId: PROJECT_ID,
    number,
    status: 'APPROVED',
    origin: { kind: 'WRITTEN' as never, fromNumber: null },
    angleTitle: null,
    language: ScriptLanguage.TAGLISH,
    lengthSeconds: 45,
    contentStyle: ContentStyle.SKIT,
    studio: StudioType.ENTERTAINMENT,
    hooks: [],
    selectedHookId: null,
    scenes: scenes.map((scene, index) => ({
      id: `v${number}-scene-${index + 1}`,
      order: index + 1,
      purpose: scene.purpose,
      durationSeconds: 9,
      narration: '',
      lines: scene.lines,
      sound: null,
      onScreenText: scene.onScreenText,
      visual: scene.visual,
      transitionIn: SceneTransition.CUT,
      direction: direction(scene.inFrame, scene.props),
      cta: null,
      factIds: [],
      reportedClaims: [],
    })),
    shoot: { scenario: 'A rainy bus stop.', presenter: 'Ana; Ben' },
    caption: 'Last umbrella, first neighbour. #comedy',
    approvedAt: new Date(),
    approvedFactSnapshot: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function photo(id: string): ProjectAsset {
  return {
    id: id.padEnd(24, '0'),
    projectId: PROJECT_ID,
    kind: AssetKind.PHOTO,
    purpose: AssetPurpose.MEDIA,
    origin: AssetOrigin.UPLOAD,
    aiClip: null,
    status: AssetStatus.READY,
    fileName: `${id}.jpg`,
    sizeBytes: 1000,
    durationSeconds: null,
    previewUrl: 'https://signed.example/preview',
    createdAt: new Date(),
  };
}

const ANA_PHOTO = photo('ana').id;
const BEN_PHOTO = photo('ben').id;

function setup({ studio = true }: { studio?: boolean } = {}) {
  const repository = fakeRepository<VideoEditRecord>();
  const project = {
    id: PROJECT_ID,
    status: ProjectStatus.SCRIPT_REVIEW,
    title: 'The Umbrella Standoff',
    ...(studio
      ? {
          studioType: StudioType.ENTERTAINMENT,
          story: {
            genre: StoryGenre.COMEDY,
            premise: {
              kind: PremiseKind.OWN,
              suggestionId: null,
              title: 'The Umbrella Standoff',
              logline: 'Two strangers fight over the last umbrella.',
            },
            cast: CAST.map((character) => ({ ...character })),
            storytelling: Storytelling.ACTED,
            language: ScriptLanguage.TAGLISH,
            lengthSeconds: 45,
          },
        }
      : {}),
    // A story has no facts; an affiliate project here has one, so its claim
    // check has something to compare against.
    approvedFacts: studio ? [] : [{ id: 'f1', text: 'Holds 380 ml' }],
    product: { title: studio ? null : 'StormShield Umbrella' },
    strategy: { language: ScriptLanguage.ENGLISH, tone: 'FRIENDLY' },
    videoSummary: null,
  } as unknown as ProjectRecord;
  const state = {
    approved: [storyVersion(1)],
    assets: [photo('ana'), photo('ben')],
  };
  const projectsService = {
    getRecord: jest.fn(async (id: string, caller: typeof owner) => {
      if (id !== PROJECT_ID || caller.organizationId !== TENANT_A) {
        throw new NotFoundError('We can’t find that project.');
      }
      return project;
    }),
    setStatus: jest.fn(async () => undefined),
    syncVideo: jest.fn(async (_id: string, _owner: unknown, summary) => {
      project.videoSummary = summary;
    }),
  };
  const scriptsService = {
    currentApproved: jest.fn(async () =>
      [...state.approved].sort((a, b) => b.number - a.number),
    ),
    getRecord: jest.fn(async (id: string) => {
      const found = state.approved.find((item) => item.id === id);
      if (!found) throw new NotFoundError('We can’t find that version.');
      return found;
    }),
  };
  const assetsService = {
    list: jest.fn(async () => state.assets),
    mediaRecords: jest.fn(async () => []),
    currentAudio: jest.fn(async () => null),
    currentAudioRecord: jest.fn(async () => null),
  };
  const service = new VideoEditsService(
    repository as unknown as VideoEditsRepository,
    projectsService as unknown as ProjectsService,
    scriptsService as unknown as ScriptsService,
    assetsService as unknown as AssetsService,
    new ClaimCheckService(),
    { create: jest.fn() } as unknown as GenerationJobsService,
    { isAllowed: () => true } as unknown as VoiceService,
    {
      findRecord: jest.fn(async () => null),
      present: jest.fn(),
    } as unknown as VoiceTracksService,
    new ConfigService({}),
  );

  return { service, repository, project, state };
}

const sceneIds = (...orders: number[]) =>
  orders.map((order) => `v1-scene-${order}`);

describe('VideoEditsService — Entertainment Studio stories (§3.23)', () => {
  it('derives characters first, then the props, with no product', async () => {
    const { service, repository } = setup();

    const edit = await service.start(PROJECT_ID, owner);

    expect(
      edit.consistentItems.map(
        ({ id, kind, name, sceneIds: tags, likenessConfirmed }) => ({
          id,
          kind,
          name,
          sceneIds: tags,
          likenessConfirmed,
        }),
      ),
    ).toEqual([
      {
        id: 'character-ana-00001',
        kind: ConsistentItemKind.CHARACTER,
        name: 'Ana',
        // Lines in scenes 1 and 5, named in scene 2's visual.
        sceneIds: sceneIds(1, 2, 5),
        likenessConfirmed: false,
      },
      {
        id: 'character-ben-00001',
        kind: ConsistentItemKind.CHARACTER,
        name: 'Ben',
        sceneIds: sceneIds(1, 3, 5),
        likenessConfirmed: false,
      },
      {
        id: 'character-lola-0001',
        kind: ConsistentItemKind.CHARACTER,
        name: 'Lola',
        // Never named: every Cast-on-camera scene.
        sceneIds: sceneIds(1, 2, 3, 5),
        likenessConfirmed: false,
      },
      {
        id: 'script-umbrella',
        kind: ConsistentItemKind.PROP,
        name: 'Umbrella',
        sceneIds: sceneIds(1, 2, 5),
        likenessConfirmed: false,
      },
      {
        id: 'script-helmet',
        kind: ConsistentItemKind.PROP,
        name: 'Helmet',
        sceneIds: sceneIds(2),
        likenessConfirmed: false,
      },
      {
        id: 'script-phone',
        kind: ConsistentItemKind.PROP,
        name: 'Phone',
        sceneIds: sceneIds(3),
        likenessConfirmed: false,
      },
      {
        id: 'script-house-keys',
        kind: ConsistentItemKind.PROP,
        name: 'House keys',
        sceneIds: sceneIds(4),
        likenessConfirmed: false,
      },
    ]);
    expect(repository.records[0].consistentItems?.[0]).toMatchObject({
      origin: 'STORY',
      assetId: null,
    });
    expect(
      edit.consistentItems.some(
        (item) => item.kind === ConsistentItemKind.PRODUCT,
      ),
    ).toBe(false);
  });

  it('starts on its clips’ sound with the end card off, no #ad and the story’s clip context', async () => {
    const { service, repository } = setup();

    const edit = await service.start(PROJECT_ID, owner);

    expect(edit.studio).toBe(StudioType.ENTERTAINMENT);
    expect(edit.voice.source).toBe(VoiceSource.SCENE);
    expect(edit.endCard).toEqual({
      enabled: false,
      durationSeconds: 2,
      productTitle: null,
      cta: null,
      storyTitle: 'The Umbrella Standoff',
      endLine: null,
    });
    expect(edit.postCaption).toMatchObject({
      text: 'Last umbrella, first neighbour. #comedy',
      adTag: false,
    });
    expect(repository.records[0].adTag).toBe(false);
    expect(edit.clipContext).toEqual({
      language: ScriptLanguage.TAGLISH,
      tone: 'FRIENDLY',
      openingShot: null,
      genre: StoryGenre.COMEDY,
      cast: CAST,
    });
  });

  it('reads the story’s language when the pinned version can’t be read', async () => {
    const { service, repository, state } = setup();
    await service.start(PROJECT_ID, owner);
    repository.records[0].scriptVersionId = 'gone'.padEnd(24, '0');
    state.approved = [];

    const edit = await service.get(PROJECT_ID, owner);

    expect(edit?.clipContext.language).toBe(ScriptLanguage.TAGLISH);
  });

  it('stores the end line trimmed, clears it when empty and ignores #ad', async () => {
    const { service, repository } = setup();
    await service.start(PROJECT_ID, owner);

    const updated = await service.update(
      {
        projectId: PROJECT_ID,
        endCardEnabled: true,
        endLine: '  Part 2   tomorrow ',
        adTag: true,
      },
      owner,
    );

    expect(updated.endCard).toMatchObject({
      enabled: true,
      storyTitle: 'The Umbrella Standoff',
      endLine: 'Part 2 tomorrow',
    });
    expect(updated.postCaption.adTag).toBe(false);
    expect(repository.records[0]).toMatchObject({
      endLine: 'Part 2 tomorrow',
      adTag: false,
    });
    await expect(
      service.update({ projectId: PROJECT_ID, endLine: 'x'.repeat(61) }, owner),
    ).rejects.toThrow(new ValidationError('Use 60 characters or fewer.'));

    const cleared = await service.update(
      { projectId: PROJECT_ID, endLine: '   ' },
      owner,
    );

    expect(cleared.endCard.endLine).toBeNull();
  });

  it('flags nothing and never blocks on flags for a story, unlike an affiliate video', async () => {
    const story = setup();
    const affiliate = setup({ studio: false });

    const storyEdit = await story.service.start(PROJECT_ID, owner);
    const storyCaption = await story.service.update(
      { projectId: PROJECT_ID, postCaption: 'The best umbrella, guaranteed.' },
      owner,
    );
    const affiliateEdit = await affiliate.service.start(PROJECT_ID, owner);

    expect(storyEdit.scenes[0].flags).toEqual([]);
    expect(storyCaption.postCaption.flags).toEqual([]);
    expect(storyCaption.readiness.blocking).not.toContain(
      VideoEditBlocker.FLAGGED_LINES,
    );
    expect(storyCaption.readiness.blocking).toEqual([
      VideoEditBlocker.MEDIA_INCOMPLETE,
    ]);
    // The same on-screen text is flagged where the studio runs the check.
    expect(affiliateEdit.scenes[0].flags.length).toBeGreaterThan(0);
    expect(affiliateEdit.readiness.blocking).toContain(
      VideoEditBlocker.FLAGGED_LINES,
    );
  });

  it('refuses a character photo without the likeness confirmation', async () => {
    const { service, repository } = setup();
    const edit = await service.start(PROJECT_ID, owner);
    const items = edit.consistentItems.map((item) => ({
      id: item.id,
      name: item.name,
      sceneIds: item.sceneIds,
    }));

    await expect(
      service.update(
        {
          projectId: PROJECT_ID,
          consistentItems: [{ ...items[0], assetId: ANA_PHOTO }, ...items],
        },
        owner,
      ),
    ).rejects.toThrow(new ValidationError(LIKENESS_REQUIRED));
    await expect(
      service.update(
        {
          projectId: PROJECT_ID,
          consistentItems: [
            { ...items[0], assetId: ANA_PHOTO, likenessConfirmed: false },
            ...items.slice(1),
          ],
        },
        owner,
      ),
    ).rejects.toMatchObject({
      message: LIKENESS_REQUIRED,
      details: { field: 'input.consistentItems.0.likenessConfirmed' },
    });
    expect(repository.records[0].consistentItems?.[0].assetId).toBeNull();

    // A prop's photo needs no confirmation; no product has to stay.
    const saved = await service.update(
      {
        projectId: PROJECT_ID,
        consistentItems: [
          { ...items[0], assetId: ANA_PHOTO, likenessConfirmed: true },
          { ...items[3], assetId: BEN_PHOTO },
        ],
      },
      owner,
    );

    expect(
      saved.consistentItems.map(({ id, photo: file, likenessConfirmed }) => ({
        id,
        photo: file?.id ?? null,
        likenessConfirmed,
      })),
    ).toEqual([
      {
        id: 'character-ana-00001',
        photo: ANA_PHOTO,
        likenessConfirmed: true,
      },
      { id: 'script-umbrella', photo: BEN_PHOTO, likenessConfirmed: false },
    ]);
    const confirmedAt =
      repository.records[0].consistentItems?.[0].likenessConfirmedAt;

    expect(confirmedAt && new Date(confirmedAt).getTime()).toBeGreaterThan(0);

    // Keeping the same photo needs no new confirmation; changing it does,
    // and clearing it drops the confirmation.
    const [ana, umbrella] = saved.consistentItems.map((item) => ({
      id: item.id,
      name: item.name,
      sceneIds: item.sceneIds,
      assetId: item.photo?.id ?? null,
    }));

    await expect(
      service.update(
        { projectId: PROJECT_ID, consistentItems: [ana, umbrella] },
        owner,
      ),
    ).resolves.toMatchObject({
      consistentItems: [{ likenessConfirmed: true }, {}],
    });
    await expect(
      service.update(
        {
          projectId: PROJECT_ID,
          consistentItems: [{ ...ana, assetId: BEN_PHOTO }, umbrella],
        },
        owner,
      ),
    ).rejects.toThrow(new ValidationError(LIKENESS_REQUIRED));

    const cleared = await service.update(
      {
        projectId: PROJECT_ID,
        consistentItems: [{ ...ana, assetId: null }, umbrella],
      },
      owner,
    );

    expect(cleared.consistentItems[0]).toMatchObject({
      photo: null,
      likenessConfirmed: false,
    });
    expect(
      repository.records[0].consistentItems?.[0].likenessConfirmedAt,
    ).toBeNull();
  });

  it('renames a character without touching the cast', async () => {
    const { service, project, repository } = setup();
    const edit = await service.start(PROJECT_ID, owner);

    const renamed = await service.update(
      {
        projectId: PROJECT_ID,
        consistentItems: edit.consistentItems.map((item) => ({
          id: item.id,
          name: item.id === 'character-ana-00001' ? 'Nurse Ana' : item.name,
          sceneIds: item.sceneIds,
        })),
      },
      owner,
    );

    expect(renamed.consistentItems[0]).toMatchObject({
      kind: ConsistentItemKind.CHARACTER,
      name: 'Nurse Ana',
    });
    expect(repository.records[0].consistentItems?.[0].origin).toBe('CREATOR');
    expect(project.story?.cast.map((character) => character.name)).toEqual([
      'Ana',
      'Ben',
      'Lola',
    ]);
  });

  it('keeps a character’s photo and confirmation when switching versions', async () => {
    const { service, state } = setup();
    const edit = await service.start(PROJECT_ID, owner);
    const items = edit.consistentItems.map((item) => ({
      id: item.id,
      name: item.name,
      sceneIds: item.sceneIds,
    }));

    await service.update(
      {
        projectId: PROJECT_ID,
        consistentItems: [
          { ...items[1], assetId: BEN_PHOTO, likenessConfirmed: true },
          ...items.filter((_, index) => index !== 1),
        ],
      },
      owner,
    );

    // Version 2: Ben only speaks in its last scene, and Ana is gone from the lines.
    const v2 = storyVersion(2);
    v2.scenes = v2.scenes.map((scene, index) => ({
      ...scene,
      lines:
        index === 4 ? [{ speaker: 'Ben', text: 'Share na lang tayo.' }] : [],
      visual: 'Rain on the bus stop roof.',
    }));
    state.approved = [storyVersion(1), v2];

    const switched = await service.switchVersion(
      { projectId: PROJECT_ID, scriptVersionId: v2.id },
      owner,
    );
    const ben = switched.consistentItems.find(
      (item) => item.id === 'character-ben-00001',
    );

    expect(
      switched.consistentItems
        .filter((item) => item.kind === ConsistentItemKind.CHARACTER)
        .map((item) => item.name),
    ).toEqual(['Ana', 'Ben', 'Lola']);
    expect(ben).toMatchObject({
      photo: expect.objectContaining({ id: BEN_PHOTO }),
      likenessConfirmed: true,
      sceneIds: ['v2-scene-5'],
    });
    // Ana has no line or mention now: every Cast-on-camera scene.
    expect(switched.consistentItems[0].sceneIds).toEqual([
      'v2-scene-1',
      'v2-scene-2',
      'v2-scene-3',
      'v2-scene-5',
    ]);
  });

  it('records the studio and no #ad in the render snapshot', async () => {
    const { service } = setup();
    await service.start(PROJECT_ID, owner);
    await service.update(
      {
        projectId: PROJECT_ID,
        endCardEnabled: true,
        endLine: 'Part 2 tomorrow',
      },
      owner,
    );

    const source = await service.renderSource(PROJECT_ID, owner);

    expect(source?.snapshot).toMatchObject({
      studio: StudioType.ENTERTAINMENT,
      adTag: false,
      endCard: true,
    });
    expect(source?.video.endCard).toMatchObject({
      storyTitle: 'The Umbrella Standoff',
      endLine: 'Part 2 tomorrow',
    });
  });

  it('puts a story’s end line in the fingerprint only while the end card shows', async () => {
    const { service } = setup();
    await service.start(PROJECT_ID, owner);
    const fingerprint = async () =>
      (await service.renderSource(PROJECT_ID, owner))?.fingerprint;

    const off = await fingerprint();
    await service.update({ projectId: PROJECT_ID, endLine: 'Part 2' }, owner);
    const offWithLine = await fingerprint();
    await service.update(
      { projectId: PROJECT_ID, endCardEnabled: true },
      owner,
    );
    const on = await fingerprint();
    await service.update({ projectId: PROJECT_ID, endLine: 'Part 3' }, owner);

    expect(offWithLine).toBe(off);
    expect(on).not.toBe(off);
    expect(await fingerprint()).not.toBe(on);
  });

  it('refuses a write from another tenant', async () => {
    const { service, repository } = setup();
    await service.start(PROJECT_ID, owner);

    await expect(
      service.update(
        { projectId: PROJECT_ID, endLine: 'Part 2 tomorrow' },
        otherTenant,
      ),
    ).rejects.toThrow(NotFoundError);
    expect(repository.records[0].endLine ?? null).toBeNull();
  });

  it('reads a project stored before studios as Affiliate, with its product and end card', async () => {
    const { service, repository } = setup({ studio: false });

    const edit = await service.start(PROJECT_ID, owner);

    expect(edit.studio).toBe(StudioType.AFFILIATE);
    expect(edit.consistentItems[0]).toMatchObject({
      id: 'product',
      kind: ConsistentItemKind.PRODUCT,
      name: 'StormShield Umbrella',
    });
    // Affiliate derivation knows no cast, even with speakers in the lines.
    expect(
      edit.consistentItems.some(
        (item) => item.kind === ConsistentItemKind.CHARACTER,
      ),
    ).toBe(false);
    expect(edit.endCard).toMatchObject({
      enabled: true,
      productTitle: 'StormShield Umbrella',
      storyTitle: null,
      endLine: null,
    });
    expect(edit.postCaption.adTag).toBe(true);
    expect(edit.clipContext).toMatchObject({ genre: null, cast: [] });

    // An end line sent for an affiliate video isn't stored.
    await service.update({ projectId: PROJECT_ID, endLine: 'Part 2' }, owner);
    expect(repository.records[0].endLine ?? null).toBeNull();
  });
});
