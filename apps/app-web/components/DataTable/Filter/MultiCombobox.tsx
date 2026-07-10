'use client';

import { ChevronsUpDownIcon, Loader2Icon } from 'lucide-react';
import * as React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useControllableState } from '@/hooks/use-controllable-state';
import { cn } from '@/utils';

import type { Option } from '../useDataTable';

interface MultiComboboxProps {
  id?: string;
  label: string;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  options: (inputValue: string, previousValue: string[]) => Promise<Option[]>;
  disabled?: boolean;
  clearable?: boolean;
  clearOnSelect?: boolean;
  placeholder?: string;
}

function getValueLabel(value: string[], options: Option[], placeholder?: string) {
  if (value.length === 0) {
    return placeholder ?? 'Select';
  }

  const labels = value
    .map((entry) => options.find((option) => option.value === entry)?.label ?? entry)
    .slice(0, 2);

  const joined = labels.join(', ');

  if (value.length <= 2) {
    return joined;
  }

  return `${joined} +${value.length - 2}`;
}

export function MultiCombobox({
  clearable = true,
  clearOnSelect = false,
  ...props
}: MultiComboboxProps) {
  const [value, setValue] = useControllableState({
    value: props.value,
    defaultValue: props.defaultValue ?? [],
    onChange: props.onChange,
  });
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [options, setOptions] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const next = await props.options(query, value);

        if (active) {
          setOptions(next);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [props, query, value]);

  return (
    <div id={props.id} className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {props.label}
          {value.length > 0 ? (
            <span className="text-muted-foreground"> ({value.length})</span>
          ) : null}
        </label>
        {clearable && value.length > 0 ? (
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() => setValue([])}
          >
            Clear
          </button>
        ) : null}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-expanded={open}
            className={cn(
              'flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
              value.length === 0 && 'text-muted-foreground',
            )}
            disabled={props.disabled}
          >
            <span className="truncate">
              {getValueLabel(value, options, props.placeholder)}
            </span>
            <ChevronsUpDownIcon className="size-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={props.placeholder ?? `Search ${props.label}`}
            />
            <CommandList>
              {loading ? (
                <CommandItem value="loading" disabled>
                  <Loader2Icon className="size-4 animate-spin" />
                  Loading options
                </CommandItem>
              ) : null}
              {!loading ? <CommandEmpty>No options found.</CommandEmpty> : null}
              {!loading ? (
                <CommandGroup>
                  {options.map((option) => {
                    const checked = value.includes(option.value);

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => {
                          const nextValue = checked
                            ? value.filter((entry) => entry !== option.value)
                            : [...value, option.value];

                          setValue(nextValue);

                          if (clearOnSelect && !checked) {
                            setQuery('');
                          }
                        }}
                      >
                        <Checkbox
                          checked={checked}
                          className="pointer-events-none"
                          aria-hidden="true"
                        />
                        <span className="truncate">{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
