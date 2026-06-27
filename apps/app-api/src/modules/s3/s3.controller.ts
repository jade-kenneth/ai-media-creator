import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PresignedUploadUrlResponse, S3ConfigSummary } from './s3.service';
import { S3Service } from './s3.service';

interface CreatePresignedUploadUrlBody {
  contentType?: string;
  key?: string;
}

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
    @Body() body: CreatePresignedUploadUrlBody,
    @Query('expiresInSeconds', new ParseIntPipe({ optional: true }))
    expiresInSeconds?: number,
  ): Promise<PresignedUploadUrlResponse> {
    return this.s3Service.createPresignedUploadUrl(
      body.key ?? '',
      body.contentType ?? '',
      expiresInSeconds ?? 900,
    );
  }
}
