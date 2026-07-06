import { createPresignedUploadUrlBodySchema } from './s3.validation';

describe('createPresignedUploadUrlBodySchema', () => {
  it('accepts supported image uploads under allowed folders', () => {
    expect(
      createPresignedUploadUrlBodySchema.parse({
        uploadPathPrefix: 'gallery',
        contentType: 'IMAGE/WEBP',
      }),
    ).toEqual({
      uploadPathPrefix: 'gallery',
      contentType: 'image/webp',
    });
  });

  it('rejects object keys outside allowed upload folders', () => {
    const result = createPresignedUploadUrlBodySchema.safeParse({
      uploadPathPrefix: 'private',
      contentType: 'image/jpeg',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['uploadPathPrefix'],
          message: 'uploadPathPrefix must be an allowed upload folder.',
        }),
      ]),
    );
  });

  it('rejects traversal and absolute upload prefixes', () => {
    for (const uploadPathPrefix of ['../gallery', '/gallery']) {
      const result = createPresignedUploadUrlBodySchema.safeParse({
        uploadPathPrefix,
        contentType: 'image/jpeg',
      });

      expect(result.success).toBe(false);
    }
  });

  it('rejects unsupported content types', () => {
    const result = createPresignedUploadUrlBodySchema.safeParse({
      uploadPathPrefix: 'gallery',
      contentType: 'image/svg+xml',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['contentType'],
          message: 'contentType must be a supported image MIME type.',
        }),
      ]),
    );
  });

  it('rejects caller-supplied keys instead of upload prefixes', () => {
    const result = createPresignedUploadUrlBodySchema.safeParse({
      uploadPathPrefix: 'gallery/photo.png',
      contentType: 'image/jpeg',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['uploadPathPrefix'],
          message: 'uploadPathPrefix must be an allowed upload folder.',
        }),
      ]),
    );
  });
});
