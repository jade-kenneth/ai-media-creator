import { Module } from '@nestjs/common';
import { SchedulerLocksRepositoryModule } from './repositories/scheduler-locks.repository.module';
import { SchedulerLocksService } from './scheduler-locks.service';

@Module({
  imports: [SchedulerLocksRepositoryModule],
  providers: [SchedulerLocksService],
  exports: [SchedulerLocksService],
})
export class SchedulerLocksModule {}
