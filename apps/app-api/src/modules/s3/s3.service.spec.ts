import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import {
  buildAiClipFrameStorageKey,
  buildAiClipStorageKey,
} from '../ai-clips/ai-clip-storage';
import { S3Service } from './s3.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('S3Service', () => {
  const configService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_REGION: 'ap-southeast-1',
        AWS_S3_BUCKET: 'test-bucket',
        AWS_S3_PUBLIC_BASE_URL: 'https://cdn.example.com/uploads/',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
      };

      return config[key];
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(getSignedUrl)
      .mockResolvedValue('https://s3.example.com/upload');
  });

  it('generates the S3 object key instead of using a caller-supplied key', async () => {
    const service = new S3Service(configService);

    const response = await service.createPresignedUploadUrl(
      'avatars',
      'image/png',
      900,
    );

    expect(response.key).toMatch(
      /^avatars\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
    );
    expect(response.publicUrl).toBe(
      `https://cdn.example.com/uploads/${response.key}`,
    );
    expect(getSignedUrl).toHaveBeenCalledTimes(1);

    const command = jest.mocked(getSignedUrl).mock.calls[0]?.[1];

    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(JSON.stringify(command)).toContain(response.key);
    expect(JSON.stringify(command)).not.toContain('photo.png');
  });

  it.each([
    [
      'a photo or clip',
      `projects/${'a'.repeat(24)}/assets/${'b'.repeat(24)}.jpg`,
    ],
    [
      'a recording or music track',
      `projects/${'a'.repeat(24)}/audio/${'b'.repeat(24)}.m4a`,
    ],
    [
      'an export video',
      `projects/${'a'.repeat(24)}/exports/${'b'.repeat(24)}.mp4`,
    ],
    [
      'an export poster',
      `projects/${'a'.repeat(24)}/exports/${'b'.repeat(24)}.jpg`,
    ],
    [
      'a voiceover segment',
      `projects/${'a'.repeat(24)}/voice/${'c'.repeat(24)}/${'d'.repeat(24)}.mp3`,
    ],
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index): [string, string] => [
      `AI clip input frame ${index} built by the clip handler`,
      buildAiClipFrameStorageKey('a'.repeat(24), 'b'.repeat(24), index),
    ]),
    [
      'an AI-generated clip built by the clip handler',
      buildAiClipStorageKey('a'.repeat(24), 'b'.repeat(24)),
    ],
  ])('signs private keys for %s', async (_label, key) => {
    const service = new S3Service(configService);

    await expect(service.createPresignedGetUrl(key)).resolves.toBe(
      'https://s3.example.com/upload',
    );
  });

  it.each([
    `projects/${'a'.repeat(24)}/exports/${'b'.repeat(24)}.mov`,
    `projects/${'a'.repeat(24)}/audio/../${'b'.repeat(24)}.m4a`,
    `projects/not-an-id/audio/${'b'.repeat(24)}.m4a`,
    `projects/${'a'.repeat(24)}/voice/${'c'.repeat(24)}/${'d'.repeat(24)}.wav`,
    `projects/${'a'.repeat(24)}/ai-clips/${'b'.repeat(24)}.jpg`,
    `projects/${'a'.repeat(24)}/ai-clips/${'b'.repeat(24)}-frame.mp4`,
    `projects/${'a'.repeat(24)}/ai-clips/${'b'.repeat(24)}-frame.jpg`,
    `projects/${'a'.repeat(24)}/ai-clips/${'b'.repeat(24)}-frame-9.jpg`,
    `projects/${'a'.repeat(24)}/ai-clips/${'b'.repeat(24)}-frame-0.mp4`,
    `projects/${'a'.repeat(24)}/ai-clips/${'b'.repeat(24)}-frame-01.jpg`,
    `projects/${'a'.repeat(24)}/ai-clips/../${'b'.repeat(24)}.mp4`,
    'avatars/anything.png',
  ])('refuses any other key shape: %s', async (key) => {
    const service = new S3Service(configService);

    await expect(service.createPresignedGetUrl(key)).rejects.toThrow(
      'Invalid storage key.',
    );
  });

  it('builds no frame key past the nine references a clip can send', () => {
    expect(() =>
      buildAiClipFrameStorageKey('a'.repeat(24), 'b'.repeat(24), 9),
    ).toThrow('Clip frame index 9 is out of range.');
  });

  it('streams a private object into a task-owned file', async () => {
    const service = new S3Service(configService);
    const directory = await mkdtemp(join(tmpdir(), 's3-service-'));
    const path = join(directory, 'input.mp4');
    const key = `projects/${'a'.repeat(24)}/exports/${'b'.repeat(24)}.mp4`;
    const send = jest.fn(async () => ({
      Body: Readable.from([Buffer.from('video bytes')]),
    }));
    Object.defineProperty(service, 'client', { value: { send } });

    try {
      await expect(service.downloadObjectToFile(key, path)).resolves.toBe(true);
      await expect(readFile(path, 'utf8')).resolves.toBe('video bytes');
      expect(send).toHaveBeenCalledTimes(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
