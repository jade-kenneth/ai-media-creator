'use client';

import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { store } from '@/providers/AuthProvider/store';
import Image from 'next/image';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

type ImageUploadFieldProps = {
  disabled?: boolean;
  errorMessage?: string;
  id: string;
  label: string;
  maxFileSizeBytes?: number;
  onChange: (value: string) => void;
  uploadPathPrefix?: string;
  value: string;
};

type PresignedUploadResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string | null;
};

export function ImageUploadField({
  disabled = false,
  errorMessage,
  id,
  label,
  maxFileSizeBytes = MAX_FILE_SIZE_BYTES,
  onChange,
  uploadPathPrefix = 'uploads',
  value,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const hasImage = value.trim().length > 0;

  async function handleFileChange(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    if (file.size > maxFileSizeBytes) {
      const limitMb = Math.round(maxFileSizeBytes / (1024 * 1024));
      toast.error(`Image must be smaller than ${limitMb} MB.`);
      return;
    }

    setIsUploading(true);

    try {
      const graphqlUrl =
        process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3001/graphql';
      const apiBaseUrl = graphqlUrl.replace(/\/graphql\/?$/, '');
      const auth = await store.get('accessToken');
      const key = `${uploadPathPrefix.replace(/^\/+|\/+$/g, '')}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

      const presignedResponse = await fetch(
        `${apiBaseUrl}/files/presigned-upload-url?expiresInSeconds=900`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
          },
          body: JSON.stringify({
            key,
            contentType: file.type,
          }),
        },
      );

      if (!presignedResponse.ok) {
        throw new Error('Unable to prepare image upload.');
      }

      const presignedData =
        (await presignedResponse.json()) as PresignedUploadResponse;

      const uploadResponse = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Image upload failed.');
      }

      const uploadedImageUrl =
        presignedData.publicUrl ?? presignedData.uploadUrl.split('?')[0];

      onChange(uploadedImageUrl);
      toast.success('Image uploaded successfully.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to upload image right now.',
      );
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void handleFileChange(event.target.files?.[0] ?? null);
          }}
          disabled={disabled || isUploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload data-icon="inline-start" />
              Upload image
            </>
          )}
        </Button>
        {hasImage ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange('')}
            disabled={disabled || isUploading}
          >
            <Trash2 data-icon="inline-start" />
            Remove
          </Button>
        ) : null}
      </div>

      {hasImage ? (
        <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/20">
          <Image
            src={value}
            alt="Selected cover image"
            className="h-40 w-full object-cover"
            width={400}
            height={160}
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/10 text-sm text-muted-foreground">
          <ImageIcon className="mr-2 size-4" />
          No image selected
        </div>
      )}

      {errorMessage ? (
        <p className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
