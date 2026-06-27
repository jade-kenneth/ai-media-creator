import { Module } from '@nestjs/common';
import { PushTokensRepositoryModule } from './repositories/push-tokens.repository.module';
import { PushTokensResolver } from './push-tokens.resolver';
import { PushTokensService } from './push-tokens.service';

@Module({
  imports: [PushTokensRepositoryModule],
  providers: [PushTokensService, PushTokensResolver],
  exports: [PushTokensService],
})
export class PushTokensModule {}
