import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <section className="admin-surface">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[1.85rem]">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
              {description}
            </p>
          </div>
        </div>
        {action ? (
          <div className="admin-muted-surface w-full p-2 sm:w-auto">
            {action}
          </div>
        ) : null}
      </div>
    </section>
  );
}
