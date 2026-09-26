import { CompassIcon } from 'lucide-react';
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

export default function NotFound() {
  return (
    <main className="flex min-h-dvh justify-center bg-canvas px-4 pt-24">
      <Empty className="max-w-110">
        <EmptyHeader>
          <EmptyMedia variant="neutral">
            <CompassIcon strokeWidth={1.75} />
          </EmptyMedia>
          <EmptyTitle as="h1">Page not found</EmptyTitle>
          <EmptyDescription>
            The link may be wrong or the page may have moved.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/projects">Back to projects</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
