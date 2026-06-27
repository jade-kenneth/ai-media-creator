import { ToggleField } from '~/components/forms/ToggleField';
import { Field } from '~/components/ui/Field';
import { useControllableState } from '~/hooks/useControllableState';

interface ToggleSwitchProps {
  id?: string;
  label: string;
  onChange?: (value: boolean) => void;
  value?: boolean;
  defaultValue?: boolean;
  disabled?: boolean;
}

export function Switch(props: ToggleSwitchProps) {
  const [value, setValue] = useControllableState({
    value: props.value,
    onChange: props.onChange,
    defaultValue: props.defaultValue ?? false,
  });

  return (
    <Field.Root id={props.id}>
      <Field.Label>{props.label}</Field.Label>
      <ToggleField
        value={value}
        onChange={setValue}
        disabled={props.disabled}
      />
    </Field.Root>
  );
}
