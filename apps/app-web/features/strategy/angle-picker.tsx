'use client';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { CheckIcon, PencilIcon } from 'lucide-react';
import { useId } from 'react';

import { FieldError, FieldLabel } from '@/components/studio/field-label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ANGLE_TYPE_LABEL } from '@/lib/studio/labels';
import type { ProjectDetail } from '@/react-query/projects/projects-operations';

export const OWN_ANGLE = 'own';

type Suggestion = NonNullable<
  ProjectDetail['angleSuggestionSet']
>['suggestions'][number];

const cardClass =
  'relative flex w-full flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-colors duration-120 hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60 data-[state=on]:border-[1.5px] data-[state=on]:border-ink data-[state=on]:ring-1 data-[state=on]:ring-ink';

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
 * Selling angle cards as one radio group: the suggestions plus “Write my own
 * angle”, which reveals a textarea when chosen.
 */
export function AnglePicker({
  suggestions,
  suggesting,
  value,
  ownText,
  ownError,
  facts,
  disabled,
  onSelect,
  onOwnTextChange,
  onOwnTextBlur,
}: {
  suggestions: Suggestion[];
  suggesting: boolean;
  value: string | null;
  ownText: string;
  ownError: string | null;
  facts: ProjectDetail['approvedFacts'];
  disabled: boolean;
  onSelect: (value: string) => void;
  onOwnTextChange: (text: string) => void;
  onOwnTextBlur: () => void;
}) {
  const id = useId();
  const factText = new Map(facts.map((fact) => [fact.id, fact.text]));

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroupPrimitive.Root
        type="single"
        value={value ?? ''}
        onValueChange={(next) => {
          if (next) onSelect(next);
        }}
        disabled={disabled}
        aria-label="Selling angle"
        aria-busy={suggesting || undefined}
        className="grid gap-3 md:grid-cols-2"
      >
        {suggesting
          ? Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-border p-4"
              >
                <Skeleton className="h-5.5 w-24 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))
          : suggestions.map((suggestion) => (
              <ToggleGroupPrimitive.Item
                key={suggestion.id}
                value={suggestion.id}
                className={cn('group', cardClass)}
              >
                <SelectedCheck />
                <Badge dot={false}>{ANGLE_TYPE_LABEL[suggestion.type]}</Badge>
                <span className="t-h3 pr-6">{suggestion.title}</span>
                <span className="t-sm text-ink-2">{suggestion.pitch}</span>
                {suggestion.factIds.length > 0 ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="t-caption text-ink-3">Uses</span>
                    {suggestion.factIds.map((factId) =>
                      factText.has(factId) ? (
                        <Badge key={factId} dot={false}>
                          {factText.get(factId)}
                        </Badge>
                      ) : null,
                    )}
                  </span>
                ) : null}
              </ToggleGroupPrimitive.Item>
            ))}
        <ToggleGroupPrimitive.Item
          value={OWN_ANGLE}
          className={cn(
            'group',
            cardClass,
            'border-[1.5px] border-dashed border-border-strong data-[state=on]:border-solid',
          )}
        >
          <SelectedCheck />
          <PencilIcon aria-hidden="true" className="size-4 text-ink-2" />
          <span className="t-h3">Write my own angle</span>
          <span className="t-sm text-ink-2">Describe it in your words.</span>
        </ToggleGroupPrimitive.Item>
      </ToggleGroupPrimitive.Root>

      {value === OWN_ANGLE ? (
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${id}-own`}>Describe your angle</FieldLabel>
          <Textarea
            id={`${id}-own`}
            rows={3}
            maxLength={280}
            value={ownText}
            disabled={disabled}
            onChange={(event) => onOwnTextChange(event.target.value)}
            onBlur={onOwnTextBlur}
            aria-invalid={Boolean(ownError)}
            aria-describedby={ownError ? `${id}-own-error` : undefined}
          />
          {ownError ? (
            <FieldError id={`${id}-own-error`}>{ownError}</FieldError>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
