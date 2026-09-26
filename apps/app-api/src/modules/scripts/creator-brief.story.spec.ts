import {
  ContentStyle,
  HookType,
  ScenePurpose,
  SceneTransition,
  ScriptLanguage,
  ScriptOriginKind,
  ShotFraming,
  ShotSubject,
  StoryGenre,
  Storytelling,
  StudioType,
} from 'src/graphql/generated/graphql';
import { ClaimCheckService } from '../facts/claim-check.service';
import type { FactsService } from '../facts/facts.service';
import type { ProjectsService } from '../projects/projects.service';
import type { ProjectRecord } from '../projects/repositories/projects.repository';
import type {
  ScriptSceneRecord,
  ScriptVersionRecord,
} from './repositories/scripts.repository';
import { CreatorBriefService, storyCastLines } from './creator-brief.service';
import { ScriptsService } from './scripts.service';

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
    look: '20s, green rider jacket, helmet under his arm',
  },
];

function project(storytelling: Storytelling, language: ScriptLanguage) {
  return {
    id: 'p'.repeat(24),
    title: 'The Umbrella Standoff',
    studioType: StudioType.ENTERTAINMENT,
    approvedFacts: [],
    product: { title: null, affiliateUrl: null },
    strategy: { platform: 'TIKTOK_SHOP', tone: 'FRIENDLY' },
    story: {
      genre:
        storytelling === Storytelling.ACTED
          ? StoryGenre.COMEDY
          : StoryGenre.ACTION,
      premise: {
        kind: 'OWN',
        suggestionId: null,
        title: '',
        logline:
          "Two strangers fight over the last umbrella at a bus stop, then find out they're neighbours.",
      },
      cast,
      storytelling,
      language,
      lengthSeconds: 45,
    },
  } as unknown as ProjectRecord;
}

const frame = (inFrame: ShotSubject, setting: string, props = '') => ({
  inFrame,
  framing: ShotFraming.MEDIUM,
  setting,
  props,
});

function scene(
  order: number,
  purpose: ScenePurpose,
  durationSeconds: number,
  extra: Partial<ScriptSceneRecord>,
): ScriptSceneRecord {
  return {
    id: `s${order}`,
    order,
    purpose,
    durationSeconds,
    narration: '',
    onScreenText: '',
    visual: '',
    transitionIn: SceneTransition.CUT,
    cta: null,
    factIds: [],
    reportedClaims: [],
    ...extra,
  };
}

function version(
  contentStyle: ContentStyle,
  scenes: ScriptSceneRecord[],
  language: ScriptLanguage,
): ScriptVersionRecord {
  return {
    id: 'v'.repeat(24),
    ownerId: 'user-1',
    organizationId: 'org-a',
    projectId: 'p'.repeat(24),
    number: 1,
    status: 'APPROVED',
    origin: { kind: ScriptOriginKind.WRITTEN, fromNumber: null },
    angleTitle: null,
    language,
    lengthSeconds: 45,
    contentStyle,
    studio: StudioType.ENTERTAINMENT,
    hooks: [
      {
        id: 'h1',
        type: HookType.COLD_OPEN,
        text: 'Uy, akin ’yan!',
        openingShot: 'Two hands grab one umbrella',
        reportedClaims: [],
      },
    ],
    selectedHookId: 'h1',
    scenes,
    shoot: {
      scenario: 'A bus stop in the rain, one umbrella left.',
      presenter: 'Ana, a nurse; Ben, a rider',
    },
    caption: 'Sino ang panalo?',
    approvedAt: new Date('2026-09-26T02:00:00Z'),
    approvedFactSnapshot: [],
    createdAt: new Date('2026-09-26T01:00:00Z'),
    updatedAt: new Date('2026-09-26T02:00:00Z'),
  };
}

async function brief(record: ProjectRecord, approved: ScriptVersionRecord) {
  const scripts = new ScriptsService(
    {} as never,
    {} as never,
    {} as never,
    new ClaimCheckService(),
  );
  const facts = { list: jest.fn(async () => []) };
  const service = new CreatorBriefService(
    { getRecord: jest.fn(async () => record) } as unknown as ProjectsService,
    {
      records: jest.fn(async () => [approved]),
      effectiveStatus: scripts.effectiveStatus.bind(scripts),
      flagsFor: scripts.flagsFor.bind(scripts),
    } as unknown as ScriptsService,
    facts as unknown as FactsService,
  );

  return { result: await service.build(record.id, {} as never), facts };
}

