import { TZDateMini, tz } from '@date-fns/tz';
import { format } from 'date-fns';
import { isDate } from 'es-toolkit';

/**
 * Formats a date in a specific timezone
 */
export function formatInTimeZone(
  date: Date | number | string,
  timeZone: string,
  formatStr: string,
): string {
  return format(date, formatStr, { in: tz(timeZone) });
}

/**
 * Converts a zoned time to UTC
 */
export function zonedTimeToUtc(
  date: Date | string | number,
  timeZone: string,
): Date {
  const tzDate = new TZDateMini(isDate(date) ? date : new Date(date), timeZone);
  return new Date(tzDate.getTime());
}

/**
 * Converts UTC time to zoned time
 */
export function utcToZonedTime(
  date: Date | string | number,
  timeZone: string,
): Date {
  return new TZDateMini(isDate(date) ? date : new Date(date), timeZone);
}
