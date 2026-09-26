import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { GenerationJobsRepositoryFactory } from './generation-jobs.repository';

@Module({
  providers: [
    {
      provide: TOKENS.GENERATION_JOBS_REPOSITORY,
      useFactory: GenerationJobsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.GENERATION_JOBS_REPOSITORY],
})
export class GenerationJobsRepositoryModule {}
