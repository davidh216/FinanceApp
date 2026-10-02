import { Account, Transaction } from '../../types/financial';
import { reviewYears, yearReview } from '../yearReview';

let nextId = 0;
const txn = (
  date: string,
  amount: number,
  merchant = 'Other',
  category = 'Other',
  extra: Partial<Transaction> = {}
): Transaction => ({
  id: `t${nextId++}`,
  accountId: 'checking',
  description: merchant.toUpperCase(),
  amount,
  date,
  category,
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: merchant,
    logo: '',
    suggestedCategory: '',
    original: '',
  },
  createdAt: '',
  updatedAt: '',
  ...extra,
});

const account = (balance: number, transactions: Transaction[]): Account => ({
  id: 'checking',
  name: 'Checking',
  type: 'CHECKING',
  balance,
  accountNumber: '',
  bankName: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  transactions,
});

describe('yearReview', () => {
  const transactions = [
    // 2024
    txn('2024-01-05', 2000, 'Payroll', 'Income'),
    txn('2024-03-05', -100, 'Amazon', 'Shopping'),
    txn('2024-07-01', -900, 'Delta', 'Travel'),
    // 2025, up to the test day (15 June)
    txn('2025-01-02', 3000, 'Payroll', 'Income'),
    txn('2025-01-10', -200, 'Amazon', 'Shopping'),
    txn('2025-01-20', -50, 'Starbucks', 'Food & Dining'),
    txn('2025-03-15', 3000, 'Payroll', 'Income'),
    txn('2025-03-16', -1200, 'Delta', 'Travel'),
    txn('2025-03-20', -300, 'Amazon', 'Shopping'),
    txn('2025-06-01', -25, 'Starbucks', 'Food & Dining'),
    // Neither income nor spending.
    txn('2025-02-01', -5000, 'Card payment', 'Transfer', {
      transferAccountId: 'card',
    }),
    txn('2025-02-02', 400, 'Balance update', 'Other', { adjustment: true }),
  ];
  const accounts = [account(10000, transactions)];

  it('adds up the year so far and compares with the same days last year', () => {
    const review = yearReview(accounts, 2025, '2025-06-15');
    expect(review.partial).toBe(true);
    expect(review.range).toEqual({ start: '2025-01-01', end: '2025-06-15' });
    expect(review.previousRange).toEqual({
      start: '2024-01-01',
      end: '2024-06-15',
    });
    expect(review.income).toBe(6000);
    expect(review.spending).toBe(1775);
    expect(review.saved).toBe(4225);
    expect(review.savingsRate).toBeCloseTo(4225 / 6000);
    // July's flight is outside the same days last year.
    expect(review.previousIncome).toBe(2000);
    expect(review.previousSpending).toBe(100);
    expect(review.transactionCount).toBe(7);
    expect(review.dataStart).toBeNull();
  });

  it('lists each month so far, and picks the biggest and best', () => {
    const review = yearReview(accounts, 2025, '2025-06-15');
    expect(review.months.map((m) => m.month)).toEqual([
      '2025-01',
      '2025-02',
      '2025-03',
      '2025-04',
      '2025-05',
      '2025-06',
    ]);
    expect(review.biggestMonth?.month).toBe('2025-03');
    expect(review.biggestMonth?.spending).toBe(1500);
    expect(review.bestMonth?.month).toBe('2025-01');
    expect(review.bestMonth?.net).toBe(2750);
  });

  it('ranks categories and merchants by spending', () => {
    const review = yearReview(accounts, 2025, '2025-06-15');
    expect(review.categories.map((c) => [c.category, c.amount])).toEqual([
      ['Travel', 1200],
      ['Shopping', 500],
      ['Food & Dining', 75],
    ]);
    expect(review.categories[1].previous).toBe(100);
    expect(review.merchants).toEqual([
      { merchant: 'Delta', amount: 1200, count: 1 },
      { merchant: 'Amazon', amount: 500, count: 2 },
      { merchant: 'Starbucks', amount: 75, count: 2 },
    ]);
    expect(review.biggestPurchase).toEqual({
      date: '2025-03-16',
      merchant: 'Delta',
      category: 'Travel',
      amount: 1200,
    });
  });

  it('works out net worth at the start and end of the year', () => {
    // Today 10,000. Undoing 2025 (+6000 -1775 -5000 +400 = -375) gives
    // 10,375 at the end of 2024.
    const review = yearReview(accounts, 2025, '2025-06-15');
    expect(review.netWorthStart).toBe(10375);
    expect(review.netWorthEnd).toBe(10000);
  });

  it('covers the whole of a past year', () => {
    const review = yearReview(accounts, 2024, '2025-06-15');
    expect(review.partial).toBe(false);
    expect(review.range).toEqual({ start: '2024-01-01', end: '2024-12-31' });
    expect(review.months).toHaveLength(12);
    expect(review.spending).toBe(1000);
    expect(review.biggestPurchase?.merchant).toBe('Delta');
    expect(review.netWorthEnd).toBe(10375);
    // Nothing from 2023 to compare with.
    expect(review.previousIncome).toBeNull();
    expect(review.previousSpending).toBeNull();
    expect(review.dataStart).toBe('2024-01-05');
  });

  it('handles a year with nothing in it', () => {
    const review = yearReview([account(0, [])], 2025, '2025-06-15');
    expect(review.income).toBe(0);
    expect(review.savingsRate).toBe(0);
    expect(review.biggestMonth).toBeNull();
    expect(review.bestMonth).toBeNull();
    expect(review.biggestPurchase).toBeNull();
    expect(review.categories).toEqual([]);
  });

  it("doesn't compare with a year your transactions start partway through", () => {
    const late = [
      account(0, [txn('2024-09-01', -50), txn('2025-03-01', -100)]),
    ];
    const review = yearReview(late, 2025, '2025-06-15');
    expect(review.previousSpending).toBeNull();
    // From the January before, it does.
    const early = [
      account(0, [txn('2024-01-20', -50), txn('2025-03-01', -100)]),
    ];
    expect(yearReview(early, 2025, '2025-06-15').previousSpending).toBe(50);
  });

  it('compares 29 February with the 28th a year earlier', () => {
    expect(yearReview(accounts, 2028, '2028-02-29').previousRange.end).toBe(
      '2027-02-28'
    );
  });
});

describe('reviewYears', () => {
  it('lists years with income or spending, newest first', () => {
    expect(
      reviewYears(
        [
          txn('2023-05-01', -10),
          txn('2024-05-01', 10),
          // A transfer alone doesn't make a year.
          txn('2022-05-01', -10, 'x', 'Transfer', { transferAccountId: 'a' }),
        ],
        '2025-06-15'
      )
    ).toEqual([2025, 2024, 2023]);
  });
});
