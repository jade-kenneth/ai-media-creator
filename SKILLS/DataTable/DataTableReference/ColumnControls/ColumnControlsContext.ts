import { createContext } from '@ark-ui/react/utils';
import { useControllableState } from '~/hooks/useControllableState';

export interface UseColumnControlsProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (value: boolean) => void;
}

export interface UseColumnControlsReturn
  extends ReturnType<typeof useColumnsControl> {}

export function useColumnsControl(props: UseColumnControlsProps) {
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

export const [ColumnControlsProvider, useColumnControlsContext] =
  createContext<UseColumnControlsReturn>();
