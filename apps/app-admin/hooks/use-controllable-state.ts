import { useControllableState as usePrimitive } from '@radix-ui/react-use-controllable-state';
import { Dispatch, SetStateAction } from 'react';

export interface UseControllableStateProps<T> {
  value?: T;
  onChange?: (value: T) => void;
  defaultValue: T;
}

export type UseControllableStateReturn<T> = [T, Dispatch<SetStateAction<T>>];

export function useControllableState<T>(
  props: UseControllableStateProps<T>,
): UseControllableStateReturn<T> {
  const [value, setValue] = usePrimitive({
    prop: props.value,
    onChange: props.onChange,
    defaultProp: props.defaultValue,
  });

  return [value, setValue];
}
