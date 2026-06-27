interface CapitalizeConfig {
  /**
   * @description The delimiter used to split the string into words.
   * @default ' '
   */
  delimiter?: string | RegExp;
  /**
   * @description Whether to convert the string to lowercase before capitalizing.
   * @default true
   */
  lower?: boolean;
  /**
   * @description Whether to trim the string before capitalizing.
   * @default true
   */
  trim?: boolean;
  /**
   * @description A record of known words to return as is, without modification.
   * @example
   * ```ts
   * {
   *   Foo: 'Bar',
   *   Bar: 'Baz',
   * }
   */
  knownWords?: Record<string, string>;
}

const SPACE = /\s/g;
const UNDERSCORE = /_/g;
const DASH = /-/g;
const PASCAL = /(?=[A-Z])/;

const KNOWN_WORDS: Record<string, string> = {
  GCASH: 'GCash',
  GCASH_STANDARD_CASH_IN: 'GCash Standard Cash In',
  QR_PH: 'QR PH',
  PISO_PAY_CHECKOUT: 'PisoPay Checkout',
  PISO_PAY_REMITTANCE: ' PisoPay Remittance',
  BTI: 'BTI',
  DRBINGO: 'Dr Bingo',
  CQ9: 'CQ9',
  E2E: 'E2E',
  RTG: 'RTG',
  BNG: 'BNG',
  HOLLYWOODTV: 'Hollywood TV',
  KINGMIDAS: 'King Midas',
  SAGAMING: 'SA Gaming',
  DG: 'Dynasty Gaming',
  JDB: 'JDB',
  MEGA2SPIN: 'Mega2Spin',
  YELLOWBAT: 'Yellow Bat',
  PGSOFT: 'PG Soft',
  ONEAPI_SPADEGAMING: 'OneAPI Spade Gaming',
  ONEAPI_EVOLUTION: 'OneAPI Evolution',
  AIO: 'AiO',
  E8X8: '8x8',
  MANUAL_BANK: 'Bank Account',
  MANUAL_UPI: 'UPI ID',
  JK8: 'JK8',
};

/**
 * @example
 * ```ts
 * capitalize('foo bar baz') // 'Foo Bar Baz'
 * capitalize('foo_bar_baz', { delimiter: capitalize.delimiters.UNDERSCORE }) // 'Foo Bar Baz'
 * capitalize('foo', { knownWords: { foo: 'Bar' } }) // 'Bar'
 * ```
 */
export function capitalize(subject: string, config?: CapitalizeConfig) {
  let copy = subject;

  if (typeof copy !== 'string') return copy;

  const trim = config?.trim ?? true;
  const lower = config?.lower ?? true;
  const delimiter = config?.delimiter ?? SPACE;
  const knownWords = {
    ...KNOWN_WORDS,
    ...config?.knownWords,
  };

  if (knownWords[copy]) {
    return knownWords[copy];
  }

  if (trim) copy = copy.trim();

  if (copy.length < 2) {
    return copy.toUpperCase();
  }

  if (delimiter instanceof RegExp) {
    delimiter.lastIndex = 0;
  }

  return copy
    .split(delimiter)
    .map((word) => {
      if (knownWords[word]) {
        return knownWords[word];
      }

      if (word.length < 2) {
        return word.toUpperCase();
      }

      const firstChar = word.charAt(0).toUpperCase();
      const otherChars = lower
        ? word.substring(1).toLowerCase()
        : word.substring(1);

      return firstChar.concat(otherChars);
    })
    .join(' ');
}

capitalize.delimiters = {
  SPACE,
  UNDERSCORE,
  DASH,
  /**
   * ```
   * SpotBonus => Spot Bonus
   * GenericPromo => Generic Promo
   * ```
   */
  PASCAL,
};
