import * as Brevo from '@getbrevo/brevo';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private emailApi: Brevo.TransactionalEmailsApi;

  constructor(private readonly configService: ConfigService) {
    this.emailApi = new Brevo.TransactionalEmailsApi();

    this.emailApi.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      this.configService.getOrThrow<string>('BREVO_API_KEY'),
    );
  }

  async sendEmail(to: string, subject: string, html: string) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name:
        this.configService.get<string>('BREVO_SENDER_NAME') ??
        'Application',
      email: this.configService.getOrThrow<string>('BREVO_SENDER_EMAIL'),
    };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    try {
      const response = await this.emailApi.sendTransacEmail(sendSmtpEmail);
      return response;
    } catch (err) {
      console.error('Brevo send email error:', err);
      throw err;
    }
  }
}
