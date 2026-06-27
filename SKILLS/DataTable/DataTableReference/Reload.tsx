import { RefreshCw02Icon } from '@untitled-theme/icons-react';
import { isNil } from 'es-toolkit/compat';
import { Icon } from '~/components/ui/Icon';
import { IconButton } from '~/components/ui/IconButton';
import { dataAttr } from '~/utils/dataAttr';
import { useDataTableContext } from './DataTableContext';

export function Reload() {
  const datatable = useDataTableContext();

  if (isNil(datatable.table.reload)) return null;

  return (
    <IconButton
      size="sm"
      variant="subtle"
      onClick={() => datatable.table.reload?.()}
      disabled={datatable.table.loading}
      aria-label="Reload Table"
    >
      <Icon
        className="ui-loading:animate-spin"
        data-loading={dataAttr(datatable.table.loading)}
      >
        <RefreshCw02Icon />
      </Icon>
    </IconButton>
  );
}
