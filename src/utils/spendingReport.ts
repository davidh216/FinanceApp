// src/utils/spendingReport.ts
import { Transaction } from '../types/financial';
import { isCashflow } from './cashflow';

// Inclusive "YYYY-MM-DD" bounds.
export interface DateRange {
  start: string;
  end: string;
}

export interface CategorySpending {
  category: string;
  amount: number;
  // Share of the period's total spending, 0–1.
  share: number;
  previous: number;
  // amount - previous: positive means you spent more.
  change: number;
}

export interface SpendingReport {
  total: number;
  previousTotal: number;
  categories: CategorySpending[];
}

const round = (value: number) => Math.round(value * 100) / 100;

// Money out by category, as positive amounts. Transfers between your own
// accounts and money coming in don't count. Dates compare as strings, so
// there's no timezone conversion.
const totalsFor = (
  transactions: Transaction[],
  range: DateRange
): Record<string, number> => {
  const totals: Record<string, number> = {};
  for (const txn of transactions) {
    if (
      txn.amount >= 0 ||
      !isCashflow(txn) ||
      txn.date < range.start ||
      txn.date > range.end
    ) {
      continue;
    }
    totals[txn.category] = (totals[txn.category] || 0) - txn.amount;
  }
  return totals;
};

// Spending by category for `period`, compared with `previous`. Categories
// with spending in either period are listed, the biggest first.
export const spendingReport = (
  transactions: Transaction[],
  period: DateRange,
  previous: DateRange
): SpendingReport => {
  const current = totalsFor(transactions, period);
  const before = totalsFor(transactions, previous);
  const total = round(Object.values(current).reduce((a, b) => a + b, 0));
  const previousTotal = round(Object.values(before).reduce((a, b) => a + b, 0));

  const categories = Array.from(
    new Set([...Object.keys(current), ...Object.keys(before)])
  )
    .map((category) => {
      const amount = round(current[category] || 0);
      const prev = round(before[category] || 0);
      return {
        category,
        amount,
        share: total > 0 ? amount / total : 0,
        previous: prev,
        change: round(amount - prev),
      };
    })
    .sort(
      (a, b) =>
        b.amount - a.amount ||
        b.previous - a.previous ||
        a.category.localeCompare(b.category)
    );

  return { total, previousTotal, categories };
};
