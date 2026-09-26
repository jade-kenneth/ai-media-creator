import { createHash } from 'crypto';
import {
  ContentStyle,
  StudioType,
  type ScenePurpose,
} from 'src/graphql/generated/graphql';
import { STUDIOS } from '../studios/studios';
import type { ScriptSceneRecord } from './repositories/scripts.repository';
import { SCRIPT_STUDIOS } from './script-studios';
import {
  hookRewriteMessages,
  sceneRewriteMessages,
  scriptMessages,
  type WritingContext,
} from './script-writing';

/**
 * Affiliate Studio's prompts and schemas must not change when other studios
 * are added (Product Specification §3.23, “Unchanged”). These digests were
 * captured from the builders before Phase 30 (the schemas with the enum
 * values Affiliate Studio had then). A failure here means an Affiliate
 * prompt or schema changed: that needs a product decision, not a new digest.
 */
const BEFORE: Record<string, string> = {
  'script:VOICEOVER_PRODUCT_SHOTS':
    '4748638703a0d88caaf1bcfda98a60191d14c07fc3fdd5a7ca2534507737163c',
  'hook:VOICEOVER_PRODUCT_SHOTS':
    '0eea8f1d3453033a3e9188d7ef8586e886a735869be2419befeb99d0909c8c5b',
  'scene:VOICEOVER_PRODUCT_SHOTS':
    '39654dfe0198adc68dcc73eacf3da29e04fcd9c37d0164f992df3a9121051f76',
  'sceneHook:VOICEOVER_PRODUCT_SHOTS':
    '932300909149f3c25cc9805e194dd6b9fd3fb9aaf611a19b493e7c608066c0c4',
  'script:TALKING_TO_CAMERA':
    'e58d18da1908a5f08b2c40d7a00d033ef4da541cde3cc8915c285b8d572f6108',
  'hook:TALKING_TO_CAMERA':
    'ff77dbb1de38c88997684c971c250ecdc3968224cc13b9b4fd682843bcc14da0',
  'scene:TALKING_TO_CAMERA':
    '0df78249d4abb2e568edb20f01079e25a5f8a31bff1c6fc6a91677205ae208e2',
  'sceneHook:TALKING_TO_CAMERA':
    '3412fa1946d86a558e4c711b5c1017abeb12d931d2199f02c901e729184eacb8',
  'script:TEXT_ONLY':
    '94a8ea85b5d5f1570e902ce608488446419fcf35bfe48573ca350c2387925f88',
  'hook:TEXT_ONLY':
    '370f02b77de8e41621a37a0cc3b4f2964ced692f4cfb9d3d82e8825a63e0a092',
  'scene:TEXT_ONLY':
    '797117526f74d24b5cef219ee1a631cc02d5372dde266a52be1deadd12ce262e',
  'sceneHook:TEXT_ONLY':
    'e1436c0fa5aef0a7a239b6a5750d82c6ee366d684458f7a3d16fd7face12fea7',
  'script:HANDS_ON_DEMO':
    '3bc7edd3c186c0937d1a81f0d94415d0bc54ec7058b91275244e7103cd03cda0',
  'hook:HANDS_ON_DEMO':
    'f895199060e1af90d3bba32b34cd713ed1dff8da519785fadf334b6cb0925852',
  'scene:HANDS_ON_DEMO':
    'a1bfc6cd42dd9ea6a23682b97b63657f4f380dfe33947ae4cc0d5ff9dc3312c2',
  'sceneHook:HANDS_ON_DEMO':
    'e1f3974bdc0db33b996aff68d8f80ffdf3970e22a759036232c1bd368a5c17d8',
  'script:SKIT':
    'da92bb1fc639cb42d8b7b5716f88dcee891fa727506c303fc9a3a63295d88181',
  'hook:SKIT':
    '34b4b795e004a990a3df1ffa22020f5abad5ca81f203d5fbf83a373ec73909d8',
  'scene:SKIT':
    '29339053e0a491c428021322d0dd02f03775781e281fe876990c9bbe2e6c54d5',
  'sceneHook:SKIT':
    'b62a4b6df66176e21f6eb1574f2a7397067b513997729cff91c5aa71c3d0345e',
  'schema:script':
    '69b9e80dd858adddbb9ceead8d8d15e300e48e8fa097e6c504a2a810bb02e5bc',
  'schema:skitScript':
    'de4e7e2b4cdfe7b3fb5045f3f5745f08cdf9ee179f7e68fec1697b5a121c3e31',
  'schema:hook':
    '515dc81cb96841973d82d4c8557076c27fc570849cfd2de874b86b1dad66650e',
  'schema:scene':
    'd6e77fe3927077254108d4f0f41ebc324435c944dcd28e1e28bc815a8ccfd6dc',
  'schema:skitScene':
    'c692ea8328ced5e3e4d2c070aa575b3c33fd7745646bb5f4a1624cf266f9382a',
};

