import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { ExportsRepositoryFactory } from './exports.repository';

@Module({
  providers: [
    {
      provide: TOKENS.EXPORTS_REPOSITORY,
      useFactory: ExportsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.EXPORTS_REPOSITORY],
})
export class ExportsRepositoryModule {}
