'use client';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { CheckIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ProjectDetail } from '@/react-query/projects/projects-operations';

type Suggestion = NonNullable<
  ProjectDetail['audienceSuggestionSet']
>['suggestions'][number];

const cardClass =
  'group relative flex w-full flex-col items-start gap-1.5 rounded-lg border border-border bg-surface p-4 text-left transition-colors duration-120 hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60 data-[state=on]:border-[1.5px] data-[state=on]:border-ink data-[state=on]:ring-1 data-[state=on]:ring-ink';

/**
 * Suggested audiences as one radio group (Design Reference §5.7). Picking a
 * card fills the three Audience fields, which stay editable; a card shows as
 * chosen while the fields still match it.
 */
export function AudiencePicker({
  suggestions,
  suggesting,
  value,
  facts,
  disabled,
  onSelect,
}: {
  suggestions: Suggestion[];
  suggesting: boolean;
  value: string | null;
  facts: ProjectDetail['approvedFacts'];
  disabled: boolean;
  onSelect: (suggestion: Suggestion) => void;
}) {
  const factText = new Map(facts.map((fact) => [fact.id, fact.text]));

  if (!suggesting && !suggestions.length) return null;

  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value ?? ''}
      onValueChange={(next) => {
        const suggestion = suggestions.find((item) => item.id === next);
        if (suggestion) onSelect(suggestion);
      }}
      disabled={disabled}
      aria-label="Suggested audiences"
      aria-busy={suggesting || undefined}
      className="grid gap-3 md:grid-cols-3"
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
            </div>
          ))
        : suggestions.map((suggestion) => (
            <ToggleGroupPrimitive.Item
              key={suggestion.id}
              value={suggestion.id}
              className={cardClass}
            >
              <span
                aria-hidden="true"
                className="absolute top-3 right-3 hidden size-5 items-center justify-center rounded-full bg-ink text-white group-data-[state=on]:flex"
              >
                <CheckIcon className="size-3" strokeWidth={3} />
              </span>
              <span className="t-h3 pr-6">{suggestion.buyer}</span>
              {suggestion.problem ? (
                <span className="t-sm text-ink-2">
                  <span className="font-medium text-ink">Problem:</span>{' '}
                  {suggestion.problem}
                </span>
              ) : null}
              {suggestion.benefit ? (
                <span className="t-sm text-ink-2">
                  <span className="font-medium text-ink">Wants:</span>{' '}
                  {suggestion.benefit}
                </span>
              ) : null}
              {suggestion.factIds.some((id) => factText.has(id)) ? (
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
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
    </ToggleGroupPrimitive.Root>
  );
}
