import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { PushTokensRepositoryFactory } from './push-tokens.repository';

@Module({
  providers: [
    {
      provide: TOKENS.PUSH_TOKENS_REPOSITORY,
      useFactory: PushTokensRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.PUSH_TOKENS_REPOSITORY],
})
export class PushTokensRepositoryModule {}
