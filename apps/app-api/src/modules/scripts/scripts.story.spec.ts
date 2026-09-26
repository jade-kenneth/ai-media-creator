import { fakeRepository } from '../../../test/fake-repository';
import {
  ContentStyle,
  GenerationJobType,
  HookType,
  ProjectStatus,
  ScenePurpose,
  SceneTransition,
  ScriptCopyReason,
  ScriptLanguage,
  ScriptOriginKind,
  ScriptVersionStatus,
  ShotFraming,
  ShotSubject,
  StoryGenre,
  Storytelling,
  StudioType,
} from 'src/graphql/generated/graphql';
import { ClaimCheckService } from '../facts/claim-check.service';
import type { GenerationJobHandlers } from '../generation-jobs/generation-job-handlers';
import type { GenerationJobsService } from '../generation-jobs/generation-jobs.service';
import type { GenerationJobRecord } from '../generation-jobs/repositories/generation-jobs.repository';
import type { ProjectsService } from '../projects/projects.service';
import type {
  ProjectRecord,
  StoryRecord,
} from '../projects/repositories/projects.repository';
import { STORY_ENDING_RULE, STORY_RULES } from '../studios/story';
import type { TextGenerationService } from '../text-generation/text-generation.service';
import type {
  ScriptsRepository,
  ScriptVersionRecord,
} from './repositories/scripts.repository';
import { ScriptJobsHandler } from './script-jobs.handler';
import { ScriptsService } from './scripts.service';

const owner = { ownerId: 'user-1', organizationId: 'org-a' };
const PROJECT_ID = 'b'.repeat(24);
const VERSION_ID = 'c'.repeat(24);

const cast = [
  {
    id: 'c-ana-0001',
    name: 'Ana',
    role: 'a nurse heading home after a night shift',
    look: '20s, yellow raincoat, short hair',
  },
  {
    id: 'c-ben-0001',
    name: 'Ben',
    role: 'a delivery rider on a break',
    look: '20s, green rider jacket',
  },
];

function story(overrides: Partial<StoryRecord> = {}): StoryRecord {
  return {
    genre: StoryGenre.COMEDY,
    premise: {
      kind: 'OWN' as StoryRecord['premise'] extends infer P
        ? P extends { kind: infer K }
          ? K
          : never
        : never,
      suggestionId: null,
      title: 'The Umbrella Standoff',
      logline:
        "Two strangers fight over the last umbrella at a bus stop, then find out they're neighbours.",
    },
    cast,
    storytelling: Storytelling.ACTED,
    language: ScriptLanguage.TAGLISH,
    lengthSeconds: 45,
    ...overrides,
  };
}

function storyProject(overrides: Partial<StoryRecord> = {}): ProjectRecord {
  return {
    id: PROJECT_ID,
    title: 'The Umbrella Standoff',
    studioType: StudioType.ENTERTAINMENT,
    status: ProjectStatus.DRAFT,
    approvedFacts: [],
    product: { title: null },
    strategy: {
      platform: 'TIKTOK_SHOP',
      tone: 'FRIENDLY',
      language: ScriptLanguage.ENGLISH,
      lengthSeconds: 30,
      contentStyle: ContentStyle.VOICEOVER_PRODUCT_SHOTS,
      selectedAngle: null,
      buyer: null,
    },
    story: story(overrides),
  } as unknown as ProjectRecord;
}

const direction = {
  inFrame: ShotSubject.CREATOR,
  framing: ShotFraming.MEDIUM,
  setting: 'Bus stop, rainy night',
  props: 'Umbrella',
};

