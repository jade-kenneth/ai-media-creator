import { Module } from '@nestjs/common';
import { SessionsRepositoryModule } from './repositories/sessions.repository.module';
import { SessionsResolver } from './sessions.resolver';
import { SessionsService } from './sessions.service';

@Module({
  imports: [SessionsRepositoryModule],
  providers: [SessionsService, SessionsResolver],
  exports: [SessionsService],
})
export class SessionsModule {}
