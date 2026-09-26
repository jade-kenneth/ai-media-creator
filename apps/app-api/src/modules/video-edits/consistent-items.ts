import { Types } from 'mongoose';
import { ValidationError } from 'src/common/errors/app.error';
import { slugify } from 'src/common/utils/slugify';
import {
  AssetKind,
  AssetOrigin,
  ConsistentItemKind,
  ShotSubject,
  type ConsistentItemInput,
  type ProjectAsset,
} from 'src/graphql/generated/graphql';
import type { SceneDirectionRecord } from '../scripts/repositories/scripts.repository';
import type { ConsistentItemRecord } from './repositories/video-edits.repository';

/**
 * Keep consistent (Product Specification §3.21, §3.23): the product or the
 * cast's characters, and the props that must look the same across a video's
 * AI clips. At most 8, so a one-click clip sends 8 item photos plus a still
 * of the scene before, the video service's cap of 9 references.
 */
export const MAX_CONSISTENT_ITEMS = 8;
export const MAX_ITEM_NAME = 60;
export const PRODUCT_FALLBACK_NAME = 'The product';
export const LIKENESS_REQUIRED =
  'Confirm this person agreed, or that you have the rights to this character.';
const PRODUCT_ITEM_ID = 'product';
/** Ids a client may give a new item (so repeated autosaves don't duplicate it). */
const CLIENT_ITEM_ID = /^[A-Za-z0-9_-]{8,64}$/;

/** What leads a studio's list (read from its `keepConsistent` definition). */
export interface ConsistentSubject {
  /** The product is the first, required item. */
  product: boolean;
  /** The story's cast; each character becomes an item before the props. */
  cast: readonly { id: string; name: string }[];
}

const PRODUCT_SUBJECT: ConsistentSubject = { product: true, cast: [] };

/** A scene as the derivation reads it: its props, lines, visual and framing. */
export interface ConsistentScene {
  sceneId: string;
  direction?: SceneDirectionRecord | null;
  lines?: readonly { speaker: string }[] | null;
  visual?: string | null;
}

/**
 * The list the script implies: the product in every scene (or, for a story,
 * one item per character), then each prop the scenes name (split on commas,
 * deduplicated case-insensitively, in the order they first appear), tagged
 * with the scenes that name it. When `previous` is given (switching
 * versions), an item whose name still matches keeps its id and photo, a
 * creator item keeps the scenes that still exist, and a script item no scene
 * names any more is dropped. Ids are derived from the names (a character's
 * from its cast id), so a list read without being stored stays stable.
 */
export function deriveConsistentItems(
  scenes: ConsistentScene[],
  previous: ConsistentItemRecord[],
  productTitle: string | null,
  subject: ConsistentSubject = PRODUCT_SUBJECT,
): ConsistentItemRecord[] {
  const sceneIds = scenes.map((scene) => scene.sceneId);
  const existing = (tags: string[]) =>
    sceneIds.filter((id) => tags.includes(id));
  const lead: ConsistentItemRecord[] = [];

  if (subject.product) {
    const before = previous.find(
      (item) => item.kind === ConsistentItemKind.PRODUCT,
    );
    const productTags = before ? existing(before.sceneIds) : [];

    lead.push({
      itemId: before?.itemId ?? PRODUCT_ITEM_ID,
      kind: ConsistentItemKind.PRODUCT,
      name: productTitle?.trim() || PRODUCT_FALLBACK_NAME,
      sceneIds: productTags.length ? productTags : sceneIds,
      assetId: before?.assetId ?? null,
      origin: 'SCRIPT',
    });
  }

  lead.push(...characterItems(scenes, previous, subject.cast, existing));

  const named = new Map<string, { name: string; sceneIds: string[] }>();

  for (const scene of scenes) {
    for (const part of (scene.direction?.props ?? '').split(',')) {
      const name = part.replace(/\s+/g, ' ').trim().slice(0, MAX_ITEM_NAME);

      if (!name) continue;

      const prop = named.get(name.toLowerCase()) ?? { name, sceneIds: [] };

      if (!prop.sceneIds.includes(scene.sceneId)) {
        prop.sceneIds.push(scene.sceneId);
      }
      named.set(name.toLowerCase(), prop);
    }
  }

  // A prop named like a character is that character, not a second item.
  const characters = new Set(
    lead
      .filter((item) => item.kind === ConsistentItemKind.CHARACTER)
      .map((item) => item.name.toLowerCase()),
  );

  for (const key of characters) named.delete(key);

  const earlier = new Map(
    previous
      .filter((item) => item.kind === ConsistentItemKind.PROP)
      .map((item) => [item.name.toLowerCase(), item]),
  );
  const taken = new Set([
    ...lead.map((item) => item.itemId),
    ...previous.map((item) => item.itemId),
  ]);
  const props: ConsistentItemRecord[] = [];

  for (const [key, prop] of named) {
    const match = earlier.get(key);

    earlier.delete(key);

    if (match) {
      props.push({
        ...match,
        sceneIds:
          match.origin === 'CREATOR'
            ? existing([...match.sceneIds, ...prop.sceneIds])
            : prop.sceneIds,
      });
      continue;
    }

    let itemId = `script-${slugify(key)}`;
    for (let n = 2; taken.has(itemId); n += 1) {
      itemId = `script-${slugify(key)}-${n}`;
    }
    taken.add(itemId);
    props.push({
      itemId,
      kind: ConsistentItemKind.PROP,
      name: prop.name,
      sceneIds: prop.sceneIds,
      assetId: null,
      origin: 'SCRIPT',
    });
  }

  for (const item of earlier.values()) {
    if (item.origin === 'CREATOR' && !characters.has(item.name.toLowerCase())) {
      props.push({ ...item, sceneIds: existing(item.sceneIds) });
    }
  }

  return [...lead, ...props].slice(0, MAX_CONSISTENT_ITEMS);
}

