import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller()
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Post('send')
  async send(
    @Body()
    body: {
      to: string;
      subject: string;
      html: string;
    },
  ) {
    return this.mail.sendEmail(body.to, body.subject, body.html);
  }
}
