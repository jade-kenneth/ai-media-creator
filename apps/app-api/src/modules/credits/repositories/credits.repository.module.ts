import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { CreditsLedgerRepositoryFactory } from './credits-ledger.repository';
import { CreditsRepositoryFactory } from './credits.repository';

@Module({
  providers: [
    {
      provide: TOKENS.CREDITS_REPOSITORY,
      useFactory: CreditsRepositoryFactory,
      inject: [getConnectionToken()],
    },
    {
      provide: TOKENS.CREDITS_LEDGER_REPOSITORY,
      useFactory: CreditsLedgerRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.CREDITS_REPOSITORY, TOKENS.CREDITS_LEDGER_REPOSITORY],
})
export class CreditsRepositoryModule {}
