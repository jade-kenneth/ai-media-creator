import { Module, forwardRef } from '@nestjs/common';
import { MembersModule } from '../../modules/members/members.module';
import { UsersModule } from '../../modules/users/users.module';
import { LoaderFactory } from './loader-registry';

@Module({
  imports: [forwardRef(() => MembersModule), forwardRef(() => UsersModule)],
  providers: [LoaderFactory],
  exports: [LoaderFactory],
})
export class LoadersModule {}
