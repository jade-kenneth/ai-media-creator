import { Module } from '@nestjs/common';
import { SchedulerLocksRepositoryModule } from './repositories/scheduler-locks.repository.module';
import { SchedulerLockService } from './scheduler-lock.service';

@Module({
  imports: [SchedulerLocksRepositoryModule],
  providers: [SchedulerLockService],
  exports: [SchedulerLockService],
})
export class SchedulerLocksModule {}
