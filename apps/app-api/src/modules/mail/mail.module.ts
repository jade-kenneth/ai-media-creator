import { Module } from '@nestjs/common';

import { EmailHandler } from 'src/libs/async-event-service/email-async-event.service';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

@Module({
  providers: [MailService, EmailHandler],
  controllers: [MailController],
  exports: [MailService],
})
export class MailModule {}
