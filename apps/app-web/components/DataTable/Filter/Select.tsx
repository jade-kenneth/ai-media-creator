'use client';

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import * as React from 'react';

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
import { callIfFn } from '@/utils/call-if-fn';
import { cn } from '@/utils';

import type { Option } from '../useDataTable';

interface SelectProps {
  id?: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  options: Option[] | (() => Option[]);
  clearable?: boolean;
  disabled?: boolean;
}

export function Select({ clearable = true, ...props }: SelectProps) {
  const [value, setValue] = useControllableState({
    value: props.value,
    onChange: props.onChange,
    defaultValue: props.defaultValue ?? '',
  });
  const [open, setOpen] = React.useState(false);

  const options = callIfFn(props.options);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div id={props.id} className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{props.label}</label>
        {clearable && value ? (
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() => setValue('')}
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
              !selectedOption && 'text-muted-foreground',
            )}
            disabled={props.disabled}
          >
            <span className="truncate">
              {selectedOption?.label ?? props.placeholder ?? 'Select'}
            </span>
            <ChevronsUpDownIcon className="size-4 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={props.placeholder ?? `Search ${props.label}`} />
            <CommandList>
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      setValue(option.value);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        'size-4 text-primary',
                        option.value === value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
