import { Module } from '@nestjs/common';
import { PushTokensRepositoryModule } from '../push-tokens/repositories/push-tokens.repository.module';
import { PushNotificationsResolver } from './push-notifications.resolver';
import { PushNotificationsService } from './push-notifications.service';

@Module({
  imports: [PushTokensRepositoryModule],
  providers: [PushNotificationsService, PushNotificationsResolver],
  exports: [PushNotificationsService],
})
export class PushNotificationsModule {}
