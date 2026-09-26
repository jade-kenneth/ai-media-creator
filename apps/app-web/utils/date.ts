const numberFormatter = new Intl.NumberFormat();

export function formatCount(value: number) {
  return numberFormatter.format(value);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const shortDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
});
const longDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const timeOfDay = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Newer ICU writes the en-GB short month as “Sept”; the copy uses “Sep”. */
function formatDay(formatter: Intl.DateTimeFormat, date: Date) {
  return formatter
    .formatToParts(date)
    .map((part) => (part.type === 'month' ? part.value.slice(0, 3) : part.value))
    .join('');
}

/** “23 Sep”. */
export function formatShortDate(value: string | Date) {
  return formatDay(shortDate, typeof value === 'string' ? new Date(value) : value);
}

/**
 * Relative time for recent events, absolute beyond a week (voice-content.md):
 * “just now”, “12 min ago”, “3 h ago”, “yesterday”, “4 days ago”, “20 Sep”.
 */
export function formatRelativeTime(value: string | Date, now = Date.now()) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const elapsed = Math.max(0, now - date.getTime());

  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} min ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)} h ago`;
  if (elapsed < 2 * DAY) return 'yesterday';
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)} days ago`;

  return formatDay(shortDate, date);
}

/** “23 Sep 2026”. */
export function formatLongDate(value: string | Date) {
  return formatDay(longDate, typeof value === 'string' ? new Date(value) : value);
}

/** “23 Sep, 10:42”. */
export function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;

  return `${formatDay(shortDate, date)}, ${timeOfDay.format(date)}`;
}

/** “0:08”. */
export function formatTimecode(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** “1.2 MB”, “840 KB”. */
export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
