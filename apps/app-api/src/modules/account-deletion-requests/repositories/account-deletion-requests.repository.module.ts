import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { AccountDeletionRequestsRepositoryFactory } from './account-deletion-requests.repository';

@Module({
  providers: [
    {
      provide: TOKENS.ACCOUNT_DELETION_REQUESTS_REPOSITORY,
      useFactory: AccountDeletionRequestsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.ACCOUNT_DELETION_REQUESTS_REPOSITORY],
})
export class AccountDeletionRequestsRepositoryModule {}
