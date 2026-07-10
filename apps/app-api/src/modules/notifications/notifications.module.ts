import { Module } from '@nestjs/common';
import { NotificationsRepositoryModule } from './repositories/notifications.repository.module';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [NotificationsRepositoryModule],
  providers: [NotificationsService, NotificationsResolver],
  exports: [NotificationsService],
})
export class NotificationsModule {}
