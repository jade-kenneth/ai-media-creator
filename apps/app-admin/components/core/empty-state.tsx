import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-[22px] border border-border/70 bg-muted/70 text-primary shadow-sm">
        <Icon className="size-8" />
      </div>
      <h3 className="mt-5 text-lg font-medium">{title}</h3>
      <p className="mt-2 max-w-[340px] text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionLabel ? (
        <Button className="mt-5" size="lg">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
