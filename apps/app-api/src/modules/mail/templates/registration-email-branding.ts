// REFERENCE email-branding tokens — neutral placeholders; replace with your brand.
export const REGISTRATION_EMAIL_BRAND = {
  appName: 'App Boilerplate',
  colors: {
    primary: '#2563eb',
    accent: '#f59e0b',
    accentDark: '#d97706',
    screenBg: '#f8fafc',
    cardBg: '#ffffff',
    subtleFill: '#f1f5f9',
    border: '#e2e8f0',
    bodyText: '#0f172a',
    secondaryText: '#475569',
    mutedText: '#94a3b8',
    successBg: '#ecfdf5',
    successText: '#059669',
    successBorder: '#a7f3d0',
    errorBg: '#fef2f2',
    errorText: '#dc2626',
    errorBorder: '#fecaca',
    warningBg: '#fffbeb',
    warningText: '#b45309',
    warningBorder: '#fde68a',
  },
} as const;

export function getRegistrationEmailAppUrl(): string {
  return (
    process.env.REGISTRATION_EMAIL_APP_URL?.trim() ||
    'https://play.google.com/store/apps/details?id=com.example.appmobile&pli=1'
  );
}

const DEFAULT_MASCOT_OBJECT_KEY = 'brand-assets/onboarding_5.png';

let cachedMascotUrl: string | null | undefined;

export function getRegistrationEmailMascotUrl(): string | null {
  if (cachedMascotUrl !== undefined) {
    return cachedMascotUrl;
  }

  const explicitUrl = process.env.REGISTRATION_EMAIL_MASCOT_URL?.trim();

  if (explicitUrl) {
    cachedMascotUrl = explicitUrl;
    return cachedMascotUrl;
  }

  const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL?.trim();

  if (publicBaseUrl) {
    cachedMascotUrl = `${publicBaseUrl.replace(/\/+$/, '')}/${DEFAULT_MASCOT_OBJECT_KEY}`;
    return cachedMascotUrl;
  }

  cachedMascotUrl = null;
  return cachedMascotUrl;
}
