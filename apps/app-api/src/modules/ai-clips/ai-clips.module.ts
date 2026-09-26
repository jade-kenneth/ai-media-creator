import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { FactsModule } from '../facts/facts.module';
import { GenerationJobsModule } from '../generation-jobs/generation-jobs.module';
import { ProjectsModule } from '../projects/projects.module';
import { RenderModule } from '../render/render.module';
import { S3Module } from '../s3/s3.module';
import { VideoEditsModule } from '../video-edits/video-edits.module';
import { VideoModule } from '../video/video.module';
import { AiClipJobsHandler } from './ai-clip-jobs.handler';
import { AiClipsResolver } from './ai-clips.resolver';
import { AiClipsService } from './ai-clips.service';

@Module({
  imports: [
    ProjectsModule,
    VideoEditsModule,
    AssetsModule,
    FactsModule,
    GenerationJobsModule,
    RenderModule,
    S3Module,
    VideoModule,
  ],
  // The clip job handler registers in every process that imports this
  // module; only the media worker claims its job type.
  providers: [AiClipsService, AiClipsResolver, AiClipJobsHandler],
})
export class AiClipsModule {}
