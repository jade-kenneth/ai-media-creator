import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { StorePurchasesRepositoryFactory } from './store-purchases.repository';

@Module({
  providers: [
    {
      provide: TOKENS.STORE_PURCHASES_REPOSITORY,
      useFactory: StorePurchasesRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.STORE_PURCHASES_REPOSITORY],
})
export class StorePurchasesRepositoryModule {}
