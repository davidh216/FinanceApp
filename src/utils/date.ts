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

// "Jun 1 – Jun 15, 2025" for two "YYYY-MM-DD" dates; the year is shown once
// when both are in the same year.
export const formatDateRange = (start: string, end: string): string => {
  const from = parseLocalDate(start);
  const to = parseLocalDate(end);
  const day = { month: 'short', day: 'numeric' } as const;
  const fromText = from.toLocaleDateString('en-US', {
    ...day,
    ...(from.getFullYear() !== to.getFullYear() ? { year: 'numeric' } : {}),
  });
  const toText = to.toLocaleDateString('en-US', { ...day, year: 'numeric' });
  return start === end ? toText : `${fromText} – ${toText}`;
};
