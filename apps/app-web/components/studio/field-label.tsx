import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * A field's label row: the label, “Required” or “Optional” in ink-3, and an
 * optional trailing badge such as the value's source.
 */
export function FieldLabel({
  htmlFor,
  children,
  requirement,
  badge,
  className,
}: {
  htmlFor: string;
  children: ReactNode;
  requirement?: 'required' | 'optional';
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1', className)}>
      <Label htmlFor={htmlFor}>{children}</Label>
      {requirement ? (
        <span className="t-caption text-ink-3">
          {requirement === 'required' ? 'Required' : 'Optional'}
        </span>
      ) : null}
      {badge}
    </div>
  );
}

export function FieldHint({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="t-sm text-ink-3">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="t-sm flex items-center gap-1.5 text-danger">
      <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-danger" />
      {children}
    </p>
  );
}
