import { Bell, Database, LockKeyhole, ShieldCheck, UserX } from 'lucide-react';
import type { Metadata } from 'next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const applicationName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Your Application';
const privacyEmail =
  process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL ?? 'privacy@example.com';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy policy for ${applicationName}.`,
};

const policySections = [
  {
    title: 'Information collected',
    description: 'Data needed to provide and secure an account.',
    icon: Database,
    items: [
      'Account details such as name and email address.',
      'Organization assignment and access-role information.',
      'Authentication sessions and security metadata.',
      'Device push tokens when notifications are enabled.',
      'Files or other content submitted through enabled application features.',
    ],
  },
  {
    title: 'How information is used',
    description: 'Purposes that support the application and its users.',
    icon: ShieldCheck,
    items: [
      'Authenticate users and enforce role-based access.',
      'Provide organization-scoped application features.',
      'Deliver requested notifications and service messages.',
      'Maintain reliability, prevent abuse, and investigate security issues.',
      'Comply with valid legal and account-deletion obligations.',
    ],
  },
  {
    title: 'Storage and sharing',
    description: 'How infrastructure providers may process information.',
    icon: LockKeyhole,
    items: [
      'Information may be stored by configured database, hosting, email, push-notification, and object-storage providers.',
      'Providers should receive only the information required to operate their service.',
      'Information is not sold. It may be disclosed when required by law or needed to protect the application and its users.',
      'Retention periods should be configured for the needs and legal obligations of the deployed application.',
    ],
  },
  {
    title: 'Notifications',
    description: 'Controls for optional push delivery.',
    icon: Bell,
    items: [
      'Push notifications require a device token and basic delivery metadata.',
      'Users can disable notifications in their device settings.',
      'Removing notification permission does not automatically delete an account.',
    ],
  },
  {
    title: 'Your choices',
    description: 'Access, correction, and deletion requests.',
    icon: UserX,
    items: [
      'Contact the application operator to request access to or correction of personal information.',
      'Use the account-deletion request page when permanent account removal is required.',
      'Some information may be retained when a legal or security obligation requires it.',
    ],
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-5 py-12 sm:px-8">
          <p className="text-sm font-medium text-primary">{applicationName}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Privacy Policy
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            This starter policy describes the reusable platform capabilities.
            Review and customize it for the features, providers, jurisdiction,
            and retention rules of your deployed application before launch.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-5 px-5 py-8 sm:px-8">
        {policySections.map(({ description, icon: Icon, items, title }) => (
          <Card key={title}>
            <CardHeader>
              <Icon aria-hidden="true" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm leading-6 text-muted-foreground">
                {items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>
              Privacy questions and data-rights requests can be sent to the
              configured application operator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              className="text-sm font-medium text-primary"
              href={`mailto:${privacyEmail}`}
            >
              {privacyEmail}
            </a>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
