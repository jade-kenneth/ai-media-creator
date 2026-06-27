import {
  BarChart2,
  Bell,
  CheckCircle2,
  Database,
  Images,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const privacyEmail = 'velarstudio0828@gmail.com';

const registrationData = [
  'First name',
  'Last name',
  'Email address',
  'Contact number, if provided',
  'Selected organization',
  'Password and password confirmation',
];

const loginData = ['Email address', 'Password', 'Selected organization'];

const storedData = [
  'Login session tokens',
  'Selected organization details',
  'Member profile details saved or updated by you',
  'Service request records and status updates submitted through the app',
  'Push notification tokens',
  'Basic device notification metadata needed to keep you signed in and send app notifications',
  'Public content uploaded by authorized administrators, such as announcements, event details, public documents, and activity photos',
  'Community poll votes linked to your member account',
  'Poll topic suggestions you submit, linked to your member account',
];

const pollVotingData = [
  'Your member account identifier',
  'The poll option you selected',
  'The date and time you voted or changed your vote',
];

const pollSuggestionData = [
  'Your member account identifier',
  'The poll topic title and description you submitted',
  'Suggestion status (pending, approved, or rejected)',
  'The date the suggestion was submitted',
];

const profileData = [
  'Middle name, if provided',
  'Birthdate',
  'Gender, if provided',
  'Contact number',
  'Address and purok or zone',
];

const serviceRequestData = [
  'Selected service or document request type',
  'Purpose or reason for the request',
  'Optional notes or special instructions you provide',
  'Requested copy count and pickup or processing details, when applicable',
  'Request reference number, status, status history, office remarks, rejection reasons, and pickup instructions',
  'Member profile details needed for processing, such as full name, contact number, selected organization, and address if already saved in your profile',
];

const collectionReasons = [
  'Create and manage your account',
  'Allow you to log in securely',
  'Show updates, announcements, documents, and services based on your selected organization',
  'Process service or document request submissions and coordinate organization office pickup or follow-up',
  'Let authorized administrators review and manage account registrations, when applicable',
  'Give you access to app features',
  'Send important organization-related updates and notifications',
  'Protect your account, app session, and system security',
  'Provide support, maintenance, and troubleshooting when needed',
  'Record your community poll votes to prevent duplicate voting and show you your selected option',
  'Link poll topic suggestions to your account so you can receive approval or rejection notifications',
];

const accessList = [
  'You, through the mobile app',
  'Authorized organization or community administrators who manage app content, account registrations, and service requests',
  'Authorized system administrators or developers when support, maintenance, or security work is required',
];

const thirdPartyProviderDetails = [
  'Backend hosting',
  'Authentication',
  'Database storage',
  'Push notifications',
  'Email services',
];

const deletionDetails = [
  'Your full name',
  'Registered email address',
  'Selected organization',
];

export const metadata: Metadata = {
  title: 'Privacy Policy | App Boilerplate',
  description:
    'Privacy Policy for App Boilerplate, including collected data, data usage, storage, access, notifications, public content, deletion requests, and privacy contact information.',
  robots: {
    index: true,
    follow: true,
  },
};

function PolicyList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckCircle2
            aria-hidden="true"
            className="mt-1 size-4 shrink-0 text-primary"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-background">
      <section className="border-b bg-card/85">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              App Boilerplate
            </p>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Privacy Policy
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                Effective Date: May 2026
              </p>
            </div>
          </div>

          <div className="max-w-3xl space-y-4 text-base leading-7 text-muted-foreground">
            <p>
              App Boilerplate is a community management mobile app designed to
              help users access organization-related updates, announcements,
              schedules, public documents, and account-related features based on
              their selected organization.
            </p>
            <p>
              This Privacy Policy explains what information we collect, why we
              collect it, how we use it, how we protect it, and how users can
              request correction or deletion of their data.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-5 px-5 py-8 sm:px-6 lg:px-8">
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserCheck aria-hidden="true" className="size-5" />
              </div>
              <div>
                <CardTitle>1. Information We Collect</CardTitle>
                <CardDescription>
                  We only collect information needed to create your account,
                  verify your selected organization, and provide app services.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Registration</h2>
              <PolicyList items={registrationData} />
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Login</h2>
              <PolicyList items={loginData} />
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Stored or Processed</h2>
              <PolicyList items={storedData} />
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Profile Updates</h2>
              <PolicyList items={profileData} />
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Service Requests</h2>
              <PolicyList items={serviceRequestData} />
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                In this version of the app, we collect basic account
                information, member profile details, and service request
                details needed for account creation, login, organization-based
                content access, notifications, account support, and organization
                service workflows.
              </p>
              <p>
                Listed service requirements, such as IDs, proof of residency,
                medical documents, evidence, or other supporting records, are
                shown for guidance and are submitted or verified at the organization
                office unless the app clearly provides an online upload feature.
              </p>
              <p>
                Please avoid entering sensitive details in free-text fields
                unless they are needed for the service you request. If you choose
                to include sensitive details in a request purpose or note, they
                will be used only to review, process, support, or keep required
                records of that request.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </div>
              <div>
                <CardTitle>2. Why We Collect Your Information</CardTitle>
                <CardDescription>
                  We use your information to run member account and organization
                  service workflows.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PolicyList items={collectionReasons} />
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Database aria-hidden="true" className="size-5" />
              </div>
              <div>
                <CardTitle>
                  3. How We Store and Protect Your Information
                </CardTitle>
                <CardDescription>
                  Account information is stored in the backend database, while
                  session data may be stored securely on your device.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Account, registration, and member profile information is stored
              in the app&apos;s backend database.
            </p>
            <p>
              Service request records, including request details, status changes,
              and office remarks, are stored in the backend database so the
              member and authorized organization staff can review and process the
              request.
            </p>
            <p>
              Login session tokens and selected organization information may be
              stored securely on your device using secure device storage.
            </p>
            <p>
              Passwords are used only for authentication. Passwords are stored
              as hashed values and are never stored as plain text.
            </p>
            <p>
              We take reasonable steps to protect your personal information from
              unauthorized access, misuse, loss, or disclosure.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LockKeyhole aria-hidden="true" className="size-5" />
              </div>
              <div>
                <CardTitle>4. Who Can Access Your Information</CardTitle>
                <CardDescription>
                  Access is limited to members and authorized administrators
                  or support personnel.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <PolicyList items={accessList} />
            <div className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>We do not sell your personal information.</p>
              <p>
                We do not share your personal information with third parties for
                advertising or marketing purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>5. Third-Party Service Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <PolicyList items={thirdPartyProviderDetails} />
            <div className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                These providers may process limited data only as needed to
                support app functionality, security, maintenance, and service
                delivery.
              </p>
              <p>
                We do not allow third-party providers to use your personal
                information for their own advertising or marketing purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell aria-hidden="true" className="size-5" />
              </div>
              <div>
                <CardTitle>6. Push Notifications</CardTitle>
                <CardDescription>
                  Notifications help send important updates from your selected
                  organization.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              App Boilerplate may use push notifications to send important
              updates, announcements, reminders, and service-related notices
              based on your selected organization.
            </p>
            <p>
              Push notification tokens may be stored only for the purpose of
              sending app notifications.
            </p>
            <p>
              You may disable push notifications anytime through your device
              settings.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Images aria-hidden="true" className="size-5" />
              </div>
              <div>
                <CardTitle>7. Activity Photos and Public Content</CardTitle>
                <CardDescription>
                  Authorized administrators may upload public organization content
                  for community updates and documentation.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Our app may display organization activity photos, event images, public
              announcements, public documents, and other community-related
              content uploaded by authorized administrators.
            </p>
            <p>
              These photos and public content are used only for public
              information, documentation, and community update purposes.
            </p>
            <p>
              Administrators are responsible for ensuring that uploaded photos
              are appropriate for public posting and that consent or proper
              authorization is obtained when photos include clearly identifiable
              individuals, especially minors or vulnerable persons.
            </p>
            <p>
              We do not use activity photos for profiling, advertising, facial
              recognition, or identity verification.
            </p>
            <p>
              If you believe a photo or public content should be removed, you
              may contact us at{' '}
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                href={`mailto:${privacyEmail}`}
              >
                {privacyEmail}
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart2 aria-hidden="true" className="size-5" />
              </div>
              <div>
                <CardTitle>8. Community Polls</CardTitle>
                <CardDescription>
                  When you participate in community polls or submit poll
                  suggestions, we collect limited data linked to your member
                  account.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Poll Votes</h2>
              <PolicyList items={pollVotingData} />
              <p className="text-sm leading-6 text-muted-foreground">
                Your vote is linked to your member account to prevent duplicate
                voting and to show you the option you previously selected. Only
                aggregate vote counts are visible to other members — your
                individual vote is not publicly disclosed.
              </p>
            </div>
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Poll Suggestions</h2>
              <PolicyList items={pollSuggestionData} />
              <p className="text-sm leading-6 text-muted-foreground">
                Poll suggestions are linked to your member account so we can
                notify you when your suggestion is approved or rejected.
                Suggestion details are visible to authorized administrators only.
              </p>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <p className="text-sm leading-6 text-muted-foreground">
              Poll vote and suggestion data is retained for as long as the
              associated poll or suggestion record exists in the system. When
              your account is deleted, your linked poll votes and suggestions
              are also removed.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserX aria-hidden="true" className="size-5" />
              </div>
              <div>
                <CardTitle>9. Data Deletion Request</CardTitle>
                <CardDescription>
                  You may request deletion of your account and personal data
                  through our dedicated deletion request page.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-6 text-muted-foreground">
              To request deletion of your account and personal data, visit our
              dedicated account deletion page:
            </p>
            <Link
              className="inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              href="/delete-account"
            >
              organizationbuddy.site/delete-account
            </Link>
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">
                You will be asked to provide:
              </h2>
              <PolicyList items={deletionDetails} />
            </div>
            <div className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                If you are unable to access the deletion page, you may also
                send your request by email to{' '}
                <Link
                  className="font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  href={`mailto:${privacyEmail}`}
                >
                  {privacyEmail}
                </Link>{' '}
                with your full name, registered email address, and selected
                organization.
              </p>
              <p>
                After verification, we will process your request within a
                reasonable period.
              </p>
              <p>
                You may request correction or removal of content that includes
                your personal information or identifiable image by contacting us
                at{' '}
                <Link
                  className="font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  href={`mailto:${privacyEmail}`}
                >
                  {privacyEmail}
                </Link>
                .
              </p>
              <p>
                Some account, service request, or public content records may be
                retained if required for official organization records, legal
                compliance, security, dispute resolution, or audit purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>10. Children&apos;s Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              App Boilerplate is intended for general community and member use.
            </p>
            <p>
              If the app is used by minors, registration should be done with
              proper guidance or consent from a parent, guardian, or authorized
              representative when required.
            </p>
            <p>
              We do not knowingly collect information from children without
              proper consent.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>11. Government Affiliation Disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              This app is independently developed and is not an official
              government app unless formally adopted, approved, or operated by a
              organization, Org, or authorized government office.
            </p>
            <p>
              Until such approval is granted, the app should be treated as an
              independent community management platform and not as an official
              government service.
            </p>
            <p>
              If a organization officially uses this platform, the app may serve as
              their digital management and information tool under their approval
              and administrative control.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>12. Google Play Data Safety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              The information described in this Privacy Policy should match the
              data disclosed in our Google Play Data Safety section.
            </p>
            <p>
              If the app collects account information, member profile details
              such as contact number, address, birthdate, gender, or purok,
              service request purpose or notes, request status activity, push
              notification tokens, community poll votes and suggestions linked to
              your member account, or app-related metadata, these will be
              disclosed properly in the Google Play Data Safety form.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>13. Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              We may update this Privacy Policy from time to time to reflect
              changes in the app, services, legal requirements, or data
              practices.
            </p>
            <p>
              When we make updates, we will revise the effective date above.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>14. Contact Us</CardTitle>
            <CardDescription>
              For privacy questions, concerns, data deletion requests, or
              requests to correct or remove content that includes your personal
              information or identifiable image, please contact:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              className="inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              href={`mailto:${privacyEmail}`}
            >
              {privacyEmail}
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
