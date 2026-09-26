import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { createContext } from './create-context';

/**
 * tailwind-merge must know the theme's custom type sizes (`text-caption`,
 * `text-small`, …); otherwise it reads them as text colours and drops them
 * when a colour class such as `text-ink` follows.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['caption', 'small', 'body', 'hook', 'title', 'display'] },
      ],
    },
  },
});

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { cn, createContext };
