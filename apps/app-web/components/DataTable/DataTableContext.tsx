'use client';

import { createContext } from '@/utils/createContext';

import type { UseDataTableReturn } from './useDataTable';

export const [DataTableProvider, useDataTableContext] =
  createContext<UseDataTableReturn>();
