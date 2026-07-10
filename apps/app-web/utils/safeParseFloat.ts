import * as z from 'zod';

const definition = z
  .union([
    z.number().transform((val) => {
      return Number.isNaN(val) ? null : val;
    }),
    z.string().transform((val) => {
      const parsed = Number.parseFloat(val);
      if (Number.isNaN(parsed)) return null;
      return parsed;
    }),
  ])
  .optional()
  .nullable()
  .catch(null);

export function safeParseFloat(value: unknown, fallback: number): number;
export function safeParseFloat(value: unknown): number | undefined;
export function safeParseFloat(value: unknown, fallback?: null | number) {
  return definition.parse(value) ?? fallback;
}
