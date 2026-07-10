'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useControllableState } from '@/hooks/use-controllable-state';
import { cn } from '@/utils';

interface DatePickerProps {
  id?: string;
  type?: 'date' | 'datetime';
  label: string;
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date | null) => void;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
}

function toTimeValue(date: Date | null | undefined) {
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

export function DatePicker({ clearable = true, ...props }: DatePickerProps) {
  const [value, setValue] = useControllableState({
    value: props.value,
    onChange: props.onChange,
    defaultValue: props.defaultValue ?? null,
  });
  const mode = props.type ?? 'date';

  return (
    <div id={props.id} className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{props.label}</label>
        {clearable && value ? (
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
            className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}
          >
            <CalendarIcon data-icon="inline-start" />
            {value
              ? mode === 'datetime'
                ? format(value, 'PPP p')
                : format(value, 'PPP')
              : props.placeholder ?? 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(nextDate) => {
              if (!nextDate) {
                setValue(null);
                return;
              }

              if (mode === 'datetime' && value) {
                setValue(setTimeOnDate(nextDate, toTimeValue(value)));
                return;
              }

              setValue(nextDate);
            }}
            disabled={props.disabled}
          />
          {mode === 'datetime' ? (
            <div className="border-t border-border p-2">
              <Input
                type="time"
                value={toTimeValue(value)}
                onChange={(event) => {
                  const nextDate = value ?? new Date();
                  setValue(setTimeOnDate(nextDate, event.target.value));
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
