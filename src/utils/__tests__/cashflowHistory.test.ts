import { Transaction } from '../../types/financial';
import { monthBounds, monthlyCashflow, shiftMonth } from '../cashflowHistory';

let nextId = 0;
const txn = (
  date: string,
  amount: number,
  transferAccountId?: string
): Transaction => ({
  id: `t${nextId++}`,
  accountId: 'a',
  description: '',
  amount,
  date,
  category: 'Other',
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: '',
    logo: '',
    suggestedCategory: '',
    original: '',
  },
  transferAccountId,
  createdAt: '',
  updatedAt: '',
});

describe('shiftMonth and monthBounds', () => {
  it('move across years', () => {
    expect(shiftMonth('2025-01', -1)).toBe('2024-12');
    expect(shiftMonth('2025-06', -11)).toBe('2024-07');
    expect(shiftMonth('2024-12', 1)).toBe('2025-01');
  });

  it('give the first and last day, including leap years', () => {
    expect(monthBounds('2024-02')).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    });
    expect(monthBounds('2025-04').end).toBe('2025-04-30');
  });
});

describe('monthlyCashflow', () => {
  it('totals each of the last 12 months, oldest first', () => {
    const months = monthlyCashflow(
      [
        txn('2025-06-01', 3000),
        txn('2025-06-30', -500.255),
        txn('2025-05-10', 3000),
        txn('2025-05-31', -1000),
        txn('2025-04-15', -200),
        // A transfer is neither income nor spending.
        txn('2025-06-03', -400, 'card'),
        // Outside the 12 months.
        txn('2024-06-30', -999),
      ],
      '2025-06'
    );
    expect(months).toHaveLength(12);
    expect(months[0].month).toBe('2024-07');
    expect(months.slice(-3)).toEqual([
      { month: '2025-04', income: 0, spending: 200, net: -200 },
      { month: '2025-05', income: 3000, spending: 1000, net: 2000 },
      { month: '2025-06', income: 3000, spending: 500.26, net: 2499.74 },
    ]);
    expect(months[0]).toEqual({
      month: '2024-07',
      income: 0,
      spending: 0,
      net: 0,
    });
  });
});
