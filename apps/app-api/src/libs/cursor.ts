import { randomUUID } from 'node:crypto';

export function generateCursor(date = new Date()): string {
  return `${date.toISOString()}_${randomUUID()}`;
}
