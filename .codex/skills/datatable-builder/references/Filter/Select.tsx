import { SelectField } from '~/components/forms/SelectField';
import { Show } from '~/components/Show';
import { Field } from '~/components/ui/Field';
import { useControllableState } from '~/hooks/useControllableState';
import { Option } from '~/types/index';
import { callIfFn } from '~/utils/callIfFn';

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

  return (
    <Field.Root id={props.id}>
      <div className="mb-1.5 flex items-center justify-between">
        <Field.Label className="mb-0">{props.label}</Field.Label>
        <Show when={clearable && !!value}>
          <button
            type="button"
            className="text-sm font-medium text-[#0BA5EC]"
            onClick={() => setValue('')}
          >
            Clear
          </button>
        </Show>
      </div>
      <SelectField
        options={callIfFn(props.options)}
        value={value}
        onChange={setValue}
        disabled={props.disabled}
        placeholder={props.placeholder ?? 'Select'}
        portalled
      />
    </Field.Root>
  );
}
