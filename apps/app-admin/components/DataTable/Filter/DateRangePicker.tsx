'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange as DayPickerRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useControllableState } from '@/hooks/use-controllable-state';
import { cn } from '@/utils';

import type { DateRange } from '../useDataTable';

interface DateRangePickerProps {
  id?: string;
  type?: 'date' | 'datetime';
  label: string;
  value?: Partial<DateRange> | null;
  defaultValue?: Partial<DateRange> | null;
  onChange?: (value: Partial<DateRange> | null) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
}

function toTimeValue(date: Date | undefined) {
  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }

  return format(date, 'HH:mm');
}

function setTimeOnDate(date: Date, timeValue: string) {
  const [hoursString, minutesString] = timeValue.split(':');
  const hours = Number.parseInt(hoursString ?? '0', 10);
  const minutes = Number.parseInt(minutesString ?? '0', 10);

  const next = new Date(date);
  next.setHours(Number.isNaN(hours) ? 0 : hours);
  next.setMinutes(Number.isNaN(minutes) ? 0 : minutes);
  next.setSeconds(0);
  next.setMilliseconds(0);

  return next;
}

function formatRangeLabel(value: Partial<DateRange> | null | undefined, mode: 'date' | 'datetime') {
  if (!value?.start && !value?.until) {
    return null;
  }

  const formatString = mode === 'datetime' ? 'PPP p' : 'PPP';

  if (value.start && value.until) {
    return `${format(value.start, formatString)} - ${format(value.until, formatString)}`;
  }

  if (value.start) {
    return `From ${format(value.start, formatString)}`;
  }

  if (value.until) {
    return `Until ${format(value.until, formatString)}`;
  }

  return null;
}

export function DateRangePicker({
  clearable = true,
  ...props
}: DateRangePickerProps) {
  const [value, setValue] = useControllableState({
    value: props.value,
    onChange: props.onChange,
    defaultValue: props.defaultValue ?? null,
  });
  const mode = props.type ?? 'datetime';

  const selectedRange: DayPickerRange | undefined =
    value?.start || value?.until
      ? {
          from: value?.start,
          to: value?.until,
        }
      : undefined;

  const label = formatRangeLabel(value, mode);

  return (
    <div id={props.id} className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{props.label}</label>

        {clearable && value && (value.start || value.until) ? (
          <button
            type="button"
            onClick={() => setValue(null)}
            className="text-sm font-medium text-primary"
          >
            Clear
          </button>
        ) : null}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={props.disabled}
            className={cn('w-full justify-start text-left font-normal', !label && 'text-muted-foreground')}
          >
            <CalendarIcon data-icon="inline-start" />
            <span className="truncate">{label ?? props.placeholder ?? 'Pick a date range'}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={(nextRange) => {
              if (!nextRange) {
                setValue(null);
                return;
              }

              const nextStart = nextRange.from
                ? mode === 'datetime' && value?.start
                  ? setTimeOnDate(nextRange.from, toTimeValue(value.start))
                  : nextRange.from
                : undefined;
              const nextUntil = nextRange.to
                ? mode === 'datetime' && value?.until
                  ? setTimeOnDate(nextRange.to, toTimeValue(value.until))
                  : nextRange.to
                : undefined;

              setValue({
                start: nextStart,
                until: nextUntil,
              });
            }}
            numberOfMonths={2}
            disabled={props.disabled}
          />

          {mode === 'datetime' ? (
            <div className="grid grid-cols-2 gap-2 border-t border-border p-2">
              <Input
                type="time"
                value={toTimeValue(value?.start)}
                onChange={(event) => {
                  const base = value?.start ?? new Date();
                  setValue({
                    ...(value ?? {}),
                    start: setTimeOnDate(base, event.target.value),
                  });
                }}
                disabled={props.disabled}
              />
              <Input
                type="time"
                value={toTimeValue(value?.until)}
                onChange={(event) => {
                  const base = value?.until ?? value?.start ?? new Date();
                  setValue({
                    ...(value ?? {}),
                    until: setTimeOnDate(base, event.target.value),
                  });
                }}
                disabled={props.disabled}
              />
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
