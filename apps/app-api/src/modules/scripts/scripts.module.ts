import { Module } from '@nestjs/common';
import { FactsModule } from '../facts/facts.module';
import { GenerationJobsModule } from '../generation-jobs/generation-jobs.module';
import { ProjectsModule } from '../projects/projects.module';
import { TextGenerationModule } from '../text-generation/text-generation.module';
import { CreatorBriefService } from './creator-brief.service';
import { ScriptsRepositoryModule } from './repositories/scripts.repository.module';
import { ScriptJobsHandler } from './script-jobs.handler';
import { ScriptsResolver } from './scripts.resolver';
import { ScriptsService } from './scripts.service';

@Module({
  imports: [
    ScriptsRepositoryModule,
    ProjectsModule,
    FactsModule,
    GenerationJobsModule,
    TextGenerationModule,
  ],
  providers: [
    ScriptsService,
    CreatorBriefService,
    ScriptJobsHandler,
    ScriptsResolver,
  ],
  exports: [ScriptsService],
})
export class ScriptsModule {}
