import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { OrganizationsRepositoryFactory } from './organizations.repository';

@Module({
  providers: [
    {
      provide: TOKENS.ORGANIZATION_REPOSITORY,
      useFactory: OrganizationsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.ORGANIZATION_REPOSITORY],
})
export class OrganizationsRepositoryModule {}
