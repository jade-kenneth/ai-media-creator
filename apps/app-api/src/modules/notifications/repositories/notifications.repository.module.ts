import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { TOKENS } from 'src/types/tokens';
import { NotificationsRepositoryFactory } from './notifications.repository';

@Module({
  providers: [
    {
      provide: TOKENS.NOTIFICATIONS_REPOSITORY,
      useFactory: NotificationsRepositoryFactory,
      inject: [getConnectionToken()],
    },
  ],
  exports: [TOKENS.NOTIFICATIONS_REPOSITORY],
})
export class NotificationsRepositoryModule {}