/** A story version whose words would be flagged in an affiliate video. */
function storyVersion(
  overrides: Partial<ScriptVersionRecord> = {},
): ScriptVersionRecord {
  return {
    id: VERSION_ID,
    ownerId: owner.ownerId,
    organizationId: owner.organizationId,
    projectId: PROJECT_ID,
    number: 1,
    status: 'DRAFT',
    origin: { kind: ScriptOriginKind.WRITTEN, fromNumber: null },
    angleTitle: 'The Umbrella Standoff',
    language: ScriptLanguage.TAGLISH,
    lengthSeconds: 45,
    contentStyle: ContentStyle.SKIT,
    studio: StudioType.ENTERTAINMENT,
    hooks: [
      {
        id: 'h1',
        type: HookType.COLD_OPEN,
        text: 'This is the best umbrella, guaranteed!',
        openingShot: 'Two hands on one umbrella',
        reportedClaims: [],
      },
    ],
    selectedHookId: 'h1',
    scenes: [
      {
        id: 's1',
        order: 1,
        purpose: ScenePurpose.HOOK,
        durationSeconds: 5,
        narration: '',
        lines: [
          { speaker: 'Ana', text: 'This is the best umbrella, guaranteed!' },
        ],
        sound: 'rain on the roof',
        onScreenText: '100% mine',
        visual: 'Two hands on one umbrella',
        direction,
        transitionIn: SceneTransition.CUT,
        cta: null,
        factIds: [],
        reportedClaims: [],
      },
      {
        id: 's2',
        order: 2,
        purpose: ScenePurpose.TURN,
        durationSeconds: 5,
        narration: '',
        lines: [{ speaker: 'Ben', text: 'Kapitbahay kita?' }],
        sound: null,
        onScreenText: '',
        visual: 'Ben holds up his keys',
        direction,
        transitionIn: SceneTransition.CUT,
        cta: null,
        factIds: [],
        reportedClaims: [],
      },
      {
        id: 's3',
        order: 3,
        purpose: ScenePurpose.PAYOFF,
        durationSeconds: 5,
        narration: '',
        lines: [
          { speaker: 'Ana', text: 'Teka, bakit may susi ka ng unit ko?' },
        ],
        sound: null,
        onScreenText: '',
        visual: 'Ana stares at the key in Ben’s hand',
        direction,
        transitionIn: SceneTransition.CUT,
        cta: null,
        factIds: [],
        reportedClaims: [],
      },
    ],
    shoot: { scenario: 'A bus stop in the rain.', presenter: 'Ana; Ben' },
    caption: 'Sino ang panalo? Best comedy ever.',
    approvedAt: null,
    approvedFactSnapshot: [],
    createdAt: new Date('2026-09-26T02:00:00Z'),
    updatedAt: new Date('2026-09-26T02:00:00Z'),
    ...overrides,
  };
}

function setup(
  project: ProjectRecord = storyProject(),
  records: ScriptVersionRecord[] = [],
) {
  const repository = fakeRepository<ScriptVersionRecord>(records);
  const projects = {
    getRecord: jest.fn(async () => project),
    syncScripts: jest.fn(async () => undefined),
    setStatus: jest.fn(async () => undefined),
  };
  const jobs = {
    create: jest.fn(async (input: Record<string, unknown>) => ({
      id: 'job-1',
      ...input,
    })),
    listForProject: jest.fn(async () => []),
  };
  const service = new ScriptsService(
    repository as unknown as ScriptsRepository,
    projects as unknown as ProjectsService,
    jobs as unknown as GenerationJobsService,
    new ClaimCheckService(),
  );

  return { service, repository, projects, jobs, project };
}

