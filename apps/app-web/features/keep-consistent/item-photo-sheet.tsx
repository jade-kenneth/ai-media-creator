'use client';

import { CheckIcon, UploadIcon } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';

import { MediaThumb } from '@/components/studio/media-thumb';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { UploadTile } from '@/features/product-setup/media-card';
import { useAssetUploads } from '@/features/product-setup/use-asset-uploads';
import { useProject } from '@/features/project-workflow/workflow-state';
import { studioOf } from '@/lib/studios';
import { cn } from '@/lib/utils';
import {
  useProjectAssetsQuery,
  type ProjectAsset,
} from '@/react-query/assets/assets-operations';
import { AssetKind, AssetOrigin } from '@/react-query/generated__types';

const PHOTO_TYPES = 'image/jpeg,image/png,image/webp';

/**
 * `item-photo-sheet` (Design Reference §5.12, Item photo picker): the photo a
 * Keep consistent item is shown by. Photos only, never AI clips; the Product
 * uploader runs in place with its rights confirmation. A story character's
 * photo also needs its likeness confirmed (§3.23, R28 D3).
 */
export function ItemPhotoSheet({
  open,
  onOpenChange,
  projectId,
  itemName,
  current,
  usedBy,
  online,
  confirmLikeness = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  itemName: string;
  current: string | null;
  /** The other items each photo already shows. */
  usedBy: Map<string, string[]>;
  online: boolean;
  /** A character: **Use this** waits for `item-photo.confirm-likeness`. */
  confirmLikeness?: boolean;
  onConfirm: (assetId: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined} className="sm:w-120">
        {open ? (
          <PickerBody
            projectId={projectId}
            itemName={itemName}
            current={current}
            usedBy={usedBy}
            online={online}
            confirmLikeness={confirmLikeness}
            onCancel={() => onOpenChange(false)}
            onConfirm={onConfirm}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function PickerBody({
  projectId,
  itemName,
  current,
  usedBy,
  online,
  confirmLikeness,
  onCancel,
  onConfirm,
}: {
  projectId: string;
  itemName: string;
  current: string | null;
  usedBy: Map<string, string[]>;
  online: boolean;
  confirmLikeness: boolean;
  onCancel: () => void;
  onConfirm: (assetId: string) => void;
}) {
  const { uploadRightsNote } = studioOf(useProject().studio);
  const assets = useProjectAssetsQuery({ projectId });
  const ready = assets.data?.projectAssets ?? [];
  const uploadCount = ready.filter(
    (asset) => asset.origin !== AssetOrigin.AiClip,
  ).length;
  const photos = ready.filter(
    (asset) =>
      asset.kind === AssetKind.Photo && asset.origin === AssetOrigin.Upload,
  );
  const { uploads, upload, cancel, dismiss, limitReached } = useAssetUploads(
    projectId,
    uploadCount,
  );
  const [selected, setSelected] = useState<string | null>(current);
  const [rights, setRights] = useState(false);
  // The likeness is confirmed for one photo; picking another asks again.
  const [likenessFor, setLikenessFor] = useState<string | null>(null);
  const browseRef = useRef<HTMLInputElement>(null);
  const rightsId = useId();
  const likenessId = useId();
  const ids = photos.map((photo) => photo.id);
  const likeness = Boolean(selected) && likenessFor === selected;
  const canUse = Boolean(selected) && online && (!confirmLikeness || likeness);

  // A photo uploaded here is selected once it is ready.
  const [known, setKnown] = useState<Set<string> | null>(null);
  if (!assets.isPending && known === null) {
    setKnown(new Set(ids));
  } else if (known) {
    const fresh = ids.find((id) => !known.has(id));
    if (fresh) {
      setKnown(new Set(ids));
      setSelected(fresh);
    }
  }

  const tabStop = selected && ids.includes(selected) ? selected : ids[0];

  // A radio group (APG): arrow keys move and select.
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    const edge =
      event.key === 'Home' ? ids[0] : event.key === 'End' ? ids.at(-1) : null;

    if (!step && !edge) return;
    event.preventDefault();

    const index = Math.max(0, ids.indexOf(selected ?? ids[0]));
    const next = edge ?? ids[(index + step + ids.length) % ids.length];
    if (!next) return;

    setSelected(next);
    event.currentTarget
      .querySelector<HTMLElement>(`[data-option="${next}"]`)
      ?.focus();
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Photo for {itemName}</SheetTitle>
      </SheetHeader>
      <SheetBody className="flex flex-col gap-4">
        {assets.isPending ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-5 text-ink-3" />
          </div>
        ) : assets.isError ? (
          <div className="flex flex-col items-start gap-3" role="alert">
            <p className="t-sm text-danger">
              We couldn’t load your photos. Check your connection and try again.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void assets.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : photos.length ? (
          <div
            role="radiogroup"
            aria-label={`Photo for ${itemName}`}
            onKeyDown={onKey}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {photos.map((photo) => (
              <PhotoOption
                key={photo.id}
                photo={photo}
                selected={selected === photo.id}
                tabbable={tabStop === photo.id}
                usedBy={usedBy.get(photo.id) ?? []}
                onSelect={() => setSelected(photo.id)}
              />
            ))}
          </div>
        ) : (
          <p className="t-sm text-ink-2">No photos yet.</p>
        )}

        {uploads.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {uploads.map((item) => (
              <UploadTile
                key={item.key}
                upload={item}
                onCancel={() => cancel(item.key)}
                onDismiss={() => dismiss(item.key)}
              />
            ))}
          </div>
        ) : null}
        {limitReached ? (
          <p className="t-sm text-warning" role="status">
            You can upload up to 20 files per project.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id={rightsId}
              checked={rights}
              onCheckedChange={(checked) => setRights(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor={rightsId} className="flex flex-col">
              <span className="t-label text-ink">
                I have the right to use these photos
              </span>
              <span className="t-sm text-ink-2">
                {uploadRightsNote}
              </span>
            </label>
          </div>
          <input
            ref={browseRef}
            type="file"
            accept={PHOTO_TYPES}
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              upload(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
          />
          <Button
            variant="secondary"
            className="self-start"
            disabled={!rights || !online}
            onClick={() => browseRef.current?.click()}
          >
            <UploadIcon data-icon="inline-start" />
            Upload photos
          </Button>
        </div>
      </SheetBody>
      {confirmLikeness ? (
        <div className="flex items-start gap-3 border-t border-border px-5 py-3">
          <Checkbox
            id={likenessId}
            checked={likeness}
            disabled={!selected}
            onCheckedChange={(checked) =>
              setLikenessFor(checked === true ? selected : null)
            }
            aria-describedby={`${likenessId}-caption`}
            className="mt-0.5"
          />
          <label htmlFor={likenessId} className="flex flex-col">
            <span className="t-sm text-ink">
              This is me, someone who agreed to appear in AI video, or a
              character I have the rights to.
            </span>
            <span id={`${likenessId}-caption`} className="t-caption text-ink-3">
              Never a real public figure or anyone under 18.
            </span>
          </label>
        </div>
      ) : null}
      <div className="flex justify-end gap-3 border-t border-border bg-canvas px-5 py-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!canUse}
          onClick={() => {
            if (!canUse || !selected) return;
            onConfirm(selected);
          }}
        >
          Use this
        </Button>
      </div>
    </>
  );
}

function PhotoOption({
  photo,
  selected,
  tabbable,
  usedBy,
  onSelect,
}: {
  photo: ProjectAsset;
  selected: boolean;
  tabbable: boolean;
  usedBy: string[];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabbable ? 0 : -1}
      data-option={photo.id}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface text-left transition-shadow duration-120',
        selected && 'border-ink ring-1 ring-ink',
      )}
    >
      <MediaThumb asset={photo} className="aspect-4/5 w-full" sizes="160px" />
      <span className="flex flex-col px-2.5 py-2">
        <span className="t-caption truncate font-medium text-ink">
          {photo.fileName}
        </span>
        {usedBy.length ? (
          <span className="t-caption truncate text-ink-3">
            For {usedBy.join(', ')}
          </span>
        ) : null}
      </span>
      {selected ? (
        <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-ink text-white">
          <CheckIcon
            aria-hidden="true"
            className="size-3.5"
            strokeWidth={2.5}
          />
        </span>
      ) : null}
    </button>
  );
}
