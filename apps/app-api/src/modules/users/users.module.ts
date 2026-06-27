import { forwardRef, Module } from '@nestjs/common';
import { LoadersModule } from 'src/common/batch/loaders.module';
import { MembersModule } from '../members/members.module';
import { UsersRepositoryModule } from './repositories/users.repository.module';
import { RegistrationReviewResolver, UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  imports: [
    UsersRepositoryModule,
    forwardRef(() => MembersModule),
    forwardRef(() => LoadersModule),
  ],
  providers: [UsersService, UsersResolver, RegistrationReviewResolver],
  exports: [UsersService],
})
export class UsersModule {}