const PRODUCT_STYLES = [
  ContentStyle.VOICEOVER_PRODUCT_SHOTS,
  ContentStyle.TALKING_TO_CAMERA,
  ContentStyle.TEXT_ONLY,
  ContentStyle.HANDS_ON_DEMO,
  ContentStyle.SKIT,
];

const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

// The fixed input the digests were captured with.
const context = (contentStyle: ContentStyle) =>
  ({
    product: {
      title: 'Portable blender',
      category: 'Kitchen',
      description: 'A USB-C blender for smoothies on the go.',
    },
    facts: [
      { id: 'f1', text: 'Holds 380 ml' },
      { id: 'f2', text: 'Charges by USB-C' },
    ],
    strategy: {
      buyer: 'Office workers who skip breakfast',
      problem: 'No time for breakfast',
      benefit: 'A smoothie in a minute',
      platform: 'TIKTOK_SHOP',
      language: 'TAGLISH',
      lengthSeconds: 30,
      tone: 'FRIENDLY',
      contentStyle,
      angle: 'Breakfast on the commute',
    },
  }) as unknown as WritingContext;

const scene = {
  id: 's1',
  order: 1,
  purpose: 'HOOK',
  durationSeconds: 4,
  narration: 'Late ka na naman?',
  lines: [{ speaker: 'Ana', text: 'Late ka na naman?' }],
  sound: 'Footsteps',
  onScreenText: 'Breakfast, pero portable',
  visual: 'Ana at the bus stop',
  transitionIn: 'CUT',
  cta: null,
  factIds: ['f1'],
  reportedClaims: [],
} as unknown as ScriptSceneRecord;
const shoot = { scenario: 'Late for work.', presenter: 'Ana, 20s' };

describe('Affiliate Studio scripts are unchanged by studios', () => {
  const studio = STUDIOS[StudioType.AFFILIATE];
  const scripts = SCRIPT_STUDIOS[StudioType.AFFILIATE];

  it.each(PRODUCT_STYLES)(
    'writes and rewrites %s with the same prompt and schema as before',
    (style) => {
      const skit = style === ContentStyle.SKIT;
      const write = scripts.script(context(style), studio);
      const hook = scripts.hook(
        context(style),
        studio,
        ['Other hook'],
        'Current hook',
      );
      const rewrite = scripts.scene(
        context(style),
        studio,
        [scene],
        scene,
        shoot,
        null,
      );
      const opening = scripts.scene(
        context(style),
        studio,
        [scene],
        scene,
        shoot,
        'Late ka na naman?',
      );

      expect(digest(write.messages)).toBe(BEFORE[`script:${style}`]);
      expect(digest(scriptMessages(context(style)))).toBe(
        BEFORE[`script:${style}`],
      );
      expect(digest(hook.messages)).toBe(BEFORE[`hook:${style}`]);
      expect(
        digest(
          hookRewriteMessages(context(style), ['Other hook'], 'Current hook'),
        ),
      ).toBe(BEFORE[`hook:${style}`]);
      expect(digest(rewrite.messages)).toBe(BEFORE[`scene:${style}`]);
      expect(
        digest(sceneRewriteMessages(context(style), [scene], scene, shoot)),
      ).toBe(BEFORE[`scene:${style}`]);
      expect(digest(opening.messages)).toBe(BEFORE[`sceneHook:${style}`]);

      expect(digest(write.schema)).toBe(
        BEFORE[skit ? 'schema:skitScript' : 'schema:script'],
      );
      expect(digest(hook.schema)).toBe(BEFORE['schema:hook']);
      expect(digest(rewrite.schema)).toBe(
        BEFORE[skit ? 'schema:skitScene' : 'schema:scene'],
      );
    },
  );

  it('offers the model only the purposes and hook types Affiliate Studio had', () => {
    const schema = scripts.script(
      context(ContentStyle.VOICEOVER_PRODUCT_SHOTS),
      studio,
    ).schema as {
      properties: {
        hooks: { items: { properties: { type: { enum: string[] } } } };
        scenes: {
          items: { properties: { purpose: { enum: ScenePurpose[] } } };
        };
      };
    };

    expect(schema.properties.scenes.items.properties.purpose.enum).toEqual([
      'HOOK',
      'PROBLEM',
      'DEMO',
      'FEATURE',
      'PROOF',
      'CALL_TO_ACTION',
    ]);
    expect(schema.properties.hooks.items.properties.type.enum).toEqual([
      'PROBLEM_FIRST',
      'QUESTION',
      'SHOW_DONT_TELL',
      'RELATABLE_MOMENT',
      'DIRECT_PITCH',
    ]);
  });

  it('has a scripts definition for every studio', () => {
    for (const type of Object.values(StudioType)) {
      expect(SCRIPT_STUDIOS[type]).toBeDefined();
    }
  });
});
