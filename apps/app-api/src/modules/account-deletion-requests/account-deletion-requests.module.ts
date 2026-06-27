import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { AccountDeletionRequestsResolver } from './account-deletion-requests.resolver';
import { AccountDeletionRequestsService } from './account-deletion-requests.service';
import { AccountDeletionRequestsRepositoryModule } from './repositories/account-deletion-requests.repository.module';

@Module({
  imports: [
    AccountDeletionRequestsRepositoryModule,
    OrganizationsModule,
    UsersModule,
  ],
  providers: [
    AccountDeletionRequestsService,
    AccountDeletionRequestsResolver,
  ],
  exports: [AccountDeletionRequestsService],
})
export class AccountDeletionRequestsModule {}
