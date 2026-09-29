// src/utils/date.ts

// Transaction and date-range dates are stored as "YYYY-MM-DD" calendar
// dates. `new Date("YYYY-MM-DD")` parses those as midnight UTC, which west
// of UTC is the evening of the previous day, so a transaction on the 1st
// lands in the previous month. Parse them as local midnight instead.
export const parseLocalDate = (value: string): Date => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
};

// The inverse: a local calendar date as "YYYY-MM-DD". toISOString() would
// convert to UTC first and shift the date east of UTC.
export const toLocalDateString = (date: Date): string =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
