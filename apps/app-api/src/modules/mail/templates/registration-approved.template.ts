import {
  getRegistrationEmailAppUrl,
  getRegistrationEmailMascotUrl,
  REGISTRATION_EMAIL_BRAND,
} from './registration-email-branding';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildApprovalEmailHtml(
  firstName: string,
  organizationName: string,
): string {
  const safeFirstName = escapeHtml(firstName.trim() || 'Member');
  const safeOrganizationName = escapeHtml(organizationName.trim());
  const mascotUrl = getRegistrationEmailMascotUrl();
  const appUrl = getRegistrationEmailAppUrl();
  const {
    appName,
    colors: {
      accent,
      accentDark,
      bodyText,
      border,
      cardBg,
      mutedText,
      primary,
      screenBg,
      secondaryText,
      subtleFill,
      successBg,
      successBorder,
      successText,
    },
  } = REGISTRATION_EMAIL_BRAND;
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
  <title>Registration Approved</title>
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
              <p style="margin:16px auto 0;display:inline-block;padding:8px 14px;background-color:${successBg};border:1px solid ${successBorder};border-radius:999px;color:${successText};font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                Registration approved
              </p>
              <h1 style="margin:18px 0 0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.25;">
                You&apos;re all set
              </h1>
              <p style="margin:12px 0 0;color:#dbe4ff;font-size:15px;line-height:1.6;">
                Your member account for <strong style="color:#ffffff;">${safeOrganizationName}</strong> is now active.
              </p>
              ${mascotBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:${bodyText};font-weight:700;">Hi ${safeFirstName},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${secondaryText};">
                Your ${appName} registration for <strong style="color:${bodyText};">${safeOrganizationName}</strong> has been approved.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${secondaryText};">
                You can now sign in to the app and use organization services, announcements, and community updates.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background-color:${subtleFill};border:1px solid ${border};border-radius:18px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px;color:${primary};font-size:13px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;">
                      What&apos;s next
                    </p>
                    <p style="margin:0;color:${secondaryText};font-size:14px;line-height:1.7;">
                      Open the app, sign in with the same email address you used during registration, and complete your member setup.
                    </p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
                <tr>
                  <td align="center" style="background-color:${accent};border:1px solid ${accentDark};border-radius:999px;">
                    <a href="${appUrl}" style="display:inline-block;padding:14px 28px;color:${primary};font-size:15px;font-weight:700;text-decoration:none;">
                      Open ${appName}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.7;color:${mutedText};">
                If the button does not open the app, sign in manually with the same email address that received this message.
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
              <p style="margin:0;font-size:12px;color:${mutedText};">Need help? Contact your organization hall for account support.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
