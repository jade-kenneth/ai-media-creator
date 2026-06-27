import { Injectable } from '@nestjs/common';

import { MailService } from 'src/modules/mail/mail.service';
import { AsyncEventHandler } from '../async-event-module/async-event-handler.decorator';
import { type AsyncEvent } from '../async-event-module/types';

@Injectable()
export class EmailHandler {
  constructor(private readonly mail: MailService) {}

  @AsyncEventHandler('JoinWaitlist')
  async handleJoinWaitlist(event: AsyncEvent<'JoinWaitlist'>) {
    await this.mail.sendEmail(
      event.data.emailAddress,
      "You're on the App Boilerplate early access waitlist!",
      `
    <div style="
      max-width: 600px;
      margin: 0 auto;
      font-family: Arial, Helvetica, sans-serif;
      background-color: #ffffff;
      padding: 24px;
      color: #1f2937;
    ">

      <h1 style="font-size: 24px; margin-bottom: 8px; color: #0f172a;">
        Thank you for joining the App Boilerplate early access waitlist.
      </h1>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
        We are one step closer to making the app available to our community.
        Since you already joined the waitlist, we would like to invite you to
        start testing the app through Google Play.
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;">
        You can install the app here:
      </p>

      <a href="https://play.google.com/store/apps/details?id=com.example.appmobile"
        style="
          display: inline-block;
          background-color: #06b6d4;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: bold;
          margin-bottom: 24px;
        ">
        Install on Google Play
      </a>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
        App Boilerplate is designed to help members access community
        announcements, schedules, public resources, and important updates
        in one place.
      </p>

      <div style="
        background-color: #f8fafc;
        border-left: 4px solid #06b6d4;
        padding: 16px;
        margin: 24px 0;
        border-radius: 6px;
      ">
        <p style="margin: 0; font-size: 15px;">
          As an early access tester, your feedback will help us improve the
          app, check for possible issues, and make sure it gives a good
          experience before the full production release.
        </p>
      </div>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
        Please note that some features are intentionally hidden for now due
        to Google Play privacy and policy requirements. This helps us move
        faster with deployment while making sure we follow the required
        guidelines.
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        Thank you so much for your support.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

      <p style="font-size: 13px; color: #6b7280; margin-top: 16px;">
        Best regards,<br />
        App Boilerplate Team
      </p>
    </div>
      `,
    );
  }

  @AsyncEventHandler('SuccessfulSignup')
  async handle(event: AsyncEvent<'SuccessfulSignup'>) {
    await this.mail.sendEmail(
      event.data.emailAddress,
      'Welcome!',
      `
    <div style="
      max-width: 600px;
      margin: 0 auto;
      font-family: Arial, Helvetica, sans-serif;
      background-color: #ffffff;
      padding: 24px;
      color: #1f2937;
    ">
      
      <!-- Header -->
      <h1 style="
        font-size: 24px;
        margin-bottom: 8px;
        color: #0f172a;
      ">
        Welcome, ${event.data.firstName}! 🎉
      </h1>

      <p style="
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 16px;
      ">
        We’re excited to let you know that your member account has been
        <strong>successfully created</strong>.
      </p>

      <!-- Highlight box -->
      <div style="
        background-color: #f8fafc;
        border-left: 4px solid #06b6d4;
        padding: 16px;
        margin: 24px 0;
        border-radius: 6px;
      ">
        <p style="margin: 0; font-size: 15px;">
          You can now access your account, explore features, and start your journey with us right away.
        </p>
      </div>

      <!-- CTA -->
      <a href="https://amy-store.site"
        style="
          display: inline-block;
          background-color: #06b6d4;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: bold;
        ">
        Log in to Your Account
      </a>

      <!-- Footer -->
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

      <p style="
        font-size: 13px;
        color: #6b7280;
        line-height: 1.5;
      ">
        If you didn’t create this account, you can safely ignore this email.
        <br />
        Need help? Just reply to this message — we’re happy to assist.
      </p>

      <p style="
        font-size: 13px;
        color: #6b7280;
        margin-top: 16px;
      ">
        — The Team
      </p>
    </div>
    `,
    );
  }
}
