'use client';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { CheckIcon, PencilIcon } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { FieldError, FieldLabel } from '@/components/studio/field-label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { STORY_LIMITS } from '@/lib/studios';
import { cn } from '@/lib/utils';

import { OWN_PREMISE } from './story-form.schema';

export interface PremiseOption {
  id: string;
  title: string;
  logline: string;
  cast: { id: string; name: string }[];
}

/** The angle card anatomy (Design Reference §5.7): ink ring and check when chosen. */
const cardClass =
  'group relative flex w-full flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-colors duration-120 hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60 data-[state=on]:border-[1.5px] data-[state=on]:border-ink data-[state=on]:ring-1 data-[state=on]:ring-ink';

function SelectedCheck() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-3 right-3 hidden size-5 items-center justify-center rounded-full bg-ink text-white group-data-[state=on]:flex"
    >
      <CheckIcon className="size-3" strokeWidth={3} />
    </span>
  );
}

/**
 * Premise cards as one radio group: the suggestions plus “Write my own
 * premise”, which reveals the Describe your story textarea when chosen.
 */
export function PremisePicker({
  options,
  suggesting,
  value,
  ownField,
  ownError,
  disabled,
  onSelect,
}: {
  options: PremiseOption[];
  suggesting: boolean;
  value: string;
  ownField: UseFormRegisterReturn<'ownText'>;
  ownError: string | null;
  disabled: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ToggleGroupPrimitive.Root
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next) onSelect(next);
        }}
        disabled={disabled}
        aria-label="Premise"
        aria-busy={suggesting || undefined}
        className="grid gap-3 md:grid-cols-2"
      >
        {suggesting
          ? Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-border p-4"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-5.5 w-32 rounded-full" />
              </div>
            ))
          : options.map((option) => (
              <ToggleGroupPrimitive.Item
                key={option.id}
                value={option.id}
                className={cardClass}
              >
                <SelectedCheck />
                <span className="t-h3 pr-6">{option.title}</span>
                <span className="t-sm text-ink-2">{option.logline}</span>
                {option.cast.length > 0 ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="t-caption text-ink-3">Cast</span>
                    {option.cast.map((character) => (
                      <Badge key={character.id} dot={false}>
                        {character.name}
                      </Badge>
                    ))}
                  </span>
                ) : null}
              </ToggleGroupPrimitive.Item>
            ))}
        <ToggleGroupPrimitive.Item
          value={OWN_PREMISE}
          className={cn(
            cardClass,
            'border-[1.5px] border-dashed border-border-strong data-[state=on]:border-solid',
          )}
        >
          <SelectedCheck />
          <PencilIcon aria-hidden="true" className="size-4 text-ink-2" />
          <span className="t-h3">Write my own premise</span>
          <span className="t-sm text-ink-2">Describe it in your words.</span>
        </ToggleGroupPrimitive.Item>
      </ToggleGroupPrimitive.Root>

      {value === OWN_PREMISE ? (
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="story-own-premise">
            Describe your story
          </FieldLabel>
          <Textarea
            id="story-own-premise"
            rows={3}
            maxLength={STORY_LIMITS.ownPremise}
            placeholder="e.g. Two strangers fight over the last umbrella at a bus stop, then find out they’re neighbours."
            disabled={disabled}
            aria-invalid={Boolean(ownError)}
            aria-describedby={ownError ? 'story-own-premise-error' : undefined}
            {...ownField}
          />
          {ownError ? (
            <FieldError id="story-own-premise-error">{ownError}</FieldError>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
