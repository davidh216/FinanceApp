// src/utils/cashflowHistory.ts
import { Transaction } from '../types/financial';
import { incomeOf, spendingOf } from './cashflow';

export interface MonthFlow {
  // "YYYY-MM"
  month: string;
  income: number;
  spending: number;
  // income - spending: what was saved (negative when you spent more).
  net: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

// The "YYYY-MM" `offset` months from `month`.
export const shiftMonth = (month: string, offset: number): string => {
  const [year, mon] = month.split('-').map(Number);
  const index = year * 12 + (mon - 1) + offset;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(
    2,
    '0'
  )}`;
};

// First and last day of a "YYYY-MM" month, as "YYYY-MM-DD".
export const monthBounds = (month: string): { start: string; end: string } => {
  const [year, mon] = month.split('-').map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
};

// Income, spending and what was saved in each of the `count` months ending
// with `lastMonth`, oldest first. Transfers between your own accounts are
// neither, as everywhere else.
export const monthlyCashflow = (
  transactions: Transaction[],
  lastMonth: string,
  count = 12
): MonthFlow[] => {
  const byMonth = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const month = txn.date.slice(0, 7);
    byMonth.set(month, [...(byMonth.get(month) || []), txn]);
  }
  return Array.from({ length: count }, (_, i) => {
    const month = shiftMonth(lastMonth, i - count + 1);
    const txns = byMonth.get(month) || [];
    const income = round(incomeOf(txns));
    const spending = round(spendingOf(txns));
    return { month, income, spending, net: round(income - spending) };
  });
};
