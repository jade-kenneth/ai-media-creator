import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { ClaimCheckService } from './claim-check.service';
import { FactsResolver } from './facts.resolver';
import { FactsService } from './facts.service';
import { FactsRepositoryModule } from './repositories/facts.repository.module';

@Module({
  imports: [FactsRepositoryModule, ProjectsModule],
  providers: [FactsService, ClaimCheckService, FactsResolver],
  exports: [FactsService, ClaimCheckService],
})
export class FactsModule {}
