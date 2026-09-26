'use client';

import { TriangleAlertIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** A screen crashed: say what happened, what was kept, what to do next. */
export default function Error({ reset }: ErrorProps) {
  return (
    <main className="flex min-h-dvh justify-center bg-canvas px-4 pt-24">
      <Empty className="max-w-110">
        <EmptyHeader>
          <EmptyMedia variant="neutral">
            <TriangleAlertIcon strokeWidth={1.75} />
          </EmptyMedia>
          <EmptyTitle as="h1">This screen didn’t load</EmptyTitle>
          <EmptyDescription>
            Something went wrong on our side. Your saved work is safe. Try
            again, or go back to your projects.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="secondary">
            <Link href="/projects">Back to projects</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
