import { isFunction } from 'es-toolkit/compat';

type Fn<T, Args> = (...args: Args[]) => T;

export function callIfFn<T, Args>(
  valueOrFn: Fn<T, Args> | T,
  ...args: Args[]
): T {
  return isFunction(valueOrFn) ? valueOrFn(...args) : valueOrFn;
}
