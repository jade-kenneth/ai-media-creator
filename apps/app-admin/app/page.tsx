import Link from 'next/link';

const INCLUDED = [
  'JWT auth (access + refresh) & route guards',
  'Multi-tenant organizations',
  'Admin + Super-Admin dashboards',
  'Members management',
  'Announcements (example CRUD)',
  'Notifications + Expo push',
  'TanStack Query · Tailwind · shadcn/ui',
];

/**
 * Boilerplate landing page. Replace this with your own marketing/home page.
 * The admin app itself lives under /admin and /super-admin (auth-gated).
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-4">
        <span className="w-fit rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Boilerplate
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          App Boilerplate
        </h1>
        <p className="text-lg text-muted-foreground">
          A multi-tenant admin starter built with Next.js, TanStack Query,
          Tailwind and shadcn/ui. Auth, dashboards, and an example CRUD are
          already wired up — start building features, not plumbing.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Admin sign in
        </Link>
        <Link
          href="/admin/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-semibold transition hover:bg-secondary"
        >
          Go to dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card/60 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          What&apos;s included
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <span className="size-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Edit{' '}
        <code className="rounded bg-secondary px-1 py-0.5">app/page.tsx</code> to
        customize this page.
      </p>
    </main>
  );
}
