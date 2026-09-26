import {
  ContentStyle,
  HookType,
  ScenePurpose,
  SceneTransition,
  ShotFraming,
  ShotSubject,
  StoryGenre,
  Storytelling,
  StudioType,
} from 'src/graphql/generated/graphql';
import type { ProjectRecord } from '../projects/repositories/projects.repository';
import {
  ACTED_STORY_RULES,
  GENRE_NOTES,
  STORY_ENDING_RULE,
  STORY_RULES,
} from '../studios/story';
import { STUDIOS } from '../studios/studios';
import type { ScriptSceneRecord } from './repositories/scripts.repository';
import { SCRIPT_STUDIOS } from './script-studios';
import {
  allowHookTypes,
  allowPurposes,
  coerceDraft,
  endOnLastScene,
  type WritingContext,
} from './script-writing';

const studio = STUDIOS[StudioType.ENTERTAINMENT];
const scripts = SCRIPT_STUDIOS[StudioType.ENTERTAINMENT];

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

function storyProject(
  story: Partial<NonNullable<ProjectRecord['story']>> = {},
): ProjectRecord {
  return {
    id: 'p'.repeat(24),
    title: 'The Umbrella Standoff',
    studioType: StudioType.ENTERTAINMENT,
    approvedFacts: [],
    strategy: { platform: 'TIKTOK_SHOP', tone: 'FRIENDLY' },
    story: {
      genre: StoryGenre.COMEDY,
      premise: {
        kind: 'OWN',
        suggestionId: null,
        title: 'The Umbrella Standoff',
        logline:
          "Two strangers fight over the last umbrella at a bus stop, then find out they're neighbours.",
      },
      cast,
      storytelling: Storytelling.ACTED,
      language: 'TAGLISH',
      lengthSeconds: 45,
      ...story,
    },
  } as unknown as ProjectRecord;
}

const direction = {
  inFrame: ShotSubject.CREATOR,
  framing: ShotFraming.MEDIUM,
  setting: 'Bus stop, rainy night',
  props: ['Umbrella'],
};

function actedScene(purpose: ScenePurpose, text: string) {
  return {
    purpose,
    durationSeconds: 6,
    narration: '',
    onScreenText: '',
    visual: 'Ana reaches for the umbrella',
    direction,
    transitionIn: SceneTransition.CUT,
    lines: [
      {
        speaker: 'Ana',
        shot: 'close-up on Ana',
        reaction: 'freezes',
        pauseSeconds: 1,
        delivery: 'deadpan',
        text,
      },
    ],
    sound: 'rain on the roof',
  };
}

