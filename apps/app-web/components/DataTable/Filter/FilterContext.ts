'use client';

import { createContext } from '@/utils/create-context';
import { useControllableState } from '@/hooks/use-controllable-state';

export interface UseFilterProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (value: boolean) => void;
}

export interface UseFilterReturn extends ReturnType<typeof useFilter> {}

export function useFilter(props: UseFilterProps = {}) {
  const [open, setOpen] = useControllableState({
    value: props.open,
    onChange: props.onOpenChange,
    defaultValue: props.defaultOpen ?? false,
  });

  return {
    open,
    setOpen,
  };
}

export const [FilterProvider, useFilterContext] =
  createContext<UseFilterReturn>();
