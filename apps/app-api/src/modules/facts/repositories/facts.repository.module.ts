import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { FactsRepositoryFactory } from './facts.repository';

@Module({
  providers: [
    {
      provide: TOKENS.FACTS_REPOSITORY,
      useFactory: FactsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.FACTS_REPOSITORY],
})
export class FactsRepositoryModule {}
