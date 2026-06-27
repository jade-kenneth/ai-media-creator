import { SearchMdIcon } from '@untitled-theme/icons-react';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Field } from '~/components/ui/Field';
import { Icon } from '~/components/ui/Icon';
import { useDataTableContext } from './DataTableContext';

export function Searchbar() {
  const context = useDataTableContext();

  const [value, setValue] = useState(context.search.value);
  const setExternalValue = useDebouncedCallback(context.search.setValue, 250);

  if (!context.search.enabled) return null;

  return (
    <Field.Root className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#85888E]">
        <SearchMdIcon />
      </Icon>
      <Field.Input
        size="sm"
        className="w-[250px] pl-10"
        placeholder={context.search.placeholder}
        value={value}
        onChange={(e) => {
          setExternalValue(e.target.value);
          setValue(e.target.value);
        }}
      />
    </Field.Root>
  );
}
