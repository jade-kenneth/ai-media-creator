import { format, formatDistanceToNowStrict } from 'date-fns';

const numberFormatter = new Intl.NumberFormat();

export function formatCount(value: number) {
  return numberFormatter.format(value);
}

export function formatAnnouncementTime(publishedAt: string | null | undefined) {
  if (!publishedAt) {
    return 'Recently';
  }

  const date = new Date(publishedAt);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function formatScheduleDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'TBD';
  }

  return format(date, 'MMM d');
}
