import { Module } from '@nestjs/common';
import { LoadersModule } from 'src/common/batch/loaders.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MembersModule } from '../members/members.module';
import { AnnouncementsResolver } from './announcements.resolver';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsRepositoryModule } from './repositories/announcements.repository.module';

@Module({
  imports: [
    AnnouncementsRepositoryModule,
    MembersModule,
    NotificationsModule,
    LoadersModule,
  ], // IMPORTING THE REPOSITORY MODULE TO PROVIDE THE REPOSITORY DEPENDENCY
  providers: [AnnouncementsService, AnnouncementsResolver], // PROVIDING THE SERVICE AND RESOLVER TO THE MODULE
  exports: [AnnouncementsService], // EXPORTING THE SERVICE TO BE USED IN OTHER MODULES IF NEEDED
})
export class AnnouncementsModule {}

// THIS MODULE IS RESPONSIBLE FOR ANNOUNCEMENT-RELATED FUNCTIONALITIES, INCLUDING THE SERVICE, RESOLVER, AND REPOSITORY MODULE.
// THIS MODULE CAN BE IMPORTED INTO THE MAIN APP MODULE TO MAKE ANNOUNCEMENT FUNCTIONALITIES AVAILABLE THROUGHOUT THE APPLICATION.
