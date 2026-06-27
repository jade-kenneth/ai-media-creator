import { AsyncComboField } from '~/components/forms/AsyncComboField';
import { Show } from '~/components/Show';
import { Field } from '~/components/ui/Field';
import { useControllableState } from '~/hooks/useControllableState';
import { Option } from '~/types/index';

interface ComboboxProps {
  id?: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: (inputValue: string, previousValue: string) => Promise<Option[]>;
  disabled?: boolean;
  clearable?: boolean;
  placeholder?: string;
}

export function Combobox({ clearable = true, ...props }: ComboboxProps) {
  const [value, setValue] = useControllableState({
    value: props.value,
    defaultValue: props.defaultValue ?? '',
    onChange: props.onChange,
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
      <AsyncComboField
        value={value}
        onChange={setValue}
        loadOptions={props.options}
        disabled={props.disabled}
        placeholder={props.placeholder}
        portalled
      />
    </Field.Root>
  );
}
