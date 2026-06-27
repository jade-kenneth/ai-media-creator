import { RegistrationRejectionReason } from '../../../graphql/generated/graphql';

export const REGISTRATION_EVENTS = {
  SUBMITTED: 'registration.submitted',
  APPROVED: 'registration.approved',
  REJECTED: 'registration.rejected',
} as const;

export class RegistrationSubmittedEvent {
  constructor(
    public readonly organizationId: string,
    public readonly organizationName: string,
    public readonly memberFirstName: string,
    public readonly memberLastName: string,
    public readonly memberEmail: string,
  ) {}
}

export class RegistrationApprovedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly organizationName: string,
  ) {}
}

export class RegistrationRejectedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly rejectionReason: RegistrationRejectionReason,
    public readonly rejectionNote: string | null,
    public readonly organizationName: string | null,
  ) {}
}
