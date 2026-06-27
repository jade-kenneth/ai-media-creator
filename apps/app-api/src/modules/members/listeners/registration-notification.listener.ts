import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType } from '../../../graphql/generated/graphql';
import { MailService } from '../../mail/mail.service';
import { buildApprovalEmailHtml } from '../../mail/templates/registration-approved.template';
import { buildAdminRegistrationNotificationHtml } from '../../mail/templates/registration-submitted.template';
import {
  buildRejectionEmailHtml,
  formatRegistrationRejectionReason,
} from '../../mail/templates/registration-rejected.template';
import { NotificationsService } from '../../notifications/notifications.service';
import { PushNotificationsService } from '../../push-notifications/push-notifications.service';
import { UsersService } from '../../users/users.service';
import {
  REGISTRATION_EVENTS,
  RegistrationApprovedEvent,
  RegistrationRejectedEvent,
  RegistrationSubmittedEvent,
} from '../events/registration.events';

@Injectable()
export class RegistrationNotificationListener {
  private readonly logger = new Logger(RegistrationNotificationListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly usersService: UsersService,
  ) {}

  @OnEvent(REGISTRATION_EVENTS.SUBMITTED)
  async handleSubmitted(event: RegistrationSubmittedEvent): Promise<void> {
    const adminEmails = await this.usersService
      .findAdminEmailsByOrganizationId(event.organizationId)
      .catch((err: unknown) => {
        this.logger.warn(
          `Failed to fetch admin emails for organization ${event.organizationId}: ${err instanceof Error ? err.message : String(err)}`,
        );
        return [];
      });

    if (adminEmails.length === 0) {
      this.logger.warn(
        `No active admins found for organization ${event.organizationId} — skipping admin registration notification email.`,
      );
      return;
    }

    const html = buildAdminRegistrationNotificationHtml(
      event.memberFirstName,
      event.memberLastName,
      event.memberEmail,
      event.organizationName,
    );

    const results = await Promise.allSettled(
      adminEmails.map((email) =>
        this.mailService.sendEmail(
          email,
          `New registration pending review — ${event.organizationName}`,
          html,
        ),
      ),
    );

    this.logSettledFailures('submitted-admin-notify', event.organizationId, results);
  }

  @OnEvent(REGISTRATION_EVENTS.APPROVED)
  async handleApproved(event: RegistrationApprovedEvent): Promise<void> {
    const notificationTitle = 'Registration Approved';
    const notificationMessage = `Welcome to App Boilerplate. Your registration for ${event.organizationName} has been approved.`;

    const results = await Promise.allSettled([
      this.mailService.sendEmail(
        event.email,
        'Your App Boilerplate registration has been approved',
        buildApprovalEmailHtml(event.firstName, event.organizationName),
      ),
      this.notificationsService.createNotification({
        userId: event.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: NotificationType.REGISTRATION_APPROVED,
      }),
      this.pushNotificationsService.sendRegistrationApproved({
        userIds: [event.userId],
        title: 'Registration Approved',
        body: `Your ${event.organizationName} registration has been approved.`,
      }),
    ]);

    this.logSettledFailures('approved', event.userId, results);
  }

  @OnEvent(REGISTRATION_EVENTS.REJECTED)
  async handleRejected(event: RegistrationRejectedEvent): Promise<void> {
    const rejectionReasonLabel = formatRegistrationRejectionReason(
      event.rejectionReason,
    );
    const locationLabel = event.organizationName
      ? ` for ${event.organizationName}`
      : '';
    const notificationTitle = 'Registration Not Approved';
    const notificationMessage = `Your App Boilerplate registration${locationLabel} was not approved. Reason: ${rejectionReasonLabel}.`;

    const results = await Promise.allSettled([
      this.mailService.sendEmail(
        event.email,
        'Update on your App Boilerplate registration',
        buildRejectionEmailHtml(
          event.firstName,
          event.rejectionReason,
          event.rejectionNote,
          event.organizationName,
        ),
      ),
      this.notificationsService.createNotification({
        userId: event.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: NotificationType.REGISTRATION_REJECTED,
      }),
      this.pushNotificationsService.sendRegistrationRejected({
        userIds: [event.userId],
        title: 'Registration Update',
        body: 'Your App Boilerplate registration has a new status. Tap to review it.',
      }),
    ]);

    this.logSettledFailures('rejected', event.userId, results);
  }

  private logSettledFailures(
    action: 'submitted-admin-notify' | 'approved' | 'rejected',
    userId: string,
    results: PromiseSettledResult<unknown>[],
  ) {
    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    if (failedResults.length === 0) {
      return;
    }

    failedResults.forEach((result, index) => {
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);

      this.logger.warn(
        `Registration ${action} notification task ${index + 1} failed for user ${userId}: ${reason}`,
      );
    });
  }
}
