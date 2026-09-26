import { Module } from '@nestjs/common';
import { AssetsModule } from '../assets/assets.module';
import { FactsModule } from '../facts/facts.module';
import { ProjectsModule } from '../projects/projects.module';
import { ScriptsModule } from '../scripts/scripts.module';
import { ProjectDuplicatesResolver } from './project-duplicates.resolver';
import { ProjectDuplicatesService } from './project-duplicates.service';

@Module({
  imports: [ProjectsModule, FactsModule, AssetsModule, ScriptsModule],
  providers: [ProjectDuplicatesService, ProjectDuplicatesResolver],
})
export class ProjectDuplicatesModule {}
