import {
  ContentStyle,
  ScenePurpose,
  SceneTransition,
  ShotFraming,
  ShotSubject,
} from 'src/graphql/generated/graphql';
import {
  SKIT_SOUND_NOTE,
  SKIT_TIMING_NOTE,
  sceneTransitionLines,
  shootPlanLines,
  spokenLines,
} from './creator-brief.service';
import type {
  ScriptSceneRecord,
  ScriptVersionRecord,
} from './repositories/scripts.repository';
import {
  coerceLines,
  coerceScene,
  coerceShoot,
  fitDuration,
  joinProps,
  lineTimeline,
  narrationSeconds,
  readLine,
  normalizeTransitions,
  SCRIPT_SCHEMA,
  SKIT_SCRIPT_SCHEMA,
  sceneRewriteMessages,
  scriptMessages,
  scriptOutput,
  skitScriptOutput,
  spokenSeconds,
  spokenText,
} from './script-writing';

const sceneOutput = {
  purpose: ScenePurpose.HOOK,
  durationSeconds: 4,
  narration: 'Late ka na naman sa breakfast?',
  onScreenText: 'Breakfast, pero portable',
  visual: 'Hand pulling the blender out of a tote bag.',
  direction: {
    inFrame: ShotSubject.HANDS,
    framing: ShotFraming.CLOSE_UP,
    setting: '  Bus stop,   early morning ',
    props: ['Tote bag', 'tote bag', 'Keys, lanyard', '', 'Phone', 'Umbrella'],
  },
  transitionIn: SceneTransition.WHIP,
  cta: null,
  factIds: [],
  claims: [],
};

function scene(overrides: Partial<ScriptSceneRecord>): ScriptSceneRecord {
  return {
    id: 's',
    order: 1,
    purpose: ScenePurpose.HOOK,
    durationSeconds: 4,
    narration: 'Line',
    onScreenText: '',
    visual: '',
    cta: null,
    factIds: [],
    reportedClaims: [],
    ...overrides,
  };
}

