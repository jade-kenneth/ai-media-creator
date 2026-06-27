/** commit */
'use client';

import { createContext } from '@/utils';

import type { UseRichTextReturn } from './useRichText';

export type UseRichTextContext = UseRichTextReturn;

export const [RichTextProvider, useRichTextContext] =
  createContext<UseRichTextReturn>();
