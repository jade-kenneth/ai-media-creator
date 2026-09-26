import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { AssetsRepositoryFactory } from './assets.repository';

@Module({
  providers: [
    {
      provide: TOKENS.ASSETS_REPOSITORY,
      useFactory: AssetsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.ASSETS_REPOSITORY],
})
export class AssetsRepositoryModule {}
