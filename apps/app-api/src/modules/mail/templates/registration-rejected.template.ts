import { RegistrationRejectionReason } from '../../../graphql/generated/graphql';
import {
  getRegistrationEmailMascotUrl,
  REGISTRATION_EMAIL_BRAND,
} from './registration-email-branding';

const REJECTION_REASON_LABELS: Record<RegistrationRejectionReason, string> = {
  [RegistrationRejectionReason.INCOMPLETE_INFORMATION]:
    'Incomplete or missing registration information',
  [RegistrationRejectionReason.INVALID_IDENTITY]:
    'Identity details could not be verified',
  [RegistrationRejectionReason.NOT_A_MEMBER]:
    'You could not be verified as a member of this organization',
  [RegistrationRejectionReason.DUPLICATE_ACCOUNT]:
    'A member account already exists for this person',
  [RegistrationRejectionReason.UNDERAGE]: 'You do not meet the age requirement',
  [RegistrationRejectionReason.INVALID_CONTACT_DETAILS]:
    'Your contact details could not be verified',
  [RegistrationRejectionReason.SUSPICIOUS_ACTIVITY]:
    'The registration needs further review',
  [RegistrationRejectionReason.OTHER]: 'Other reason',
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatRegistrationRejectionReason(
  reason: RegistrationRejectionReason,
): string {
  return REJECTION_REASON_LABELS[reason] ?? reason;
}

export function buildRejectionEmailHtml(
  firstName: string,
  rejectionReason: RegistrationRejectionReason,
  rejectionNote: string | null,
  organizationName?: string | null,
): string {
  const safeFirstName = escapeHtml(firstName.trim() || 'Member');
  const safeReason = escapeHtml(
    formatRegistrationRejectionReason(rejectionReason),
  );
  const safeOrganizationName = organizationName?.trim()
    ? escapeHtml(organizationName.trim())
    : null;
  const safeNote = rejectionNote?.trim()
    ? escapeHtml(rejectionNote.trim())
    : '';
  const mascotUrl = getRegistrationEmailMascotUrl();
  const {
    appName,
    colors: {
      accent,
      bodyText,
      border,
      cardBg,
      errorBg,
      errorBorder,
      errorText,
      mutedText,
      primary,
      screenBg,
      secondaryText,
      subtleFill,
      warningBg,
      warningBorder,
      warningText,
    },
  } = REGISTRATION_EMAIL_BRAND;

  const noteBlock = safeNote
    ? `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background-color:${warningBg};border:1px solid ${warningBorder};border-radius:18px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${warningText};text-transform:uppercase;letter-spacing:0.4px;">
                      Note from the organization
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:${secondaryText};">
                      ${safeNote}
                    </p>
                  </td>
                </tr>
              </table>`
    : '';

  const locationLabel = safeOrganizationName
    ? ` for <strong>${safeOrganizationName}</strong>`
    : '';
  const mascotBlock = mascotUrl
    ? `<div style="margin:24px auto 0;width:172px;height:172px;border-radius:999px;background:${cardBg};padding:10px;">
                <img
                  src="${mascotUrl}"
                  alt="${appName} mascot"
                  width="152"
                  style="display:block;width:152px;max-width:100%;height:auto;margin:0 auto;"
                />
              </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration Update</title>
</head>
<body style="margin:0;padding:0;background-color:${screenBg};font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${screenBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${cardBg};border:1px solid ${border};border-radius:24px;overflow:hidden;">
          <tr>
            <td style="background-color:${primary};padding:32px 32px 24px;text-align:center;">
              <p style="margin:0;color:${accent};font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">
                ${appName}
              </p>
              <p style="margin:16px auto 0;display:inline-block;padding:8px 14px;background-color:${errorBg};border:1px solid ${errorBorder};border-radius:999px;color:${errorText};font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                Registration update
              </p>
              <h1 style="margin:18px 0 0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.25;">
                We need a few changes
              </h1>
              <p style="margin:12px 0 0;color:#dbe4ff;font-size:15px;line-height:1.6;">
                Your registration could not be approved yet, but you can review the details and try again.
              </p>
              ${mascotBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:${bodyText};font-weight:700;">Hi ${safeFirstName},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${secondaryText};">
                We reviewed your ${appName} registration${locationLabel}, but we could not approve it at this time.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background-color:${errorBg};border:1px solid ${errorBorder};border-radius:18px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${errorText};text-transform:uppercase;letter-spacing:0.4px;">
                      Reason
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:${bodyText};font-weight:600;">
                      ${safeReason}
                    </p>
                  </td>
                </tr>
              </table>
              ${noteBlock}
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background-color:${subtleFill};border:1px solid ${border};border-radius:18px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px;color:${primary};font-size:13px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;">
                      Next step
                    </p>
                    <p style="margin:0;color:${secondaryText};font-size:14px;line-height:1.7;">
                      Review your registration details in the app, correct anything needed, then submit again when ready.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${secondaryText};">
                You can update your details and try again in the app, or contact your organization hall if you need help.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:${mutedText};">
                If you believe this was a mistake, please reach out to your organization hall for clarification.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid ${border};margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${primary};">${appName}</p>
              <p style="margin:0;font-size:12px;color:${mutedText};">Need help? Contact your organization hall directly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
