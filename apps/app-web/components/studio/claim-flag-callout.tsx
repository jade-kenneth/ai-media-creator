import { FlagIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Warning-tinted block with a 3px left bar, a flag icon, a bold one-line lead
 * and the reason (components-states.md#claim-flag-callout). A prompt, not an
 * error.
 */
export function ClaimFlagCallout({
  id,
  lead,
  reason,
  action,
  className,
}: {
  id?: string;
  lead: string;
  reason: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        'flex gap-2.5 rounded-sm border-l-3 border-warning bg-warning-soft px-3 py-2.5 text-small text-ink',
        className,
      )}
    >
      <FlagIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
      <p className="min-w-0">
        <span className="font-semibold">{lead}</span>{' '}
        <span className="text-ink-2">{reason}</span>
        {action ? <span className="ml-1 inline-flex">{action}</span> : null}
      </p>
    </div>
  );
}
