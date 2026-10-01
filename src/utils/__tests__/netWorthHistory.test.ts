import { Account, Transaction } from '../../types/financial';
import { netWorthHistory } from '../netWorthHistory';

const txn = (date: string, amount: number): Transaction => ({
  id: `${date}-${amount}`,
  accountId: '',
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
});

const account = (
  id: string,
  balance: number,
  transactions: Transaction[]
): Account => ({
  id,
  name: id,
  type: balance < 0 ? 'CREDIT' : 'CHECKING',
  balance,
  accountNumber: '',
  bankName: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  transactions,
});

describe('netWorthHistory', () => {
  const checking = account('Checking', 3000, [
    txn('2025-06-10', 1000),
    txn('2025-05-20', 500),
  ]);
  // Owed 400 today; 600 at the end of May, before a 200 payment.
  const card = account('Card', -400, [txn('2025-06-05', 200)]);

  it('works back from today, month by month, oldest first', () => {
    const months = netWorthHistory([checking, card], '2025-06-15', 3);
    expect(months.map((m) => m.month)).toEqual([
      '2025-04',
      '2025-05',
      '2025-06',
    ]);
    expect(months.map((m) => m.date)).toEqual([
      '2025-04-30',
      '2025-05-31',
      // The current month is taken today.
      '2025-06-15',
    ]);
    expect(months.map((m) => [m.assets, m.debts, m.net])).toEqual([
      [1500, 600, 900],
      [2000, 600, 1400],
      [3000, 400, 2600],
    ]);
  });

  it("lists each account's balance that day, largest first", () => {
    const [april] = netWorthHistory([card, checking], '2025-06-15', 3);
    expect(april.accounts).toEqual([
      { id: 'Checking', name: 'Checking', balance: 1500 },
      { id: 'Card', name: 'Card', balance: -600 },
    ]);
  });

  it('counts an overdrawn account as owed, and handles no accounts', () => {
    const [today] = netWorthHistory(
      [account('Overdrawn', -50.5, [])],
      '2025-06-15',
      1
    );
    expect(today).toMatchObject({ assets: 0, debts: 50.5, net: -50.5 });
    expect(netWorthHistory([], '2025-06-15', 2)).toEqual([
      expect.objectContaining({ month: '2025-05', net: 0, accounts: [] }),
      expect.objectContaining({ month: '2025-06', net: 0, accounts: [] }),
    ]);
  });

  it('crosses into the previous year', () => {
    const months = netWorthHistory([], '2025-02-03', 3);
    expect(months.map((m) => m.date)).toEqual([
      '2024-12-31',
      '2025-01-31',
      '2025-02-03',
    ]);
  });
});
