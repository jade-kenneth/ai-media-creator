import { Module } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';
import { SchedulerLocksModule } from '../scheduler-locks/scheduler-locks.module';
import { GenerationJobHandlers } from './generation-job-handlers';
import { GenerationJobsResolver } from './generation-jobs.resolver';
import { GenerationJobsRunner } from './generation-jobs.runner';
import { GenerationJobsService } from './generation-jobs.service';
import { GenerationJobsRepositoryModule } from './repositories/generation-jobs.repository.module';

@Module({
  imports: [
    GenerationJobsRepositoryModule,
    CreditsModule,
    SchedulerLocksModule,
  ],
  providers: [
    GenerationJobsService,
    GenerationJobHandlers,
    GenerationJobsRunner,
    GenerationJobsResolver,
  ],
  // Workers are not provided here: each process registers only the worker for
  // the queue it owns (GenerationJobsWorker in AppModule, MediaJobsWorker in
  // MediaWorkerModule), so importing this module never starts a poller.
  exports: [GenerationJobsService, GenerationJobHandlers, GenerationJobsRunner],
})
export class GenerationJobsModule {}
