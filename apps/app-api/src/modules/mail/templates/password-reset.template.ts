export type PasswordResetEmailInput = {
  code: string;
  productName: string;
};

export type PasswordResetEmail = {
  html: string;
  subject: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderPasswordResetEmail({
  code,
  productName,
}: PasswordResetEmailInput): PasswordResetEmail {
  const escapedCode = escapeHtml(code);
  const escapedProductName = escapeHtml(productName);

  return {
    subject: `Your ${productName} password reset code`,
    html: `<p>Your ${escapedProductName} reset code is <strong>${escapedCode}</strong>.</p><p>It expires in 15 minutes.</p>`,
  };
}
