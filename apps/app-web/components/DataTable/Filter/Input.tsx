'use client';

import * as React from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { Input as TextInput } from '@/components/ui/input';
import { useControllableState } from '@/hooks/use-controllable-state';

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

  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <div id={props.id} className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{props.label}</label>
        {clearable && value ? (
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() => {
              setValue('');
              setInternalValue('');
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      <TextInput
        type={props.type}
        value={internalValue}
        onChange={(event) => {
          setValueDebounced(event.target.value);
          setInternalValue(event.target.value);
        }}
        placeholder={props.placeholder}
        disabled={props.disabled}
      />
    </div>
  );
}
