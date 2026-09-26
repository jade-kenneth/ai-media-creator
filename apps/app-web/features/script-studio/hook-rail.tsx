'use client';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { ClaimFlagCallout } from '@/components/studio/claim-flag-callout';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonCost } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useScrollFade } from '@/hooks/use-scroll-fade';
import { cn } from '@/lib/utils';
import { CREDIT_COST, HOOK_TYPE_LABEL } from '@/lib/studio/labels';
import type { ClaimFlag, ScriptHook } from '@/react-query/scripts/scripts-operations';

export interface HookItemState {
  rewriting: boolean;
  failed: boolean;
}

/**
 * The opening hook rail (Design Reference §5.8, scroller `script-studio.hooks`):
 * three cards at ≥ 1024px; below, a snapping rail with a peek, “n of m” and
 * previous/next controls.
 */
export function HookRail({
  hooks,
  flags,
  selectedId,
  readOnly,
  disabled,
  itemState,
  onSelect,
  onEdit,
  onRewrite,
}: {
  hooks: Array<Pick<ScriptHook, 'id' | 'type' | 'text' | 'openingShot'>>;
  flags: Map<string, ClaimFlag[]>;
  selectedId: string | null;
  readOnly: boolean;
  disabled: boolean;
  itemState: (hookId: string) => HookItemState;
  onSelect: (hookId: string) => void;
  onEdit: (hookId: string, patch: { text?: string; openingShot?: string }) => void;
  onRewrite: (hookId: string) => void;
}) {
  const [railRef, railFade] = useScrollFade<HTMLDivElement>();
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);

  const updateIndex = useCallback(() => {
    const element = railRef.current;
    const card = element?.firstElementChild as HTMLElement | null | undefined;
    if (!element || !card) return;
    setIndex(Math.round(element.scrollLeft / (card.offsetWidth + 12)));
  }, [railRef]);

  useEffect(() => {
    const element = railRef.current;
    element?.addEventListener('scroll', updateIndex, { passive: true });
    return () => element?.removeEventListener('scroll', updateIndex);
  }, [railRef, updateIndex]);

  const page = (delta: number) => {
    const element = railRef.current;
    const card = element?.children[index + delta] as HTMLElement | undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'nearest', inline: 'start' });
  };

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroupPrimitive.Root
        type="single"
        value={selectedId ?? ''}
        onValueChange={(value) => {
          if (value && !readOnly) onSelect(value);
        }}
        aria-label="Opening hook"
        disabled={disabled}
        asChild
      >
        <div
          ref={railRef}
          data-fade={railFade}
          data-scroller-id="script-studio.hooks"
          className="scroller flex gap-3 lg:grid lg:grid-cols-3 lg:overflow-visible"
        >
          {hooks.map((hook, position) => {
            const state = itemState(hook.id);
            const hookFlags = flags.get(hook.id) ?? [];
            const isEditing = editing === hook.id && !readOnly;

            return (
              <div
                key={hook.id}
                className={cn(
                  'flex w-[calc((100%-12px)/1.15)] shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface sm:w-[calc((100%-24px)/2.2)] lg:w-auto',
                  selectedId === hook.id && 'border-[1.5px] border-ink ring-1 ring-ink',
                )}
              >
                {state.rewriting ? (
                  <div className="flex flex-1 flex-col gap-2 p-4" aria-busy="true">
                    <Skeleton className="h-5.5 w-24 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-2/3" />
                    <p className="t-sm text-ink-2" role="status">
                      Rewriting this hook…
                    </p>
                  </div>
                ) : isEditing ? (
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <label className="t-label" htmlFor={`hook-${hook.id}-text`}>
                      Hook
                    </label>
                    <Textarea
                      id={`hook-${hook.id}-text`}
                      rows={2}
                      maxLength={160}
                      defaultValue={hook.text}
                      autoFocus
                      onChange={(event) => onEdit(hook.id, { text: event.target.value })}
                    />
                    <label className="t-label" htmlFor={`hook-${hook.id}-shot`}>
                      Opening shot
                    </label>
                    <Input
                      id={`hook-${hook.id}-shot`}
                      maxLength={200}
                      defaultValue={hook.openingShot}
                      onChange={(event) => onEdit(hook.id, { openingShot: event.target.value })}
                    />
                    <Button size="sm" variant="ghost" className="self-start" onClick={() => setEditing(null)}>
                      Done
                    </Button>
                  </div>
                ) : (
                  <ToggleGroupPrimitive.Item
                    value={hook.id}
                    aria-label={`Hook ${position + 1} of ${hooks.length}: ${HOOK_TYPE_LABEL[hook.type]}`}
                    className="relative flex flex-1 flex-col items-start gap-2.5 p-4 text-left disabled:cursor-default"
                  >
                    {selectedId === hook.id ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-ink text-white"
                      >
                        <CheckIcon className="size-3" strokeWidth={3} />
                      </span>
                    ) : null}
                    <Badge dot={false}>{HOOK_TYPE_LABEL[hook.type]}</Badge>
                    <span className="t-hook pr-5">“{hook.text}”</span>
                    <span className="t-sm text-ink-2">
                      <span className="font-medium text-ink">Opening shot:</span>{' '}
                      {hook.openingShot}
                    </span>
                  </ToggleGroupPrimitive.Item>
                )}
                {hookFlags.map((flag) => (
                  <ClaimFlagCallout
                    key={`${flag.category}-${flag.claim}`}
                    lead={flag.lead}
                    reason={flag.reason}
                    className="mx-4 mb-3"
                  />
                ))}
                {state.failed && !state.rewriting ? (
                  <p className="t-sm px-4 pb-2 text-danger" role="alert">
                    Rewrite didn’t finish. Your hook is unchanged. You weren’t charged.
                  </p>
                ) : null}
                {readOnly ? null : (
                  <div className="flex gap-1 border-t border-border px-3 py-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={disabled || state.rewriting}
                      onClick={() => setEditing(isEditing ? null : hook.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={disabled || state.rewriting}
                      aria-busy={state.rewriting}
                      onClick={() => onRewrite(hook.id)}
                    >
                      {state.rewriting ? <Spinner /> : null}
                      {state.failed ? 'Try again' : 'Rewrite'}
                      <ButtonCost>{CREDIT_COST.rewrite} credit</ButtonCost>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ToggleGroupPrimitive.Root>

      {hooks.length > 1 ? (
        <div className="flex items-center gap-2 lg:hidden">
          <span className="t-mono text-caption text-ink-2" aria-live="polite">
            {Math.min(index + 1, hooks.length)} of {hooks.length}
          </span>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Previous hook"
            disabled={index <= 0}
            onClick={() => page(-1)}
            className="ml-auto"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Next hook"
            disabled={index >= hooks.length - 1}
            onClick={() => page(1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
