import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { FactsModule } from '../facts/facts.module';
import { GenerationJobsModule } from '../generation-jobs/generation-jobs.module';
import { ProjectsModule } from '../projects/projects.module';
import { RenderModule } from '../render/render.module';
import { S3Module } from '../s3/s3.module';
import { ScriptsModule } from '../scripts/scripts.module';
import { VoiceModule } from '../voice/voice.module';
import { VoiceTracksModule } from '../voice-tracks/voice-tracks.module';
import { VideoEditsRepositoryModule } from './repositories/video-edits.repository.module';
import { VideoEditsResolver } from './video-edits.resolver';
import { VideoEditsService } from './video-edits.service';
import { VoiceoverJobsHandler } from './voiceover-jobs.handler';

@Module({
  imports: [
    VideoEditsRepositoryModule,
    ProjectsModule,
    ScriptsModule,
    AssetsModule,
    FactsModule,
    GenerationJobsModule,
    VoiceModule,
    VoiceTracksModule,
    RenderModule,
    S3Module,
  ],
  // The voice job handler registers in every process that imports this
  // module; only the media worker claims its job types.
  providers: [VideoEditsService, VideoEditsResolver, VoiceoverJobsHandler],
  exports: [VideoEditsService],
})
export class VideoEditsModule {}
