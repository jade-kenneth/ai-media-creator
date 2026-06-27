import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ModuleErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

export function ModuleErrorState({
  title,
  message,
  onRetry,
  retryLabel = 'Retry',
}: ModuleErrorStateProps) {
  return (
    <Card className="admin-surface border-border/70">
      <CardContent className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-medium">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="w-full sm:w-auto"
        >
          {retryLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
