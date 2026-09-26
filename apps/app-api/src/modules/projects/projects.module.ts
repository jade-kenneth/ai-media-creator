import { Module } from '@nestjs/common';
import { GenerationJobsModule } from '../generation-jobs/generation-jobs.module';
import { S3Module } from '../s3/s3.module';
import { TextGenerationModule } from '../text-generation/text-generation.module';
import { AngleSuggestionsHandler } from './angle-suggestions.handler';
import { AudienceSuggestionsHandler } from './audience-suggestions.handler';
import { PremiseSuggestionsHandler } from './premise-suggestions.handler';
import { ProductImportService } from './product-import.service';
import { ProjectsResolver } from './projects.resolver';
import { ProjectsService } from './projects.service';
import { ProjectsRepositoryModule } from './repositories/projects.repository.module';

@Module({
  imports: [
    ProjectsRepositoryModule,
    GenerationJobsModule,
    S3Module,
    TextGenerationModule,
  ],
  providers: [
    ProjectsService,
    ProductImportService,
    AngleSuggestionsHandler,
    AudienceSuggestionsHandler,
    PremiseSuggestionsHandler,
    ProjectsResolver,
  ],
  exports: [ProjectsService],
})
export class ProjectsModule {}
