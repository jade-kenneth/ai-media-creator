import { fakeRepository } from '../../../test/fake-repository';
import { ConflictError, NotFoundError } from 'src/common/errors/app.error';
import {
  ContentStyle,
  HookType,
  ScenePurpose,
  SceneTransition,
  ScriptCopyReason,
  ScriptLanguage,
  ScriptOriginKind,
  ScriptVersionStatus,
  ShotFraming,
  ShotSubject,
} from 'src/graphql/generated/graphql';
import { ClaimCheckService } from '../facts/claim-check.service';
import type { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { ProjectsService } from '../projects/projects.service';
import type { ProjectRecord } from '../projects/repositories/projects.repository';
import type {
  ScriptsRepository,
  ScriptVersionRecord,
} from './repositories/scripts.repository';
import { ScriptsService } from './scripts.service';

const TENANT_A = 'org-a';
const TENANT_B = 'org-b';
const owner = { ownerId: 'user-1', organizationId: TENANT_A };
const PROJECT_ID = 'b'.repeat(24);
const VERSION_ID = 'c'.repeat(24);

function version(
  overrides: Partial<ScriptVersionRecord> = {},
): ScriptVersionRecord {
  return {
    id: VERSION_ID,
    ownerId: owner.ownerId,
    organizationId: TENANT_A,
    projectId: PROJECT_ID,
    number: 3,
    status: 'DRAFT',
    origin: { kind: ScriptOriginKind.WRITTEN, fromNumber: null },
    angleTitle: 'Breakfast that fits in your bag',
    language: ScriptLanguage.TAGLISH,
    lengthSeconds: 30,
    hooks: [
      {
        id: 'h1',
        type: HookType.PROBLEM_FIRST,
        text: 'Late ka na naman sa breakfast?',
        openingShot: 'Hand pulling the blender out of a tote bag.',
        reportedClaims: [],
      },
    ],
    selectedHookId: 'h1',
    scenes: [
      {
        id: 's1',
        order: 1,
        purpose: ScenePurpose.FEATURE,
        durationSeconds: 6,
        narration:
          'Kasya ang 380 ml, sakto sa isang smoothie. Blends ice in 10 seconds pa.',
        onScreenText: '380 ml',
        visual: 'Cup filling up',
        cta: null,
        factIds: ['f1'],
        reportedClaims: ['Blends ice in 10 seconds'],
      },
    ],
    caption: 'Breakfast, pero portable.',
    approvedAt: null,
    approvedFactSnapshot: [],
    createdAt: new Date('2026-09-23T02:00:00Z'),
    updatedAt: new Date('2026-09-23T02:00:00Z'),
    ...overrides,
  };
}

function setup(
  record = version(),
  approvedFacts = [{ id: 'f1', text: 'Holds 380 ml' }],
) {
  const repository = fakeRepository<ScriptVersionRecord>([record]);
  const project = { id: PROJECT_ID, approvedFacts } as unknown as ProjectRecord;
  const service = new ScriptsService(
    repository as unknown as ScriptsRepository,
    {
      getRecord: jest.fn(async () => project),
      syncScripts: jest.fn(async () => undefined),
    } as unknown as ProjectsService,
    {
      listForProject: jest.fn(async () => []),
    } as unknown as GenerationJobsService,
    new ClaimCheckService(),
  );

  return { service, repository, project };
}

describe('ScriptsService', () => {
  it('flags a line that states a claim that is not an approved fact', () => {
    const { service, project } = setup();

    const flags = service.flagsFor(version(), project.approvedFacts);

    expect(flags.scenes.get('s1')?.map((flag) => flag.category)).toContain(
      'NOT_APPROVED_FACT',
    );
  });

  it('refuses to approve while a line is flagged or no hook is picked', async () => {
    await expect(setup().service.approve(VERSION_ID, owner)).rejects.toThrow(
      'Fix 1 flagged line first.',
    );
    await expect(
      setup(version({ selectedHookId: null })).service.approve(
        VERSION_ID,
        owner,
      ),
    ).rejects.toThrow('Pick a hook first.');
  });

  it('approves a clean version against the facts it uses', async () => {
    const clean = version({
      scenes: [
        {
          ...version().scenes[0],
          narration: 'Kasya ang 380 ml, sakto sa isang smoothie.',
          reportedClaims: ['Kasya ang 380 ml'],
        },
      ],
    });
    const { service, repository } = setup(clean, [
      { id: 'f1', text: 'Kasya ang 380 ml' },
    ]);

    const approved = await service.approve(VERSION_ID, owner);

    expect(approved.status).toBe(ScriptVersionStatus.APPROVED);
    expect(repository.records[0].approvedFactSnapshot).toEqual([
      { id: 'f1', text: 'Kasya ang 380 ml' },
    ]);
  });

  it('reports needs review when a used fact changed after approval', () => {
    const { service } = setup();
    const approved = version({
      status: 'APPROVED',
      approvedFactSnapshot: [{ id: 'f1', text: 'Holds 380 ml' }],
    });

    expect(
      service.effectiveStatus(approved, [{ id: 'f1', text: 'Holds 380 ml' }]),
    ).toBe(ScriptVersionStatus.APPROVED);
    expect(
      service.effectiveStatus(approved, [{ id: 'f1', text: 'Holds 400 ml' }]),
    ).toBe(ScriptVersionStatus.NEEDS_REVIEW);
  });

  it('keeps approved versions immutable and copies them into a new draft', async () => {
    const { service, repository } = setup(version({ status: 'APPROVED' }));

    await expect(
      service.update(owner, { id: VERSION_ID, caption: 'New caption' }),
    ).rejects.toThrow(ConflictError);

    const copy = await service.copy(owner, {
      id: VERSION_ID,
      reason: ScriptCopyReason.EDIT,
    });

    expect(copy).toMatchObject({
      number: 4,
      status: ScriptVersionStatus.DRAFT,
      origin: { kind: ScriptOriginKind.EDITED, fromNumber: 3 },
    });
    expect(repository.records).toHaveLength(2);
  });

  it('autosaves partial shot direction and the shoot plan on a draft', async () => {
    const { service, repository } = setup(
      version({
        shoot: { scenario: 'Late for work.', presenter: 'Office worker' },
      }),
    );

    const updated = await service.update(owner, {
      id: VERSION_ID,
      scenes: [
        {
          id: 's1',
          direction: { framing: ShotFraming.OVERHEAD, props: '' },
          transitionIn: SceneTransition.WHIP,
        },
      ],
      shoot: { presenter: '' },
    });

    // A version from before shot direction starts from a product-only shot.
    expect(updated.scenes[0].direction).toEqual({
      inFrame: ShotSubject.PRODUCT_ONLY,
      framing: ShotFraming.OVERHEAD,
      setting: '',
      props: '',
    });
    expect(repository.records[0].shoot).toEqual({
      scenario: 'Late for work.',
      presenter: null,
    });
    expect(updated.scenes[0].transitionIn).toBe(SceneTransition.WHIP);
    await expect(
      service.update(owner, {
        id: VERSION_ID,
        scenes: [{ id: 's1', direction: { setting: 'x'.repeat(81) } }],
      }),
    ).rejects.toThrow('Use 80 characters or fewer.');
  });

  it('carries the shoot plan into a copied draft', async () => {
    const shoot = { scenario: 'Late for work.', presenter: null };
    const { service } = setup(
      version({
        status: 'APPROVED',
        shoot,
        scenes: [
          { ...version().scenes[0], transitionIn: SceneTransition.DISSOLVE },
        ],
      }),
    );

    const copy = await service.copy(owner, {
      id: VERSION_ID,
      reason: ScriptCopyReason.EDIT,
    });

    expect(copy.shoot).toEqual(shoot);
    expect(copy.scenes[0].transitionIn).toBe(SceneTransition.DISSOLVE);
  });

  it('reads a legacy scene without a stored transition as Cut', () => {
    const { service, project } = setup();

    expect(service.toGraphql(version(), project).scenes[0].transitionIn).toBe(
      SceneTransition.CUT,
    );
  });

  it('grows a scene to fit its narration and keeps a longer one', async () => {
    const { service, repository } = setup();
    const words = (count: number) =>
      Array.from({ length: count }, (_, index) => `salita${index}`).join(' ');

    // 30 words take 12 s at 2.5 words per second.
    const grown = await service.update(owner, {
      id: VERSION_ID,
      scenes: [{ id: 's1', narration: words(30) }],
    });
    expect(grown.scenes[0].durationSeconds).toBe(12);
    expect(grown.totalSeconds).toBe(12);

    const shorter = await service.update(owner, {
      id: VERSION_ID,
      scenes: [{ id: 's1', durationSeconds: 3 }],
    });
    expect(shorter.scenes[0].durationSeconds).toBe(12);

    // A pause on the product: longer than the narration stays.
    await service.update(owner, {
      id: VERSION_ID,
      scenes: [{ id: 's1', durationSeconds: 14, narration: words(5) }],
    });
    expect(repository.records[0].scenes[0].durationSeconds).toBe(14);
  });

  it('reads older drafts with fitted lengths, approves them so, and keeps approved versions as stored', async () => {
    const legacyScene = {
      ...version().scenes[0],
      durationSeconds: 4,
      narration: Array.from(
        { length: 22 },
        (_, index) => `salita${index}`,
      ).join(' '),
      reportedClaims: [],
    };
    const { service, repository, project } = setup(
      version({ scenes: [legacyScene] }),
    );

    // 22 words take 9 s.
    expect(
      service.toGraphql(repository.records[0], project).scenes[0]
        .durationSeconds,
    ).toBe(9);
    await service.approve(VERSION_ID, owner);
    expect(repository.records[0].scenes[0].durationSeconds).toBe(9);

    const approvedLegacy = version({
      status: 'APPROVED',
      scenes: [legacyScene],
    });
    expect(
      service.toGraphql(approvedLegacy, project).scenes[0].durationSeconds,
    ).toBe(4);
  });

  describe('the chosen hook opens scene 1', () => {
    const hooks = [
      {
        id: 'h1',
        type: HookType.PROBLEM_FIRST,
        text: 'Late ka na naman sa breakfast?',
        openingShot: 'Hand pulling the blender out of a tote bag.',
        reportedClaims: [],
      },
      {
        id: 'h2',
        type: HookType.QUESTION,
        text: 'Anong breakfast mo kapag late ka na, at kasya ang 380 ml sa bag?',
        openingShot: 'Keys dropping into a tote bag at the door.',
        reportedClaims: ['kasya ang 380 ml'],
      },
    ];
    const hookScene = {
      ...version().scenes[0],
      id: 's1',
      order: 1,
      purpose: ScenePurpose.HOOK,
      durationSeconds: 3,
      narration: hooks[0].text,
      onScreenText: 'Breakfast, pero portable',
      visual: hooks[0].openingShot,
      factIds: [],
      reportedClaims: [],
    };
    const demo = { ...version().scenes[0], id: 's2', order: 2 };
    const draft = (overrides: Partial<ScriptVersionRecord> = {}) =>
      version({
        hooks,
        selectedHookId: null,
        scenes: [hookScene, demo],
        ...overrides,
      });

    it("puts a picked hook's words and opening shot in scene 1, growing it to fit", async () => {
      const { service, repository } = setup(draft());

      const updated = await service.update(owner, {
        id: VERSION_ID,
        selectedHookId: 'h2',
      });

      expect(updated.scenes[0]).toMatchObject({
        narration: hooks[1].text,
        visual: hooks[1].openingShot,
        // 14 words take 6 s.
        durationSeconds: 6,
      });
      expect(repository.records[0].scenes[0].reportedClaims).toEqual([
        'kasya ang 380 ml',
      ]);
      expect(updated.scenes[1].narration).toBe(demo.narration);
    });

    it('moves only the part of the chosen hook that was edited', async () => {
      const { service } = setup(draft({ selectedHookId: 'h1' }));

      const updated = await service.update(owner, {
        id: VERSION_ID,
        hooks: [{ id: 'h1', text: 'Late ka na naman?' }],
      });

      expect(updated.scenes[0]).toMatchObject({
        narration: 'Late ka na naman?',
        visual: hooks[0].openingShot,
      });
    });

    it('leaves scene 1 as sent when the same save edits it (the editor already put the hook there)', async () => {
      const { service } = setup(draft());

      const updated = await service.update(owner, {
        id: VERSION_ID,
        selectedHookId: 'h2',
        scenes: [{ id: 's1', narration: 'Sariling opening.' }],
      });

      expect(updated.scenes[0].narration).toBe('Sariling opening.');
    });

    it('leaves the scenes alone when the first scene is not the hook scene', async () => {
      const { service } = setup(
        draft({ scenes: [{ ...hookScene, purpose: ScenePurpose.PROBLEM }] }),
      );

      const updated = await service.update(owner, {
        id: VERSION_ID,
        selectedHookId: 'h2',
      });

      expect(updated.scenes[0].narration).toBe(hooks[0].text);
    });

    it("in a skit, has scene 1's first line say the hook, keeping its speaker and beat", async () => {
      const beat = {
        shot: 'close-up on Ben',
        reaction: 'stops at the door',
        pauseSeconds: 1,
        delivery: 'teasing',
      };
      const { service } = setup(
        draft({
          contentStyle: ContentStyle.SKIT,
          scenes: [
            {
              ...hookScene,
              narration: '',
              lines: [
                { speaker: 'Ben', text: hooks[0].text, ...beat },
                { speaker: 'Ana', text: 'Oo na.' },
              ],
            },
            demo,
          ],
        }),
      );

      const updated = await service.update(owner, {
        id: VERSION_ID,
        selectedHookId: 'h2',
      });

      expect(updated.scenes[0].narration).toBe('');
      expect(updated.scenes[0].lines.map((line) => line.text)).toEqual([
        hooks[1].text,
        'Oo na.',
      ]);
      expect(updated.scenes[0].lines[0]).toMatchObject({
        speaker: 'Ben',
        ...beat,
      });
    });

    it('keeps the chosen hook in scene 1 through a hook rewrite and a scene rewrite', async () => {
      const { service, repository } = setup(draft({ selectedHookId: 'h1' }));

      await service.replaceItem(VERSION_ID, owner, {
        hook: {
          ...hooks[0],
          text: 'Gutom ka na naman?',
          openingShot: 'Empty mug.',
        },
      });
      expect(repository.records[0].scenes[0]).toMatchObject({
        narration: 'Gutom ka na naman?',
        visual: 'Empty mug.',
      });

      await service.replaceItem(VERSION_ID, owner, {
        scene: {
          ...hookScene,
          narration: 'Something else.',
          visual: 'New angle.',
        },
      });
      expect(repository.records[0].scenes[0]).toMatchObject({
        narration: 'Gutom ka na naman?',
        visual: 'New angle.',
      });
    });
  });

  describe('skits', () => {
    const skit = () =>
      version({
        contentStyle: ContentStyle.SKIT,
        scenes: [
          {
            ...version().scenes[0],
            narration: '',
            lines: [{ speaker: 'Ana', text: 'Kasya ang 380 ml!' }],
            sound: 'Blender whirring',
            reportedClaims: [],
          },
        ],
      });
    const words = (count: number) =>
      Array.from({ length: count }, (_, index) => `w${index}`).join(' ');

    it('reads the style and skit fields, counting lines as spoken', () => {
      const { service, project } = setup(skit());
      const read = service.toGraphql(skit(), project);

      expect(read.contentStyle).toBe(ContentStyle.SKIT);
      expect(read.scenes[0]).toMatchObject({
        narration: '',
        lines: [{ speaker: 'Ana', text: 'Kasya ang 380 ml!' }],
        sound: 'Blender whirring',
      });
      // 4 words at 2.5 per second.
      expect(read.spokenSeconds).toBe(2);
    });

    it('reads a version from before skits as narrated', () => {
      const { service, project } = setup();
      const read = service.toGraphql(version(), project);

      expect(read.contentStyle).toBeNull();
      expect(read.scenes[0]).toMatchObject({ lines: [], sound: null });
    });

    it('flags a claim a character says that is not an approved fact', () => {
      const { service, project } = setup();
      const flagged = skit();
      flagged.scenes[0].lines = [
        { speaker: 'Ben', text: 'Blends ice in 10 seconds pa!' },
      ];
      flagged.scenes[0].reportedClaims = ['Blends ice in 10 seconds'];

      expect(
        service
          .flagsFor(flagged, project.approvedFacts)
          .scenes.get('s1')
          ?.map((flag) => flag.claim),
      ).toContain('Blends ice in 10 seconds');
    });

    it('edits lines and sound on a draft, dropping a blank line and fitting the scene to them', async () => {
      const { service, repository } = setup(skit());

      // 25 words take 10 s.
      const updated = await service.update(owner, {
        id: VERSION_ID,
        scenes: [
          {
            id: 's1',
            lines: [
              { speaker: ' Ana ', text: words(15) },
              { speaker: 'Ben', text: '   ' },
              { speaker: '', text: words(10) },
            ],
            sound: '',
          },
        ],
      });

      const none = { shot: '', reaction: '', pauseSeconds: 0, delivery: '' };

      expect(updated.scenes[0].lines).toEqual([
        { speaker: 'Ana', text: words(15), ...none },
        { speaker: '', text: words(10), ...none },
      ]);
      expect(updated.scenes[0].durationSeconds).toBe(10);
      expect(repository.records[0].scenes[0].sound).toBeNull();
    });

    it("keeps each line's beat and grows the scene to fit its pauses", async () => {
      const { service } = setup(skit());
      const beat = {
        shot: ' close-up on Ben ',
        reaction: 'stops, looks down at the sandals',
        pauseSeconds: 1.5,
        delivery: 'half laughing',
      };

      // 10 words take 4 s, and the reaction holds 1.5 s before them.
      const updated = await service.update(owner, {
        id: VERSION_ID,
        scenes: [
          {
            id: 's1',
            durationSeconds: 4,
            lines: [{ speaker: 'Ben', text: words(10), ...beat }],
          },
        ],
      });

      expect(updated.scenes[0].lines).toEqual([
        { speaker: 'Ben', text: words(10), ...beat, shot: 'close-up on Ben' },
      ]);
      expect(updated.scenes[0].durationSeconds).toBe(6);
    });

    it('rejects a fourth line, a long line, a long speaker and a long sound', async () => {
      const { service } = setup(skit());
      const edit = (scene: Record<string, unknown>) =>
        service.update(owner, {
          id: VERSION_ID,
          scenes: [{ id: 's1', ...scene }],
        });
      const line = { speaker: 'Ana', text: 'Oo' };

      await expect(edit({ lines: [line, line, line, line] })).rejects.toThrow(
        'Add at most 3 lines.',
      );
      await expect(
        edit({ lines: [{ speaker: 'Ana', text: 'x'.repeat(161) }] }),
      ).rejects.toThrow('Use 160 characters or fewer.');
      await expect(
        edit({ lines: [{ speaker: 'x'.repeat(25), text: 'Oo' }] }),
      ).rejects.toThrow('Use 24 characters or fewer.');
      await expect(edit({ sound: 'x'.repeat(81) })).rejects.toThrow(
        'Use 80 characters or fewer.',
      );
      for (const pauseSeconds of [-0.5, 0.25, 3.5]) {
        await expect(
          edit({ lines: [{ ...line, pauseSeconds }] }),
        ).rejects.toThrow('Use 0 to 3 seconds in steps of 0.5.');
      }
      await expect(
        edit({ lines: [{ ...line, reaction: 'x'.repeat(81) }] }),
      ).rejects.toThrow('Use 80 characters or fewer.');
      await expect(
        edit({ lines: [{ ...line, shot: 'x'.repeat(61) }] }),
      ).rejects.toThrow('Use 60 characters or fewer.');
      await expect(
        edit({ lines: [{ ...line, delivery: 'x'.repeat(61) }] }),
      ).rejects.toThrow('Use 60 characters or fewer.');
    });

    it('leaves a narrated scene without skit fields when they are not edited', async () => {
      const { service, repository } = setup();

      await service.update(owner, {
        id: VERSION_ID,
        scenes: [{ id: 's1', onScreenText: '380 ml cup' }],
      });

      expect(repository.records[0].scenes[0]).not.toHaveProperty('lines');
      expect(repository.records[0].scenes[0]).not.toHaveProperty('sound');
    });

    it('carries the style, lines and sound into a copied draft', async () => {
      const { service } = setup({ ...skit(), status: 'APPROVED' });

      const copy = await service.copy(owner, {
        id: VERSION_ID,
        reason: ScriptCopyReason.RESTORE,
      });

      expect(copy.contentStyle).toBe(ContentStyle.SKIT);
      expect(copy.scenes[0]).toMatchObject({
        lines: [{ speaker: 'Ana', text: 'Kasya ang 380 ml!' }],
        sound: 'Blender whirring',
      });
    });
  });

  it('treats a version from another tenant as not found', async () => {
    const { service } = setup();

    await expect(
      service.getRecord(VERSION_ID, { ...owner, organizationId: TENANT_B }),
    ).rejects.toThrow(NotFoundError);
    await expect(service.getRecord(VERSION_ID, owner)).resolves.toMatchObject({
      id: VERSION_ID,
    });
  });
});
