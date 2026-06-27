import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { WaitlistRepositoryFactory } from './waitlist.repository';

@Module({
  providers: [
    {
      provide: TOKENS.WAITLIST_REPOSITORY,
      useFactory: WaitlistRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.WAITLIST_REPOSITORY],
})
export class WaitlistRepositoryModule {}
