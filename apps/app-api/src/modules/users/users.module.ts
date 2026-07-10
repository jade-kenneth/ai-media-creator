import { Module } from '@nestjs/common';
import { UsersRepositoryModule } from './repositories/users.repository.module';
import { UsersService } from './users.service';

@Module({
  imports: [UsersRepositoryModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
