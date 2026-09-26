'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  CircleAlertIcon,
  FilmIcon,
  LockIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useId, useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';

import {
  Alert,
  AlertContent,
  AlertDescription,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { AssetKind, AssetOrigin } from '@/react-query/generated__types';
import {
  assetsQueryKeys,
  useProjectAssetsQuery,
  useRemoveAssetMutation,
  type ProjectAsset,
} from '@/react-query/assets/assets-operations';
import { projectsQueryKeys } from '@/react-query/projects/projects-operations';
import { formatFileSize } from '@/utils/date';

import { ACCEPTED_TYPES, useAssetUploads, type LocalUpload } from './use-asset-uploads';

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4';

export function MediaCard({ projectId, online }: { projectId: string; online: boolean }) {
  const queryClient = useQueryClient();
  const assets = useProjectAssetsQuery({ projectId });
  // The creator's own uploads; AI scene clips live only in the Media picker.
  const ready = (assets.data?.projectAssets ?? []).filter(
    (asset) => asset.origin !== AssetOrigin.AiClip,
  );
  const { uploads, upload, cancel, dismiss, limitReached } = useAssetUploads(
    projectId,
    ready.length,
  );
  const [rights, setRights] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [removing, setRemoving] = useState<ProjectAsset | null>(null);
  const [replacing, setReplacing] = useState<ProjectAsset | null>(null);
  const browseRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const rightsId = useId();
  const locked = !rights || !online;

  const remove = useRemoveAssetMutation({
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: assetsQueryKeys.list(projectId) }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(projectId) }),
      ]);
      toast.success(`Removed ${removing?.fileName ?? 'file'}.`);
      setRemoving(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (locked) return;
    upload(Array.from(event.dataTransfer.files));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle>Photos and clips</CardTitle>
          <CardDescription>Used as scene visuals later. Stored once per project.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="gap-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id={rightsId}
            checked={rights}
            onCheckedChange={(checked) => setRights(checked === true)}
            className="mt-0.5"
          />
          <label htmlFor={rightsId} className="flex flex-col">
            <span className="t-label text-ink">I have the right to use these photos and clips</span>
            <span className="t-sm text-ink-2">
              Only upload media you own or have permission to use in ads.
            </span>
          </label>
        </div>

        <div
          role="group"
          aria-disabled={locked || undefined}
          aria-label="Upload photos and clips"
          onDragOver={(event) => {
            event.preventDefault();
            if (!locked) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border-[1.5px] border-dashed border-border-strong bg-canvas p-8 text-center transition-colors duration-120 max-sm:p-6',
            dragging && 'border-solid border-ink bg-surface',
            locked && 'opacity-60',
          )}
        >
          {locked ? (
            <LockIcon aria-hidden="true" className="size-6 text-ink-2" />
          ) : (
            <UploadIcon aria-hidden="true" className="size-6 text-ink-2" />
          )}
          {locked ? (
            <p className="t-body">
              {online ? 'Confirm your rights to upload' : 'Uploads need a connection'}
            </p>
          ) : (
            <p className="t-body">
              Drag photos or clips here, or{' '}
              <button
                type="button"
                onClick={() => browseRef.current?.click()}
                className="font-medium text-flare-text underline underline-offset-2"
              >
                browse your files
              </button>
            </p>
          )}
          <p className="t-caption text-ink-3">
            JPG, PNG or WebP up to 10 MB · MP4 or MOV up to 100 MB and 60
            seconds · up to 20 files
          </p>
          <input
            ref={browseRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            className="sr-only"
            tabIndex={-1}
            disabled={locked}
            onChange={(event) => {
              upload(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
          />
          <input
            ref={replaceRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && replacing) upload([file], replacing.id);
              setReplacing(null);
              event.target.value = '';
            }}
          />
        </div>

        {limitReached ? (
          <Alert variant="warning">
            <TriangleAlertIcon />
            <AlertContent>
              <AlertDescription className="text-ink">
                You can upload up to 20 files per project.
              </AlertDescription>
            </AlertContent>
          </Alert>
        ) : null}

        {assets.isPending ? (
          <div className={GRID} aria-busy="true" aria-label="Loading files">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="aspect-4/5 rounded-lg" />
            ))}
          </div>
        ) : ready.length + uploads.length > 0 ? (
          <ul className={GRID}>
            {ready.map((asset) => (
              <li key={asset.id}>
                <AssetTile
                  asset={asset}
                  disabled={!online}
                  onReplace={() => {
                    setReplacing(asset);
                    replaceRef.current?.click();
                  }}
                  onRemove={() => setRemoving(asset)}
                />
              </li>
            ))}
            {uploads.map((item) => (
              <li key={item.key}>
                <UploadTile upload={item} onCancel={() => cancel(item.key)} onDismiss={() => dismiss(item.key)} />
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>

      <Dialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setRemoving(null);
        }}
      >
        <DialogContent role="alertdialog">
          <DialogHeader>
            <DialogTitle>Remove {removing?.fileName}?</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              It won’t be used in new scripts or videos. This can’t be undone.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRemoving(null)} disabled={remove.isPending}>
              Keep file
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              aria-busy={remove.isPending}
              onClick={() => {
                if (!removing || remove.isPending) return;
                remove.mutate({ id: removing.id });
              }}
            >
              {remove.isPending ? <Spinner /> : null}
              {remove.isPending ? 'Removing…' : 'Remove file'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AssetTile({
  asset,
  disabled,
  onReplace,
  onRemove,
}: {
  asset: ProjectAsset;
  disabled: boolean;
  onReplace: () => void;
  onRemove: () => void;
}) {
  const isClip = asset.kind === AssetKind.Clip;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="relative aspect-4/5 bg-surface-sunken">
        {asset.previewUrl && !isClip ? (
          <Image src={asset.previewUrl} alt="" fill unoptimized sizes="200px" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <FilmIcon aria-hidden="true" className="size-5 text-ink-3" strokeWidth={1.75} />
          </div>
        )}
        {isClip && asset.durationSeconds ? (
          <span className="t-caption absolute bottom-2 left-2 rounded-full bg-black/70 px-2 font-mono text-white">
            {Math.round(asset.durationSeconds)} s
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-1 px-2.5 py-2">
        <div className="min-w-0 flex-1">
          <p className="t-caption truncate font-medium text-ink">{asset.fileName}</p>
          <p className="t-caption text-ink-3">
            {isClip && asset.durationSeconds
              ? `${Math.round(asset.durationSeconds)} s · ${formatFileSize(asset.sizeBytes)}`
              : formatFileSize(asset.sizeBytes)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label={`More actions for ${asset.fileName}`}
            >
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={onReplace}>
                <RefreshCwIcon />
                Replace
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                <Trash2Icon />
                Remove
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function UploadTile({
  upload,
  onCancel,
  onDismiss,
}: {
  upload: LocalUpload;
  onCancel: () => void;
  onDismiss: () => void;
}) {
  const failed = upload.status === 'failed';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-surface',
        failed ? 'border-danger-border' : 'border-border',
      )}
    >
      <div
        className={cn(
          'flex aspect-4/5 flex-col items-center justify-center gap-2 px-3',
          failed ? 'bg-danger-soft' : 'bg-surface-sunken',
        )}
      >
        {failed ? (
          <CircleAlertIcon aria-hidden="true" className="size-5 text-danger" />
        ) : (
          <>
            <div
              className="h-1 w-full overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-label={`Uploading ${upload.fileName}`}
              aria-valuenow={upload.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full origin-left bg-ink transition-transform duration-280 ease-out"
                style={{ transform: `scaleX(${upload.progress / 100})` }}
              />
            </div>
            <span className="t-mono text-ink-2">{upload.progress}%</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 px-2.5 py-2">
        <div className="min-w-0 flex-1">
          <p className="t-caption truncate font-medium text-ink">{upload.fileName}</p>
          <p className={cn('t-caption', failed ? 'text-danger' : 'text-ink-3')}>
            {failed ? upload.error : formatFileSize(upload.sizeBytes)}
          </p>
        </div>
        <Button variant="ghost" size="xs" onClick={failed ? onDismiss : onCancel}>
          {failed ? 'Dismiss' : 'Cancel'}
        </Button>
      </div>
    </div>
  );
}