/**
 * One item per character, in cast order, tagged with the scenes where the
 * character speaks a line or is named in the visual (case-insensitive, whole
 * words), or every Cast-on-camera scene when none are. A previous character
 * item keeps its id, photo and likeness confirmation when its name still
 * matches, or when the creator renamed it (it keeps the cast's id); a
 * renamed item stays even after its character leaves the cast.
 */
function characterItems(
  scenes: ConsistentScene[],
  previous: ConsistentItemRecord[],
  cast: ConsistentSubject['cast'],
  existing: (tags: string[]) => string[],
): ConsistentItemRecord[] {
  const earlier = previous.filter(
    (item) => item.kind === ConsistentItemKind.CHARACTER,
  );
  const used = new Set<string>();
  const items: ConsistentItemRecord[] = [];

  for (const character of cast) {
    const name = character.name
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_ITEM_NAME);

    if (!name) continue;

    const itemId = `character-${character.id.replace(/[^A-Za-z0-9_-]/g, '-')}`;
    const tags = characterScenes(scenes, name);
    const match =
      earlier.find(
        (item) =>
          !used.has(item.itemId) &&
          item.name.toLowerCase() === name.toLowerCase(),
      ) ??
      earlier.find((item) => !used.has(item.itemId) && item.itemId === itemId);

    if (match) {
      used.add(match.itemId);
      items.push(
        match.origin === 'CREATOR'
          ? { ...match, sceneIds: existing([...match.sceneIds, ...tags]) }
          : { ...match, name, sceneIds: tags },
      );
      continue;
    }
    if (items.some((item) => item.itemId === itemId)) continue;

    items.push({
      itemId,
      kind: ConsistentItemKind.CHARACTER,
      name,
      sceneIds: tags,
      assetId: null,
      origin: 'STORY',
      likenessConfirmedAt: null,
    });
  }

  for (const item of earlier) {
    if (!used.has(item.itemId) && item.origin === 'CREATOR') {
      items.push({ ...item, sceneIds: existing(item.sceneIds) });
    }
  }

  return items;
}

const REGEXP_SPECIAL = /[.*+?^${}()|[\]\\]/g;

function characterScenes(scenes: ConsistentScene[], name: string): string[] {
  const key = name.toLowerCase();
  const escaped = name.replace(REGEXP_SPECIAL, '\\$&');
  // The name as a whole word: “Ana” is named in “Ana waves”, not in “banana”.
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,
    'iu',
  );
  const tagged = scenes.filter(
    (scene) =>
      (scene.lines ?? []).some(
        (line) =>
          line.speaker.replace(/\s+/g, ' ').trim().toLowerCase() === key,
      ) || pattern.test(scene.visual ?? ''),
  );

  return (
    tagged.length
      ? tagged
      : scenes.filter(
          (scene) => scene.direction?.inFrame === ShotSubject.CREATOR,
        )
  ).map((scene) => scene.sceneId);
}

/**
 * The creator's replacement list, checked against the current one: where the
 * studio keeps the product, it stays (it reads the product's title, so its
 * name isn't edited) and keeps at least one scene; every prop and character
 * has a unique name of 1–60 characters; scenes belong to the video; photos
 * are ready photos the creator uploaded to this project. A character's photo
 * needs the likeness confirmation whenever it is set or changed. A renamed
 * script prop or story character becomes the creator's; renaming a character
 * doesn't change the story's cast. New items are props.
 */
