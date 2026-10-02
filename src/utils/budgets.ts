// src/utils/budgets.ts
import { Transaction } from '../types/financial';
import { isCashflow } from './cashflow';

// Monthly spending limits by category, in dollars.
export type Budgets = Record<string, number>;

// Categories you can budget: everything you spend on, so not income.
export const isBudgetCategory = (category: string): boolean =>
  category !== 'Income' && category !== 'Transfer';

// A budget turns amber once this share of it is spent.
export const BUDGET_WARNING_RATIO = 0.8;

// "YYYY-MM" for a local date.
export const monthOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// Money spent in each category during `month` ("YYYY-MM"), as positive
// amounts. Transfers and money coming in don't count.
export const spendingByCategory = (
  transactions: Transaction[],
  month: string
): Record<string, number> => {
  const totals: Record<string, number> = {};
  for (const txn of transactions) {
    if (txn.amount >= 0 || !isCashflow(txn) || !txn.date.startsWith(month)) {
      continue;
    }
    totals[txn.category] = (totals[txn.category] || 0) - txn.amount;
  }
  for (const category of Object.keys(totals)) {
    totals[category] = Math.round(totals[category] * 100) / 100;
  }
  return totals;
};

export type BudgetStatus = 'ok' | 'near' | 'over';

export interface BudgetProgress {
  category: string;
  // This month's limit: the budget, plus what rolled over from last month.
  limit: number;
  // The budget you set.
  baseLimit: number;
  // Left over from last month (negative when last month went over), for a
  // budget that rolls over; otherwise 0.
  carried: number;
  spent: number;
  // Negative once over budget.
  remaining: number;
  status: BudgetStatus;
}

const round = (value: number) => Math.round(value * 100) / 100;

// One row per budget, the most used first. A budget in `rollover` adds
// what was left of last month's budget (or takes off what went over).
export const budgetProgress = (
  budgets: Budgets,
  spending: Record<string, number>,
  options: {
    previousSpending?: Record<string, number>;
    rollover?: string[];
  } = {}
): BudgetProgress[] =>
  Object.entries(budgets)
    .map(([category, baseLimit]) => {
      const carried =
        options.rollover?.includes(category) && options.previousSpending
          ? round(baseLimit - (options.previousSpending[category] || 0))
          : 0;
      // Overspending can use up a month's budget, but not more.
      const limit = Math.max(0, round(baseLimit + carried));
      const spent = spending[category] || 0;
      const status: BudgetStatus =
        spent > limit
          ? 'over'
          : spent >= limit * BUDGET_WARNING_RATIO
          ? 'near'
          : 'ok';
      return {
        category,
        limit,
        baseLimit,
        carried,
        spent,
        remaining: Math.round((limit - spent) * 100) / 100,
        status,
      };
    })
    .sort((a, b) => used(b) - used(a) || a.category.localeCompare(b.category));

// How much of the limit is spent; a limit of 0 with any spending is over.
const used = (row: { spent: number; limit: number }) =>
  row.limit > 0 ? row.spent / row.limit : row.spent > 0 ? Infinity : 0;

// Keeps only positive, finite limits for budgetable categories, rounded to
// the cent. Used for saved budgets and backups, which may be hand-edited.
export const cleanBudgets = (value: unknown): Budgets => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  const budgets: Budgets = {};
  for (const [category, limit] of Object.entries(value)) {
    if (
      isBudgetCategory(category) &&
      typeof limit === 'number' &&
      Number.isFinite(limit) &&
      limit > 0
    ) {
      budgets[category] = Math.round(limit * 100) / 100;
    }
  }
  return budgets;
};

// Spending by category for each of the `count` months ending with `month`,
// oldest first.
export const budgetHistory = (
  transactions: Transaction[],
  month: string,
  count = 6
): { months: string[]; spending: Record<string, number>[] } => {
  const [year, mon] = month.split('-').map(Number);
  const months = Array.from({ length: count }, (_, i) =>
    monthOf(new Date(year, mon - 1 - (count - 1 - i), 1))
  );
  return {
    months,
    spending: months.map((m) => spendingByCategory(transactions, m)),
  };
};

// Keeps budget categories, once each. Used for the saved rollover choices
// and backups.
export const cleanRollover = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value.filter(
            (c): c is string => typeof c === 'string' && isBudgetCategory(c)
          )
        )
      ).sort()
    : [];
