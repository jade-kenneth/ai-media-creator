import { isNil } from 'es-toolkit';
import { safeParseFloat } from './safeParseFloat';

interface FormatConfig {
  /** @default "en-US" */
  locale?: string;
  compact?: boolean;
  currency?: string;
  /** @default 2 */
  minDecimalPlaces?: number;
  /** @default 2 */
  maxDecimalPlaces?: number;
  fallback?: string | null;
}

const formatDefaultConfig = {
  locale: 'en-US',
  compact: false,
  minDecimalPlaces: 2,
  maxDecimalPlaces: 2,
} satisfies FormatConfig;

function format(value: unknown, config?: FormatConfig): string {
  const {
    /**/
    locale,
    compact,
    currency,
    minDecimalPlaces,
    maxDecimalPlaces,
    fallback,
  } = Object.assign({}, formatDefaultConfig, config);

  if (isNil(value) && fallback) return fallback;

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: minDecimalPlaces,
    maximumFractionDigits: maxDecimalPlaces,

    ...(currency
      ? {
          style: 'currency',
          currency,
        }
      : {}),

    ...(compact
      ? {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }
      : {}),
  });

  return formatter.format(safeParseFloat(value, 0));
}

interface FormatOrdinalConfig {
  /** @default "en-US" */
  locale?: string;
  suffixes?: Map<string, string>;
}

const formatOrdinalDefaultConfig = {
  locale: 'en-US',
  suffixes: new Map([
    ['one', 'st'],
    ['two', 'nd'],
    ['few', 'rd'],
    ['other', 'th'],
  ]),
} satisfies FormatOrdinalConfig;

function formatOrdinal(value: unknown, config?: FormatOrdinalConfig) {
  const { locale, suffixes } = Object.assign(
    {},
    formatOrdinalDefaultConfig,
    config,
  );

  const pluralRules = new Intl.PluralRules(locale, { type: 'ordinal' });

  const n = safeParseFloat(value, 0);
  const rule = pluralRules.select(n);
  const suffix = suffixes.get(rule) ?? '';

  return `${n}${suffix}`;
}

export const numberFormatter = {
  /**
   * @example
   * ```ts
   * numberFormatter.format(1234567.89) // "1,234,567.89"
   * numberFormatter.format(1234567.89, { locale: 'de-DE' }) // "1.234.567,89"
   * numberFormatter.format(1234567.89, { compact: true }) // "1M"
   * numberFormatter.format(1234567.89, { currency: 'USD' }) // "$1,234,567.89"
   * ```
   */
  format,
  /**
   * @example
   * ```ts
   * numberFormatter.formatOrdinal(1) // "1st"
   * numberFormatter.formatOrdinal(2) // "2nd"
   * numberFormatter.formatOrdinal(3) // "3rd"
   * numberFormatter.formatOrdinal(4) // "4th"
   * ```
   */
  formatOrdinal,
};
