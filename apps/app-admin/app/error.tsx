"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="flex max-w-lg flex-col items-center gap-5 rounded-[28px] border border-border/70 bg-card/85 px-8 py-10 text-center shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="size-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            The admin app hit an unexpected error while loading this screen.
          </p>
          {error.message ? (
            <p className="text-xs text-muted-foreground">{error.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/admin/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
