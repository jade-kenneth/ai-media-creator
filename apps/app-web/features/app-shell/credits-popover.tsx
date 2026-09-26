'use client';

import { CoinsIcon } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CreditEntryKind } from '@/react-query/generated__types';
import { useMyCreditsQuery } from '@/react-query/credits/credits-operations';
import { formatRelativeTime } from '@/utils/date';

/** Credits pill and popover: balance, how charging works, recent usage. */
export function CreditsPopover() {
  const credits = useMyCreditsQuery();
  const balance = credits.data?.myCredits.balance;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            balance === undefined
              ? 'Credits'
              : `${balance} credits available`
          }
          className="press flex h-8 items-center gap-2 rounded-full border border-border-strong bg-surface px-3 text-ink hover:bg-surface-hover aria-expanded:bg-surface-hover max-lg:h-10"
        >
          <CoinsIcon aria-hidden="true" className="size-4 text-ink-2" />
          {balance === undefined ? (
            <Skeleton className="h-3 w-7" />
          ) : (
            <span className="t-mono">{balance}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent aria-label="Credits">
        <h2 className="t-h3">Credits</h2>
        {credits.isPending ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : credits.isError ? (
          <p className="t-sm text-danger">We couldn’t load your usage.</p>
        ) : (
          <>
            <p className="flex items-baseline gap-2">
              <span className="font-mono text-display font-semibold">
                {credits.data.myCredits.balance}
              </span>
              <span className="t-sm text-ink-2">credits available</span>
            </p>
            <p className="t-sm text-ink-2">
              Paid actions show their cost before you start. Failed jobs aren’t
              charged.
            </p>
            <Separator />
            <div className="flex flex-col gap-2">
              <h3 className="t-overline text-ink-3">Recent usage</h3>
              {credits.data.myCredits.recentUsage.length === 0 ? (
                <p className="t-sm text-ink-3">No usage yet.</p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {credits.data.myCredits.recentUsage.map((entry) => (
                    <li key={entry.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="t-sm text-ink">{entry.label}</p>
                        <p className="t-caption truncate text-ink-3">
                          {[entry.projectTitle, formatRelativeTime(entry.createdAt)]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <span
                        className={cn(
                          't-mono',
                          entry.kind === CreditEntryKind.Hold
                            ? 'text-ink'
                            : 'text-success',
                        )}
                      >
                        {entry.amount > 0 ? `+${entry.amount}` : `−${Math.abs(entry.amount)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
