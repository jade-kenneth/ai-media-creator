import { DateField } from '~/components/forms/DateField';
import { Show } from '~/components/Show';
import { Field } from '~/components/ui/Field';
import { useControllableState } from '~/hooks/useControllableState';

interface DatePickerProps {
  id?: string;
  /** @default 'date' */
  type?: 'date' | 'datetime';
  label: string;
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date | null) => void;
  placeholder?: string;
  format?: (date: Date) => string;
  /** @default true */
  clearable?: boolean;
  disabled?: boolean;
}

export function DatePicker({ clearable = true, ...props }: DatePickerProps) {
  const [value, setValue] = useControllableState({
    value: props.value,
    onChange: props.onChange,
    defaultValue: props.defaultValue ?? null,
  });

  return (
    <Field.Root id={props.id}>
      <div className="mb-1.5 flex items-center justify-between">
        <Field.Label className="mb-0">{props.label}</Field.Label>

        <Show when={clearable && !!value}>
          <button
            type="button"
            onClick={() => setValue(null)}
            className="text-sm font-medium text-[#0BA5EC]"
          >
            Clear
          </button>
        </Show>
      </div>

      <DateField
        type={props.type ?? 'date'}
        value={value}
        onChange={setValue}
        disabled={props.disabled}
        placeholder={props.placeholder}
        portalled
      />
    </Field.Root>
  );
}
