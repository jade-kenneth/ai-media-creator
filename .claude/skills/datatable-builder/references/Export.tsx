import { Portal } from '@ark-ui/react';
import { Download02Icon } from '@untitled-theme/icons-react';
import { isNil } from 'es-toolkit/compat';
import { Button } from '~/components/ui/Button';
import { Icon } from '~/components/ui/Icon';
import { Tooltip } from '~/components/ui/Tooltip';
import { useDataTableContext } from './DataTableContext';

export function Export() {
  const datatable = useDataTableContext();

  if (isNil(datatable.table.export)) return null;

  return (
    <Tooltip.Root
      positioning={{
        placement: 'top-end',
      }}
    >
      <Tooltip.Trigger asChild>
        <Button
          size="sm"
          variant="subtle"
          onClick={datatable.table.export}
          disabled={datatable.table.loading}
        >
          <Icon>
            <Download02Icon />
          </Icon>
          Export
        </Button>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content className="flex justify-center gap-1 rounded-lg bg-[#4B390D] px-3.5 py-3 text-xs">
            <Tooltip.Arrow className="arrow-bg-[#4B390D]!">
              <Tooltip.ArrowTip />
            </Tooltip.Arrow>
            <span className="font-bold text-[#E2AA28]">Note:</span>
            <span className="max-w-[250px]">
              Exported data is capped at{' '}
              <span className="font-mono">10,000</span> entries per export.
            </span>
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  );
}
