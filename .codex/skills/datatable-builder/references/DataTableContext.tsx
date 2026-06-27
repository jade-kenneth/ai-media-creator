import { createContext } from '@ark-ui/react/utils';
import { UseDataTableReturn } from './useDataTable';

export const [DataTableProvider, useDataTableContext] =
  createContext<UseDataTableReturn>({
    name: 'DataTableContext',
    hookName: 'useDataTableContext',
    providerName: 'DataTableProvider',
    strict: true,
  });
