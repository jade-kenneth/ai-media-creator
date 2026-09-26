import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppLoggerService } from './common/logger/app-logger.service';
import { validateEnv } from './config/env.schema';
import {
  createMongoConnectionOptions,
  resolveEnvFilePaths,
} from './config/runtime-config';
import { GenerationJobsModule } from './modules/generation-jobs/generation-jobs.module';
import { MediaJobsWorker } from './modules/generation-jobs/generation-jobs.worker';
import { RenderToolchainCheck } from './modules/render/render.toolchain';
import { AiClipsModule } from './modules/ai-clips/ai-clips.module';
import { ExportsModule } from './modules/exports/exports.module';
import { S3Module } from './modules/s3/s3.module';
import { VideoEditsModule } from './modules/video-edits/video-edits.module';

/**
 * The media worker process (src/worker.ts): no HTTP or GraphQL server, only
 * the voice, render and AI clip job queue. Modules that own a media job type register
 * their handler on init, so they are imported here as they are built.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: resolveEnvFilePaths(),
      validate: validateEnv,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createMongoConnectionOptions(configService),
    }),
    ScheduleModule.forRoot(),
    GenerationJobsModule,
    S3Module,
    // Own the voice job handlers, the render handler and the AI clip handler.
    VideoEditsModule,
    ExportsModule,
    AiClipsModule,
  ],
  providers: [AppLoggerService, RenderToolchainCheck, MediaJobsWorker],
})
export class MediaWorkerModule {}
