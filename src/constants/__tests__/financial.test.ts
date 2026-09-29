import { generateHistoricalTransactions } from '../financial';
import { createRandom } from '../../utils/random';
import { Transaction } from '../../types/financial';

const inMonth = (transactions: Transaction[], yearMonth: string) =>
  transactions.filter((txn) => txn.date.startsWith(yearMonth));

describe('createRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRandom('seed');
    const b = createRandom('seed');
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
  });

  it('gives different sequences for different seeds', () => {
    expect(createRandom('one')()).not.toBe(createRandom('two')());
  });

  it('returns numbers in [0, 1)', () => {
    const random = createRandom('range');
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('generateHistoricalTransactions', () => {
  const today = new Date(2025, 5, 15); // 15 June 2025

  it.each(['acc_checking', 'acc_mortgage'])(
    'returns identical data for %s on every call',
    (accountId) => {
      expect(generateHistoricalTransactions(accountId, 6, 20, today)).toEqual(
        generateHistoricalTransactions(accountId, 6, 20, new Date(today))
      );
    }
  );

  it('gives different accounts different data', () => {
    const checking = generateHistoricalTransactions('acc_a', 1, 20, today);
    const savings = generateHistoricalTransactions('acc_b', 1, 20, today);
    expect(checking.map((t) => t.amount)).not.toEqual(
      savings.map((t) => t.amount)
    );
  });

  it.each(['acc_checking', 'acc_mortgage'])(
    'keeps past months unchanged as time moves on (%s)',
    (accountId) => {
      const inJune = generateHistoricalTransactions(accountId, 6, 20, today);
      const inSeptember = generateHistoricalTransactions(
        accountId,
        6,
        20,
        new Date(2025, 8, 3)
      );
      // May 2025 is in both windows; it must be the same data, IDs included.
      const mayInJune = inMonth(inJune, '2025-05');
      expect(mayInJune.length).toBeGreaterThan(0);
      expect(inMonth(inSeptember, '2025-05')).toEqual(mayInJune);
    }
  );

  it.each(['acc_checking', 'acc_mortgage'])(
    'keeps a month the same once it ends (%s)',
    (accountId) => {
      // On the last day of June, June is complete. In July it becomes a past
      // month and must not change, apart from no longer being pending.
      const withoutPending = (transactions: Transaction[]) =>
        inMonth(transactions, '2025-06').map(({ pending, ...rest }) => rest);
      const onJune30 = generateHistoricalTransactions(
        accountId,
        3,
        20,
        new Date(2025, 5, 30)
      );
      const inJuly = generateHistoricalTransactions(
        accountId,
        3,
        20,
        new Date(2025, 6, 10)
      );
      expect(withoutPending(onJune30).length).toBeGreaterThan(0);
      expect(withoutPending(inJuly)).toEqual(withoutPending(onJune30));
    }
  );

  it.each(['acc_checking', 'acc_mortgage'])(
    'never dates %s transactions after today',
    (accountId) => {
      // Early in the month, when most of the month is still in the future.
      const earlyInMonth = new Date(2025, 5, 2);
      const dates = generateHistoricalTransactions(
        accountId,
        3,
        20,
        earlyInMonth
      ).map((t) => t.date);
      expect(dates.filter((date) => date > '2025-06-02')).toEqual([]);
    }
  );

  it('produces valid, sorted, uniquely identified transactions', () => {
    const transactions = generateHistoricalTransactions(
      'acc_checking',
      15,
      20,
      today
    );
    expect(new Set(transactions.map((t) => t.id)).size).toBe(
      transactions.length
    );
    const dates = transactions.map((t) => t.date);
    expect(dates).toEqual([...dates].sort().reverse());
    transactions.forEach((txn) => {
      expect(txn.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(txn.amount)).toBe(true);
      expect(txn.amount).not.toBe(0);
    });
  });
});

describe('MOCK_ACCOUNTS', () => {
  it('is identical each time the app loads', () => {
    const load = () => {
      let accounts: unknown;
      jest.isolateModules(() => {
        accounts = require('../financial').MOCK_ACCOUNTS;
      });
      return accounts;
    };
    const first = load();
    const second = load();
    expect(second).not.toBe(first);
    // Accounts carry load-time timestamps; compare everything else.
    const strip = (accounts: any) =>
      accounts.map(({ createdAt, updatedAt, ...rest }: any) => rest);
    expect(strip(second)).toEqual(strip(first));
  });
});
