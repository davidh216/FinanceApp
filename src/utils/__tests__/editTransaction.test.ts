import { Account, Transaction } from '../../types/financial';
import { editTransaction } from '../editTransaction';
import { createManualTransaction } from '../manualTransactions';

const NOW = new Date('2025-06-15T12:00:00Z');

const imported: Transaction = {
  id: 'txn_imported',
  accountId: 'acc_import_1',
  description: 'STARBUCKS STORE 1234',
  amount: -5.75,
  date: '2025-06-05',
  category: 'Food & Dining',
  tags: ['Coffee'],
  pending: false,
  cleanMerchant: {
    cleanName: 'Starbucks',
    logo: '',
    suggestedCategory: 'Food & Dining',
    original: 'STARBUCKS STORE 1234',
  },
  createdAt: '2025-06-05',
  updatedAt: '2025-06-05',
};

const manual = createManualTransaction({
  accountId: 'acc_import_1',
  date: '2025-06-03',
  description: 'Farmrs market',
  amount: -20,
  category: 'Groceries',
});

const account = (): Account => ({
  id: 'acc_import_1',
  name: 'Checking',
  type: 'CHECKING',
  balance: 100,
  accountNumber: '',
  bankName: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  transactions: [imported, manual],
});

const find = (acc: Account, id: string) =>
  acc.transactions!.find((t) => t.id === id)!;

describe('editTransaction', () => {
  it('renames an imported transaction and adds a note', () => {
    const edited = editTransaction(
      account(),
      imported.id,
      { name: '  Morning   coffee ', notes: ' With Sam ' },
      NOW
    );
    const txn = find(edited, imported.id);
    expect(txn.cleanMerchant.cleanName).toBe('Morning coffee');
    expect(txn.cleanMerchant.original).toBe('STARBUCKS STORE 1234');
    expect(txn.notes).toBe('With Sam');
    expect(txn.updatedAt).toBe(NOW.toISOString());
    expect(txn.category).toBe('Food & Dining');
    expect(txn.tags).toEqual(['Coffee']);
    expect(edited.balance).toBe(100);
  });

  it("doesn't change what the bank reported", () => {
    const edited = editTransaction(account(), imported.id, {
      name: 'Starbucks',
      notes: '',
      date: '2025-01-01',
      description: 'Something else',
      amount: -500,
    });
    const txn = find(edited, imported.id);
    expect(txn).toMatchObject({
      date: '2025-06-05',
      description: 'STARBUCKS STORE 1234',
      amount: -5.75,
    });
    expect(edited.balance).toBe(100);
  });

  it('removes a note left blank, and uses the usual name for a blank name', () => {
    const noted = editTransaction(account(), imported.id, {
      name: 'Coffee',
      notes: 'x',
    });
    const cleared = editTransaction(noted, imported.id, {
      name: ' ',
      notes: '  ',
    });
    const txn = find(cleared, imported.id);
    expect(txn).not.toHaveProperty('notes');
    expect(txn.cleanMerchant.cleanName).toBe('Starbucks');
  });

  it('fixes the date, description and amount of one you added', () => {
    const edited = editTransaction(account(), manual.id, {
      name: '',
      notes: '',
      date: '2025-06-10',
      description: ' Farmers market ',
      amount: -32.505,
    });
    const txn = find(edited, manual.id);
    expect(txn).toMatchObject({
      date: '2025-06-10',
      description: 'Farmers market',
      amount: -32.51,
      category: 'Groceries',
      manual: true,
    });
    expect(txn.cleanMerchant.original).toBe('Farmers market');
    expect(txn.cleanMerchant.cleanName).toBe('Farmers Market');
    // The balance moves by the difference: 20.00 out became 32.51 out.
    expect(edited.balance).toBe(87.49);
    // Still newest first.
    expect(edited.transactions!.map((t) => t.id)).toEqual([
      manual.id,
      imported.id,
    ]);
  });

  it('turns money out into money in', () => {
    const edited = editTransaction(account(), manual.id, {
      name: '',
      notes: '',
      amount: 20,
    });
    expect(find(edited, manual.id).amount).toBe(20);
    expect(edited.balance).toBe(140);
  });

  it('leaves the account alone for an unknown transaction', () => {
    const acc = account();
    expect(editTransaction(acc, 'missing', { name: 'x', notes: '' })).toBe(acc);
  });
});