describe('ScriptsService for stories', () => {
  it('asks a story for a genre, a premise and, when acted, a character before charging', async () => {
    const write = (overrides: Partial<StoryRecord>) =>
      setup(storyProject(overrides)).service.writeScript(
        owner,
        PROJECT_ID,
        'key-1',
      );

    await expect(write({ genre: null })).rejects.toMatchObject({
      message: 'Pick a genre',
      details: { code: 'NO_GENRE' },
    });
    await expect(write({ premise: null })).rejects.toMatchObject({
      message: 'Choose or write a premise',
      details: { code: 'NO_PREMISE' },
    });
    await expect(
      write({
        premise: { ...story().premise!, logline: '   ' },
      }),
    ).rejects.toMatchObject({ details: { code: 'NO_PREMISE' } });
    await expect(write({ cast: [] })).rejects.toMatchObject({
      message: 'Add a character, or switch to Narrated',
      details: { code: 'NO_CAST' },
    });
  });

  it('writes a narrated story with no cast and no facts, and moves it to script review', async () => {
    const { service, jobs, projects } = setup(
      storyProject({ storytelling: Storytelling.NARRATED, cast: [] }),
    );

    await service.writeScript(owner, PROJECT_ID, 'key-1');

    expect(jobs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: GenerationJobType.WRITE_SCRIPT,
        creditCost: 3,
      }),
    );
    expect(projects.setStatus).toHaveBeenCalledWith(
      PROJECT_ID,
      owner,
      ProjectStatus.SCRIPT_REVIEW,
    );
  });

  it('keeps the affiliate gate for an affiliate project', async () => {
    const affiliate = {
      ...storyProject(),
      studioType: StudioType.AFFILIATE,
      story: null,
    } as unknown as ProjectRecord;

    await expect(
      setup(affiliate).service.writeScript(owner, PROJECT_ID, 'key-1'),
    ).rejects.toMatchObject({
      message: 'Approve at least one fact first.',
      details: { code: 'NO_APPROVED_FACTS' },
    });
  });

  it('stamps a written story version with the studio and the story’s format', async () => {
    const { service, repository, project } = setup();

    await service.createWrittenVersion(project, owner, {
      contentStyle: ContentStyle.SKIT,
      hooks: storyVersion().hooks,
      scenes: storyVersion().scenes,
      shoot: storyVersion().shoot,
      caption: 'Sino ang panalo?',
    });

    expect(repository.records[0]).toMatchObject({
      studio: StudioType.ENTERTAINMENT,
      angleTitle: 'The Umbrella Standoff',
      language: ScriptLanguage.TAGLISH,
      lengthSeconds: 45,
      contentStyle: ContentStyle.SKIT,
    });

    const own = setup(
      storyProject({
        premise: { ...story().premise!, title: '' },
        language: ScriptLanguage.ENGLISH,
        lengthSeconds: 60,
      }),
    );
    await own.service.createWrittenVersion(own.project, owner, {
      contentStyle: ContentStyle.NARRATION,
      hooks: [],
      scenes: [],
      shoot: null,
      caption: '',
    });
    expect(own.repository.records[0]).toMatchObject({
      angleTitle: null,
      language: ScriptLanguage.ENGLISH,
      lengthSeconds: 60,
    });
  });

  it('approves a story with no facts: no flags, no facts used, a picked hook is enough', async () => {
    const { service, repository, project } = setup(storyProject(), [
      storyVersion(),
    ]);

    const read = service.toGraphql(storyVersion(), project);
    expect(read.studio).toBe(StudioType.ENTERTAINMENT);
    expect(read.hooks[0].flags).toEqual([]);
    expect(read.scenes.flatMap((scene) => scene.flags)).toEqual([]);
    expect(read.captionFlags).toEqual([]);
    expect(read.usedFactIds).toEqual([]);

    const approved = await service.approve(VERSION_ID, owner);

    expect(approved.status).toBe(ScriptVersionStatus.APPROVED);
    expect(repository.records[0].approvedFactSnapshot).toEqual([]);
    await expect(
      setup(storyProject(), [
        storyVersion({ selectedHookId: null }),
      ]).service.approve(VERSION_ID, owner),
    ).rejects.toThrow('Pick a hook first.');
  });

  it('still refuses a story approval while a rewrite is running', async () => {
    const { service, jobs } = setup(storyProject(), [storyVersion()]);
    jobs.listForProject.mockResolvedValueOnce([
      { input: { versionId: VERSION_ID, sceneId: 's2' } },
    ] as never);

    await expect(service.approve(VERSION_ID, owner)).rejects.toThrow(
      'Wait for the rewrite to finish.',
    );
  });

  it('carries the studio into a restored or edited copy', async () => {
    for (const reason of [ScriptCopyReason.RESTORE, ScriptCopyReason.EDIT]) {
      const { service, repository } = setup(storyProject(), [
        storyVersion({ status: 'APPROVED' }),
      ]);

      const copy = await service.copy(owner, { id: VERSION_ID, reason });

      expect(copy.studio).toBe(StudioType.ENTERTAINMENT);
      expect(repository.records[1].studio).toBe(StudioType.ENTERTAINMENT);
    }
  });

  it('carries the studio into a duplicated project’s draft', async () => {
    const { service } = setup(storyProject(), [
      storyVersion({
        status: 'APPROVED',
        approvedAt: new Date('2026-09-26T03:00:00Z'),
      }),
    ]);
    const target = { ...storyProject(), id: 'd'.repeat(24) } as ProjectRecord;
    const targetRepository = (
      service as unknown as { versions: ReturnType<typeof fakeRepository> }
    ).versions;

    await service.copyApprovedToProject(PROJECT_ID, target, owner, new Map());

    expect(
      targetRepository.records.find(
        (record) =>
          (record as unknown as ScriptVersionRecord).projectId === target.id,
      ),
    ).toMatchObject({
      studio: StudioType.ENTERTAINMENT,
      origin: { kind: ScriptOriginKind.COPIED, fromNumber: 1 },
    });
  });

  it('reads a version from before studios as Affiliate, with its claim check', () => {
    const { service } = setup();
    const legacy = storyVersion({ studio: undefined, contentStyle: null });
    const affiliate = {
      id: PROJECT_ID,
      approvedFacts: [],
    } as unknown as ProjectRecord;

    const read = service.toGraphql(legacy, affiliate);

    expect(read.studio).toBe(StudioType.AFFILIATE);
    expect(read.hooks[0].flags.map((flag) => flag.category)).toEqual(
      expect.arrayContaining(['SUPERLATIVE', 'GUARANTEE']),
    );
  });
});

