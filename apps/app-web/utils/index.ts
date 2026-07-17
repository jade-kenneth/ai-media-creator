import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createContext } from './create-context';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { cn, createContext };