describe('CreatorBriefService: story brief', () => {
  it('builds an acted story brief: story header, cast lines, live sound, no facts, story reminders', async () => {
    const line = (speaker: string, text: string, pauseSeconds = 0) => ({
      speaker,
      text,
      shot: '',
      reaction: '',
      pauseSeconds,
      delivery: '',
    });
    const approved = version(
      ContentStyle.SKIT,
      [
        scene(1, ScenePurpose.HOOK, 4, {
          lines: [line('Ana', 'Uy, akin ’yan!')],
          sound: 'rain on the shelter roof',
          visual: 'Two hands grab one umbrella',
          direction: frame(
            ShotSubject.CREATOR,
            'Bus stop, rainy night',
            'Umbrella',
          ),
        }),
        scene(2, ScenePurpose.SETUP, 8, {
          lines: [line('Ben', 'Nauna ako dito.')],
          direction: frame(ShotSubject.HANDS, 'Bus stop, rainy night'),
        }),
        scene(3, ScenePurpose.BUILD, 9, {
          lines: [line('Ana', 'Night shift ako, pagod na ako.')],
          direction: frame(ShotSubject.CREATOR, 'Bus stop, rainy night'),
        }),
        scene(4, ScenePurpose.TURN, 10, {
          lines: [line('Ben', 'Teka, Unit 4B ka?')],
          transitionIn: SceneTransition.WHIP,
          direction: frame(
            ShotSubject.PRODUCT_ONLY,
            'Apartment hallway',
            'Keys',
          ),
        }),
        scene(5, ScenePurpose.PAYOFF, 7, {
          lines: [line('Ana', 'Bakit may susi ka ng unit ko?')],
          direction: frame(ShotSubject.CREATOR, 'Apartment hallway'),
        }),
      ],
      ScriptLanguage.TAGLISH,
    );

    const { result, facts } = await brief(
      project(Storytelling.ACTED, ScriptLanguage.TAGLISH),
      approved,
    );

    expect(facts.list).not.toHaveBeenCalled();
    expect(result.fileName).toBe('the-umbrella-standoff-brief-v1.txt');
    expect(result.text).toBe(
      [
        'THE UMBRELLA STANDOFF',
        'Genre: Comedy · Acted',
        "Premise: Two strangers fight over the last umbrella at a bus stop, then find out they're neighbours.",
        'Format: Taglish · 45 s',
        'Script: v1, approved 26 Sep 2026',
        '',
        'HOOK',
        '"Uy, akin ’yan!"',
        'Opening shot: Two hands grab one umbrella',
        '',
        'SHOOT PLAN',
        'Scenario: A bus stop in the rain, one umbrella left.',
        'Cast:',
        '- Ana: a nurse heading home after a night shift. 20s, yellow raincoat, short hair.',
        '- Ben: a delivery rider on a break. 20s, green rider jacket, helmet under his arm.',
        'Record with sound on. What people say and the natural sound go into the video.',
        'Locations:',
        '- Bus stop, rainy night (scenes 1, 2, 3)',
        '- Apartment hallway (scenes 4, 5)',
        'Props:',
        '- Umbrella',
        '- Keys',
        '',
        'SHOT LIST',
        '1. Hook (0:00–0:04)',
        '   Ana: "Uy, akin ’yan!"',
        '   Sound: rain on the shelter roof',
        '   Shot: Two hands grab one umbrella',
        '   Frame: Medium · Cast on camera · Bus stop, rainy night',
        '   Props: Umbrella',
        '2. Setup (0:04–0:12)',
        '   Ben: "Nauna ako dito."',
        '   Frame: Medium · Hands only · Bus stop, rainy night',
        '3. Build-up (0:12–0:21)',
        '   Ana: "Night shift ako, pagod na ako."',
        '   Frame: Medium · Cast on camera · Bus stop, rainy night',
        '4. Turn (0:21–0:31)',
        '   Ben: "Teka, Unit 4B ka?"',
        '   Frame: Medium · No one in frame · Apartment hallway',
        '   Props: Keys',
        '   Transition: Whip',
        '5. Cliffhanger (0:31–0:38)',
        '   Ana: "Bakit may susi ka ng unit ko?"',
        '   Frame: Medium · Cast on camera · Apartment hallway',
        '',
        'CAPTION',
        'Sino ang panalo?',
        '',
        'BEFORE YOU FILM AND POST',
        '- Get permission from everyone who appears.',
        '- Fake fights and stunts with angles and cuts. Never film real danger.',
        '- Label AI-generated scenes if your platform asks for it.',
        'These are reminders, not a compliance check. The final review is yours.',
        '',
      ].join('\n'),
    );
    for (const affiliateLine of [
      'Product:',
      'Link:',
      'Angle:',
      'APPROVED FACTS USED',
      'BEFORE YOU POST\n',
    ]) {
      expect(result.text).not.toContain(affiliateLine);
    }
  });

  it('builds a narrated story brief with the narration and no live-sound note', async () => {
    const approved = version(
      ContentStyle.NARRATION,
      [
        scene(1, ScenePurpose.HOOK, 5, {
          narration: 'One umbrella. Two strangers. Zero patience.',
          visual: 'Two hands grab one umbrella',
          direction: frame(ShotSubject.CREATOR, 'Bus stop, rainy night'),
        }),
        scene(2, ScenePurpose.SETUP, 6, {
          narration: 'Ana just finished a night shift.',
          direction: frame(ShotSubject.PRODUCT_ONLY, 'Empty street, rain'),
        }),
        scene(3, ScenePurpose.PAYOFF, 6, {
          narration: 'Then Ben pulls out a key to her door.',
          onScreenText: 'Part 2?',
        }),
      ],
      ScriptLanguage.ENGLISH,
    );
    const record = project(Storytelling.NARRATED, ScriptLanguage.ENGLISH);
    (record.story as { premise: { title: string } }).premise.title =
      'The Umbrella Standoff';

    const { result } = await brief(record, approved);

    expect(result.text).toContain(
      [
        'THE UMBRELLA STANDOFF',
        'Genre: Action · Narrated',
        "Premise: The Umbrella Standoff. Two strangers fight over the last umbrella at a bus stop, then find out they're neighbours.",
        'Format: English · 45 s',
        'Script: v1, approved 26 Sep 2026',
      ].join('\n'),
    );
    expect(result.text).toContain(
      [
        'SHOOT PLAN',
        'Scenario: A bus stop in the rain, one umbrella left.',
        'Cast:',
        '- Ana: a nurse heading home after a night shift. 20s, yellow raincoat, short hair.',
        '- Ben: a delivery rider on a break. 20s, green rider jacket, helmet under his arm.',
        'Locations:',
      ].join('\n'),
    );
    expect(result.text).toContain(
      [
        'SHOT LIST',
        '1. Hook (0:00–0:05)',
        '   Say: One umbrella. Two strangers. Zero patience.',
        '   Shot: Two hands grab one umbrella',
        '   Frame: Medium · Cast on camera · Bus stop, rainy night',
        '2. Setup (0:05–0:11)',
        '   Say: Ana just finished a night shift.',
        '   Frame: Medium · No one in frame · Empty street, rain',
        '3. Cliffhanger (0:11–0:17)',
        '   Say: Then Ben pulls out a key to her door.',
        '   Text: Part 2?',
      ].join('\n'),
    );
    expect(result.text).not.toContain('Record with sound on.');
    expect(result.text).not.toContain('APPROVED FACTS USED');
    expect(result.text).toMatch(
      /BEFORE YOU FILM AND POST\n- Get permission from everyone who appears\.\n- Fake fights and stunts with angles and cuts\. Never film real danger\.\n- Label AI-generated scenes if your platform asks for it\.\nThese are reminders, not a compliance check\. The final review is yours\.\n$/,
    );
  });

  it('writes each character as a sentence and a narrated story with no cast as narrator only', () => {
    expect(
      storyCastLines(
        [
          { name: 'Ana', role: 'a nurse.', look: '' },
          { name: 'Ben', role: '', look: '' },
        ],
        true,
      ),
    ).toEqual(['Cast:', '- Ana: a nurse.', '- Ben']);
    expect(storyCastLines([], false)).toEqual([
      'Cast: Nobody. The narrator tells the story over the scenes.',
    ]);
  });
});
