import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
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
});
