import { Loader2 } from 'lucide-react';

import { cn } from '@/utils';

interface LoadingChipProps {
  label: string;
  className?: string;
}

export function LoadingChip({ label, className }: LoadingChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="size-3.5 animate-spin" />
      {label}
    </span>
  );
}
