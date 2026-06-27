import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { SchedulerLocksRepositoryFactory } from './scheduler-locks.repository';

@Module({
  providers: [
    {
      provide: TOKENS.SCHEDULER_LOCKS_REPOSITORY,
      useFactory: SchedulerLocksRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.SCHEDULER_LOCKS_REPOSITORY],
})
export class SchedulerLocksRepositoryModule {}
