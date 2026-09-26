import type { Metadata } from 'next';
import Link from 'next/link';

import { BrandMark, Wordmark } from '@/components/brand/brand-mark';

const applicationName =
  process.env.NEXT_PUBLIC_APP_NAME ?? 'AI Creation Platform';
const privacyEmail =
  process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL ?? 'privacy@example.com';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${applicationName} handles your information.`,
  robots: { index: true, follow: true },
};

// ⚠ Legal review pending: the text-writing and AI clip sentences carry the
// §3.23 story wording (R27–R28) and are confirmed together with the pending
// R21 wording, which also removes the video provider's name (Phase 22).
const sections = [
  {
    title: 'What we collect',
    items: [
      'From Google sign-in: your name, email address and Google account id. We never see your Google password.',
      'What you add to projects: product details, facts and strategy choices, or a story’s genre, premise and cast, plus scripts and the photos and clips you upload.',
      'Voice and audio content: narration text, voice settings, recordings and music you upload.',
      'Rendered exports: finished videos, poster frames and their download history.',
      'Usage records: the paid actions you start, their status and the credits they held, used or released.',
      'Security data: sign-in sessions and request logs used to keep your account safe.',
    ],
  },
  {
    title: 'How we use it',
    items: [
      'To sign you in and keep each project visible only to you.',
      'To write angles, premises, hooks and scripts: we send our text-writing provider your approved facts, product details and strategy, or, for a story, its genre, premise and cast. Rejected, unknown and unreviewed facts are never sent.',
      'To create an AI voiceover or time your recording: when you ask us to, we send the narration text and relevant voice settings or recording to ElevenLabs.',
      'To make AI scene clips: when you ask us to, we send the photos you chose (each cropped to a vertical frame; for a story, this can be a photo of a person who agreed to appear), for a one-click clip a still from the scene before it, and your clip description to MiniMax, which returns short video clips.',
      'To render and let you download finished videos, including burned-in captions, music and end cards.',
      'To show your credit balance and usage, and to investigate failed or repeated jobs.',
    ],
  },
  {
    title: 'Your media',
    items: [
      'Uploaded photos, clips, recordings and music are private. They are shown or played only to you, through links that expire after a short time.',
      'You confirm you have the right to use each file before it uploads. Removing a file deletes the stored copy.',
      'Rendered videos and poster frames are private. Video download links expire after a short time.',
      'AI scene clips are stored privately with the project they were made for, alongside your uploads. Discarding them deletes the stored copies.',
    ],
  },
  {
    title: 'Who else processes it',
    items: [
      'Our hosting, database, file-storage and text-writing providers process information only to run the service.',
      'ElevenLabs processes narration text and voice settings to create an AI voiceover, or narration text and your recording to calculate timing, only when you request those actions.',
      'MiniMax processes the photos and description you choose to create AI scene clips, only when you request them.',
      'We don’t sell your information. We share it only when the law requires it or to protect the service and its users.',
    ],
  },
  {
    title: 'Your choices',
    items: [
      `Email ${privacyEmail} to ask for a copy of your information, a correction, or deletion of your account.`,
      'Some records may be kept longer when a legal or security obligation requires it.',
    ],
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-canvas px-4 py-10">
      <div className="mx-auto flex max-w-180 flex-col gap-8">
        <Link
          href="/"
          className="flex items-center gap-2 self-start rounded-sm text-ink"
        >
          <BrandMark />
          <Wordmark />
        </Link>
        <div>
          <h1 className="t-h1">Privacy policy</h1>
          <p className="t-body mt-2 text-ink-2">
            How {applicationName} handles the information you give it.
          </p>
        </div>
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-3">
            <h2 className="t-h2">{section.title}</h2>
            <ul className="t-body flex list-disc flex-col gap-2 pl-5 text-ink">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
