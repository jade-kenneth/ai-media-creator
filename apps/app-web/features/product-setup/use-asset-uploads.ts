'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  assetsQueryKeys,
  completeAssetUploadRequest,
  createAssetUploadRequest,
  removeAssetRequest,
} from '@/react-query/assets/assets-operations';
import { AssetPurpose } from '@/react-query/generated__types';
import { projectsQueryKeys } from '@/react-query/projects/projects-operations';

/** Upload limits (open decision 14; demo values). */
export const UPLOAD_LIMITS = {
  photoBytes: 10 * 1024 * 1024,
  clipBytes: 100 * 1024 * 1024,
  clipSeconds: 60,
  files: 20,
} as const;

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CLIP_TYPES = ['video/mp4', 'video/quicktime'];
export const ACCEPTED_TYPES = [...PHOTO_TYPES, ...CLIP_TYPES].join(',');

export interface LocalUpload {
  key: string;
  fileName: string;
  sizeBytes: number;
  isClip: boolean;
  status: 'uploading' | 'failed';
  progress: number;
  error?: string;
  replacesAssetId?: string;
}

/** Reads a clip's or audio file's length in the browser (advisory). */
export function readMediaDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };

    video.preload = 'metadata';
    video.onloadedmetadata = () =>
      done(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}

export function putWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
  register: (xhr: XMLHttpRequest) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    register(xhr);
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error('Upload failed. Try again.'));
    xhr.onerror = () => reject(new Error('Upload failed. Try again.'));
    xhr.onabort = () => reject(new DOMException('Cancelled', 'AbortError'));
    xhr.send(file);
  });
}

/**
 * Uploads straight to storage with a presigned PUT (the server chose the key)
 * and per-file progress, then confirms with the API. Validation here is
 * feedback only; the API re-checks type, size and the file limit.
 */
export function useAssetUploads(projectId: string, readyCount: number) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<LocalUpload[]>([]);
  const requests = useRef(new Map<string, { xhr?: XMLHttpRequest; assetId?: string }>());
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    const active = requests.current;

    return () => {
      active.forEach(({ xhr }) => xhr?.abort());
    };
  }, []);

  const patch = (key: string, changes: Partial<LocalUpload>) =>
    setUploads((current) =>
      current.map((upload) => (upload.key === key ? { ...upload, ...changes } : upload)),
    );

  const refresh = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: assetsQueryKeys.list(projectId) }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(projectId) }),
      ]),
    [projectId, queryClient],
  );

  const uploadOne = useCallback(
    async (file: File, replacesAssetId?: string) => {
      const key = crypto.randomUUID();
      const isClip = CLIP_TYPES.includes(file.type);
      const base: LocalUpload = {
        key,
        fileName: file.name,
        sizeBytes: file.size,
        isClip,
        status: 'uploading',
        progress: 0,
        replacesAssetId,
      };

      const fail = (error: string) =>
        setUploads((current) => [
          ...current.filter((upload) => upload.key !== key),
          { ...base, status: 'failed', error },
        ]);

      if (!PHOTO_TYPES.includes(file.type) && !isClip) {
        fail('This file type isn’t supported.');
        return;
      }
      if (!isClip && file.size > UPLOAD_LIMITS.photoBytes) {
        fail('Larger than 10 MB.');
        return;
      }
      if (isClip && file.size > UPLOAD_LIMITS.clipBytes) {
        fail('Larger than 100 MB.');
        return;
      }

      const duration = isClip ? await readMediaDuration(file) : null;

      if (duration !== null && duration > UPLOAD_LIMITS.clipSeconds) {
        fail('Clips can be up to 60 seconds.');
        return;
      }

      setUploads((current) => [...current, base]);
      requests.current.set(key, {});

      try {
        const ticket = await createAssetUploadRequest({
          input: {
            projectId,
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            durationSeconds: duration,
            rightsConfirmed: true,
            replacesAssetId,
          },
        });
        const assetId = ticket.createAssetUpload.asset.id;
        requests.current.set(key, { assetId });

        await putWithProgress(
          ticket.createAssetUpload.uploadUrl,
          file,
          (percent) => patch(key, { progress: percent }),
          (xhr) => requests.current.set(key, { xhr, assetId }),
        );
        await completeAssetUploadRequest({ id: assetId });
        await refresh();
        setUploads((current) => current.filter((upload) => upload.key !== key));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setUploads((current) => current.filter((upload) => upload.key !== key));
          return;
        }
        patch(key, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Upload failed. Try again.',
        });
      } finally {
        requests.current.delete(key);
      }
    },
    [projectId, refresh],
  );

  const upload = useCallback(
    (files: File[], replacesAssetId?: string) => {
      const inProgress = uploads.filter((item) => item.status === 'uploading').length;
      const room = replacesAssetId
        ? files.length
        : Math.max(0, UPLOAD_LIMITS.files - readyCount - inProgress);

      setLimitReached(!replacesAssetId && files.length > room);
      files.slice(0, room).forEach((file) => void uploadOne(file, replacesAssetId));
    },
    [readyCount, uploadOne, uploads],
  );

  const cancel = useCallback(
    (key: string) => {
      const request = requests.current.get(key);

      request?.xhr?.abort();
      if (request?.assetId) {
        void removeAssetRequest({ id: request.assetId }).catch(() => undefined);
      }
      setUploads((current) => current.filter((upload) => upload.key !== key));
    },
    [],
  );

  const dismiss = useCallback((key: string) => {
    setUploads((current) => current.filter((upload) => upload.key !== key));
  }, []);

  return { uploads, upload, cancel, dismiss, limitReached };
}

