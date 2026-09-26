'use client';

import { useId } from 'react';

import { ClaimFlagCallout } from '@/components/studio/claim-flag-callout';
import { Checkbox } from '@/components/ui/checkbox';
import { useProject } from '@/features/project-workflow/workflow-state';
import { studioOf } from '@/lib/studios';
import type { ClaimFlag } from '@/react-query/scripts/scripts-operations';

/**
 * The accuracy check a clip needs before it can fill a scene (R20), in the
 * project's studio's words: a product's accuracy, or a story's characters
 * and consent (§3.23). Its parent gates the primary action on
 * `checked.every(Boolean)` and shows the reason while it is unticked.
 */
export function AccuracyCheck({
  checked,
  onChange,
  flags = [],
}: {
  checked: boolean[];
  onChange: (next: boolean[]) => void;
  /** The description's claim flags, repeated here before the check. */
  flags?: ClaimFlag[];
}) {
  const id = useId();
  const { checks, checkCaption } = studioOf(useProject().studio).clips;

  return (
    <fieldset className="flex flex-col gap-3 rounded-md border border-border bg-canvas p-4">
      <legend className="sr-only">Check before you use it</legend>
      <p className="t-label" aria-hidden="true">
        Check before you use it
      </p>
      {flags.map((flag) => (
        <ClaimFlagCallout
          key={`${flag.category}-${flag.claim}`}
          lead={flag.lead}
          reason={flag.reason}
        />
      ))}
      {checks.map((label, index) => (
        <div key={label} className="flex items-start gap-3">
          <Checkbox
            id={`${id}-${index}`}
            checked={checked[index] ?? false}
            onCheckedChange={(value) =>
              onChange(
                checks.map((_, item) =>
                  item === index ? value === true : (checked[item] ?? false),
                ),
              )
            }
            className="mt-0.5"
          />
          <label htmlFor={`${id}-${index}`} className="t-sm text-ink">
            {label}
          </label>
        </div>
      ))}
      <p className="t-caption text-ink-3">{checkCaption}</p>
    </fieldset>
  );
}
