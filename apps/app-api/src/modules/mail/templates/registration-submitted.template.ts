import { REGISTRATION_EMAIL_BRAND } from './registration-email-branding';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildAdminRegistrationNotificationHtml(
  memberFirstName: string,
  memberLastName: string,
  memberEmail: string,
  organizationName: string,
): string {
  const safeName = escapeHtml(
    `${memberFirstName.trim()} ${memberLastName.trim()}`,
  );
  const safeEmail = escapeHtml(memberEmail.trim());
  const safeOrganization = escapeHtml(organizationName.trim());

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
      warningBg,
      warningBorder,
      warningText,
    },
  } = REGISTRATION_EMAIL_BRAND;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Registration Pending Review</title>
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
              <p style="margin:16px auto 0;display:inline-block;padding:8px 14px;background-color:${warningBg};border:1px solid ${warningBorder};border-radius:999px;color:${warningText};font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                New registration pending review
              </p>
              <h1 style="margin:18px 0 0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.25;">
                Action Required
              </h1>
              <p style="margin:12px 0 0;color:#dbe4ff;font-size:15px;line-height:1.6;">
                A member has submitted a registration for <strong style="color:#ffffff;">${safeOrganization}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:${bodyText};font-weight:700;">Hi Admin,</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${secondaryText};">
                A new member has registered for <strong style="color:${bodyText};">${safeOrganization}</strong> and is waiting for your review. Please log in to the admin dashboard to approve or reject the registration.
              </p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;background-color:${subtleFill};border:1px solid ${border};border-radius:18px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 8px;color:${primary};font-size:13px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;">
                      Applicant details
                    </p>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:4px 0;color:${secondaryText};font-size:14px;width:100px;">Name</td>
                        <td style="padding:4px 0;color:${bodyText};font-size:14px;font-weight:600;">${safeName}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:${secondaryText};font-size:14px;">Email</td>
                        <td style="padding:4px 0;color:${bodyText};font-size:14px;font-weight:600;">${safeEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:${secondaryText};font-size:14px;">Organization</td>
                        <td style="padding:4px 0;color:${bodyText};font-size:14px;font-weight:600;">${safeOrganization}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.7;color:${mutedText};">
                Log in to the ${appName} admin dashboard to review this registration and take action.
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
              <p style="margin:0;font-size:12px;color:${mutedText};">This is an automated notification. Do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
