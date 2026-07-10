/** commit */
'use client';

import type { ReactNode } from 'react';

import {
  useRichTextContext,
  type UseRichTextContext,
} from './useRichTextContext';

export interface RichTextContextProps {
  children: (context: UseRichTextContext) => ReactNode;
}

export function Context(props: RichTextContextProps) {
  return props.children(useRichTextContext());
}
