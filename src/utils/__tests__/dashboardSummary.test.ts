import { Account, Transaction } from '../../types/financial';
import { periodSummary, trendData } from '../dashboardSummary';

const txn = (
  date: string,
  amount: number,
  extra: Partial<Transaction> = {}
): Transaction => ({
  id: `${date}_${amount}`,
  accountId: 'chk',
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
  createdAt: '',
  updatedAt: '',
  ...extra,
});

const account = (
  balance: number,
  transactions: Transaction[],
  id = 'chk'
): Account => ({
  id,
  name: id,
  type: 'CHECKING',
  balance,
  accountNumber: '',
  bankName: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  transactions,
});

// Sunday 15 June 2025, midday.
const NOW = new Date(2025, 5, 15, 12);

const checking = account(3000, [
  txn('2025-06-02', 2000),
  txn('2025-06-10', -500),
  // A transfer and a balance update are neither income nor spending.
  txn('2025-06-11', -300, { transferAccountId: 'sav' }),
  txn('2025-06-12', 100, { adjustment: true }),
  txn('2025-05-05', 1800),
  txn('2025-05-20', -900),
]);
const card = account(-250, [txn('2025-06-03', -250)], 'card');

describe('periodSummary', () => {
  it('sums this month, and last month for comparison', () => {
    const summary = periodSummary([checking, card], 'month', undefined, NOW);
    expect(summary).toMatchObject({
      totalBalance: 2750,
      monthlyIncome: 2000,
      monthlyExpenses: 750,
      savingsRate: 0.625,
      previousPeriodIncome: 1800,
      previousPeriodExpenses: 900,
      periodStartDate: '2025-06-01',
      periodEndDate: '2025-06-15',
      previousPeriodStartDate: '2025-05-01',
      previousPeriodEndDate: '2025-05-31',
      periodLabel: 'monthly',
    });
    // Today's 2,750 with June's transactions undone.
    expect(summary.previousPeriodBalance).toBe(1700);
  });

  it('starts weeks on Monday, and compares with the week before', () => {
    const summary = periodSummary([checking], 'week', undefined, NOW);
    expect(summary).toMatchObject({
      periodStartDate: '2025-06-09',
      periodEndDate: '2025-06-15',
      // The whole of the week before, not just its Sunday.
      previousPeriodStartDate: '2025-06-02',
      previousPeriodEndDate: '2025-06-08',
      monthlyExpenses: 500,
      previousPeriodIncome: 2000,
    });
  });

  it('compares the first quarter with last year’s fourth', () => {
    const summary = periodSummary(
      [],
      'quarter',
      undefined,
      new Date(2025, 1, 10)
    );
    expect(summary).toMatchObject({
      periodStartDate: '2025-01-01',
      previousPeriodStartDate: '2024-10-01',
      previousPeriodEndDate: '2024-12-31',
    });
  });

  it('ends a custom range on its last day, after a period as long', () => {
    const summary = periodSummary(
      [checking],
      'custom',
      { startDate: '2025-05-15', endDate: '2025-06-05', label: '' },
      NOW
    );
    expect(summary).toMatchObject({
      periodStartDate: '2025-05-15',
      periodEndDate: '2025-06-05',
      // 22 days, straight before.
      previousPeriodStartDate: '2025-04-23',
      previousPeriodEndDate: '2025-05-14',
      monthlyIncome: 2000,
      monthlyExpenses: 900,
      previousPeriodIncome: 1800,
      periodLabel: 'custom',
    });
  });

  it('reports no savings rate without income', () => {
    expect(periodSummary([card], 'month', undefined, NOW).savingsRate).toBe(0);
  });
});

describe('trendData', () => {
  it('gives one point a day for the month, oldest first', () => {
    const trend = trendData([checking], 'month', NOW);
    expect(trend.income).toHaveLength(30);
    // The 2,000 paid on 2 June lands in that day's window.
    expect(trend.income.filter((v) => v > 0)).toEqual([2000]);
    // The 30 days start on 17 May, so the 900 on 20 May is in too.
    expect(trend.expenses.filter((v) => v > 0)).toEqual([900, 500]);
    // Today's balance is the last point.
    expect(trend.balance[29]).toBe(3000);
  });

  it('keeps the balance line at zero or above', () => {
    expect(Math.min(...trendData([card], 'week', NOW).balance)).toBe(0);
  });
});
