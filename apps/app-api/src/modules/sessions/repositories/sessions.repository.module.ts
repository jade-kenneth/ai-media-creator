import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { SessionsRepositoryFactory } from './sessions.repository';

@Module({
  providers: [
    {
      provide: TOKENS.SESSIONS_REPOSITORY,
      useFactory: SessionsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.SESSIONS_REPOSITORY],
})
export class SessionsRepositoryModule {}
