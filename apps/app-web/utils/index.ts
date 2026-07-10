import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createContext } from './createContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { cn, createContext };
