import { Module } from '@nestjs/common';
import { WaitlistRepositoryModule } from './repositories/waitlist.repository.module';
import { WaitlistResolver } from './waitlist.resolver';
import { WaitlistService } from './waitlist.service';

@Module({
  imports: [WaitlistRepositoryModule],
  providers: [WaitlistService, WaitlistResolver],
  exports: [WaitlistService],
})
export class WaitlistModule {}
