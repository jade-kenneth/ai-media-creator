import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface S3ConfigSummary {
  bucket: string;
  publicBaseUrl: string | null;
  region: string;
}

export interface PresignedUploadUrlResponse {
  expiresInSeconds: number;
  key: string;
  publicUrl: string | null;
  uploadUrl: string;
}

@Injectable()
export class S3Service {
  private readonly bucket: string;
  private readonly client: S3Client;
  private readonly publicBaseUrl: string | null;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');

    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error('AWS S3 configuration is incomplete.');
    }

    this.bucket = bucket;
    this.publicBaseUrl =
      this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL') ?? null;
    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  getConfigSummary(): S3ConfigSummary {
    return {
      region: this.configService.get<string>('AWS_REGION') ?? '',
      bucket: this.bucket,
      publicBaseUrl: this.publicBaseUrl,
    };
  }

  async createPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds: number,
  ): Promise<PresignedUploadUrlResponse> {
    const normalizedKey = key.trim();
    const normalizedContentType = contentType.trim();

    if (!normalizedKey) {
      throw new BadRequestException('key is required.');
    }

    if (!normalizedContentType) {
      throw new BadRequestException('contentType is required.');
    }

    if (
      !Number.isInteger(expiresInSeconds) ||
      expiresInSeconds < 1 ||
      expiresInSeconds > 3600
    ) {
      throw new BadRequestException(
        'expiresInSeconds must be an integer between 1 and 3600.',
      );
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: normalizedKey,
      ContentType: normalizedContentType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });

    return {
      key: normalizedKey,
      expiresInSeconds,
      uploadUrl,
      publicUrl: this.publicBaseUrl
        ? `${this.publicBaseUrl.replace(/\/+$/, '')}/${normalizedKey}`
        : null,
    };
  }
}
