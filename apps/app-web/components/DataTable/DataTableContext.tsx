'use client';

import { createContext } from '@/utils/create-context';

import type { UseDataTableReturn } from './useDataTable';

export const [DataTableProvider, useDataTableContext] =
  createContext<UseDataTableReturn>();
