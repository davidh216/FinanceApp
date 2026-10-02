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
  limit: number;
  spent: number;
  // Negative once over budget.
  remaining: number;
  status: BudgetStatus;
}

// One row per budget, the most used first.
export const budgetProgress = (
  budgets: Budgets,
  spending: Record<string, number>
): BudgetProgress[] =>
  Object.entries(budgets)
    .map(([category, limit]) => {
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
        spent,
        remaining: Math.round((limit - spent) * 100) / 100,
        status,
      };
    })
    .sort(
      (a, b) =>
        b.spent / b.limit - a.spent / a.limit ||
        a.category.localeCompare(b.category)
    );

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
