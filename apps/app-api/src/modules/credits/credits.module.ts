import { Module } from '@nestjs/common';
import { CreditsResolver } from './credits.resolver';
import { CreditsService } from './credits.service';
import { CreditsRepositoryModule } from './repositories/credits.repository.module';

@Module({
  imports: [CreditsRepositoryModule],
  providers: [CreditsService, CreditsResolver],
  exports: [CreditsService],
})
export class CreditsModule {}
