import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'src/common/validation/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PresignedUploadUrlResponse, S3ConfigSummary } from './s3.service';
import { S3Service } from './s3.service';
import {
  createPresignedUploadUrlBodySchema,
  type CreatePresignedUploadUrlBody,
} from './s3.validation';

@Controller('files')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Get('config')
  getConfig(): S3ConfigSummary {
    return this.s3Service.getConfigSummary();
  }

  @Post('presigned-upload-url')
  @UseGuards(JwtAuthGuard)
  createPresignedUploadUrl(
    @Body(new ZodValidationPipe(createPresignedUploadUrlBodySchema))
    body: CreatePresignedUploadUrlBody,
    @Query('expiresInSeconds', new ParseIntPipe({ optional: true }))
    expiresInSeconds?: number,
  ): Promise<PresignedUploadUrlResponse> {
    return this.s3Service.createPresignedUploadUrl(
      body.uploadPathPrefix,
      body.contentType,
      expiresInSeconds ?? 900,
    );
  }
}
