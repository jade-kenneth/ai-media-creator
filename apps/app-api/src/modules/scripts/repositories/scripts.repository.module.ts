import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { ScriptsRepositoryFactory } from './scripts.repository';

@Module({
  providers: [
    {
      provide: TOKENS.SCRIPTS_REPOSITORY,
      useFactory: ScriptsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.SCRIPTS_REPOSITORY],
})
export class ScriptsRepositoryModule {}