/** Audio upload limits (open decision 18; demo values). */
export const AUDIO_LIMITS = {
  bytes: 20 * 1024 * 1024,
  recordingSeconds: 90,
} as const;

export const AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
].join(',');

export interface AudioUploadState {
  fileName: string;
  sizeBytes: number;
  status: 'uploading' | 'failed';
  progress: number;
  error?: string;
}

/**
 * Uploads one narration recording or music track (the project keeps one of
 * each; the server replaces the previous file once the new one is stored).
 * Validation here is feedback only; the API re-checks type, size and length.
 */
export function useAudioUpload(
  projectId: string,
  purpose: AssetPurpose.Recording | AssetPurpose.Music,
  onStored: () => Promise<unknown> | void,
) {
  const [state, setState] = useState<AudioUploadState | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const onStoredRef = useRef(onStored);

  useEffect(() => {
    onStoredRef.current = onStored;
  }, [onStored]);

  useEffect(() => () => xhrRef.current?.abort(), []);

  const upload = useCallback(
    async (file: File) => {
      const base = { fileName: file.name, sizeBytes: file.size, progress: 0 };
      const fail = (error: string) =>
        setState({ ...base, status: 'failed', error });

      if (!AUDIO_TYPES.split(',').includes(file.type)) {
        fail('This file type isn’t supported.');
        return;
      }
      if (file.size > AUDIO_LIMITS.bytes) {
        fail('Larger than 20 MB.');
        return;
      }

      const duration = await readMediaDuration(file);

      if (
        purpose === AssetPurpose.Recording &&
        duration !== null &&
        duration > AUDIO_LIMITS.recordingSeconds
      ) {
        fail('Recordings can be up to 90 seconds.');
        return;
      }

      setState({ ...base, status: 'uploading' });

      try {
        const ticket = await createAssetUploadRequest({
          input: {
            projectId,
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            durationSeconds: duration,
            rightsConfirmed: true,
            purpose,
          },
        });

        await putWithProgress(
          ticket.createAssetUpload.uploadUrl,
          file,
          (progress) =>
            setState((current) => (current ? { ...current, progress } : current)),
          (xhr) => {
            xhrRef.current = xhr;
          },
        );
        await completeAssetUploadRequest({ id: ticket.createAssetUpload.asset.id });
        await onStoredRef.current();
        setState(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setState(null);
          return;
        }
        fail(error instanceof Error ? error.message : 'Upload failed. Try again.');
      } finally {
        xhrRef.current = null;
      }
    },
    [projectId, purpose],
  );

  const cancel = useCallback(() => xhrRef.current?.abort(), []);
  const dismiss = useCallback(() => setState(null), []);

  return { state, upload, cancel, dismiss };
}
