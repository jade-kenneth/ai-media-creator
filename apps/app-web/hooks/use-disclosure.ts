import { ComponentProps } from 'react';
import { useControllableState } from './use-controllable-state';

export interface UseDisclosureProps {
  open?: boolean;
  onChange?: (value: boolean) => void;
  defaultOpen?: boolean;
}

export interface UseDisclosureReturn {
  open: boolean;
  setOpen: (value: boolean) => void;
  getDisclosureProps: () => ComponentProps<'button'>;
}

export function useDisclosure(
  props: UseDisclosureProps = {},
): UseDisclosureReturn {
  const [open, setOpen] = useControllableState({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onChange,
  });

  return {
    open,
    setOpen,
    getDisclosureProps() {
      return {
        type: 'button',
        onClick() {
          setOpen((prev) => !prev);
        },
        'data-state': open ? 'open' : 'closed',
      };
    },
  };
}
