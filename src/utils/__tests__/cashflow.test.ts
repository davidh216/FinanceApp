import { Transaction } from '../../types/financial';
import { incomeOf, isTransfer, spendingOf, transfersOf } from '../cashflow';

const txn = (amount: number, transferAccountId?: string): Transaction => ({
  id: `${amount}_${transferAccountId}`,
  accountId: 'acc_checking',
  description: 'TEST',
  amount,
  date: '2025-06-01',
  category: 'Other',
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: 'Test',
    logo: '',
    suggestedCategory: 'Other',
    original: 'TEST',
  },
  transferAccountId,
  createdAt: '',
  updatedAt: '',
});

const transactions = [
  txn(1000), // paycheck
  txn(-40), // groceries
  txn(-60), // fuel
  txn(-1500, 'acc_mortgage'), // loan payment out
  txn(200, 'acc_savings'), // moved in from savings
];

describe('cashflow', () => {
  it('identifies transfers', () => {
    expect(transactions.map(isTransfer)).toEqual([
      false,
      false,
      false,
      true,
      true,
    ]);
  });

  it('leaves transfers out of income and spending', () => {
    expect(incomeOf(transactions)).toBe(1000);
    expect(spendingOf(transactions)).toBe(100);
  });

  it('nets transfers in and out', () => {
    expect(transfersOf(transactions)).toBe(-1300);
  });

  it('adds up to the balance change', () => {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    expect(
      incomeOf(transactions) -
        spendingOf(transactions) +
        transfersOf(transactions)
    ).toBe(total);
  });
});
