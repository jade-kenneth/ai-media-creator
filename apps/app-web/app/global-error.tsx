"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-dvh items-center justify-center px-6 py-12">
          <div className="flex max-w-lg flex-col items-center gap-5 rounded-[28px] border border-border/70 bg-card/85 px-8 py-10 text-center shadow-sm">
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                The admin app could not recover from an unexpected error.
              </p>
              {error.message ? (
                <p className="text-xs text-muted-foreground">{error.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Try again
              </button>
              <a
                href="/admin/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground"
              >
                Go to dashboard
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
