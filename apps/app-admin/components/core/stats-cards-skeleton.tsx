import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardsSkeletonProps {
  count?: number;
}

export function StatsCardsSkeleton({
  count = 3,
}: StatsCardsSkeletonProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="admin-surface min-h-[168px] border-border/70"
        >
          <CardContent className="flex h-full flex-col justify-between gap-6 px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded-full" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
              <Skeleton className="size-11 rounded-2xl" />
            </div>
            <Skeleton className="h-4 w-full rounded-full" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
