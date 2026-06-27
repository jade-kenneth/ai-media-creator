import { forwardRef, Module } from '@nestjs/common';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';
import { UsersModule } from '../users/users.module';
import { NotificationsRepositoryModule } from './repositories/notifications.repository.module';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    NotificationsRepositoryModule,
    forwardRef(() => UsersModule),
    PushNotificationsModule,
  ],
  providers: [NotificationsService, NotificationsResolver],
  exports: [NotificationsService],
})
export class NotificationsModule {}
