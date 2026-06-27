'use client';

import { Button } from '@/components/ui/button';
import { RefreshCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useDataTableContext } from './DataTableContext';

export function Reload() {
  const datatable = useDataTableContext();
  const t = useTranslations('Common');

  if (!datatable.table.reload) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={datatable.table.reload}
      disabled={datatable.table.loading}
    >
      <RefreshCcwIcon className={datatable.table.loading ? 'animate-spin' : undefined} />
      <span className="sr-only">{t('reload')}</span>
    </Button>
  );
}
