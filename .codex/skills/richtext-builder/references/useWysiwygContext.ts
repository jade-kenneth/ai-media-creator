import { createContext } from '@ark-ui/react/utils';
import type { UseWysiwygReturn } from './useWysiwyg';

export interface UseWysiwygContext extends UseWysiwygReturn {}

export const [WysiwygProvider, useWysiwygContext] =
  createContext<UseWysiwygReturn>();
