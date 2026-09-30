import { Transaction } from '../../types/financial';
import {
  budgetProgress,
  cleanBudgets,
  monthOf,
  spendingByCategory,
} from '../budgets';

let nextId = 0;
const txn = (
  date: string,
  amount: number,
  category: string,
  transferAccountId?: string
): Transaction => ({
  id: `t${nextId++}`,
  accountId: 'a',
  description: category,
  amount,
  date,
  category,
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: category,
    logo: '',
    suggestedCategory: category,
    original: category,
  },
  transferAccountId,
  createdAt: '',
  updatedAt: '',
});

describe('monthOf', () => {
  it('uses the local calendar month', () => {
    expect(monthOf(new Date(2025, 0, 31, 23, 59))).toBe('2025-01');
    expect(monthOf(new Date(2025, 11, 1))).toBe('2025-12');
  });
});

describe('spendingByCategory', () => {
  it("totals the month's spending by category", () => {
    expect(
      spendingByCategory(
        [
          txn('2025-06-01', -5.75, 'Food & Dining'),
          txn('2025-06-30', -10.1, 'Food & Dining'),
          txn('2025-06-10', -80, 'Shopping'),
          // Other months, money in and transfers don't count.
          txn('2025-05-31', -1000, 'Shopping'),
          txn('2025-07-01', -1000, 'Shopping'),
          txn('2025-06-02', 3000, 'Income'),
          txn('2025-06-03', -500, 'Transfer', 'acc_card'),
          // A refund is money in, not negative spending.
          txn('2025-06-12', 20, 'Shopping'),
        ],
        '2025-06'
      )
    ).toEqual({ 'Food & Dining': 15.85, Shopping: 80 });
  });
});

describe('budgetProgress', () => {
  it('flags budgets near and over their limit, most used first', () => {
    const rows = budgetProgress(
      { Shopping: 100, 'Food & Dining': 5, Travel: 200, Utilities: 50 },
      { Shopping: 80, 'Food & Dining': 5.75, Utilities: 39.99 }
    );
    expect(rows).toEqual([
      {
        category: 'Food & Dining',
        limit: 5,
        spent: 5.75,
        remaining: -0.75,
        status: 'over',
      },
      {
        category: 'Shopping',
        limit: 100,
        spent: 80,
        remaining: 20,
        status: 'near',
      },
      {
        category: 'Utilities',
        limit: 50,
        spent: 39.99,
        remaining: 10.01,
        status: 'ok',
      },
      {
        category: 'Travel',
        limit: 200,
        spent: 0,
        remaining: 200,
        status: 'ok',
      },
    ]);
  });

  it('treats spending exactly at the limit as near, not over', () => {
    expect(budgetProgress({ Travel: 100 }, { Travel: 100 })[0].status).toBe(
      'near'
    );
  });
});

describe('cleanBudgets', () => {
  it('keeps positive amounts for categories you spend on', () => {
    expect(
      cleanBudgets({
        Shopping: 100.004,
        Travel: 0,
        Utilities: -5,
        Healthcare: 'lots',
        Groceries: Infinity,
        Income: 1000,
        Transfer: 50,
        'Food & Dining': 250,
      })
    ).toEqual({ Shopping: 100, 'Food & Dining': 250 });
  });

  it('ignores anything that is not a set of budgets', () => {
    expect(cleanBudgets(null)).toEqual({});
    expect(cleanBudgets([100])).toEqual({});
    expect(cleanBudgets('Shopping')).toEqual({});
  });
});