describe('story scripts: prompts', () => {
  it('writes an acted story from the story, its rules and the story values, with no product clauses', () => {
    const context = scripts.context(storyProject());
    const [system, user] = scripts.script(context, studio).messages;

    expect(context.strategy.contentStyle).toBe(ContentStyle.SKIT);
    for (const rule of [
      STORY_RULES,
      ACTED_STORY_RULES,
      'Characters are fictional and are called only by their cast names',
      'No line reads like a testimonial or a review',
      'There is no narrator: set "narration" to an empty string',
      '"speaker" is a first name from the cast',
      'Act every line out as a beat',
      '"pauseSeconds" is how long that reaction holds',
      "The first scene is the HOOK scene and opens with the first hook: its first line says that hook's text word for word",
      'natural Taglish',
      'about 45 seconds',
      'HOOK (the opening that makes viewers stay), SETUP (who, where and what they want), BUILD (the trouble grows), TURN (the surprise or the choice), PAYOFF (the cliffhanger: the moment the story built to, with something left open)',
      STORY_ENDING_RULE,
      'COLD_OPEN (opens in the middle of the action), FLASH_FORWARD (shows a moment from the end first), QUESTION',
      'MYSTERY (opens on something the viewer needs explained)',
    ]) {
      expect(system.content).toContain(rule);
    }
    for (const productClause of [
      'approved fact',
      'affiliate',
      'CALL_TO_ACTION',
      'call to action',
      'The product is part of the story',
      '"claims"',
      '"factIds"',
      'DEMO',
    ]) {
      expect(system.content).not.toContain(productClause);
    }
    expect(JSON.parse(user.content)).toEqual({
      genre: 'Comedy',
      genreNote: GENRE_NOTES[StoryGenre.COMEDY],
      premise: {
        title: 'The Umbrella Standoff',
        logline:
          "Two strangers fight over the last umbrella at a bus stop, then find out they're neighbours.",
      },
      cast: cast.map(({ name, role, look }) => ({ name, role, look })),
      storytelling: 'ACTED',
      language: 'TAGLISH',
      targetLengthSeconds: 45,
    });
  });

  it('writes a narrated story in the narrated style with no lines and no facts', () => {
    const context = scripts.context(
      storyProject({
        storytelling: Storytelling.NARRATED,
        genre: StoryGenre.ACTION,
        language: 'ENGLISH' as never,
        lengthSeconds: 60,
        cast: [],
      }),
    );
    const request = scripts.script(context, studio);
    const system = request.messages[0].content;

    expect(context.strategy.contentStyle).toBe(ContentStyle.NARRATION);
    expect(context.facts).toEqual([]);
    expect(system).toContain('A narrator tells the story over the scenes');
    expect(system).toContain(
      "The first scene is the HOOK scene and opens with the first hook: its narration is that hook's text word for word",
    );
    expect(system).toContain("Each scene's narration must be sayable");
    expect(system).not.toContain('Act every line out as a beat');
    expect(JSON.stringify(request.schema)).not.toContain('"lines"');
  });

  it('gives the model only story values and no product fields', () => {
    const request = scripts.script(scripts.context(storyProject()), studio);
    const schema = request.schema as {
      properties: {
        shoot: { required: string[] };
        hooks: { items: { properties: { type: { enum: string[] } } } };
        scenes: {
          items: {
            required: string[];
            properties: { purpose: { enum: string[] } };
          };
        };
      };
    };
    const text = JSON.stringify(schema);

    expect(schema.properties.scenes.items.properties.purpose.enum).toEqual(
      studio.scenePurposes,
    );
    expect(schema.properties.hooks.items.properties.type.enum).toEqual(
      studio.hookTypes,
    );
    expect(schema.properties.scenes.items.required).toEqual(
      expect.arrayContaining(['lines', 'sound']),
    );
    // The model may name the cast; the server writes the presenter from it.
    expect(schema.properties.shoot.required).toEqual(['scenario', 'presenter']);
    for (const field of ['"claims"', '"factIds"', '"cta"']) {
      expect(text).not.toContain(field);
    }
  });

  it('ends every story on a cliffhanger, and never an Affiliate script (R29)', () => {
    const narrated = scripts.context(
      storyProject({ storytelling: Storytelling.NARRATED }),
    );
    const product = (contentStyle: ContentStyle) =>
      ({
        product: { title: 'Blender', category: null, description: null },
        facts: [{ id: 'f1', text: 'Holds 380 ml' }],
        strategy: {
          buyer: 'Commuters',
          problem: null,
          benefit: null,
          platform: 'TIKTOK_SHOP',
          language: 'ENGLISH',
          lengthSeconds: 30,
          tone: 'FRIENDLY',
          contentStyle,
          angle: 'Breakfast on the go',
        },
      }) as unknown as WritingContext;
    const affiliate = STUDIOS[StudioType.AFFILIATE];
    const affiliateScripts = SCRIPT_STUDIOS[StudioType.AFFILIATE];
    const scene = {
      id: 's1',
      order: 1,
      purpose: ScenePurpose.CALL_TO_ACTION,
      durationSeconds: 4,
      narration: 'Tap the link.',
      onScreenText: '',
      visual: '',
      cta: 'Tap the link',
      factIds: [],
      reportedClaims: [],
    } as ScriptSceneRecord;

    expect(scripts.script(narrated, studio).messages[0].content).toContain(
      STORY_ENDING_RULE,
    );
    for (const style of Object.values(ContentStyle)) {
      const prompts = [
        affiliateScripts.script(product(style), affiliate),
        affiliateScripts.hook(product(style), affiliate, [], 'Hook'),
        affiliateScripts.scene(
          product(style),
          affiliate,
          [scene],
          scene,
          null,
          null,
        ),
      ].map((request) => JSON.stringify(request.messages));

      for (const prompt of prompts) {
        expect(prompt).not.toContain('cliffhanger');
      }
    }
  });

  it('rewrites a story hook and scene with the story rules and values', () => {
    const context = scripts.context(storyProject());
    const hook = scripts.hook(context, studio, ['Akin ’to!'], 'Uy, akin ’yan!');
    const current = {
      id: 's2',
      order: 2,
      purpose: ScenePurpose.TURN,
      durationSeconds: 6,
      narration: '',
      lines: [{ speaker: 'Ben', text: 'Kapitbahay kita?' }],
      sound: null,
      onScreenText: '',
      visual: '',
      cta: null,
      factIds: [],
      reportedClaims: [],
    } as ScriptSceneRecord;
    const scene = scripts.scene(
      context,
      studio,
      [current],
      current,
      { scenario: 'A bus stop in the rain.', presenter: 'Ana; Ben' },
      null,
    );

    expect(hook.messages[0].content).toContain(STORY_RULES);
    expect(hook.messages[0].content).toContain(
      'Give it a "type" from: COLD_OPEN',
    );
    expect(hook.messages[0].content).toContain("the story's opening line");
    expect(JSON.stringify(hook.schema)).not.toContain('"claims"');
    expect(scene.messages[0].content).toContain(
      'Keep its purpose (TURN: the surprise or the choice)',
    );
    expect(scene.messages[0].content).toContain(STORY_RULES);
    expect(scene.messages[0].content).not.toContain('approved fact');
    expect(JSON.parse(scene.messages[2].content).sceneToRewrite).toMatchObject({
      purpose: 'TURN',
      lines: [{ speaker: 'Ben', text: 'Kapitbahay kita?' }],
    });
  });
});

