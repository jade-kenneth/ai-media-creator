import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { MembersRepositoryFactory } from './members.repository';

@Module({
  providers: [
    {
      provide: TOKENS.MEMBERS_REPOSITORY,
      useFactory: MembersRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.MEMBERS_REPOSITORY],
})
export class MembersRepositoryModule {}
