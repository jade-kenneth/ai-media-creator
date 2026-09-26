import { ValidationError } from 'src/common/errors/app.error';
import {
  AssetKind,
  AssetOrigin,
  ConsistentItemKind,
  ShotFraming,
  ShotSubject,
  type ProjectAsset,
} from 'src/graphql/generated/graphql';
import {
  deriveConsistentItems,
  LIKENESS_REQUIRED,
  MAX_CONSISTENT_ITEMS,
  validateConsistentItems,
} from './consistent-items';

const on = (inFrame: ShotSubject, props = '') => ({
  inFrame,
  framing: ShotFraming.MEDIUM,
  setting: 'Bus stop',
  props,
});
const cast = [
  { id: 'ana-00001', name: 'Ana' },
  { id: 'ben-00001', name: 'Ben' },
];
const story = { product: false, cast };

describe('deriveConsistentItems for a story', () => {
  it('lists each character by line, visual or Cast on camera, then the props, and no product', () => {
    const items = deriveConsistentItems(
      [
        {
          sceneId: 's1',
          direction: on(ShotSubject.CREATOR, 'Umbrella, Ben'),
          lines: [{ speaker: ' ANA ' }],
          visual: 'Rain on the roof.',
        },
        {
          sceneId: 's2',
          direction: on(ShotSubject.HANDS, 'Umbrella'),
          lines: [],
          visual: 'Ana’s hand on the handle.',
        },
        {
          sceneId: 's3',
          direction: on(ShotSubject.CREATOR),
          lines: [],
          visual: 'Bananas in a bag.',
        },
      ],
      [],
      null,
      story,
    );

    expect(
      items.map(({ itemId, kind, name, sceneIds, origin }) => ({
        itemId,
        kind,
        name,
        sceneIds,
        origin,
      })),
    ).toEqual([
      {
        itemId: 'character-ana-00001',
        kind: ConsistentItemKind.CHARACTER,
        name: 'Ana',
        sceneIds: ['s1', 's2'],
        origin: 'STORY',
      },
      {
        // Ben is never named or heard: every Cast-on-camera scene.
        itemId: 'character-ben-00001',
        kind: ConsistentItemKind.CHARACTER,
        name: 'Ben',
        sceneIds: ['s1', 's3'],
        origin: 'STORY',
      },
      // The prop “Ben” is the character, not a second item.
      {
        itemId: 'script-umbrella',
        kind: ConsistentItemKind.PROP,
        name: 'Umbrella',
        sceneIds: ['s1', 's2'],
        origin: 'SCRIPT',
      },
    ]);
  });

  it('caps characters and props at 8 together', () => {
    const items = deriveConsistentItems(
      [
        {
          sceneId: 's1',
          direction: on(ShotSubject.CREATOR, 'A, B, C, D, E, F, G, H'),
        },
      ],
      [],
      null,
      {
        product: false,
        cast: ['Ana', 'Ben', 'Carla', 'Dan'].map((name) => ({
          id: `${name.toLowerCase()}-00001`,
          name,
        })),
      },
    );

    expect(items).toHaveLength(MAX_CONSISTENT_ITEMS);
    expect(items.slice(0, 4).map((item) => item.kind)).toEqual(
      Array(4).fill(ConsistentItemKind.CHARACTER),
    );
    expect(items.slice(4).map((item) => item.name)).toEqual([
      'A',
      'B',
      'C',
      'D',
    ]);
  });

  it('keeps a photo and its confirmation by name, or by the cast id after a rename', () => {
    const confirmedAt = new Date('2026-09-26T01:00:00Z');
    const previous = deriveConsistentItems(
      [{ sceneId: 'a1', direction: on(ShotSubject.CREATOR) }],
      [],
      null,
      story,
    ).map((item) => ({
      ...item,
      assetId: `${item.name}-photo`,
      likenessConfirmedAt: confirmedAt,
    }));
    // The creator renamed Ben's item.
    previous[1] = { ...previous[1], name: 'Rider Ben', origin: 'CREATOR' };

    const next = deriveConsistentItems(
      [
        {
          sceneId: 'b1',
          direction: on(ShotSubject.CREATOR),
          lines: [{ speaker: 'Ben' }],
        },
      ],
      previous,
      null,
      story,
    );

    expect(
      next.map(({ itemId, name, sceneIds, assetId, likenessConfirmedAt }) => ({
        itemId,
        name,
        sceneIds,
        assetId,
        likenessConfirmedAt,
      })),
    ).toEqual([
      {
        itemId: 'character-ana-00001',
        name: 'Ana',
        sceneIds: ['b1'],
        assetId: 'Ana-photo',
        likenessConfirmedAt: confirmedAt,
      },
      {
        itemId: 'character-ben-00001',
        name: 'Rider Ben',
        sceneIds: ['b1'],
        assetId: 'Ben-photo',
        likenessConfirmedAt: confirmedAt,
      },
    ]);
  });
});

describe('validateConsistentItems for a story', () => {
  const photo = {
    id: 'p'.repeat(24),
    kind: AssetKind.PHOTO,
    origin: AssetOrigin.UPLOAD,
  } as ProjectAsset;
  const assets = new Map([[photo.id, photo]]);
  const current = deriveConsistentItems(
    [{ sceneId: 's1', direction: on(ShotSubject.CREATOR, 'Umbrella') }],
    [],
    null,
    story,
  );
  const scenes = new Set(['s1']);
  const now = new Date('2026-09-26T02:00:00Z');

  it('needs no product and keeps characters before props', () => {
    const items = validateConsistentItems(
      [
        { id: 'script-umbrella', name: 'Umbrella', sceneIds: ['s1'] },
        { name: 'Bench', sceneIds: [] },
        { id: 'character-ana-00001', name: 'Ana', sceneIds: ['s1'] },
      ],
      current,
      scenes,
      assets,
      { product: false },
      now,
    );

    expect(items.map((item) => [item.kind, item.name])).toEqual([
      [ConsistentItemKind.CHARACTER, 'Ana'],
      [ConsistentItemKind.PROP, 'Umbrella'],
      [ConsistentItemKind.PROP, 'Bench'],
    ]);
  });

  it('confirms a character photo when it is set, and refuses it unconfirmed', () => {
    expect(() =>
      validateConsistentItems(
        [
          {
            id: 'character-ana-00001',
            name: 'Ana',
            sceneIds: ['s1'],
            assetId: photo.id,
          },
        ],
        current,
        scenes,
        assets,
        { product: false },
        now,
      ),
    ).toThrow(new ValidationError(LIKENESS_REQUIRED));

    const [ana] = validateConsistentItems(
      [
        {
          id: 'character-ana-00001',
          name: 'Ana',
          sceneIds: ['s1'],
          assetId: photo.id,
          likenessConfirmed: true,
        },
      ],
      current,
      scenes,
      assets,
      { product: false },
      now,
    );

    expect(ana).toMatchObject({
      kind: ConsistentItemKind.CHARACTER,
      assetId: photo.id,
      likenessConfirmedAt: now,
      origin: 'STORY',
    });
  });

  it('still requires the product where the studio keeps one', () => {
    expect(() =>
      validateConsistentItems(
        [{ name: 'Bench', sceneIds: [] }],
        current,
        scenes,
        assets,
      ),
    ).toThrow(new ValidationError('Keep the product in the list.'));
  });
});
