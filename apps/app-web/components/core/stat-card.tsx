import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  iconClassName: string;
  caption?: string;
};

export function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
  caption,
}: StatCardProps) {
  return (
    <Card className="admin-surface min-h-[168px] border-border/70">
      <CardContent className="flex h-full flex-col justify-between gap-6 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-muted/75 ring-1 ring-border/70">
            <Icon className={`size-5 ${iconClassName}`} />
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {caption ?? 'Updated from the latest operational summary.'}
        </p>
      </CardContent>
    </Card>
  );
}
