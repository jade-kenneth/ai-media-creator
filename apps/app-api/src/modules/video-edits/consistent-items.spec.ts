import {
  ConsistentItemKind,
  ShotFraming,
  ShotSubject,
} from 'src/graphql/generated/graphql';
import {
  deriveConsistentItems,
  MAX_CONSISTENT_ITEMS,
} from './consistent-items';

const direction = (props: string) => ({
  inFrame: ShotSubject.HANDS,
  framing: ShotFraming.CLOSE_UP,
  setting: 'Office desk',
  props,
});

describe('deriveConsistentItems', () => {
  it('lists the product in every scene, then each prop once with the scenes that name it', () => {
    const items = deriveConsistentItems(
      [
        { sceneId: 's1', direction: direction('Tote bag, Keys') },
        { sceneId: 's2', direction: null },
        { sceneId: 's3', direction: direction(' tote   BAG ,Banana') },
      ],
      [],
      'BlendGo Mini Portable Blender',
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
        itemId: 'product',
        kind: ConsistentItemKind.PRODUCT,
        name: 'BlendGo Mini Portable Blender',
        sceneIds: ['s1', 's2', 's3'],
        origin: 'SCRIPT',
      },
      {
        itemId: 'script-tote-bag',
        kind: ConsistentItemKind.PROP,
        name: 'Tote bag',
        sceneIds: ['s1', 's3'],
        origin: 'SCRIPT',
      },
      {
        itemId: 'script-keys',
        kind: ConsistentItemKind.PROP,
        name: 'Keys',
        sceneIds: ['s1'],
        origin: 'SCRIPT',
      },
      {
        itemId: 'script-banana',
        kind: ConsistentItemKind.PROP,
        name: 'Banana',
        sceneIds: ['s3'],
        origin: 'SCRIPT',
      },
    ]);
  });

  it('names an untitled product, caps the list at 8 and keeps ids unique', () => {
    const items = deriveConsistentItems(
      [
        {
          sceneId: 's1',
          direction: direction('USB-C cable, USB C cable, A, B, C, D, E, F'),
        },
      ],
      [],
      '  ',
    );

    expect(items).toHaveLength(MAX_CONSISTENT_ITEMS);
    expect(items[0].name).toBe('The product');
    expect(items.slice(1, 3).map((item) => item.itemId)).toEqual([
      'script-usb-c-cable',
      'script-usb-c-cable-2',
    ]);
  });

  it('keeps photos by name and the creator’s items when the version changes', () => {
    const previous = deriveConsistentItems(
      [
        { sceneId: 'a1', direction: direction('Tote bag, Keys') },
        { sceneId: 'a2', direction: direction('Tote bag') },
      ],
      [],
      'Blender',
    ).map((item) => ({ ...item, assetId: `${item.itemId}-photo` }));
    previous.push({
      itemId: 'creator-cup',
      kind: ConsistentItemKind.PROP,
      name: 'Travel cup',
      sceneIds: ['a2'],
      assetId: 'cup-photo',
      origin: 'CREATOR',
    });

    const next = deriveConsistentItems(
      [
        { sceneId: 'b1', direction: direction('tote bag') },
        { sceneId: 'b2', direction: direction('Banana') },
      ],
      previous,
      'Blender',
    );

    expect(
      next.map(({ itemId, name, sceneIds, assetId }) => ({
        itemId,
        name,
        sceneIds,
        assetId,
      })),
    ).toEqual([
      // The product's scenes no longer exist, so it is in every new scene.
      {
        itemId: 'product',
        name: 'Blender',
        sceneIds: ['b1', 'b2'],
        assetId: 'product-photo',
      },
      {
        itemId: 'script-tote-bag',
        name: 'Tote bag',
        sceneIds: ['b1'],
        assetId: 'script-tote-bag-photo',
      },
      {
        itemId: 'script-banana',
        name: 'Banana',
        sceneIds: ['b2'],
        assetId: null,
      },
      // Keys is no longer named, so it is dropped; the creator's cup stays.
      {
        itemId: 'creator-cup',
        name: 'Travel cup',
        sceneIds: [],
        assetId: 'cup-photo',
      },
    ]);
  });
});
