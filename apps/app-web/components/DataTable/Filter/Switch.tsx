'use client';

import { Switch as SwitchControl } from '@/components/ui/switch';
import { useControllableState } from '@/hooks/use-controllable-state';

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
    <div id={props.id} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
      <label className="text-sm font-medium">{props.label}</label>
      <SwitchControl checked={value} onCheckedChange={setValue} disabled={props.disabled} />
    </div>
  );
}
