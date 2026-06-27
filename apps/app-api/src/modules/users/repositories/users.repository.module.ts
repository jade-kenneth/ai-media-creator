import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { UsersRepositoryFactory } from './users.repository';

@Module({
  providers: [
    {
      provide: TOKENS.USERS_REPOSITORY,
      useFactory: UsersRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.USERS_REPOSITORY],
})
export class UsersRepositoryModule {}
