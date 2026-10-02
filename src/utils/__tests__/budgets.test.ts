import { Transaction } from '../../types/financial';
import {
  budgetHistory,
  cleanRollover,
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
        baseLimit: 5,
        carried: 0,
        spent: 5.75,
        remaining: -0.75,
        status: 'over',
      },
      {
        category: 'Shopping',
        limit: 100,
        baseLimit: 100,
        carried: 0,
        spent: 80,
        remaining: 20,
        status: 'near',
      },
      {
        category: 'Utilities',
        limit: 50,
        baseLimit: 50,
        carried: 0,
        spent: 39.99,
        remaining: 10.01,
        status: 'ok',
      },
      {
        category: 'Travel',
        limit: 200,
        baseLimit: 200,
        carried: 0,
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

describe('budget rollover', () => {
  it("adds last month's leftover, or takes off what went over", () => {
    const [groceries, dining] = budgetProgress(
      { Groceries: 400, 'Food & Dining': 200 },
      { Groceries: 380, 'Food & Dining': 100 },
      {
        previousSpending: { Groceries: 300, 'Food & Dining': 260 },
        rollover: ['Groceries', 'Food & Dining'],
      }
    );
    expect(groceries).toMatchObject({
      baseLimit: 400,
      carried: 100,
      limit: 500,
      remaining: 120,
      status: 'ok',
    });
    expect(dining).toMatchObject({
      baseLimit: 200,
      carried: -60,
      limit: 140,
      remaining: 40,
      status: 'ok',
    });
  });

  it('only rolls over the budgets you chose, and never below zero', () => {
    const rows = budgetProgress(
      { Groceries: 400, Shopping: 100 },
      { Shopping: 10 },
      {
        previousSpending: { Groceries: 100, Shopping: 500 },
        rollover: ['Shopping'],
      }
    );
    const byCategory = Object.fromEntries(rows.map((r) => [r.category, r]));
    expect(byCategory.Groceries).toMatchObject({ carried: 0, limit: 400 });
    expect(byCategory.Shopping).toMatchObject({
      carried: -400,
      limit: 0,
      status: 'over',
    });
    // A used-up budget sorts first.
    expect(rows[0].category).toBe('Shopping');
  });

  it('cleans the saved choices', () => {
    expect(
      cleanRollover(['Shopping', 'Income', 'Shopping', 3, 'Groceries'])
    ).toEqual(['Groceries', 'Shopping']);
    expect(cleanRollover('nope')).toEqual([]);
  });
});

describe('budgetHistory', () => {
  it('gives each of the last six months, oldest first, across a new year', () => {
    const spend = (date: string, amount: number, category = 'Groceries') => ({
      id: date + amount,
      accountId: 'a',
      description: '',
      amount,
      date,
      category,
      tags: [],
      pending: false,
      cleanMerchant: {
        cleanName: '',
        logo: '',
        suggestedCategory: '',
        original: '',
      },
      createdAt: '',
      updatedAt: '',
    });
    const history = budgetHistory(
      [
        spend('2024-11-03', -50),
        spend('2025-02-10', -80),
        spend('2025-02-11', -20),
      ],
      '2025-03'
    );
    expect(history.months).toEqual([
      '2024-10',
      '2024-11',
      '2024-12',
      '2025-01',
      '2025-02',
      '2025-03',
    ]);
    expect(history.spending.map((m) => m.Groceries ?? 0)).toEqual([
      0, 50, 0, 0, 100, 0,
    ]);
  });
});
