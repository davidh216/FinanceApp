import { Account } from '../../types/financial';
import {
  addTransaction,
  createManualTransaction,
  parseManualAmount,
  removeTransaction,
  suggestCategory,
} from '../manualTransactions';

const account = (): Account => ({
  id: 'acc_import_1',
  name: 'Cash',
  type: 'CHECKING',
  balance: 100,
  accountNumber: '',
  bankName: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  transactions: [],
});

describe('parseManualAmount', () => {
  it('reads positive amounts', () => {
    expect(parseManualAmount('12.5')).toBe(12.5);
    expect(parseManualAmount('$1,200.005')).toBe(1200.01);
  });

  it('rejects signs, zero and text', () => {
    expect(parseManualAmount('-5')).toBeNull();
    expect(parseManualAmount('0')).toBeNull();
    expect(parseManualAmount('ten')).toBeNull();
    expect(parseManualAmount('')).toBeNull();
  });
});

describe('suggestCategory', () => {
  it('guesses from the description, or uses a remembered choice', () => {
    expect(suggestCategory('Starbucks', -5, {})).toBe('Food & Dining');
    expect(
      suggestCategory('Starbucks', -5, { starbucks: 'Entertainment' })
    ).toBe('Entertainment');
    expect(suggestCategory('Farmers market', -20, {})).toBe('Other');
    expect(suggestCategory('Cash gift', 50, {})).toBe('Income');
  });
});

describe('createManualTransaction', () => {
  it('builds a transaction marked as manual', () => {
    const txn = createManualTransaction(
      {
        accountId: 'acc_import_1',
        date: '2025-06-10',
        description: '  Farmers market ',
        amount: -23.456,
        category: 'Groceries',
      },
      new Date('2025-06-15T12:00:00Z')
    );
    expect(txn).toMatchObject({
      accountId: 'acc_import_1',
      date: '2025-06-10',
      description: 'Farmers market',
      amount: -23.46,
      category: 'Groceries',
      manual: true,
      tags: [],
      pending: false,
    });
    expect(txn.cleanMerchant.suggestedCategory).toBe('Groceries');
    expect(txn.id).toMatch(/^txn_acc_import_1_manual_/);
  });

  it('gives each transaction its own id', () => {
    const details = {
      accountId: 'a',
      date: '2025-06-10',
      description: 'x',
      amount: -1,
      category: 'Other',
    };
    const now = new Date();
    expect(createManualTransaction(details, now).id).not.toBe(
      createManualTransaction(details, now).id
    );
  });
});

describe('addTransaction and removeTransaction', () => {
  it('move the balance and keep the newest first', () => {
    const older = createManualTransaction({
      accountId: 'acc_import_1',
      date: '2025-06-01',
      description: 'Lunch',
      amount: -12.5,
      category: 'Food & Dining',
    });
    const newer = createManualTransaction({
      accountId: 'acc_import_1',
      date: '2025-06-09',
      description: 'Refund',
      amount: 30,
      category: 'Shopping',
    });
    const withBoth = addTransaction(addTransaction(account(), older), newer);
    expect(withBoth.balance).toBe(117.5);
    expect(withBoth.transactions!.map((t) => t.description)).toEqual([
      'Refund',
      'Lunch',
    ]);

    const without = removeTransaction(withBoth, older.id);
    expect(without.balance).toBe(130);
    expect(without.transactions).toHaveLength(1);
    expect(removeTransaction(without, 'missing')).toBe(without);
  });
});
