import * as React from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Show } from '~/components/Show';
import { Field } from '~/components/ui/Field';
import { useControllableState } from '~/hooks/useControllableState';

interface InputProps {
  id?: string;
  type?: 'text' | 'url' | 'email' | (string & {});
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  clearable?: boolean;
  placeholder?: string;
}

export function Input({ clearable = true, ...props }: InputProps) {
  const [value, setValue] = useControllableState({
    value: props.value,
    onChange: props.onChange,
    defaultValue: props.defaultValue ?? '',
  });

  const setValueDebounced = useDebouncedCallback(setValue, 300);
  const [internalValue, setInternalValue] = React.useState(value);

  return (
    <Field.Root id={props.id}>
      <div className="mb-1.5 flex items-center justify-between">
        <Field.Label className="mb-0">{props.label}</Field.Label>
        <Show when={clearable && !!value}>
          <button
            type="button"
            className="text-sm font-medium text-[#0BA5EC]"
            onClick={() => {
              setValue('');
              setInternalValue('');
            }}
          >
            Clear
          </button>
        </Show>
      </div>

      <Field.Input
        type={props.type}
        value={internalValue}
        onChange={(e) => {
          setValueDebounced(e.target.value);
          setInternalValue(e.target.value);
        }}
        placeholder={props.placeholder}
        disabled={props.disabled}
      />
    </Field.Root>
  );
}
