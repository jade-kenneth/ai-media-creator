import { Module } from '@nestjs/common';
import { SessionsRepositoryModule } from './repositories/sessions.repository.module';
import { SessionResolver } from './session.resolver';
import { SessionsService } from './sessions.service';

@Module({
  imports: [SessionsRepositoryModule],
  providers: [SessionsService, SessionResolver],
  exports: [SessionsService],
})
export class SessionsModule {}
