import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export const ALLOWED_UPLOAD_PREFIXES = [
  'announcements',
  'editor',
  'gallery',
  'organizations/logos',
  'uploads',
] as const;

const ALLOWED_CONTENT_TYPES_BY_EXTENSION: Record<string, string> = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const createPresignedUploadUrlBodySchema = z
  .object({
    uploadPathPrefix: z.string().trim().min(1, 'uploadPathPrefix is required.'),
    contentType: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'contentType is required.'),
  })
  .superRefine((input, context) => {
    const uploadPathPrefixIssue = validateUploadPathPrefix(
      input.uploadPathPrefix,
    );

    if (uploadPathPrefixIssue) {
      context.addIssue({
        code: 'custom',
        path: ['uploadPathPrefix'],
        message: uploadPathPrefixIssue,
      });
    }

    const contentTypeIssue = validateUploadContentType(input.contentType);

    if (contentTypeIssue) {
      context.addIssue({
        code: 'custom',
        path: ['contentType'],
        message: contentTypeIssue,
      });
    }
  })
  .strict();

export type CreatePresignedUploadUrlBody = z.infer<
  typeof createPresignedUploadUrlBodySchema
>;

export function validateCreatePresignedUploadUrlBody(
  input: CreatePresignedUploadUrlBody,
): CreatePresignedUploadUrlBody {
  const result = createPresignedUploadUrlBodySchema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  throw new BadRequestException({
    message: 'Input validation failed.',
    errors: result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    })),
  });
}

export function getUploadExtensionForContentType(
  contentType: string,
): string | null {
  const entry = Object.entries(ALLOWED_CONTENT_TYPES_BY_EXTENSION).find(
    ([extension, allowedContentType]) =>
      extension !== 'jpeg' && allowedContentType === contentType,
  );

  return entry?.[0] ?? null;
}

function validateUploadPathPrefix(uploadPathPrefix: string): string | null {
  if (uploadPathPrefix.startsWith('/') || uploadPathPrefix.startsWith('\\')) {
    return 'uploadPathPrefix must be relative.';
  }

  if (
    uploadPathPrefix.includes('..') ||
    uploadPathPrefix.includes('\\') ||
    uploadPathPrefix.includes('//')
  ) {
    return 'uploadPathPrefix cannot contain traversal or empty path segments.';
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(uploadPathPrefix)) {
    return 'uploadPathPrefix contains unsupported characters.';
  }

  if (!ALLOWED_UPLOAD_PREFIXES.some((prefix) => prefix === uploadPathPrefix)) {
    return 'uploadPathPrefix must be an allowed upload folder.';
  }

  return null;
}

function validateUploadContentType(contentType: string): string | null {
  if (
    !Object.values(ALLOWED_CONTENT_TYPES_BY_EXTENSION).includes(contentType)
  ) {
    return 'contentType must be a supported image MIME type.';
  }

  return null;
}
