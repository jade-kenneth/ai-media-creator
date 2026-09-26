'use client';

import Link from 'next/link';

import './globals.css';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** The whole app failed to render; the root layout isn't available here. */
export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-dvh justify-center bg-canvas px-4 pt-24">
          <div className="flex max-w-110 flex-col items-center gap-4 text-center">
            <h1 className="t-h2">The app didn’t load</h1>
            <p className="t-body text-ink-2">
              Something went wrong on our side. Your saved work is safe. Try
              again in a moment.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="press h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Try again
              </button>
              <Link
                href="/projects"
                className="flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-ink"
              >
                Back to projects
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
