'use client';

import { ImagePlusIcon, PlusIcon, SparklesIcon, XIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { MediaThumb } from '@/components/studio/media-thumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { useAutosave } from '@/features/project-workflow/use-autosave';
import { useProject } from '@/features/project-workflow/workflow-state';
import { SCENE_PURPOSE_LABEL } from '@/lib/studio/labels';
import { studioOf } from '@/lib/studios';
import { cn } from '@/lib/utils';
import type { ProjectAsset } from '@/react-query/assets/assets-operations';
import {
  ConsistentItemKind,
  type ConsistentItemInput,
} from '@/react-query/generated__types';
import {
  useUpdateVideoEditMutation,
  type VideoEdit,
} from '@/react-query/video-edits/video-edits-operations';

import { ItemPhotoSheet } from './item-photo-sheet';

/** At most 8: 8 item photos and a still of the scene before is the video service's cap of 9. */
export const MAX_CONSISTENT_ITEMS = 8;
const MAX_ITEM_NAME = 60;

type Row = {
  id: string;
  kind: ConsistentItemKind;
  name: string;
  sceneIds: string[];
  assetId: string | null;
  /** A character's photo shows someone who agreed, or a character the creator has the rights to (§3.23). */
  likenessConfirmed: boolean;
  /** The last valid name, sent while the field is invalid. */
  savedName: string;
  touched: boolean;
};

const normalize = (name: string) => name.replace(/\s+/g, ' ').trim();

/** The field error a prop's or a character's name shows (mirrors the server's rules). */
function nameError(row: Row, rows: Row[]): string | null {
  if (row.kind === ConsistentItemKind.Product) return null;

  const name = normalize(row.name);

  if (!name) return 'Name it, or remove it.';
  if (name.length > MAX_ITEM_NAME) {
    return `Use ${MAX_ITEM_NAME} characters or fewer.`;
  }

  const earlier = rows.slice(0, rows.indexOf(row));

  return earlier.some(
    (other) =>
      other.kind !== ConsistentItemKind.Product &&
      normalize(other.name).toLowerCase() === name.toLowerCase(),
  )
    ? `You already have “${name}”.`
    : null;
}

/** The list the server gets: an invalid row keeps its last valid name, a new one waits. */
function toInput(rows: Row[]): ConsistentItemInput[] {
  return rows.flatMap((row) => {
    const name = nameError(row, rows) ? row.savedName : normalize(row.name);

    if (row.kind !== ConsistentItemKind.Product && !name) return [];

    return [
      {
        id: row.id,
        name,
        sceneIds: row.sceneIds,
        assetId: row.assetId,
        // A character's photo goes with its likeness confirmation (§3.23).
        ...(row.kind === ConsistentItemKind.Character && row.assetId
          ? { likenessConfirmed: row.likenessConfirmed }
          : {}),
      },
    ];
  });
}

/**
 * Keep consistent (Design Reference §5.12, §3.21): the product and the props
 * that must look the same across the video's AI clips, each with a photo.
 * A story lists its characters first and has no product, and its photos are
 * optional (§3.23). The list starts from the script; every change autosaves
 * the whole list.
 */
export function KeepConsistentCard({
  video,
  photos,
  firstSceneHasClip,
  online,
  onSaved,
}: {
  video: VideoEdit;
  /** The project's ready photo uploads, by id. */
  photos: Map<string, ProjectAsset>;
  firstSceneHasClip: boolean;
  online: boolean;
  onSaved: (next: VideoEdit) => void;
}) {
  const studio = studioOf(useProject().studio);
  const [rows, setRows] = useState<Row[]>(() =>
    video.consistentItems.map((item) => ({
      id: item.id,
      kind: item.kind,
      name: item.name,
      sceneIds: item.sceneIds,
      assetId: item.photo?.id ?? null,
      likenessConfirmed: item.likenessConfirmed,
      savedName: item.name,
      touched: false,
    })),
  );
  const [added, setAdded] = useState<string | null>(null);
  const [photoFor, setPhotoFor] = useState<string | null>(null);
  const update = useUpdateVideoEditMutation();
  const autosave = useAutosave<{ items: ConsistentItemInput[] }>({
    source: 'keep-consistent',
    enabled: online,
    save: async ({ items }) => {
      const data = await update.mutateAsync({
        input: { projectId: video.projectId, consistentItems: items },
      });
      onSaved(data.updateVideoEdit);
    },
  });
  const headingId = useId();

  const commit = (next: Row[]) => {
    setRows(next);
    autosave.schedule({ items: toInput(next) });
  };
  const patch = (id: string, change: Partial<Row>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...change } : row)));

  const withPhotos = rows.filter(
    (row) => row.assetId && photos.has(row.assetId),
  ).length;
  const complete = rows.length > 0 && withPhotos === rows.length;
  const picking = rows.find((row) => row.id === photoFor) ?? null;
  const usedBy = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.assetId || row.id === photoFor) continue;
    usedBy.set(row.assetId, [...(usedBy.get(row.assetId) ?? []), row.name]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle
          id={headingId}
          className="flex flex-wrap items-baseline gap-x-2"
        >
          Keep consistent
          <span className="t-sm font-normal text-ink-2">
            <span className="t-mono">{withPhotos}</span> of{' '}
            <span className="t-mono">{rows.length}</span> have photos
          </span>
        </CardTitle>
        <p className="t-sm text-ink-2">{studio.media.keepConsistentSubtitle}</p>
      </CardHeader>
      <CardContent className="gap-3">
        <ol aria-labelledby={headingId} className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <ItemRow
              key={row.id}
              row={row}
              index={index}
              error={row.touched ? nameError(row, rows) : null}
              photo={row.assetId ? (photos.get(row.assetId) ?? null) : null}
              scenes={video.scenes}
              focus={added === row.id}
              disabled={!online}
              onPhoto={() => setPhotoFor(row.id)}
              onRename={(name) => {
                const next = { ...row, name };
                const valid = !nameError(
                  next,
                  rows.map((item) => (item.id === row.id ? next : item)),
                );
                patch(row.id, {
                  name,
                  touched: row.touched || Boolean(normalize(name)),
                  ...(valid ? { savedName: normalize(name) } : {}),
                });
              }}
              onBlur={() => {
                if (!row.touched) {
                  setRows((current) =>
                    current.map((item) =>
                      item.id === row.id ? { ...item, touched: true } : item,
                    ),
                  );
                }
              }}
              onToggleScene={(sceneId, on) =>
                patch(row.id, {
                  sceneIds: on
                    ? [...row.sceneIds, sceneId]
                    : row.sceneIds.filter((id) => id !== sceneId),
                })
              }
              onRemove={() => {
                commit(rows.filter((item) => item.id !== row.id));
                toast.success(
                  `${normalize(row.name) || 'Item'} removed. Its photo stays in your uploads.`,
                );
              }}
            />
          ))}
        </ol>
        <Button
          size="sm"
          variant="ghost"
          className="self-start"
          disabled={!online || rows.length >= MAX_CONSISTENT_ITEMS}
          onClick={() => {
            if (rows.length >= MAX_CONSISTENT_ITEMS) return;
            const id = crypto.randomUUID();
            setAdded(id);
            // A new row waits for its name before it is sent.
            setRows([
              ...rows,
              {
                id,
                kind: ConsistentItemKind.Prop,
                name: '',
                sceneIds: [],
                assetId: null,
                likenessConfirmed: false,
                savedName: '',
                touched: false,
              },
            ]);
          }}
        >
          <PlusIcon data-icon="inline-start" />
          Add an item
        </Button>
        <p className="t-caption text-ink-3">
          {rows.length >= MAX_CONSISTENT_ITEMS
            ? 'Up to 8 items.'
            : studio.media.keepConsistentHint}
        </p>
        {complete || (studio.media.photosOptional && rows.length > 0) ? (
          <p className="t-sm flex items-start gap-2 text-ink-2">
            <SparklesIcon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            {firstSceneHasClip
              ? 'Scene 1 sets the look. Make the rest in order, so each clip follows the one before it.'
              : 'Ready. Start with scene 1: every clip after it follows its look.'}
          </p>
        ) : null}
      </CardContent>

      <ItemPhotoSheet
        open={Boolean(picking)}
        onOpenChange={(open) => !open && setPhotoFor(null)}
        projectId={video.projectId}
        itemName={picking ? normalize(picking.name) || 'this item' : ''}
        current={picking?.assetId ?? null}
        usedBy={usedBy}
        online={online}
        confirmLikeness={picking?.kind === ConsistentItemKind.Character}
        onConfirm={(assetId) => {
          if (!picking) return;
          // A character's sheet can't confirm until its likeness box is ticked.
          patch(picking.id, {
            assetId,
            ...(picking.kind === ConsistentItemKind.Character
              ? { likenessConfirmed: true }
              : {}),
          });
          setPhotoFor(null);
        }}
      />
    </Card>
  );
}

