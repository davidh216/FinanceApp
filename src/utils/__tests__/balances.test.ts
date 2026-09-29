import { Account, Transaction } from '../../types/financial';
import { balanceAsOf, totalBalanceAsOf } from '../balances';

const txn = (date: string, amount: number): Transaction => ({
  id: `${date}_${amount}`,
  accountId: 'acc',
  description: 'TEST',
  amount,
  date,
  category: 'Other',
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: 'Test',
    logo: '',
    suggestedCategory: 'Other',
    original: 'TEST',
  },
  createdAt: '',
  updatedAt: '',
});

const account = (
  id: string,
  type: Account['type'],
  balance: number,
  transactions: Transaction[]
): Account => ({
  id,
  name: id,
  type,
  balance,
  accountNumber: '',
  bankName: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  transactions,
});

describe('balanceAsOf', () => {
  const checking = account('acc_checking', 'CHECKING', 1000, [
    txn('2025-06-10', -200),
    txn('2025-06-01', 500),
    txn('2025-05-31', -50),
  ]);

  it('undoes transactions after the date', () => {
    // 1000 now, minus the +500 and -200 in June.
    expect(balanceAsOf(checking, '2025-05-31')).toBe(700);
  });

  it('includes transactions on the date itself', () => {
    expect(balanceAsOf(checking, '2025-06-01')).toBe(1200);
    expect(balanceAsOf(checking, '2025-06-10')).toBe(1000);
  });

  it('treats credit card purchases as adding to what is owed', () => {
    const card = account('acc_credit', 'CREDIT', -300, [
      txn('2025-06-05', -100), // purchase
      txn('2025-06-06', 250), // payment
    ]);
    expect(balanceAsOf(card, '2025-05-31')).toBe(-450);
  });

  it('treats a loan payment received as reducing what is owed', () => {
    const mortgage = account('acc_mortgage', 'LOAN', -100000, [
      txn('2025-06-03', 2000),
    ]);
    expect(balanceAsOf(mortgage, '2025-05-31')).toBe(-102000);
  });
});

describe('totalBalanceAsOf', () => {
  it('sums accounts and rounds to cents', () => {
    const a = account('acc_a', 'CHECKING', 100.1, [txn('2025-06-02', 0.2)]);
    const b = account('acc_b', 'SAVINGS', 0.2, []);
    expect(totalBalanceAsOf([a, b], '2025-06-01')).toBe(100.1);
  });
});
