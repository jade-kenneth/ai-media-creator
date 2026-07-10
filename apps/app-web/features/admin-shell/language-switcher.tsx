'use client';

import { Check, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type AppLocale,
  localeCookieName,
  locales,
} from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('Common');
  const [isPending, startTransition] = useTransition();

  function selectLocale(nextLocale: AppLocale) {
    document.cookie = `${localeCookieName}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t('language')}
          className="rounded-full border-border/70 bg-background/80 shadow-sm"
          disabled={isPending}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t('language')}</DropdownMenuLabel>
        {locales.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => selectLocale(option)}
          >
            <span className="flex-1">
              {option === 'en' ? t('english') : t('tagalog')}
            </span>
            {locale === option ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
