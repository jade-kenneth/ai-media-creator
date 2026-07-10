'use client';

import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useControllableState } from '@/hooks/use-controllable-state';

import { type DateRange, type DateRangePreset } from '../useDataTable';
import { DateRangePicker } from './DateRangePicker';

interface DualDateRangePickerProps {
  id?: string;
  type?: 'date' | 'datetime';
  label: string;
  value?: Partial<DateRange> | null;
  defaultValue?: Partial<DateRange> | null;
  onChange?: (value: Partial<DateRange> | null) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  presets?: DateRangePreset[];
}

export function DualDateRangePicker({
  clearable = true,
  ...props
}: DualDateRangePickerProps) {
  const [value, setValue] = useControllableState({
    value: props.value,
    onChange: props.onChange,
    defaultValue: props.defaultValue ?? null,
  });

  return (
    <div id={props.id} className="space-y-2">
      {props.presets?.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline" disabled={props.disabled}>
              Presets
              <ChevronDownIcon data-icon="inline-end" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {props.presets.map((preset) => (
              <DropdownMenuItem
                key={preset.label}
                onSelect={() => {
                  setValue(preset.value);
                }}
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <DateRangePicker
        type={props.type}
        label={props.label}
        value={value}
        onChange={setValue}
        placeholder={props.placeholder}
        clearable={clearable}
        disabled={props.disabled}
      />
    </div>
  );
}
