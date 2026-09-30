import { Transaction } from '../../types/financial';
import { spendingReport } from '../spendingReport';

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

const JUNE = { start: '2025-06-01', end: '2025-06-15' };
const MAY = { start: '2025-05-01', end: '2025-05-31' };

describe('spendingReport', () => {
  it('compares spending by category with the period before', () => {
    const report = spendingReport(
      [
        // June, including both ends of the range.
        txn('2025-06-01', -60, 'Shopping'),
        txn('2025-06-15', -20, 'Shopping'),
        txn('2025-06-03', -20, 'Food & Dining'),
        // May.
        txn('2025-05-01', -50, 'Shopping'),
        txn('2025-05-31', -30, 'Travel'),
        // Not spending, or outside both periods.
        txn('2025-06-02', 3000, 'Income'),
        txn('2025-06-04', -500, 'Transfer', 'acc_card'),
        txn('2025-06-16', -999, 'Shopping'),
        txn('2025-04-30', -999, 'Shopping'),
      ],
      JUNE,
      MAY
    );

    expect(report.total).toBe(100);
    expect(report.previousTotal).toBe(80);
    expect(report.categories).toEqual([
      {
        category: 'Shopping',
        amount: 80,
        share: 0.8,
        previous: 50,
        change: 30,
      },
      {
        category: 'Food & Dining',
        amount: 20,
        share: 0.2,
        previous: 0,
        change: 20,
      },
      // Spent on before, but not this period.
      { category: 'Travel', amount: 0, share: 0, previous: 30, change: -30 },
    ]);
  });

  it('rounds to the cent', () => {
    const report = spendingReport(
      [txn('2025-06-01', -0.1, 'Other'), txn('2025-06-02', -0.2, 'Other')],
      JUNE,
      MAY
    );
    expect(report.total).toBe(0.3);
    expect(report.categories[0].amount).toBe(0.3);
  });

  it('is empty when nothing was spent', () => {
    expect(
      spendingReport([txn('2025-06-02', 100, 'Income')], JUNE, MAY)
    ).toEqual({ total: 0, previousTotal: 0, categories: [] });
  });
});