function ItemRow({
  row,
  index,
  error,
  photo,
  scenes,
  focus,
  disabled,
  onPhoto,
  onRename,
  onBlur,
  onToggleScene,
  onRemove,
}: {
  row: Row;
  index: number;
  error: string | null;
  photo: ProjectAsset | null;
  scenes: VideoEdit['scenes'];
  focus: boolean;
  disabled: boolean;
  onPhoto: () => void;
  onRename: (name: string) => void;
  onBlur: () => void;
  onToggleScene: (sceneId: string, on: boolean) => void;
  onRemove: () => void;
}) {
  const product = row.kind === ConsistentItemKind.Product;
  const character = row.kind === ConsistentItemKind.Character;
  const name = normalize(row.name) || `item ${index + 1}`;
  const errorId = useId();
  const nameInput = (
    <Input
      value={row.name}
      autoFocus={focus}
      disabled={disabled}
      aria-label={`Name of item ${index + 1}`}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className="h-9"
      onChange={(event) => onRename(event.target.value)}
      onBlur={onBlur}
    />
  );

  return (
    <li className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-start gap-3 border-t border-border pt-2 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={onPhoto}
        disabled={disabled}
        aria-label={
          photo ? `Change the photo for ${name}` : `Add a photo for ${name}`
        }
        className={cn(
          'relative h-15 w-12 overflow-hidden rounded-sm',
          !photo &&
            'flex items-center justify-center border-[1.5px] border-dashed border-border-strong bg-canvas',
        )}
      >
        {photo ? (
          <MediaThumb asset={photo} className="size-full" sizes="48px" />
        ) : (
          <ImagePlusIcon aria-hidden="true" className="size-4 text-ink-3" />
        )}
      </button>

      <div className="flex min-w-0 flex-col gap-2">
        {product ? (
          <p className="flex min-h-9 flex-wrap items-center gap-2">
            <span className="t-label truncate">{row.name}</span>
            <Badge dot={false}>Product</Badge>
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {/* A character is renamed and removed like a prop (§3.23). */}
            {character ? (
              <div className="flex items-center gap-2">
                {nameInput}
                <Badge dot={false} className="shrink-0">
                  Character
                </Badge>
              </div>
            ) : (
              nameInput
            )}
            {error ? (
              <p id={errorId} className="t-caption text-danger">
                {error}
              </p>
            ) : null}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="t-caption mr-1 text-ink-3">Scenes</span>
          {scenes.map((scene) => {
            const on = row.sceneIds.includes(scene.sceneId);
            // The product stays in at least one scene.
            const last = product && on && row.sceneIds.length === 1;

            return (
              <Toggle
                key={scene.sceneId}
                variant="chip"
                size="sm"
                pressed={on}
                disabled={disabled || last}
                aria-label={`In scene ${scene.order}, ${SCENE_PURPOSE_LABEL[scene.purpose]}`}
                className="t-mono px-0"
                onPressedChange={(pressed) =>
                  onToggleScene(scene.sceneId, pressed)
                }
              >
                {scene.order}
              </Toggle>
            );
          })}
        </div>
      </div>

      {product ? (
        <span />
      ) : (
        <Button
          size="icon-sm"
          variant="ghost"
          disabled={disabled}
          aria-label={`Remove ${name}`}
          onClick={onRemove}
        >
          <XIcon />
        </Button>
      )}
    </li>
  );
}
