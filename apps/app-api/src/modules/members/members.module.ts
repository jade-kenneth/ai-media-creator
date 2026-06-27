import { forwardRef, Module } from '@nestjs/common';
import { LoadersModule } from 'src/common/batch/loaders.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';
import { UsersModule } from '../users/users.module';
import { RegistrationNotificationListener } from './listeners/registration-notification.listener';
import { MembersRepositoryModule } from './repositories/members.repository.module';
import { MembersResolver } from './members.resolver';
import { MembersService } from './members.service';

@Module({
  imports: [
    forwardRef(() => OrganizationsModule),
    MailModule,
    forwardRef(() => UsersModule),
    MembersRepositoryModule,
    forwardRef(() => NotificationsModule),
    PushNotificationsModule,
    forwardRef(() => LoadersModule),
  ],
  providers: [
    MembersService,
    MembersResolver,
    RegistrationNotificationListener,
  ],
  exports: [MembersService],
})
export class MembersModule {}
