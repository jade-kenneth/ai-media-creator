'use client';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import {
  ExternalLinkIcon,
  HelpCircleIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react';
import { useId, useState } from 'react';

import { ClaimFlagCallout } from '@/components/studio/claim-flag-callout';
import { FieldError, FieldHint } from '@/components/studio/field-label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FACT_SOURCE_LABEL, FACT_STATUS_BADGE } from '@/lib/studio/labels';
import { FactSource, FactStatus } from '@/react-query/generated__types';
import type { ProductFact } from '@/react-query/facts/facts-operations';

function SourceLine({ fact }: { fact: ProductFact }) {
  const Icon =
    fact.source === FactSource.Listing
      ? LinkIcon
      : fact.source === FactSource.Edited
        ? PencilIcon
        : fact.source === FactSource.NotStated
          ? HelpCircleIcon
          : UserIcon;
  const listing = fact.source === FactSource.Listing && fact.sourceUrl;

  return (
    <p className="t-sm flex min-w-0 items-center gap-1.5 text-ink-2">
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="shrink-0">
        {FACT_SOURCE_LABEL[fact.source]}
        {listing ? ' ·' : ''}
      </span>
      {listing ? (
        <a
          href={fact.sourceUrl ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-1 text-flare-text underline underline-offset-2"
        >
          <span className="truncate">
            {fact.sourceUrl?.replace(/^https?:\/\//, '')}
          </span>
          <ExternalLinkIcon aria-hidden="true" className="size-3 shrink-0" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </p>
  );
}

export function FactRow({
  fact,
  disabled,
  saving,
  error,
  onDecide,
  onMarkUnknown,
  onSaveText,
  onRemove,
}: {
  fact: ProductFact;
  disabled: boolean;
  saving: boolean;
  error: string | null;
  onDecide: (status: FactStatus.Approved | FactStatus.Rejected) => void;
  onMarkUnknown: () => void;
  onSaveText: (text: string) => Promise<boolean>;
  onRemove: () => void;
}) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fact.text);
  const [editError, setEditError] = useState<string | null>(null);
  const badge = FACT_STATUS_BADGE[fact.status];
  const unreviewed = fact.status === FactStatus.Unreviewed;
  const unknown = fact.status === FactStatus.Unknown;
  const decision =
    fact.status === FactStatus.Approved || fact.status === FactStatus.Rejected
      ? fact.status
      : '';

  const startEdit = () => {
    setDraft(fact.text);
    setEditError(null);
    setEditing(true);
  };

  const save = async () => {
    const text = draft.trim();

    if (!text) {
      setEditError('Write the fact.');
      return;
    }

    if (await onSaveText(text)) setEditing(false);
  };

  return (
    <li
      className={cn(
        'relative grid grid-cols-1 gap-4 overflow-hidden rounded-lg border border-border px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] max-sm:px-4',
        unreviewed
          ? 'bg-warning-tint before:absolute before:inset-y-0 before:left-0 before:w-0.75 before:bg-warning'
          : 'bg-surface',
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-edit`} className="sr-only">
              Fact wording
            </label>
            <Textarea
              id={`${id}-edit`}
              rows={2}
              maxLength={200}
              value={draft}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setEditing(false);
              }}
              aria-invalid={Boolean(editError)}
              aria-describedby={`${id}-edit-hint`}
            />
            {editError ? (
              <FieldError id={`${id}-edit-hint`}>{editError}</FieldError>
            ) : (
              <FieldHint id={`${id}-edit-hint`}>
                Edited facts need your approval again.
              </FieldHint>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => void save()} disabled={saving} aria-busy={saving}>
                {saving ? <Spinner /> : null}
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <p
            className={cn(
              'text-body leading-5.5 font-medium',
              fact.status === FactStatus.Rejected ? 'text-ink-3 line-through' : 'text-ink',
            )}
          >
            {fact.text}
          </p>
        )}
        <SourceLine fact={fact} />
        {fact.flag ? (
          <ClaimFlagCallout
            id={`${id}-flag`}
            lead={fact.flag.lead}
            reason={fact.flag.reason}
            className="mt-1"
          />
        ) : null}
        {fact.note ? <p className="t-sm text-ink-3">Note: {fact.note}</p> : null}
        {error ? <p className="t-sm text-danger" role="alert">{error}</p> : null}
      </div>

      <div className="flex items-center gap-2 max-md:flex-wrap">
        <Badge variant={badge.tone}>{badge.label}</Badge>
        {unknown ? null : (
          <ToggleGroupPrimitive.Root
            type="single"
            value={decision}
            onValueChange={(value) => {
              if (value === FactStatus.Approved || value === FactStatus.Rejected) {
                onDecide(value);
              }
            }}
            disabled={disabled}
            aria-label={`Review: ${fact.text}`}
            aria-describedby={fact.flag ? `${id}-flag` : undefined}
            className="flex gap-0.5 rounded-md bg-surface-sunken p-0.75"
          >
            <ToggleGroupPrimitive.Item
              value={FactStatus.Approved}
              className="t-label h-9 rounded-sm px-3 text-ink-2 transition-colors duration-120 hover:text-ink disabled:opacity-50 data-[state=on]:bg-success data-[state=on]:text-white lg:h-8"
            >
              Approve
            </ToggleGroupPrimitive.Item>
            <ToggleGroupPrimitive.Item
              value={FactStatus.Rejected}
              className="t-label h-9 rounded-sm px-3 text-ink-2 transition-colors duration-120 hover:text-ink disabled:opacity-50 data-[state=on]:bg-danger data-[state=on]:text-white lg:h-8"
            >
              Reject
            </ToggleGroupPrimitive.Item>
          </ToggleGroupPrimitive.Root>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label={`More actions for ${fact.text}`}
            >
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={startEdit}>
                <PencilIcon />
                {unknown ? 'Add what you know' : 'Edit wording'}
              </DropdownMenuItem>
              {unknown ? null : (
                <DropdownMenuItem onSelect={onMarkUnknown}>
                  <HelpCircleIcon />
                  Mark as unknown
                </DropdownMenuItem>
              )}
              {fact.removable ? (
                <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                  <Trash2Icon />
                  Remove
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
