import { Account, Transaction } from '../../types/financial';
import {
  categoryParts,
  cleanSplits,
  describeSplits,
  hasCategory,
  isSplit,
  replaceCategory,
  splitError,
  splitTransaction,
  withSplits,
} from '../splits';
import { spendingByCategory } from '../budgets';
import { spendingReport } from '../spendingReport';
import { filterTransactions } from '../transactionFilters';
import { editTransaction } from '../editTransaction';
import { applyCategoryRule } from '../categoryRules';
import { createBackup, parseBackup, transactionsToCsv } from '../backup';

const txn = (extra: Partial<Transaction> = {}): Transaction => ({
  id: 't1',
  accountId: 'acc_import_1',
  description: 'TARGET 1234',
  amount: -100,
  date: '2025-06-10',
  category: 'Shopping',
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: 'Target',
    logo: '',
    suggestedCategory: 'Shopping',
    original: 'TARGET 1234',
  },
  createdAt: '',
  updatedAt: '',
  ...extra,
});

const parts = [
  { category: 'Groceries', amount: -70 },
  { category: 'Shopping', amount: -30 },
];
const split = withSplits(txn(), parts);

describe('splitError', () => {
  it('accepts parts that add up to the amount', () => {
    expect(splitError(-100, parts)).toBeNull();
    expect(
      splitError(-0.3, [
        { category: 'Groceries', amount: -0.1 },
        { category: 'Shopping', amount: -0.2 },
      ])
    ).toBeNull();
  });

  it('explains what is wrong', () => {
    expect(splitError(-100, [parts[0]])).toBe(
      'Split it into at least two parts.'
    );
    expect(splitError(-100, [parts[0], { category: '', amount: -30 }])).toBe(
      'Choose a category for each part.'
    );
    expect(
      splitError(-100, [parts[0], { category: 'Groceries', amount: -30 }])
    ).toBe('Use each category once.');
    expect(
      splitError(-100, [parts[0], { category: 'Shopping', amount: 0 }])
    ).toBe('Give each part an amount.');
    expect(
      splitError(-100, [parts[0], { category: 'Shopping', amount: 30 }])
    ).toBe('Give each part an amount.');
    expect(
      splitError(-100, [parts[0], { category: 'Shopping', amount: -20 }])
    ).toBe('The parts need to add up to the total: 10.00 left to assign.');
    expect(
      splitError(-100, [parts[0], { category: 'Shopping', amount: -40 }])
    ).toBe('The parts need to add up to the total: 10.00 too much.');
  });
});

describe('withSplits', () => {
  it('keeps the parts, with the largest as the category', () => {
    expect(split.splits).toEqual(parts);
    expect(split.category).toBe('Groceries');
    expect(isSplit(split)).toBe(true);
    expect(categoryParts(split)).toEqual(parts);
    expect(hasCategory(split, 'Shopping')).toBe(true);
    expect(hasCategory(split, 'Travel')).toBe(false);
  });

  it('puts it back in the largest part', () => {
    const unsplit = withSplits(split, null);
    expect(unsplit.splits).toBeUndefined();
    expect(unsplit.category).toBe('Groceries');
    expect(categoryParts(unsplit)).toEqual([
      { category: 'Groceries', amount: -100 },
    ]);
  });

  it("ignores parts that don't fit, and transfers", () => {
    const bad = [{ category: 'Groceries', amount: -10 }, parts[1]];
    expect(withSplits(txn(), bad)).toEqual(txn());
    const transfer = txn({ transferAccountId: 'acc_import_2' });
    expect(withSplits(transfer, parts).splits).toBeUndefined();
  });
});

describe('splitTransaction', () => {
  it('changes only that transaction', () => {
    const account = {
      id: 'acc_import_1',
      transactions: [txn(), txn({ id: 't2' })],
    } as Account;
    const result = splitTransaction(
      account,
      't1',
      parts,
      new Date('2025-06-15T12:00:00Z')
    );
    expect(result.transactions![0].splits).toEqual(parts);
    expect(result.transactions![0].updatedAt).toBe('2025-06-15T12:00:00.000Z');
    expect(result.transactions![1].splits).toBeUndefined();
  });
});

