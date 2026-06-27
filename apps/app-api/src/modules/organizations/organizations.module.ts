import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { OrganizationsResolver } from './organizations.resolver';
import { OrganizationsService } from './organizations.service';
import { OrganizationsRepositoryModule } from './repositories/organization.repository.module';

@Module({
  imports: [OrganizationsRepositoryModule, UsersModule],
  providers: [OrganizationsService, OrganizationsResolver],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
