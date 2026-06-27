import { isEmpty } from 'es-toolkit/compat';
import { DateRangeField } from '~/components/forms/DateRangeField';
import { Show } from '~/components/Show';
import { Field } from '~/components/ui/Field';
import { useControllableState } from '~/hooks/useControllableState';
import { DateRange } from '~/types/index';

interface DateRangePickerProps {
  id?: string;
  /** @default 'datetime' */
  type?: 'date' | 'datetime';
  label: string;
  value?: Partial<DateRange> | null;
  defaultValue?: Partial<DateRange> | null;
  onChange?: (value: Partial<DateRange> | null) => void;
  placeholder?: string;
  /** @default true */
  clearable?: boolean;
  disabled?: boolean;
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

  return (
    <Field.Root id={props.id}>
      <div className="mb-1.5 flex items-center justify-between">
        <Field.Label className="mb-0">{props.label}</Field.Label>

        <Show when={clearable && !!value && !isEmpty(value)}>
          <button
            type="button"
            onClick={() => setValue(null)}
            className="text-sm font-medium text-[#0BA5EC]"
          >
            Clear
          </button>
        </Show>
      </div>

      <DateRangeField
        type={props.type ?? 'datetime'}
        value={value}
        onChange={setValue}
        disabled={props.disabled}
        placeholder={props.placeholder}
        portalled
      />
    </Field.Root>
  );
}
