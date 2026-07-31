import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { PaymentsRepositoryFactory } from './payments.repository';

@Module({
  providers: [
    {
      provide: TOKENS.PAYMENTS_REPOSITORY,
      useFactory: PaymentsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.PAYMENTS_REPOSITORY],
})
export class PaymentsRepositoryModule {}