describe('ScriptJobsHandler for stories', () => {
  function handlerSetup(
    output: unknown,
    project: ProjectRecord = storyProject(),
    records: ScriptVersionRecord[] = [],
  ) {
    const scripts = setup(project, records);
    const generateJson = jest.fn(
      async (request: {
        schema: Record<string, unknown>;
        messages: { content: string }[];
      }) => {
        void request;
        return output;
      },
    );
    const handler = new ScriptJobsHandler(
      { register: jest.fn() } as unknown as GenerationJobHandlers,
      scripts.projects as unknown as ProjectsService,
      scripts.service,
      { generateJson } as unknown as TextGenerationService,
    );

    return { ...scripts, handler, generateJson };
  }

  const job = (type: GenerationJobType, input = {}) =>
    ({
      id: 'job-1',
      ownerId: owner.ownerId,
      organizationId: owner.organizationId,
      projectId: PROJECT_ID,
      type,
      input,
    }) as unknown as GenerationJobRecord;
  const setStep = { setStep: jest.fn(async () => undefined) };

  const line = (text: string) => ({
    speaker: 'Ana',
    shot: 'close-up on Ana',
    reaction: 'freezes',
    pauseSeconds: 1,
    delivery: 'deadpan',
    text,
  });
  const scene = (purpose: ScenePurpose, text: string) => ({
    purpose,
    durationSeconds: 7,
    narration: '',
    onScreenText: '',
    visual: 'Ana and Ben at the bus stop',
    direction: { ...direction, props: ['Umbrella'] },
    transitionIn: SceneTransition.CUT,
    lines: [line(text)],
    sound: 'rain',
  });

  it('writes an acted story as a skit with the story values, no claims and the cast as presenter', async () => {
    const { handler, generateJson, repository } = handlerSetup({
      shoot: { scenario: 'One umbrella left at a bus stop.' },
      hooks: [
        { type: HookType.COLD_OPEN, text: 'Akin ’yan!', openingShot: 'Hands' },
        {
          type: HookType.PROBLEM_FIRST,
          text: 'Isa lang?',
          openingShot: 'Wide',
        },
        { type: HookType.QUESTION, text: 'Sino mauuna?', openingShot: 'Bench' },
      ],
      scenes: [
        scene(ScenePurpose.HOOK, 'Akin ’yan!'),
        scene(ScenePurpose.SETUP, 'Late na ako.'),
        scene(ScenePurpose.PROOF, 'Ang kulit mo.'),
        scene(ScenePurpose.TURN, 'Kapitbahay kita?'),
        scene(ScenePurpose.CALL_TO_ACTION, 'Share tayo?'),
      ],
      caption: 'Sino ang panalo?',
    });

    await handler.run(job(GenerationJobType.WRITE_SCRIPT), setStep);

    const [request] = generateJson.mock.calls[0];
    expect(request.messages[0].content).toContain(STORY_RULES);
    expect(JSON.stringify(request.schema)).not.toContain('"claims"');

    const [written] = repository.records;
    expect(written).toMatchObject({
      studio: StudioType.ENTERTAINMENT,
      contentStyle: ContentStyle.SKIT,
      shoot: {
        scenario: 'One umbrella left at a bus stop.',
        presenter:
          'Ana, a nurse heading home after a night shift, 20s, yellow raincoat, short hair; Ben, a delivery rider on a break, 20s, green rider jacket',
      },
    });
    expect(written.scenes.map((item) => item.purpose)).toEqual([
      ScenePurpose.HOOK,
      ScenePurpose.SETUP,
      ScenePurpose.BUILD,
      ScenePurpose.TURN,
      ScenePurpose.PAYOFF,
    ]);
    expect(written.hooks.map((hook) => hook.type)).toEqual([
      HookType.COLD_OPEN,
      HookType.FLASH_FORWARD,
      HookType.QUESTION,
    ]);
    expect(
      written.scenes.flatMap((item) => [
        ...item.factIds,
        ...item.reportedClaims,
      ]),
    ).toEqual([]);
    expect(written.scenes[0].lines?.[0]).toMatchObject({
      speaker: 'Ana',
      text: 'Akin ’yan!',
    });
  });

  it('rewrites a story scene with the story prompt, keeping its purpose', async () => {
    const { handler, generateJson, repository } = handlerSetup(
      {
        scene: {
          ...scene(ScenePurpose.DEMO, 'Kapitbahay pala kita!'),
          claims: ['the best neighbour'],
        },
      },
      storyProject(),
      [storyVersion()],
    );

    await handler.run(
      job(GenerationJobType.REWRITE_SCENE, {
        versionId: VERSION_ID,
        sceneId: 's2',
      }),
      setStep,
    );

    const [request] = generateJson.mock.calls[0];
    expect(request.messages[0].content).toContain(
      'Rewrite one scene of the story. Keep its purpose (TURN',
    );
    expect(request.messages[0].content).toContain(STORY_RULES);
    expect(JSON.stringify(request.schema)).toContain('"PAYOFF"');
    expect(JSON.stringify(request.schema)).not.toContain('"DEMO"');

    const rewritten = repository.records[0].scenes.find(
      (item) => item.id === 's2',
    );
    expect(rewritten).toMatchObject({
      purpose: ScenePurpose.TURN,
      reportedClaims: [],
      factIds: [],
      lines: [expect.objectContaining({ text: 'Kapitbahay pala kita!' })],
    });
  });

  it('corrects a story that ends on a turn and an earlier cliffhanger (R29)', async () => {
    const { handler, repository } = handlerSetup({
      shoot: { scenario: 'One umbrella left at a bus stop.' },
      hooks: [
        { type: HookType.COLD_OPEN, text: 'Akin ’yan!', openingShot: 'Hands' },
        { type: HookType.MYSTERY, text: 'Bakit dalawa?', openingShot: 'Keys' },
        { type: HookType.QUESTION, text: 'Sino mauuna?', openingShot: 'Bench' },
      ],
      scenes: [
        scene(ScenePurpose.HOOK, 'Akin ’yan!'),
        scene(ScenePurpose.PAYOFF, 'Ay, kapitbahay?'),
        scene(ScenePurpose.BUILD, 'Ang kulit mo.'),
        scene(ScenePurpose.TURN, 'Share na lang tayo.'),
      ],
      caption: 'Sino ang panalo?',
    });

    await handler.run(job(GenerationJobType.WRITE_SCRIPT), setStep);

    expect(repository.records[0].scenes.map((item) => item.purpose)).toEqual([
      ScenePurpose.HOOK,
      ScenePurpose.TURN,
      ScenePurpose.BUILD,
      ScenePurpose.PAYOFF,
    ]);
  });

  it('tells a rewrite of the last scene it is the cliffhanger, and no other scene', async () => {
    const rewrite = async (sceneId: string, record = storyVersion()) => {
      const { handler, generateJson, repository } = handlerSetup(
        { scene: scene(ScenePurpose.SETUP, 'Susi ko ’yan!') },
        storyProject(),
        [record],
      );

      await handler.run(
        job(GenerationJobType.REWRITE_SCENE, {
          versionId: VERSION_ID,
          sceneId,
        }),
        setStep,
      );

      return {
        prompt: generateJson.mock.calls[0][0].messages[0].content,
        scene: repository.records[0].scenes.find((item) => item.id === sceneId),
      };
    };
    const last = await rewrite('s3');
    const middle = await rewrite('s2');

    for (const prompt of [last.prompt, middle.prompt]) {
      expect(prompt).toContain(STORY_ENDING_RULE);
    }
    expect(last.prompt).toContain(
      "This is the story's last scene, the cliffhanger scene",
    );
    expect(last.prompt).toContain('Keep its purpose (PAYOFF');
    expect(last.scene?.purpose).toBe(ScenePurpose.PAYOFF);
    expect(middle.prompt).not.toContain('the cliffhanger scene');

    // A version whose last scene isn't the cliffhanger gets one on rewrite.
    const legacy = storyVersion();
    legacy.scenes = legacy.scenes.slice(0, 2);
    const fixed = await rewrite('s2', legacy);
    expect(fixed.prompt).toContain('Keep its purpose (PAYOFF');
    expect(fixed.scene?.purpose).toBe(ScenePurpose.PAYOFF);
  });

  it('rewrites a story hook with a story hook type', async () => {
    const { handler, repository } = handlerSetup(
      {
        hook: {
          type: HookType.DIRECT_PITCH,
          text: 'Isang payong, dalawang tao.',
          openingShot: 'Wide on the bus stop',
        },
      },
      storyProject(),
      [storyVersion({ selectedHookId: null })],
    );

    await handler.run(
      job(GenerationJobType.REWRITE_HOOK, {
        versionId: VERSION_ID,
        hookId: 'h1',
      }),
      setStep,
    );

    expect(repository.records[0].hooks[0]).toMatchObject({
      id: 'h1',
      type: HookType.COLD_OPEN,
      text: 'Isang payong, dalawang tao.',
      reportedClaims: [],
    });
  });
});
