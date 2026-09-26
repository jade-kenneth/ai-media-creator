'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { VERSION_STATUS_BADGE } from '@/lib/studio/labels';
import { ScriptOriginKind, ScriptVersionStatus } from '@/react-query/generated__types';
import type { ScriptVersion } from '@/react-query/scripts/scripts-operations';
import { formatDateTime } from '@/utils/date';

function originLabel(version: ScriptVersion) {
  switch (version.origin.kind) {
    case ScriptOriginKind.Restored:
      return `Restored from v${version.origin.fromNumber}`;
    case ScriptOriginKind.Edited:
      return `Edited from v${version.origin.fromNumber}`;
    case ScriptOriginKind.Copied:
      return 'Copied from the original project';
    default:
      return 'Written by AI';
  }
}

/** Version history (Design Reference §5.8): view any version, restore as new. */
export function HistoryDrawer({
  open,
  onOpenChange,
  versions,
  viewingId,
  nextNumber,
  restoringId,
  disabled,
  onView,
  onRestore,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: ScriptVersion[];
  viewingId: string | null;
  nextNumber: number;
  restoringId: string | null;
  disabled: boolean;
  onView: (version: ScriptVersion) => void;
  onRestore: (version: ScriptVersion) => void;
}) {
  const newest = versions[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <ol>
            {versions.map((version) => {
              const badge = VERSION_STATUS_BADGE[version.status];
              const viewing = version.id === viewingId;
              const hook = version.hooks.find((item) => item.id === version.selectedHookId) ?? version.hooks[0];
              const when = version.approvedAt
                ? `Approved ${formatDateTime(version.approvedAt)}`
                : formatDateTime(version.createdAt);

              return (
                <li
                  key={version.id}
                  className={cn(
                    'flex flex-col gap-1.5 border-b border-border px-5 py-4',
                    viewing && 'outline-[1.5px] -outline-offset-[1.5px] outline-ink',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="t-h3">v{version.number}</span>
                    <Badge variant={badge.tone}>{badge.label}</Badge>
                    {viewing ? <span className="t-caption ml-auto text-ink-3">Viewing</span> : null}
                  </div>
                  <p className="t-caption text-ink-3">
                    {when} · {originLabel(version)}
                  </p>
                  {version.angleTitle ? <p className="t-sm">{version.angleTitle}</p> : null}
                  {hook ? (
                    <p className="t-sm line-clamp-2 text-ink-2">“{hook.text}”</p>
                  ) : null}
                  <div className="mt-1 flex gap-2">
                    {viewing ? null : (
                      <Button size="sm" variant="ghost" onClick={() => onView(version)}>
                        View
                      </Button>
                    )}
                    {version.id !== newest?.id || version.status !== ScriptVersionStatus.Draft ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={disabled || restoringId !== null}
                        onClick={() => onRestore(version)}
                      >
                        {restoringId === version.id ? <Spinner /> : null}
                        Restore as v{nextNumber}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
