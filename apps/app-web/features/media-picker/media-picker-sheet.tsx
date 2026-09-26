'use client';

import { useQueryClient } from '@tanstack/react-query';
import { CheckIcon, SparklesIcon, TypeIcon, UploadIcon } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { toast } from 'sonner';

import { MediaThumb } from '@/components/studio/media-thumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChoiceGroup } from '@/components/ui/choice-group';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { AiClipCheckDialog } from '@/features/ai-scene-clips/ai-clip-check-dialog';
import { UploadTile } from '@/features/product-setup/media-card';
import {
  ACCEPTED_TYPES,
  useAssetUploads,
} from '@/features/product-setup/use-asset-uploads';
import { useProject } from '@/features/project-workflow/workflow-state';
import { studioOf } from '@/lib/studios';
import { cn } from '@/lib/utils';
import { useCheckAiClipMutation } from '@/react-query/ai-clips/ai-clips-operations';
import {
  assetsQueryKeys,
  useProjectAssetsQuery,
  type ProjectAsset,
} from '@/react-query/assets/assets-operations';
import { AssetKind, AssetOrigin } from '@/react-query/generated__types';
import { formatFileSize } from '@/utils/date';

export type MediaPick = { kind: 'asset'; assetId: string } | { kind: 'text' };

type Filter = 'all' | 'photos' | 'clips' | 'ai';

const TEXT_CARD = 'text-card';

/**
 * Choose a scene's photo, clip or text card (Design Reference §5.12,
 * `media-picker-sheet`). Uploads run the Product uploader in place, with the
 * same rights confirmation, limits and tile states.
 */
