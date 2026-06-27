import type { ReactNode } from 'react';
import { useWysiwygContext, type UseWysiwygContext } from './useWysiwygContext';

export interface WysiwygContextProps {
  children: (context: UseWysiwygContext) => ReactNode;
}

export function Context(props: WysiwygContextProps) {
  return props.children(useWysiwygContext());
}
