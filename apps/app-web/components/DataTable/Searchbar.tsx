'use client';

import * as React from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useDataTableContext } from './DataTableContext';

export function Searchbar() {
  const datatable = useDataTableContext();
  const t = useTranslations('Common');
  const [value, setValue] = React.useState(datatable.search.value);
  const setExternalValue = useDebouncedCallback(datatable.search.setValue, 250);

  React.useEffect(() => {
    setValue(datatable.search.value);
  }, [datatable.search.value]);

  if (!datatable.search.enabled) {
    return null;
  }

  return (
    <div className="relative w-full min-w-97.5">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setExternalValue(event.target.value);
        }}
        placeholder={datatable.search.placeholder ?? t('searchRecords')}
        className="pl-9 pr-9 "
      />
      {value.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => {
            setValue('');
            setExternalValue.cancel();
            datatable.search.setValue('');
          }}
        >
          <XIcon />
          <span className="sr-only">{t('clearSearch')}</span>
        </Button>
      ) : null}
    </div>
  );
}