export function validateConsistentItems(
  input: ConsistentItemInput[],
  current: ConsistentItemRecord[],
  sceneIds: Set<string>,
  assets: Map<string, ProjectAsset>,
  rules: { product: boolean } = { product: true },
  now: Date = new Date(),
): ConsistentItemRecord[] {
  if (input.length > MAX_CONSISTENT_ITEMS) {
    throw new ValidationError(`Use up to ${MAX_CONSISTENT_ITEMS} items.`, {
      field: 'input.consistentItems',
    });
  }

  const byId = new Map(current.map((item) => [item.itemId, item]));
  const ids = new Set<string>();
  const names = new Set<string>();
  const items = input.map((change, index): ConsistentItemRecord => {
    const field = `input.consistentItems.${index}`;
    const known = change.id ? byId.get(change.id) : undefined;
    const tags = [...new Set(change.sceneIds)];

    if (tags.some((id) => !sceneIds.has(id))) {
      throw new ValidationError('That scene isn’t part of this video.', {
        field: `${field}.sceneIds`,
      });
    }

    if (change.assetId) {
      const photo = assets.get(change.assetId);

      if (
        !photo ||
        photo.kind !== AssetKind.PHOTO ||
        photo.origin !== AssetOrigin.UPLOAD
      ) {
        throw new ValidationError('Pick one of this project’s photos.', {
          field: `${field}.assetId`,
        });
      }
    }

    const itemId =
      known?.itemId ??
      (change.id && CLIENT_ITEM_ID.test(change.id)
        ? change.id
        : new Types.ObjectId().toHexString());

    if (ids.has(itemId)) {
      throw new ValidationError('Each item can be in the list once.', {
        field: `${field}.id`,
      });
    }
    ids.add(itemId);

    if (rules.product && known?.kind === ConsistentItemKind.PRODUCT) {
      if (!tags.length) {
        throw new ValidationError('The product needs at least one scene.', {
          field: `${field}.sceneIds`,
        });
      }

      return { ...known, sceneIds: tags, assetId: change.assetId ?? null };
    }

    const name = change.name.replace(/\s+/g, ' ').trim();

    if (!name) {
      throw new ValidationError('Name it, or remove it.', {
        field: `${field}.name`,
      });
    }
    if (name.length > MAX_ITEM_NAME) {
      throw new ValidationError(`Use ${MAX_ITEM_NAME} characters or fewer.`, {
        field: `${field}.name`,
      });
    }
    if (names.has(name.toLowerCase())) {
      throw new ValidationError(`You already have “${name}”.`, {
        field: `${field}.name`,
      });
    }
    names.add(name.toLowerCase());

    const sameName = known?.name.toLowerCase() === name.toLowerCase();

    if (known?.kind === ConsistentItemKind.CHARACTER) {
      const assetId = change.assetId ?? null;
      const changed = assetId !== null && assetId !== known.assetId;

      if (changed && change.likenessConfirmed !== true) {
        throw new ValidationError(LIKENESS_REQUIRED, {
          field: `${field}.likenessConfirmed`,
        });
      }

      return {
        itemId,
        kind: ConsistentItemKind.CHARACTER,
        name,
        sceneIds: tags,
        assetId,
        origin: known.origin === 'STORY' && sameName ? 'STORY' : 'CREATOR',
        likenessConfirmedAt:
          assetId === null
            ? null
            : changed
              ? now
              : (known.likenessConfirmedAt ??
                (change.likenessConfirmed === true ? now : null)),
      };
    }

    return {
      itemId,
      kind: ConsistentItemKind.PROP,
      name,
      sceneIds: tags,
      assetId: change.assetId ?? null,
      origin: known?.origin === 'SCRIPT' && sameName ? 'SCRIPT' : 'CREATOR',
    };
  });
  const product = items.find(
    (item) => item.kind === ConsistentItemKind.PRODUCT,
  );

  if (rules.product && !product) {
    throw new ValidationError('Keep the product in the list.', {
      field: 'input.consistentItems',
    });
  }

  // The product (or the characters) first, then the props, each in the
  // creator's order.
  return [
    ...(product ? [product] : []),
    ...items.filter((item) => item.kind === ConsistentItemKind.CHARACTER),
    ...items.filter((item) => item.kind === ConsistentItemKind.PROP),
  ];
}
