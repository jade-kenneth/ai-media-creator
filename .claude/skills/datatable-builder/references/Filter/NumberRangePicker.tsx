import { AlertCircleIcon } from '@untitled-theme/icons-react';
import { isNumber } from 'es-toolkit/compat';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';
import { NumberRangeField } from '~/components/forms/NumberRangeField';
import { Show } from '~/components/Show';
import { Field } from '~/components/ui/Field';
import { Tooltip } from '~/components/ui/Tooltip';
import { useControllableState } from '~/hooks/useControllableState';
import { NumberRange } from '~/types/index';
import { callIfFn } from '~/utils/callIfFn';

interface NumberRangePickerProps {
  id?: string;
  label: string;
  value?: Partial<NumberRange> | null;
  defaultValue?: Partial<NumberRange> | null;
  onChange?: (value: Partial<NumberRange> | null) => void;
  placeholder?: string | [min: string, max: string];
  min?: number;
  max?: number;
  clearable?: boolean;
  disabled?: boolean;
  hint?:
    | string
    | React.ReactNode
    | ((value: NumberRange) => string | React.ReactNode);
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

  return (
    <div id={props.id}>
      <div className="mb-1.5 flex items-center justify-between">
        <Field.Label asChild className="mb-0 flex gap-1">
          <span>
            {props.label}

            <Tooltip.Root positioning={{ placement: 'right' }}>
              <Tooltip.Trigger>
                <AlertCircleIcon
                  className={twMerge(
                    'size-3.5 text-[#ED4337]',
                    isNumber(value?.start) &&
                      isNumber(value?.until) &&
                      value.start > value.until
                      ? 'inline-block'
                      : 'hidden',
                  )}
                />
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>
                  <Tooltip.Arrow>
                    <Tooltip.ArrowTip />
                  </Tooltip.Arrow>
                  The minimum {props.label} must be less than or equal to the
                  maximum
                  {props.label}
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </span>
        </Field.Label>

        <Show when={clearable ? !!value?.start || !!value?.until : false}>
          <button
            type="button"
            onClick={() => {
              setValue(null);
            }}
            className="text-sm font-medium text-[#0BA5EC]"
          >
            Clear
          </button>
        </Show>
      </div>

      <NumberRangeField min={min} max={max} value={value} onChange={setValue} />

      {!value?.start || !value?.until ? null : (
        <div className="mt-2 text-xs text-[#94969C]">
          {callIfFn(props.hint, {
            start: value.start,
            until: value.until,
          })}
        </div>
      )}
    </div>
  );
}
