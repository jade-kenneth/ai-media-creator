import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';

import { AppProviders } from '@/providers/app-providers';

import './globals.css';

const geistSans = localFont({
  src: './fonts/geist-sans.woff2',
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/geist-mono.woff2',
  variable: '--font-geist-mono',
  display: 'swap',
});

const applicationName =
  process.env.NEXT_PUBLIC_APP_NAME ?? 'AI Creation Platform';

export const metadata: Metadata = {
  title: {
    default: applicationName,
    template: `%s · ${applicationName}`,
  },
  description:
    'Turn a real product into an approved, fact-checked short-video script.',
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#f6f5f1',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      {/* Browser extensions add attributes to <body> before hydration. */}
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
