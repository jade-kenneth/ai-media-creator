'use client';

import { AlertCircleIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Input } from '@/components/ui/input';
import { useControllableState } from '@/hooks/use-controllable-state';
import { callIfFn } from '@/utils/callIfFn';
import type { NumberRange } from '../useDataTable';

interface NumberRangePickerProps {
  id?: string;
  label: string;
  value?: Partial<NumberRange> | null;
  defaultValue?: Partial<NumberRange> | null;
  onChange?: (value: Partial<NumberRange> | null) => void;
  min?: number;
  max?: number;
  clearable?: boolean;
  disabled?: boolean;
  hint?:
    | string
    | ReactNode
    | ((value: NumberRange) => string | ReactNode);
}

export function NumberRangePicker({
  clearable = true,
  ...props
}: NumberRangePickerProps) {
  const min = props.min ?? 0;
  const max = props.max ?? 999_999;

  const [value, setValue] = useControllableState({
    value: props.value,
    onChange: props.onChange,
    defaultValue: props.defaultValue ?? null,
  });

  const hasInvalidRange =
    typeof value?.start === 'number' &&
    typeof value?.until === 'number' &&
    value.start > value.until;

  return (
    <div id={props.id} className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium">{props.label}</label>
          {hasInvalidRange ? (
            <AlertCircleIcon className="size-4 text-destructive" />
          ) : null}
        </div>

        {clearable && (value?.start !== undefined || value?.until !== undefined) ? (
          <button
            type="button"
            onClick={() => setValue(null)}
            className="text-sm font-medium text-primary"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          type="number"
          min={min}
          max={max}
          value={value?.start ?? ''}
          onChange={(event) => {
            const next = event.target.value;
            setValue({
              ...(value ?? {}),
              start: next.length ? Number(next) : undefined,
            });
          }}
          placeholder="Minimum"
          disabled={props.disabled}
        />

        <Input
          type="number"
          min={min}
          max={max}
          value={value?.until ?? ''}
          onChange={(event) => {
            const next = event.target.value;
            setValue({
              ...(value ?? {}),
              until: next.length ? Number(next) : undefined,
            });
          }}
          placeholder="Maximum"
          disabled={props.disabled}
        />
      </div>

      {value?.start === undefined || value?.until === undefined ? null : (
        <div className="text-xs text-muted-foreground">
          {callIfFn(props.hint ?? '', {
            start: value.start,
            until: value.until,
          })}
        </div>
      )}
    </div>
  );
}