describe('replaceCategory', () => {
  it('moves a part, joining parts that end up together', () => {
    const three = withSplits(txn(), [
      { category: 'Groceries', amount: -50 },
      { category: 'Pets', amount: -30 },
      { category: 'Shopping', amount: -20 },
    ]);
    expect(replaceCategory(three, 'Pets', 'Shopping').splits).toEqual([
      { category: 'Groceries', amount: -50 },
      { category: 'Shopping', amount: -50 },
    ]);
    const merged = replaceCategory(split, 'Shopping', 'Groceries');
    expect(merged.splits).toBeUndefined();
    expect(merged.category).toBe('Groceries');
  });

  it('changes an unsplit transaction in that category', () => {
    expect(replaceCategory(txn(), 'Shopping', 'Other').category).toBe('Other');
    expect(replaceCategory(txn(), 'Travel', 'Other')).toEqual(txn());
  });
});

describe('split transactions elsewhere', () => {
  it('count each part in budgets and the spending report', () => {
    expect(spendingByCategory([split], '2025-06')).toEqual({
      Groceries: 70,
      Shopping: 30,
    });
    const report = spendingReport(
      [split],
      { start: '2025-06-01', end: '2025-06-30' },
      { start: '2025-05-01', end: '2025-05-31' }
    );
    expect(report.total).toBe(100);
    expect(report.categories.map((c) => [c.category, c.amount])).toEqual([
      ['Groceries', 70],
      ['Shopping', 30],
    ]);
  });

  it('match a filter for any of their categories', () => {
    const filters = {
      search: '',
      accountId: '',
      category: '',
      from: '',
      to: '',
    };
    expect(
      filterTransactions([split], { ...filters, category: 'Shopping' })
    ).toHaveLength(1);
    expect(
      filterTransactions([split], { ...filters, search: 'shopping' })
    ).toHaveLength(1);
  });

  it("aren't changed by category rules", () => {
    expect(applyCategoryRule(split, { target: 'Travel' })).toBe(split);
  });

  it('lose their parts when a hand-entered amount changes', () => {
    const manual = withSplits(txn({ manual: true }), parts);
    const account = {
      id: 'acc_import_1',
      balance: 0,
      transactions: [manual],
    } as Account;
    const same = editTransaction(account, 't1', { name: '', notes: 'x' });
    expect(same.transactions![0].splits).toEqual(parts);
    const changed = editTransaction(account, 't1', {
      name: '',
      notes: '',
      amount: -120,
    });
    expect(changed.transactions![0].splits).toBeUndefined();
  });

  it('go through backups and the CSV export', () => {
    const account = {
      id: 'acc_import_1',
      name: 'Card',
      type: 'CREDIT',
      balance: -100,
      accountNumber: '',
      bankName: '',
      isActive: true,
      createdAt: '',
      updatedAt: '',
      transactions: [split],
    } as Account;
    const restored = parseBackup(
      JSON.stringify(createBackup([account], false))
    );
    expect(restored.accounts[0].transactions![0].splits).toEqual(parts);
    expect(transactionsToCsv([account])).toContain(
      'Split: Groceries 70.00, Shopping 30.00'
    );
    expect(describeSplits(txn())).toBe('Shopping 100.00');
  });
});

describe('cleanSplits', () => {
  it('keeps only parts that split the amount exactly', () => {
    expect(cleanSplits(parts, -100)).toEqual(parts);
    expect(cleanSplits(parts, -90)).toBeUndefined();
    expect(cleanSplits([...parts, { category: 'x' }], -100)).toBeUndefined();
    expect(cleanSplits('nope', -100)).toBeUndefined();
  });
});
