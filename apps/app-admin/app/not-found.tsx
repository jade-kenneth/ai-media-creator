import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="flex max-w-lg flex-col items-center gap-5 rounded-[28px] border border-border/70 bg-card/85 px-8 py-10 text-center shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="size-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            The page you requested is not part of the current admin workspace.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/admin/dashboard">Back to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
