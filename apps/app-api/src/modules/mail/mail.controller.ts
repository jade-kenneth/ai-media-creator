import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ZodValidationPipe } from 'src/common/validation/zod-validation.pipe';
import { UserRole } from 'src/graphql/generated/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MailService } from './mail.service';
import { sendEmailBodySchema, type SendEmailBody } from './mail.validation';

@Controller()
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async send(
    @Body(new ZodValidationPipe(sendEmailBodySchema))
    body: SendEmailBody,
  ) {
    return this.mail.sendEmail(body.to, body.subject, body.html);
  }
}
