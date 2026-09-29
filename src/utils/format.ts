// src/utils/format.ts

// Always exactly two decimals. Setting only minimumFractionDigits lets Intl
// show up to three ("6,152.293").
const moneyFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// "$1,234.56" for the magnitude of a value; callers that care about the sign
// show it themselves (for example with colour) or use formatSignedMoney.
export const formatMoney = (value: number): string =>
  `$${moneyFormat.format(Math.abs(value))}`;

// "+$1,234.56" / "-$1,234.56" for changes. Values that round to zero get no
// sign, so a tiny negative doesn't show as "-$0.00".
export const formatSignedMoney = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '';
  return `${sign}${formatMoney(rounded)}`;
};
