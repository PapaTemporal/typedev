const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const y = d * 365.25;
const mo = y / 12;

type Years = 'years' | 'year' | 'yrs' | 'yr' | 'y';
type Months = 'months' | 'month' | 'mo';
type Weeks = 'weeks' | 'week' | 'w';
type Days = 'days' | 'day' | 'd';
type Hours = 'hours' | 'hour' | 'hrs' | 'hr' | 'h';
type Minutes = 'minutes' | 'minute' | 'mins' | 'min' | 'm';
type Seconds = 'seconds' | 'second' | 'secs' | 'sec' | 's';
type Milliseconds = 'milliseconds' | 'millisecond' | 'msecs' | 'msec' | 'ms';
type Unit =
  | Years
  | Months
  | Weeks
  | Days
  | Hours
  | Minutes
  | Seconds
  | Milliseconds;

type UnitAnyCase = Capitalize<Unit> | Uppercase<Unit> | Unit;

export type StringValue =
  | `${number}`
  | `${number}${UnitAnyCase}`
  | `${number} ${UnitAnyCase}`;

interface Options {
  /**
   * Set to `true` to use verbose formatting. Defaults to `false`.
   */
  long?: boolean;
}

/**
 * Parse or format the given value.
 *
 * @param value - The string or number to convert
 * @param options - Options for the conversion
 * @throws Error if `value` is not a non-empty string or a number
 */
export function ms(value: StringValue, options?: Options): number;
export function ms(value: number, options?: Options): string;
export function ms(
  value: StringValue | number,
  options?: Options,
): number | string {
  if (typeof value === 'string') {
    return parse(value);
  } else if (typeof value === 'number') {
    return format(value, options);
  }
  throw new Error(
    `Value provided to ms() must be a string or number. value=${JSON.stringify(value)}`,
  );
}

/**
 * Parse the given string and return milliseconds.
 *
 * @param str - A string to parse to milliseconds
 * @returns The parsed value in milliseconds, or `NaN` if the string can't be
 * parsed
 */
export function parse(str: string): number {
  if (typeof str !== 'string' || str.length === 0 || str.length > 100) {
    throw new Error(
      `Value provided to ms.parse() must be a string with length between 1 and 99. value=${JSON.stringify(str)}`,
    );
  }
  const match =
    /^(?<value>-?\d*\.?\d+) *(?<unit>milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|months?|mo|years?|yrs?|y)?$/i.exec(
      str,
    );

  if (!match?.groups) {
    return NaN;
  }

  // Named capture groups need to be manually typed today.
  // https://github.com/microsoft/TypeScript/issues/32098
  const { value, unit = 'ms' } = match.groups as {
    value: string;
    unit: string | undefined;
  };

  const n = parseFloat(value);

  const matchUnit = unit.toLowerCase() as Lowercase<Unit>;

  /* istanbul ignore next - istanbul doesn't understand, but thankfully the TypeScript the exhaustiveness check in the default case keeps us type safe here */
  switch (matchUnit) {
    case 'years':
    case 'year':
