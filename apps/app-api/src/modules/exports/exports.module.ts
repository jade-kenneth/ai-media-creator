import { Module } from '@nestjs/common';
import { GenerationJobsModule } from '../generation-jobs/generation-jobs.module';
import { ProjectsModule } from '../projects/projects.module';
import { RenderModule } from '../render/render.module';
import { S3Module } from '../s3/s3.module';
import { VideoEditsModule } from '../video-edits/video-edits.module';
import { ExportsResolver } from './exports.resolver';
import { ExportsService } from './exports.service';
import { ExportsRepositoryModule } from './repositories/exports.repository.module';

@Module({
  imports: [
    ExportsRepositoryModule,
    ProjectsModule,
    VideoEditsModule,
    GenerationJobsModule,
    RenderModule,
    S3Module,
  ],
  // ExportsService registers the render handler in every process that
  // imports this module; only the media worker claims render jobs.
  providers: [ExportsService, ExportsResolver],
  exports: [ExportsService],
})
export class ExportsModule {}