describe('script writing: shot direction', () => {
  it('rebuilds scene direction from model output', () => {
    expect(coerceScene(sceneOutput, 1, new Set())?.direction).toEqual({
      inFrame: ShotSubject.HANDS,
      framing: ShotFraming.CLOSE_UP,
      setting: 'Bus stop, early morning',
      props: 'Tote bag, Keys lanyard, Phone, Umbrella',
    });
  });

  it('keeps props to four distinct items without commas inside them', () => {
    expect(joinProps(['A', 'b', 'a', 'C, D', 'E', 'F'])).toBe('A, b, C D, E');
  });

  it('rejects direction values outside the allowlist', () => {
    const parsed = scriptOutput.safeParse({
      shoot: { scenario: 'Late for work.', presenter: null },
      hooks: [],
      scenes: [
        {
          ...sceneOutput,
          direction: { ...sceneOutput.direction, inFrame: 'AI_AVATAR' },
        },
      ],
      caption: '',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects transition values outside the allowlist', () => {
    const parsed = scriptOutput.safeParse({
      shoot: { scenario: 'Late for work.', presenter: null },
      hooks: [],
      scenes: [{ ...sceneOutput, transitionIn: 'SPIN' }],
      caption: '',
    });

    expect(parsed.success).toBe(false);
  });

  it('drops an empty shoot plan and a blank presenter', () => {
    expect(coerceShoot({ scenario: '  ', presenter: 'Someone' })).toBeNull();
    expect(coerceShoot({ scenario: 'Late for work.', presenter: ' ' })).toEqual(
      { scenario: 'Late for work.', presenter: null },
    );
  });
});

describe('script writing: scene length follows narration', () => {
  const words = (count: number) =>
    Array.from({ length: count }, (_, index) => `salita${index}`).join(' ');

  it('lengthens a generated scene its narration cannot fit, within 15 s', () => {
    // 22 words take 9 s at 2.5 words per second.
    expect(
      coerceScene(
        { ...sceneOutput, durationSeconds: 4, narration: words(22) },
        1,
        new Set(),
      )?.durationSeconds,
    ).toBe(9);
    expect(fitDuration(4, words(60))).toBe(15);
  });

  it('keeps a generated scene that is longer than its narration', () => {
    expect(fitDuration(8, words(10))).toBe(8);
    expect(narrationSeconds(words(10))).toBe(4);
  });

  it('gives the word budget in writes and rewrites', () => {
    const context = {
      product: { title: 'Blender', category: null, description: null },
      facts: [],
      strategy: {
        buyer: null,
        problem: null,
        benefit: null,
        platform: 'TIKTOK_SHOP',
        language: 'ENGLISH',
        lengthSeconds: 30,
        tone: 'FRIENDLY',
        contentStyle: 'VOICEOVER_PRODUCT_SHOTS',
        angle: null,
      },
    } as unknown as Parameters<typeof scriptMessages>[0];
    const rule = 'a 4-second scene has at most 10 words';

    expect(scriptMessages(context)[0].content).toContain(rule);
    expect(
      sceneRewriteMessages(context, [], scene({}), null)[0].content,
    ).toContain(rule);
  });
});

describe('creator brief: shoot plan', () => {
  const direction = (setting: string, props: string) => ({
    inFrame: ShotSubject.HANDS,
    framing: ShotFraming.MEDIUM,
    setting,
    props,
  });

  it('lists each location with its scenes and each prop once', () => {
    const scenes = [
      scene({ direction: direction('Bus stop', 'Tote bag') }),
      scene({ direction: direction('Office desk', 'Banana, tote bag') }),
      scene({ direction: direction('bus stop', '') }),
    ];
    const lines = shootPlanLines(
      {
        shoot: { scenario: 'Late for work.', presenter: null },
      } as ScriptVersionRecord,
      scenes,
    );

    expect(lines).toEqual([
      'SHOOT PLAN',
      'Scenario: Late for work.',
      'On camera: Nobody. Hands and product only.',
      'Locations:',
      '- Bus stop (scenes 1, 3)',
      '- Office desk (scene 2)',
      'Props:',
      '- Tote bag',
      '- Banana',
      '',
    ]);
  });

  it('leaves the section out for a version written before shot direction', () => {
    expect(
      shootPlanLines({ shoot: null } as ScriptVersionRecord, [scene({})]),
    ).toEqual([]);
  });
});

describe('script writing: scene transitions', () => {
  const scenes = (...transitions: SceneTransition[]) =>
    transitions.map((transitionIn, index) =>
      scene({ id: `s${index + 1}`, order: index + 1, transitionIn }),
    );

  it('forces the opening scene to Cut', () => {
    expect(
      normalizeTransitions(scenes(SceneTransition.WHIP, SceneTransition.CUT))[0]
        .transitionIn,
    ).toBe(SceneTransition.CUT);
  });

  it('keeps only the first Whip and the first Dissolve', () => {
    expect(
      normalizeTransitions(
        scenes(
          SceneTransition.CUT,
          SceneTransition.WHIP,
          SceneTransition.CUT,
          SceneTransition.WHIP,
          SceneTransition.DISSOLVE,
          SceneTransition.CUT,
          SceneTransition.DISSOLVE,
        ),
      ).map((item) => item.transitionIn),
    ).toEqual([
      SceneTransition.CUT,
      SceneTransition.WHIP,
      SceneTransition.CUT,
      SceneTransition.CUT,
      SceneTransition.DISSOLVE,
      SceneTransition.CUT,
      SceneTransition.CUT,
    ]);
  });

  it('changes consecutive non-cuts to Cut', () => {
    expect(
      normalizeTransitions(
        scenes(
          SceneTransition.CUT,
          SceneTransition.PUNCH_IN,
          SceneTransition.DISSOLVE,
        ),
      ).map((item) => item.transitionIn),
    ).toEqual([
      SceneTransition.CUT,
      SceneTransition.PUNCH_IN,
      SceneTransition.CUT,
    ]);
  });

  it('cuts a rewritten scene between two unchanged non-cuts', () => {
    const result = normalizeTransitions(
      scenes(
        SceneTransition.WHIP,
        SceneTransition.PUNCH_IN,
        SceneTransition.DISSOLVE,
      ),
      's2',
    );

    expect(result[1].transitionIn).toBe(SceneTransition.CUT);
    expect(result[2].transitionIn).toBe(SceneTransition.DISSOLVE);
  });
});

describe('creator brief: scene transitions', () => {
  it('prints a non-cut transition after the opening scene', () => {
    expect(
      sceneTransitionLines({ transitionIn: SceneTransition.WHIP }, 1),
    ).toEqual(['   Transition: Whip']);
  });

  it('keeps legacy, Cut and opening scenes unchanged', () => {
    expect(sceneTransitionLines({}, 1)).toEqual([]);
    expect(
      sceneTransitionLines({ transitionIn: SceneTransition.CUT }, 1),
    ).toEqual([]);
    expect(
      sceneTransitionLines({ transitionIn: SceneTransition.DISSOLVE }, 0),
    ).toEqual([]);
  });
});

describe('script writing: suggested visual', () => {
  // R23: a visual that says how the shot opens and ends reads as a move
  // between two photos and tells the creator where the shot lands.
  it('asks for each shot from how it opens to how it ends, in writes and rewrites', () => {
    const context = {
      product: { title: 'Blender', category: '', description: '' },
      facts: [],
      strategy: {
        buyer: '',
        problem: '',
        benefit: '',
        platform: 'TIKTOK_SHOP',
        language: 'ENGLISH',
        lengthSeconds: 30,
        tone: 'FRIENDLY',
        contentStyle: 'VOICEOVER_PRODUCT_SHOTS',
        angle: null,
      },
    } as unknown as Parameters<typeof scriptMessages>[0];
    const scene = {
      id: 's1',
      order: 1,
      purpose: 'HOOK',
      durationSeconds: 4,
      narration: 'Hi',
    } as unknown as Parameters<typeof sceneRewriteMessages>[2];

    for (const messages of [
      scriptMessages(context),
      sceneRewriteMessages(context, [scene], scene, null),
    ]) {
      expect(messages[0].content).toContain('from how it opens to how it ends');
    }
  });
});

describe('script writing: skits', () => {
  const words = (count: number) =>
    Array.from({ length: count }, (_, index) => `salita${index}`).join(' ');
  const context = (contentStyle: ContentStyle) =>
    ({
      product: { title: 'Sandals', category: null, description: null },
      facts: [],
      strategy: {
        buyer: null,
        problem: null,
        benefit: null,
        platform: 'TIKTOK_SHOP',
        language: 'TAGLISH',
        lengthSeconds: 30,
        tone: 'FRIENDLY',
        contentStyle,
        angle: null,
      },
    }) as unknown as Parameters<typeof scriptMessages>[0];
  const skitScene = {
    ...sceneOutput,
    narration: 'A narrator line the model should not have written.',
    lines: [
      { speaker: '  Ben ', text: "Uy,   bago 'yan ah?" },
      { speaker: 'Ana', text: '   ' },
      { speaker: 'Ana', text: 'x'.repeat(170) },
      { speaker: 'Ben', text: 'Three' },
      { speaker: 'Ana', text: 'Four' },
    ],
    sound: '  sandals slapping on the pavement  ',
  };

  it('writes skits with their own rules and leaves narrated prompts as they were', () => {
    const narrated = scriptMessages(
      context(ContentStyle.VOICEOVER_PRODUCT_SHOTS),
    )[0].content;
    const skit = scriptMessages(context(ContentStyle.SKIT))[0].content;

    expect(narrated).not.toMatch(/skit/i);
    expect(narrated).toContain(
      '"presenter" describes who appears on camera (who they are, and what they wear) or is null when nobody does.',
    );
    expect(narrated).toContain(
      "Each scene's narration must be sayable within its durationSeconds",
    );
    for (const rule of [
      'This video is a skit, not an ad',
      'There is no narrator: set "narration" to an empty string',
      '"presenter" names the cast: 1 to 3 people',
      "Each hook is the skit's opening line, said out loud on camera by someone in the cast",
      "The first scene is the HOOK scene and opens with the first hook: its first line says that hook's text word for word",
      'No character says they have used the product before',
      'Act every line out as a beat',
      '"reaction" is what the speaker does silently just before speaking',
      '"pauseSeconds" is how long that reaction holds before the first word',
      '"delivery" is the speaker\'s facial expression and voice',
      '"shot" is where the camera is for the beat',
      'Keep the acting natural, never theatrical',
      "Each scene's lines and pauses, all of them together, must fit",
    ]) {
      expect(skit).toContain(rule);
    }
    expect(narrated).not.toContain('"reaction"');
    expect(narrated).toContain(
      'Each hook\'s "text" is the narrator\'s opening line, said out loud',
    );
    expect(narrated).toContain(
      "The first scene is the HOOK scene and opens with the first hook: its narration is that hook's text word for word, and its visual is that hook's opening shot.",
    );
    expect(SCRIPT_SCHEMA.properties.scenes.items.required).not.toContain(
      'lines',
    );
    expect(SKIT_SCRIPT_SCHEMA.properties.scenes.items.required).toEqual(
      expect.arrayContaining(['lines', 'sound']),
    );
    // The beat is written before the line, so the line answers the reaction.
    expect(
      SKIT_SCRIPT_SCHEMA.properties.scenes.items.properties.lines.items
        .required,
    ).toEqual([
      'speaker',
      'shot',
      'reaction',
      'pauseSeconds',
      'delivery',
      'text',
    ]);
  });

  it('gives a skit rewrite the lines around it and leaves a narrated rewrite unchanged', () => {
    const current = scene({
      narration: '',
      lines: [{ speaker: 'Ana', text: 'Oo!' }],
      sound: 'Footsteps',
    });
    const payload = (style: ContentStyle) =>
      JSON.parse(
        sceneRewriteMessages(context(style), [current], current, null)[2]
          .content,
      ) as {
        script: Record<string, unknown>[];
        sceneToRewrite: Record<string, unknown>;
      };

    expect(payload(ContentStyle.SKIT).sceneToRewrite).toMatchObject({
      lines: [{ speaker: 'Ana', text: 'Oo!' }],
      sound: 'Footsteps',
    });
    expect(payload(ContentStyle.SKIT).script[0].lines).toHaveLength(1);
    expect(
      Object.keys(payload(ContentStyle.HANDS_ON_DEMO).sceneToRewrite),
    ).toEqual(['purpose', 'narration', 'onScreenText']);
    expect(Object.keys(payload(ContentStyle.HANDS_ON_DEMO).script[0])).toEqual([
      'purpose',
      'narration',
      'transitionIn',
    ]);
  });

  it('tells a rewrite of scene 1 to keep the chosen hook', () => {
    const current = scene({
      narration: '',
      lines: [{ speaker: 'Ana', text: 'Oo!' }],
    });
    const messages = sceneRewriteMessages(
      context(ContentStyle.SKIT),
      [current],
      current,
      null,
      "Uy, bago 'yan?",
    );

    expect(messages[0].content).toContain(
      'This scene opens the video with the chosen hook ("openingHook"): keep its first line\'s text exactly as that hook reads.',
    );
    expect(JSON.parse(messages[2].content).openingHook).toBe("Uy, bago 'yan?");
    expect(
      sceneRewriteMessages(
        context(ContentStyle.SKIT),
        [current],
        current,
        null,
      )[0].content,
    ).not.toContain('openingHook');
  });

  it('keeps a skit scene without narration: lines cleaned and capped, sound clipped', () => {
    const coerced = coerceScene(skitScene, 1, new Set(), 's1', true);

    const none = { shot: '', reaction: '', pauseSeconds: 0, delivery: '' };

    expect(coerced?.narration).toBe('');
    expect(coerced?.lines).toEqual([
      { speaker: 'Ben', text: "Uy, bago 'yan ah?", ...none },
      { speaker: 'Ana', text: 'x'.repeat(160), ...none },
      { speaker: 'Ben', text: 'Three', ...none },
    ]);
    expect(coerced?.sound).toBe('sandals slapping on the pavement');
    expect(
      coerceScene({ ...skitScene, sound: '   ' }, 1, new Set(), 's1', true)
        ?.sound,
    ).toBeNull();
  });

  it('fits a skit scene to its lines, and keeps one with only sound or text', () => {
    // 22 words take 9 s at 2.5 words per second.
    expect(
      coerceScene(
        {
          ...skitScene,
          durationSeconds: 4,
          lines: [
            { speaker: 'Ana', text: words(12) },
            { speaker: 'Ben', text: words(10) },
          ],
        },
        1,
        new Set(),
        's1',
        true,
      )?.durationSeconds,
    ).toBe(9);
    expect(
      coerceScene(
        { ...skitScene, lines: [], onScreenText: '' },
        1,
        new Set(),
        's1',
        true,
      ),
    ).toMatchObject({ lines: [], sound: 'sandals slapping on the pavement' });
    expect(
      coerceScene(
        { ...skitScene, lines: [], sound: null, onScreenText: '' },
        1,
        new Set(),
        's1',
        true,
      ),
    ).toBeNull();
    // A narrated scene still needs its narration, and never gains lines.
    expect(
      coerceScene({ ...sceneOutput, narration: ' ' }, 1, new Set()),
    ).toBeNull();
    expect(coerceScene(skitScene, 1, new Set())).not.toHaveProperty('lines');
  });

  it('counts lines as spoken and reads skit output through the skit schema only', () => {
    expect(
      spokenText({
        narration: '',
        lines: [{ text: 'Uy, bago?' }, { text: 'Oo!' }],
      }),
    ).toBe('Uy, bago? Oo!');
    expect(
      spokenSeconds([
        spokenText({ narration: '', lines: [{ text: words(25) }] }),
      ]),
    ).toBe(10);

    const draft = {
      shoot: { scenario: 'Ana walks to the jeepney stop.', presenter: 'Ana' },
      hooks: [0, 1, 2].map(() => ({
        type: 'QUESTION',
        text: "Uy, bago 'yan?",
        openingShot: 'Ben points at her feet.',
        claims: [],
      })),
      scenes: [skitScene, skitScene, skitScene],
      caption: '',
    };
    expect(skitScriptOutput.safeParse(draft).success).toBe(true);
    expect(
      skitScriptOutput.safeParse({
        ...draft,
        scenes: draft.scenes.map(({ lines: _lines, ...rest }) => rest),
      }).success,
    ).toBe(false);
  });
});

describe('script writing: skit beats', () => {
  const words = (count: number) =>
    Array.from({ length: count }, (_, index) => `salita${index}`).join(' ');

  it("keeps each line's beat: directions clipped, the pause snapped to 0 to 3 s", () => {
    expect(
      coerceLines([
        {
          speaker: 'Ben',
          text: "Uy, bago 'yan ah?",
          shot: '  close-up   on Ben ',
          reaction: `stops, ${'x'.repeat(100)}`,
          pauseSeconds: 1.2,
          delivery: ' half laughing ',
        },
        { speaker: 'Ana', text: 'Oo!', pauseSeconds: 9 },
        { speaker: 'Ana', text: 'Hala', pauseSeconds: -1 },
      ]),
    ).toEqual([
      {
        speaker: 'Ben',
        text: "Uy, bago 'yan ah?",
        shot: 'close-up on Ben',
        reaction: `stops, ${'x'.repeat(73)}`,
        pauseSeconds: 1,
        delivery: 'half laughing',
      },
      {
        speaker: 'Ana',
        text: 'Oo!',
        shot: '',
        reaction: '',
        pauseSeconds: 3,
        delivery: '',
      },
      {
        speaker: 'Ana',
        text: 'Hala',
        shot: '',
        reaction: '',
        pauseSeconds: 0,
        delivery: '',
      },
    ]);
    // Lines written before beats read with none.
    expect(readLine({ speaker: 'Ana', text: 'Oo!' })).toEqual({
      speaker: 'Ana',
      text: 'Oo!',
      shot: '',
      reaction: '',
      pauseSeconds: 0,
      delivery: '',
    });
  });

  it('fits a skit scene to its lines and every pause', () => {
    // 10 words take 4 s; with 1.5 s and 1 s of reactions the scene needs 7 s.
    expect(fitDuration(4, words(10), 2.5)).toBe(7);
    expect(fitDuration(4, words(10))).toBe(4);
    expect(
      coerceScene(
        {
          ...sceneOutput,
          durationSeconds: 3,
          narration: '',
          lines: [
            { speaker: 'Ana', text: words(5), pauseSeconds: 0 },
            { speaker: 'Ben', text: words(5), pauseSeconds: 1.5 },
          ],
          sound: null,
        },
        1,
        new Set(),
        's1',
        true,
      )?.durationSeconds,
    ).toBe(6);
  });

  it('times lines at speaking pace after their reactions, the rest of the scene after the last line', () => {
    const beats = lineTimeline(
      [
        { text: words(5), pauseSeconds: 0 },
        { text: words(5), pauseSeconds: 1.5 },
      ],
      8,
    );

    expect(beats).toEqual([
      { startSeconds: 0, speakSeconds: 0, endSeconds: 2 },
      { startSeconds: 2, speakSeconds: 3.5, endSeconds: 5.5 },
    ]);
    // A scene shorter than its beats squeezes all of them evenly.
    expect(
      lineTimeline(
        [
          { text: words(5), pauseSeconds: 1 },
          { text: words(5), pauseSeconds: 1 },
        ],
        3,
      ).map((beat) => beat.endSeconds),
    ).toEqual([1.5, 3]);
  });

  it('shares an untimed scene by word count, as lines did before beats', () => {
    expect(lineTimeline([{ text: words(2) }, { text: words(6) }], 8)).toEqual([
      { startSeconds: 0, speakSeconds: 0, endSeconds: 2 },
      { startSeconds: 2, speakSeconds: 2, endSeconds: 8 },
    ]);
  });
});

describe('creator brief: skits', () => {
  it('names the cast, asks for live sound and prints who says what', () => {
    const lines = shootPlanLines(
      {
        contentStyle: ContentStyle.SKIT,
        shoot: { scenario: 'Ana walks to the stop.', presenter: 'Ana; Ben' },
      } as ScriptVersionRecord,
      [scene({ narration: '' })],
    );

    expect(lines.slice(0, 4)).toEqual([
      'SHOOT PLAN',
      'Scenario: Ana walks to the stop.',
      'Cast: Ana; Ben',
      SKIT_SOUND_NOTE,
    ]);
    expect(
      spokenLines({
        durationSeconds: 4,
        lines: [
          { speaker: 'Ben', text: "Uy, bago 'yan ah?" },
          { speaker: '', text: 'Oo!' },
        ],
      }),
    ).toEqual(['   Ben: "Uy, bago \'yan ah?"', '   "Oo!"']);
  });

  it('prints each timed line with its delivery, the reaction before it and the camera', () => {
    const scenes = [
      scene({
        narration: '',
        durationSeconds: 6,
        lines: [
          {
            speaker: 'Ben',
            text: "Uy, bago 'yan ah?",
            shot: 'close-up on Ben',
            reaction: 'stops, looks down at the sandals, then back at Ana',
            pauseSeconds: 1,
            delivery: 'half laughing, eyebrows up',
          },
          {
            speaker: 'Ana',
            text: 'Oo, bagong bili!',
            shot: '',
            reaction: '',
            pauseSeconds: 0.5,
            delivery: '',
          },
        ],
      }),
    ];

    expect(spokenLines(scenes[0])).toEqual([
      '   [1–2.5 s] Ben (half laughing, eyebrows up): "Uy, bago \'yan ah?"',
      '      Before: stops, looks down at the sandals, then back at Ana (1 s)',
      '      Camera: close-up on Ben',
      '   [3–4.5 s] Ana: "Oo, bagong bili!"',
      '      Before: a quiet beat (0.5 s)',
    ]);
    expect(
      shootPlanLines(
        {
          contentStyle: ContentStyle.SKIT,
          shoot: { scenario: 'Ana walks to the stop.', presenter: 'Ana; Ben' },
        } as ScriptVersionRecord,
        scenes,
      ),
    ).toContain(SKIT_TIMING_NOTE);
  });
});
