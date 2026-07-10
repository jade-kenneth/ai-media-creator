'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { useDataTableContext } from './DataTableContext';

function formatRangeLabel(count: number, page: number, pageSize: number) {
  if (count <= 0) {
    return {
      end: 0,
      start: 0,
    };
  }

  return {
    end: Math.min(page * pageSize, count),
    start: (page - 1) * pageSize + 1,
  };
}

export function Pagination() {
  const datatable = useDataTableContext();
  const format = useFormatter();
  const t = useTranslations('Common');

  if (!datatable.pagination.enabled) {
    return null;
  }

  const { end, start } = formatRangeLabel(
    datatable.pagination.count,
    datatable.pagination.page,
    datatable.pagination.pageSize,
  );
  const totalPages = Math.max(1, datatable.pagination.numOfPages || 1);
  const loading = datatable.table.loading || datatable.pagination.loading;

  return (
    <div className="flex w-full flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-live="polite">
          {t('showingResults', {
            start: format.number(start),
            end: format.number(end),
            count: format.number(datatable.pagination.count),
          })}
        </span>
        {loading ? <Loader2Icon className="animate-spin" /> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={String(datatable.pagination.pageSize)}
          onValueChange={(value) => datatable.pagination.setPageSize(Number(value))}
          disabled={loading}
        >
          <SelectTrigger className="min-w-28">
            <SelectValue placeholder={t('rows')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {datatable.pagination.pageSizes.map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {t('perPage', { count: pageSize })}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="rounded-full border border-border/70 px-3 py-1 text-sm text-muted-foreground">
          {t('pageOf', {
            page: datatable.pagination.page,
            total: totalPages,
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={datatable.pagination.prev}
          disabled={loading || !datatable.pagination.hasPrevPage}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          {t('previous')}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={datatable.pagination.next}
          disabled={loading || !datatable.pagination.hasNextPage}
        >
          {t('next')}
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
