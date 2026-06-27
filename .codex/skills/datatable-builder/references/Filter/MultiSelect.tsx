import { SelectMultiField } from '~/components/forms/SelectMultiField';
import { Show } from '~/components/Show';
import { Field } from '~/components/ui/Field';
import { useControllableState } from '~/hooks/useControllableState';
import { Option } from '~/types/index';
import { callIfFn } from '~/utils/callIfFn';

interface MultiSelectProps {
  id?: string;
  label: string;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  options: Option[] | (() => Option[]);
  clearable?: boolean;
  disabled?: boolean;
}

export function MultiSelect({ clearable = true, ...props }: MultiSelectProps) {
  const [value, setValue] = useControllableState({
    value: props.value,
    onChange: props.onChange,
    defaultValue: props.defaultValue ?? [],
  });

  return (
    <Field.Root id={props.id}>
      <div className="mb-1.5 flex items-center justify-between">
        <Field.Label className="mb-0">
          {props.label}

          {value.length > 0 && (
            <span>
              &nbsp;(
              <span className="text-[#3C2D0C] dark:text-brand inplay:text-brand-inplay">
                {value.length}
              </span>
              )
            </span>
          )}
        </Field.Label>
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

      <SelectMultiField
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