export function MediaPickerSheet({
  open,
  onOpenChange,
  projectId,
  sceneNumber,
  current,
  usedIn,
  online,
  sceneId,
  aiClipsEnabled = false,
  onGenerate,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  sceneNumber: number;
  current: MediaPick | null;
  /** Scene numbers each upload is already used in. */
  usedIn: Map<string, number[]>;
  online: boolean;
  /** The scene being filled, so an AI clip made for another scene says so. */
  sceneId?: string;
  /** Shows Generate a clip (Design Reference §5C). */
  aiClipsEnabled?: boolean;
  onGenerate?: () => void;
  onConfirm: (pick: MediaPick) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined} className="sm:w-120">
        {open ? (
          <PickerBody
            projectId={projectId}
            sceneNumber={sceneNumber}
            current={current}
            usedIn={usedIn}
            online={online}
            sceneId={sceneId}
            onGenerate={aiClipsEnabled ? onGenerate : undefined}
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
  sceneNumber,
  current,
  usedIn,
  online,
  sceneId,
  onGenerate,
  onCancel,
  onConfirm,
}: {
  projectId: string;
  sceneNumber: number;
  current: MediaPick | null;
  usedIn: Map<string, number[]>;
  online: boolean;
  sceneId?: string;
  onGenerate?: () => void;
  onCancel: () => void;
  onConfirm: (pick: MediaPick) => void;
}) {
  const { uploadRightsNote } = studioOf(useProject().studio);
  const queryClient = useQueryClient();
  const assets = useProjectAssetsQuery({ projectId });
  const ready = assets.data?.projectAssets ?? [];
  const uploadCount = ready.filter((asset) => asset.origin !== AssetOrigin.AiClip).length;
  const hasAiClips = ready.some((asset) => asset.origin === AssetOrigin.AiClip);
  const { uploads, upload, cancel, dismiss, limitReached } = useAssetUploads(
    projectId,
    uploadCount,
  );
  const [checking, setChecking] = useState<ProjectAsset | null>(null);
  const checkClip = useCheckAiClipMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: assetsQueryKeys.list(projectId) });
      const clip = checking;
      setChecking(null);
      if (clip) onConfirm({ kind: 'asset', assetId: clip.id });
    },
    onError: (error) => toast.error(error.message),
  });
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(
    current?.kind === 'asset'
      ? current.assetId
      : current?.kind === 'text'
        ? TEXT_CARD
        : null,
  );
  const [rights, setRights] = useState(false);
  const browseRef = useRef<HTMLInputElement>(null);
  const rightsId = useId();

  const isAiClip = (asset: ProjectAsset) => asset.origin === AssetOrigin.AiClip;
  const shown = ready.filter(
    (asset) =>
      filter === 'all' ||
      (filter === 'photos'
        ? asset.kind === AssetKind.Photo
        : filter === 'clips'
          ? asset.kind === AssetKind.Clip && !isAiClip(asset)
          : isAiClip(asset)),
  );
  const options = [...shown.map((asset) => asset.id), TEXT_CARD];

  const onGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const next = event.key === 'Home' ? options[0] : options.at(-1);
      if (!next) return;
      setSelected(next);
      event.currentTarget
        .querySelector<HTMLElement>(`[data-option="${next}"]`)
        ?.focus();
      return;
    }

    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;

    if (!step) return;
    event.preventDefault();

    const index = Math.max(0, options.indexOf(selected ?? options[0]));
    const next = options[(index + step + options.length) % options.length];

    setSelected(next);
    event.currentTarget
      .querySelector<HTMLElement>(`[data-option="${next}"]`)
      ?.focus();
  };

  const tabStop = selected && options.includes(selected) ? selected : options[0];

  return (
    <>
      <SheetHeader>
        <SheetTitle>Choose media for scene {sceneNumber}</SheetTitle>
      </SheetHeader>
      <SheetBody className="flex flex-col gap-4">
        <ChoiceGroup<Filter>
          label="Show"
          variant="segment"
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'photos', label: 'Photos' },
            { value: 'clips', label: 'Clips' },
            ...(onGenerate || hasAiClips
              ? [{ value: 'ai' as const, label: 'AI clips' }]
              : []),
          ]}
        />

        {assets.isPending ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-5 text-ink-3" />
          </div>
        ) : assets.isError ? (
          <div className="flex flex-col items-start gap-3" role="alert">
            <p className="t-sm text-danger">
              We couldn’t load your uploads. Check your connection and try again.
            </p>
            <Button variant="secondary" size="sm" onClick={() => void assets.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            {ready.length === 0 ? (
              <p className="t-sm text-ink-2">No photos or clips yet.</p>
            ) : null}
            <div
              role="radiogroup"
              aria-label={`Media for scene ${sceneNumber}`}
              onKeyDown={onGridKey}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {shown.map((asset) => (
                <AssetOption
                  key={asset.id}
                  asset={asset}
                  selected={selected === asset.id}
                  tabbable={tabStop === asset.id}
                  usedIn={usedIn.get(asset.id) ?? []}
                  onSelect={() => setSelected(asset.id)}
                />
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={selected === TEXT_CARD}
                tabIndex={tabStop === TEXT_CARD ? 0 : -1}
                data-option={TEXT_CARD}
                onClick={() => setSelected(TEXT_CARD)}
                className={cn(
                  'relative flex aspect-4/5 flex-col items-center justify-center gap-1.5 rounded-lg bg-stage p-3 text-center transition-shadow duration-120',
                  selected === TEXT_CARD && 'ring-2 ring-ink ring-offset-2',
                )}
              >
                <TypeIcon aria-hidden="true" className="size-5 text-stage-ink-2" />
                <span className="t-label text-stage-ink">Text card</span>
                <span className="t-caption text-stage-ink-2">
                  Your on-screen text on a dark background.
                </span>
                {selected === TEXT_CARD ? <SelectedCheck /> : null}
              </button>
            </div>
          </>
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
                I have the right to use these photos and clips
              </span>
              <span className="t-sm text-ink-2">
                {uploadRightsNote}
              </span>
            </label>
          </div>
          <input
            ref={browseRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              upload(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!rights || !online}
              onClick={() => browseRef.current?.click()}
            >
              <UploadIcon data-icon="inline-start" />
              Upload photos or clips
            </Button>
            {onGenerate ? (
              <Button variant="secondary" disabled={!online} onClick={onGenerate}>
                <SparklesIcon data-icon="inline-start" />
                Generate a clip
              </Button>
            ) : null}
          </div>
        </div>
      </SheetBody>
      <div className="flex justify-end gap-3 border-t border-border bg-canvas px-5 py-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            const asset = ready.find((item) => item.id === selected);
            // An AI clip is checked once before its first use (R20).
            if (asset && isAiClip(asset) && !asset.aiClip?.checkedAt) {
              setChecking(asset);
              return;
            }
            onConfirm(
              selected === TEXT_CARD
                ? { kind: 'text' }
                : { kind: 'asset', assetId: selected },
            );
          }}
        >
          Use this
        </Button>
      </div>

      <AiClipCheckDialog
        key={checking?.id ?? 'none'}
        clip={checking}
        sceneNumber={sceneNumber}
        madeForAnotherScene={Boolean(
          checking?.aiClip && sceneId && checking.aiClip.sceneId !== sceneId,
        )}
        pending={checkClip.isPending}
        onCancel={() => setChecking(null)}
        onConfirm={() => {
          if (!checking || checkClip.isPending) return;
          checkClip.mutate({ id: checking.id });
        }}
      />
    </>
  );
}

function AssetOption({
  asset,
  selected,
  tabbable,
  usedIn,
  onSelect,
}: {
  asset: ProjectAsset;
  selected: boolean;
  tabbable: boolean;
  usedIn: number[];
  onSelect: () => void;
}) {
  const isClip = asset.kind === AssetKind.Clip;
  const aiClip = asset.origin === AssetOrigin.AiClip;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabbable ? 0 : -1}
      data-option={asset.id}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface text-left transition-shadow duration-120',
        selected && 'border-ink ring-1 ring-ink',
      )}
    >
      <MediaThumb asset={asset} className="aspect-4/5 w-full" sizes="160px" />
      {aiClip ? (
        <Badge dot={false} className="absolute top-2 left-2">
          AI clip
        </Badge>
      ) : null}
      <span className="flex flex-col px-2.5 py-2">
        <span className="t-caption truncate font-medium text-ink">{asset.fileName}</span>
        <span className="t-caption text-ink-3">
          {usedIn.length
            ? `In scene ${usedIn.join(', ')}`
            : aiClip && !asset.aiClip?.checkedAt
              ? 'Not checked yet'
              : isClip && asset.durationSeconds
              ? `${Math.round(asset.durationSeconds)} s · ${formatFileSize(asset.sizeBytes)}`
              : formatFileSize(asset.sizeBytes)}
        </span>
      </span>
      {selected ? <SelectedCheck /> : null}
    </button>
  );
}

function SelectedCheck() {
  return (
    <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-ink text-white">
      <CheckIcon aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}
