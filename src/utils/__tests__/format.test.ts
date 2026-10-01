import { formatBalance, formatMoney, formatSignedMoney } from '../format';

describe('formatMoney', () => {
  it.each([
    [6152.2925, '$6,152.29'],
    [1234.5, '$1,234.50'],
    [0.005, '$0.01'],
    [1000000, '$1,000,000.00'],
    [-15862.391, '$15,862.39'],
  ])('formats %p as %s', (value, expected) => {
    expect(formatMoney(value)).toBe(expected);
  });
});

describe('formatBalance', () => {
  it('shows a minus below zero but never a plus', () => {
    expect(formatBalance(1234.5)).toBe('$1,234.50');
    expect(formatBalance(-1234.5)).toBe('-$1,234.50');
    expect(formatBalance(0)).toBe('$0.00');
    // Rounds to zero: no "-$0.00".
    expect(formatBalance(-0.001)).toBe('$0.00');
  });
});

describe('formatSignedMoney', () => {
  it.each([
    [785.96, '+$785.96'],
    [-5507.32, '-$5,507.32'],
    [6152.2925, '+$6,152.29'],
    [0, '$0.00'],
    [-0.001, '$0.00'],
  ])('formats %p as %s', (value, expected) => {
    expect(formatSignedMoney(value)).toBe(expected);
  });
});
