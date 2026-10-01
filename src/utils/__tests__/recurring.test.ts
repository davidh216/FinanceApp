import { Transaction } from '../../types/financial';
import { findRecurringPayments } from '../recurring';

let nextId = 0;
const pay = (
  merchant: string,
  date: string,
  amount: number,
  extra: Partial<Transaction> = {}
): Transaction => ({
  id: `t${nextId++}`,
  accountId: 'chk',
  description: merchant.toUpperCase(),
  amount,
  date,
  category: 'Subscriptions',
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: merchant,
    logo: '',
    suggestedCategory: 'Subscriptions',
    original: '',
  },
  createdAt: '',
  updatedAt: '',
  ...extra,
});

const TODAY = '2025-06-15';
const found = (txns: Transaction[]) => findRecurringPayments(txns, TODAY);

describe('findRecurringPayments', () => {
  it('finds a monthly subscription and a price rise', () => {
    const [netflix] = found([
      pay('Netflix', '2025-02-12', -15.49),
      pay('Netflix', '2025-03-12', -15.49),
      pay('Netflix', '2025-04-11', -15.49),
      pay('Netflix', '2025-05-12', -17.99),
    ]);
    expect(netflix).toEqual({
      merchant: 'Netflix',
      merchantKey: 'netflix',
      category: 'Subscriptions',
      cadence: 'monthly',
      amount: 17.99,
      monthlyCost: 17.99,
      lastDate: '2025-05-12',
      nextDate: '2025-06-12',
      payments: 4,
      priceChange: { from: 15.49, to: 17.99 },
    });
  });

  it('works out weekly, fortnightly and yearly costs per month', () => {
    const results = found([
      ...['2025-05-19', '2025-05-26', '2025-06-02', '2025-06-09'].map((d) =>
        pay('Yoga', d, -10)
      ),
      ...[
        '2025-04-18',
        '2025-05-02',
        '2025-05-16',
        '2025-05-30',
        '2025-06-13',
      ].map((d) => pay('Cleaner', d, -80)),
      ...['2023-03-01', '2024-03-01', '2025-03-01'].map((d) =>
        pay('Domain', d, -12)
      ),
    ]);
    const byName = Object.fromEntries(results.map((r) => [r.merchant, r]));
    expect(byName.Yoga).toMatchObject({
      cadence: 'weekly',
      monthlyCost: 43.49,
    });
    expect(byName.Cleaner).toMatchObject({
      cadence: 'every 2 weeks',
      monthlyCost: 173.94,
      nextDate: '2025-06-27',
    });
    expect(byName.Domain).toMatchObject({
      cadence: 'yearly',
      monthlyCost: 1,
      nextDate: '2026-03-01',
    });
    // Most expensive first.
    expect(results.map((r) => r.merchant)).toEqual([
      'Cleaner',
      'Yoga',
      'Domain',
    ]);
  });

  it('allows one missed payment', () => {
    expect(
      found([
        pay('Gym', '2025-02-01', -40),
        pay('Gym', '2025-03-01', -40),
        pay('Gym', '2025-05-01', -40),
        pay('Gym', '2025-06-01', -40),
      ])
    ).toHaveLength(1);
  });

  it('ignores irregular timing, varying amounts, and too few payments', () => {
    expect(
      found([
        // Irregular.
        pay('Cafe', '2025-03-02', -5),
        pay('Cafe', '2025-03-05', -5),
        pay('Cafe', '2025-04-20', -5),
        pay('Cafe', '2025-06-01', -5),
        // Weekly, but the amount varies too much.
        pay('Grocer', '2025-05-18', -45),
        pay('Grocer', '2025-05-25', -160),
        pay('Grocer', '2025-06-01', -82),
        pay('Grocer', '2025-06-08', -210),
        // Only twice.
        pay('Hulu', '2025-05-10', -8),
        pay('Hulu', '2025-06-10', -8),
      ])
    ).toEqual([]);
  });

  it('drops payments that have stopped', () => {
    expect(
      found([
        pay('Old Gym', '2025-01-05', -30),
        pay('Old Gym', '2025-02-05', -30),
        pay('Old Gym', '2025-03-05', -30),
      ])
    ).toEqual([]);
  });

  it('ignores money in, transfers and pending payments', () => {
    const monthly = ['2025-03-01', '2025-04-01', '2025-05-01', '2025-06-01'];
    expect(
      found([
        ...monthly.map((d) => pay('Salary', d, 3000)),
        ...monthly.map((d) =>
          pay('Card payment', d, -500, { transferAccountId: 'card' })
        ),
        ...monthly.map((d, i) =>
          pay('Rent', d, -1200, { pending: i === monthly.length - 1 })
        ),
      ]).map((r) => [r.merchant, r.payments])
    ).toEqual([['Rent', 3]]);
  });

  it('puts the next month-end payment on the last day of a short month', () => {
    const [bill] = found([
      pay('Phone', '2024-11-30', -40),
      pay('Phone', '2024-12-31', -40),
      pay('Phone', '2025-01-31', -40),
      pay('Phone', '2025-03-01', -40),
      pay('Phone', '2025-03-31', -40),
      pay('Phone', '2025-04-30', -40),
      pay('Phone', '2025-05-31', -40),
    ]);
    expect(bill.nextDate).toBe('2025-06-30');
  });
});
