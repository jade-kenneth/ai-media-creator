'use client';

import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

import { useHydrated } from '@/hooks/use-hydrated';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();
  const t = useTranslations('Common');

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="rounded-full border-border/70 bg-background/80 shadow-sm"
      aria-label={
        mounted
          ? isDark
            ? t('switchToLight')
            : t('switchToDark')
          : t('toggleTheme')
      }
      disabled={!mounted}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {mounted ? (
        isDark ? (
          <SunMedium className="size-4" />
        ) : (
          <MoonStar className="size-4" />
        )
      ) : (
        <span aria-hidden="true" className="size-4" />
      )}
    </Button>
  );
}
