import { AsyncComboMultiField } from '~/components/forms/AsyncComboMultiField';
import { Show } from '~/components/Show';
import { Field } from '~/components/ui/Field';
import { useControllableState } from '~/hooks/useControllableState';
import { Option } from '~/types/index';

interface MultiComboboxProps {
  id?: string;
  label: string;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  options: (inputValue: string, previousValue: string[]) => Promise<Option[]>;
  disabled?: boolean;
  clearable?: boolean;
  clearOnSelect?: boolean;
  placeholder?: string;
}

export function MultiCombobox({
  clearable = true,
  ...props
}: MultiComboboxProps) {
  const [value, setValue] = useControllableState({
    value: props.value,
    defaultValue: props.defaultValue ?? [],
    onChange: props.onChange,
  });

  return (
    <Field.Root id={props.id}>
      <div className="mb-1.5 flex items-center justify-between">
        <Field.Label className="mb-0">{props.label}</Field.Label>
        <Show when={clearable && value.length > 0}>
          <button
            type="button"
            className="text-sm font-medium text-[#0BA5EC]"
            onClick={() => setValue([])}
          >
            Clear
          </button>
        </Show>
      </div>

      <AsyncComboMultiField
        value={value}
        onChange={setValue}
        loadOptions={props.options}
        disabled={props.disabled}
        placeholder={props.placeholder}
        clearOnSelect={props.clearOnSelect}
        portalled
        dataTestId={`filter.${props.label
          .toLowerCase()
          .replace(/\s+/g, '-')}-multi-combobox`}
      />
    </Field.Root>
  );
}
