import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-[28px] border border-border/70 bg-card/85 px-8 py-10 text-center shadow-sm">
        <Loader2 className="size-8 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Loading admin workspace</p>
          <p className="text-sm text-muted-foreground">
            Preparing the latest organization operations data.
          </p>
        </div>
      </div>
    </main>
  );
}