describe('story scripts: coercion', () => {
  it('keeps only story purposes and hook types, empties claims and writes the cast as the presenter', () => {
    const context = scripts.context(storyProject());
    const draft = scripts.script(context, studio).parse({
      shoot: {
        scenario: 'A bus stop in the rain, one umbrella left.',
        presenter: 'Someone the model made up',
      },
      hooks: [
        {
          type: HookType.COLD_OPEN,
          text: 'Uy, akin ’yan!',
          openingShot: 'Two hands on one umbrella',
          claims: ['the best umbrella'],
        },
        {
          type: HookType.DIRECT_PITCH,
          text: 'Isang payong, dalawang tao.',
          openingShot: 'Wide on the bus stop',
        },
        {
          type: HookType.MYSTERY,
          text: 'Bakit may dalawang susi?',
          openingShot: 'Keys on the bench',
        },
      ],
      scenes: [
        actedScene(ScenePurpose.HOOK, 'Uy, akin ’yan!'),
        actedScene(ScenePurpose.SETUP, 'Late na ako.'),
        actedScene(ScenePurpose.DEMO, 'Ang kulit mo.'),
        actedScene(ScenePurpose.TURN, 'Kapitbahay kita?'),
        actedScene(ScenePurpose.PAYOFF, 'Share tayo?'),
      ],
      caption: 'Sino ang panalo?',
    });

    expect(draft).not.toBeNull();

    const coerced = coerceDraft(
      draft as NonNullable<typeof draft>,
      studio,
      new Set(),
      true,
    );

    expect(coerced?.scenes.map((scene) => scene.purpose)).toEqual([
      ScenePurpose.HOOK,
      ScenePurpose.SETUP,
      ScenePurpose.BUILD,
      ScenePurpose.TURN,
      ScenePurpose.PAYOFF,
    ]);
    expect(coerced?.hooks.map((hook) => hook.type)).toEqual([
      HookType.COLD_OPEN,
      HookType.FLASH_FORWARD,
      HookType.MYSTERY,
    ]);
    expect(
      coerced?.hooks.flatMap((hook) => hook.reportedClaims) ?? ['x'],
    ).toEqual([]);
    for (const scene of coerced?.scenes ?? []) {
      expect(scene).toMatchObject({
        cta: null,
        factIds: [],
        reportedClaims: [],
      });
      expect(studio.scenePurposes).toContain(scene.purpose);
    }
    expect(coerced?.shoot).toEqual({
      scenario: 'A bus stop in the rain, one umbrella left.',
      presenter:
        'Ana, a nurse heading home after a night shift, 20s, yellow raincoat, short hair; Ben, a delivery rider on a break, 20s, green rider jacket, helmet under his arm',
    });
  });

  it('clips a long cast to the presenter limit', () => {
    const long = cast.map((character) => ({
      ...character,
      role: `${character.role}, ${'x'.repeat(40)}`,
    }));
    const context = scripts.context(storyProject({ cast: long }));
    const draft = scripts.script(context, studio).parse({
      shoot: { scenario: 'A bus stop.' },
      hooks: [1, 2, 3].map(() => ({
        type: HookType.QUESTION,
        text: 'Sino?',
        openingShot: '',
      })),
      scenes: [1, 2, 3].map(() => actedScene(ScenePurpose.SETUP, 'Oo')),
      caption: '',
    });

    // Cut at the last word that fits the presenter limit.
    expect(draft?.shoot.presenter?.length).toBeLessThanOrEqual(160);
    expect(draft?.shoot.presenter?.endsWith('…')).toBe(true);
  });

  it('corrects a story ending on a turn and an earlier cliffhanger instead of failing (R29)', () => {
    const context = scripts.context(storyProject());
    const draft = scripts.script(context, studio).parse({
      shoot: { scenario: 'A bus stop in the rain.' },
      hooks: [HookType.COLD_OPEN, HookType.MYSTERY, HookType.QUESTION].map(
        (type) => ({ type, text: 'Akin ’yan!', openingShot: 'Hands' }),
      ),
      scenes: [
        actedScene(ScenePurpose.HOOK, 'Akin ’yan!'),
        actedScene(ScenePurpose.PAYOFF, 'Kapitbahay pala kita.'),
        actedScene(ScenePurpose.BUILD, 'Ang kulit mo.'),
        actedScene(ScenePurpose.TURN, 'Share na lang tayo.'),
      ],
      caption: '',
    });

    expect(
      coerceDraft(
        draft as NonNullable<typeof draft>,
        studio,
        new Set(),
        true,
      )?.scenes.map((scene) => scene.purpose),
    ).toEqual([
      ScenePurpose.HOOK,
      ScenePurpose.TURN,
      ScenePurpose.BUILD,
      ScenePurpose.PAYOFF,
    ]);

    // A studio without an ending rule keeps its purposes as written.
    const scenes = [
      { purpose: ScenePurpose.HOOK, cta: null },
      { purpose: ScenePurpose.PROOF, cta: null },
    ];
    expect(
      endOnLastScene(scenes, STUDIOS[StudioType.AFFILIATE].lastScene),
    ).toBe(scenes);
  });

  it('keeps a studio’s own values exactly as written', () => {
    const affiliate = STUDIOS[StudioType.AFFILIATE];
    const scenes = [
      { purpose: ScenePurpose.HOOK },
      { purpose: ScenePurpose.DEMO },
      { purpose: ScenePurpose.CALL_TO_ACTION },
    ];
    const hooks = [
      { type: HookType.QUESTION },
      { type: HookType.DIRECT_PITCH },
    ];

    expect(allowPurposes(scenes, affiliate.scenePurposes)).toEqual(scenes);
    expect(allowPurposes(scenes, affiliate.scenePurposes)[1]).toBe(scenes[1]);
    expect(allowHookTypes(hooks, affiliate.hookTypes)).toEqual(hooks);
    // Another studio's value is corrected by the scene's place.
    expect(
      allowPurposes(
        [...scenes, { purpose: ScenePurpose.PAYOFF }],
        affiliate.scenePurposes,
      )[3].purpose,
    ).toBe(ScenePurpose.CALL_TO_ACTION);
  });

  it('refuses a story draft that is missing its scenes', () => {
    const context = scripts.context(storyProject());

    expect(
      scripts.script(context, studio).parse({
        shoot: { scenario: 'x' },
        hooks: [],
        scenes: [],
        caption: '',
      }),
    ).toBeNull();
  });
});
