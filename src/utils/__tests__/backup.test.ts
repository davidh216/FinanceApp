import { Account, Transaction } from '../../types/financial';
import {
  BackupError,
  createBackup,
  parseBackup,
  transactionsToCsv,
} from '../backup';

const txn = (overrides: Partial<Transaction>): Transaction => ({
  id: 't1',
  accountId: 'acc_import_1',
  description: 'STARBUCKS STORE 1234',
  amount: -5.75,
  date: '2025-06-03',
  category: 'Food & Dining',
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: 'Starbucks',
    logo: '☕',
    suggestedCategory: 'Food & Dining',
    original: 'STARBUCKS STORE 1234',
  },
  createdAt: '2025-06-03T00:00:00.000Z',
  updatedAt: '2025-06-03T00:00:00.000Z',
  ...overrides,
});

const account = (overrides: Partial<Account>): Account => ({
  id: 'acc_import_1',
  name: 'My Checking',
  type: 'CHECKING',
  balance: 2494.25,
  accountNumber: 'CSV import',
  bankName: 'Imported',
  isActive: true,
  createdAt: '2025-06-01T00:00:00.000Z',
  updatedAt: '2025-06-01T00:00:00.000Z',
  transactions: [],
  importSettings: { flipSigns: false },
  ...overrides,
});

const checking = account({
  transactions: [
    txn({ id: 't1', tags: ['Coffee'] }),
    txn({
      id: 't2',
      description: 'PAYROLL DEPOSIT',
      amount: 2500,
      date: '2025-06-02',
      category: 'Income',
      cleanMerchant: {
        cleanName: 'Salary',
        logo: '',
        suggestedCategory: 'Income',
        original: 'PAYROLL DEPOSIT',
      },
    }),
  ],
});
const demo = account({ id: 'acc_checking', name: 'Primary Checking' });

const errorFor = (text: string): string => {
  try {
    parseBackup(text);
  } catch (error) {
    expect(error).toBeInstanceOf(BackupError);
    return (error as Error).message;
  }
  throw new Error('parseBackup accepted the file');
};

describe('backups', () => {
  it('holds only imported accounts, and restores them exactly', () => {
    const backup = createBackup(
      [demo, checking],
      true,
      { Groceries: 400 },
      new Date('2025-06-15T16:00:00.000Z')
    );
    expect(backup.accounts.map((a) => a.id)).toEqual(['acc_import_1']);
    expect(backup.exportedAt).toBe('2025-06-15T16:00:00.000Z');

    const restored = parseBackup(JSON.stringify(backup));
    expect(restored.accounts).toEqual([checking]);
    expect(restored.settings).toEqual({
      showDemoAccounts: true,
      budgets: { Groceries: 400 },
      categoryRules: {},
    });
  });

  it('keeps the categories you chose for merchants', () => {
    const backup = createBackup([checking], false, {}, new Date(), {
      starbucks: 'Entertainment',
    });
    expect(parseBackup(JSON.stringify(backup)).settings.categoryRules).toEqual({
      starbucks: 'Entertainment',
    });
  });

  it('keeps transactions marked as added by hand', () => {
    const cash = account({ transactions: [txn({ manual: true })] });
    const restored = parseBackup(JSON.stringify(createBackup([cash], false)));
    expect(restored.accounts[0].transactions![0].manual).toBe(true);
  });

  it('keeps transfer links', () => {
    const linked = account({
      transactions: [txn({ transferAccountId: 'acc_import_2' })],
    });
    const restored = parseBackup(JSON.stringify(createBackup([linked], false)));
    expect(restored.accounts[0].transactions![0].transferAccountId).toBe(
      'acc_import_2'
    );
  });

  it('keeps transfers you unlinked unlinked', () => {
    const unlinked = account({
      transactions: [txn({ notTransfer: true })],
    });
    const restored = parseBackup(
      JSON.stringify(createBackup([unlinked], false))
    );
    expect(restored.accounts[0].transactions![0].notTransfer).toBe(true);
  });

  it('fills in optional fields a hand-edited backup leaves out', () => {
    const minimal = {
      app: 'FinanceApp',
      version: 1,
      accounts: [
        {
          id: 'acc_import_9',
          name: 'Savings',
          type: 'SAVINGS',
          balance: 100,
          transactions: [
            { id: 'x', date: '2025-01-02', amount: 100, description: 'DEP' },
          ],
        },
      ],
    };
    const [restored] = parseBackup(JSON.stringify(minimal)).accounts;
    expect(restored.transactions![0]).toMatchObject({
      accountId: 'acc_import_9',
      category: 'Other',
      tags: [],
      pending: false,
      cleanMerchant: { cleanName: 'DEP', suggestedCategory: 'Other' },
    });
    expect(restored.importSettings).toEqual({ flipSigns: false });
  });

  it('rejects files that are not valid backups', () => {
    expect(errorFor('not json')).toBe("This file isn't a FinanceApp backup.");
    expect(errorFor('{"accounts": []}')).toBe(
      "This file isn't a FinanceApp backup."
    );
    expect(
      errorFor('{"app": "FinanceApp", "version": 2, "accounts": []}')
    ).toBe('This backup was made by a newer version of FinanceApp.');
  });

  it('rejects demo accounts and broken transactions', () => {
    const withAccounts = (accounts: unknown[]) =>
      JSON.stringify({ app: 'FinanceApp', version: 1, accounts });
    expect(errorFor(withAccounts([demo]))).toBe(
      "Account 1 isn't an imported account."
    );
    expect(
      errorFor(
        withAccounts([
          account({ transactions: [txn({ amount: 'lots' as any })] }),
        ])
      )
    ).toBe(
      'Account 1, transaction 1, is missing its id, date, amount or description.'
    );
    expect(
      errorFor(
        withAccounts([account({ transactions: [txn({ date: '06/03/2025' })] })])
      )
    ).toMatch(/transaction 1/);
    expect(errorFor(withAccounts([checking, checking]))).toBe(
      'This backup lists the same account twice.'
    );
  });
});

describe('transactionsToCsv', () => {
  it('writes one row per transaction, oldest first', () => {
    expect(transactionsToCsv([checking]).split('\n')).toEqual([
      'Date,Account,Description,Merchant,Category,Amount,Transfer account,Tags,Notes',
      '2025-06-02,My Checking,PAYROLL DEPOSIT,Salary,Income,2500.00,,,',
      '2025-06-03,My Checking,STARBUCKS STORE 1234,Starbucks,Food & Dining,-5.75,,Coffee,',
      '',
    ]);
  });

  it('names the other account of a transfer', () => {
    const card = account({
      id: 'acc_import_2',
      name: 'My Visa',
      transactions: [
        txn({
          id: 'p',
          description: 'PAYMENT THANK YOU',
          amount: 500,
          transferAccountId: 'acc_import_1',
        }),
      ],
    });
    expect(transactionsToCsv([checking, card])).toContain(
      'PAYMENT THANK YOU,Starbucks,Food & Dining,500.00,My Checking,'
    );
  });

  it('names a transfer with an account not in the app', () => {
    const venmo = account({
      transactions: [
        txn({
          description: 'VENMO',
          amount: 300,
          transferAccountId: 'external',
        }),
      ],
    });
    expect(transactionsToCsv([venmo])).toContain(
      ',300.00,Account not in FinanceApp,'
    );
  });

  it('quotes commas and quotes, and stops text running as a formula', () => {
    const tricky = account({
      name: 'Joint, "Main"',
      transactions: [
        txn({
          description: '=HYPERLINK("http://x")',
          tags: ['a', 'b'],
          cleanMerchant: {
            cleanName: '+Shop',
            logo: '',
            suggestedCategory: '',
            original: '',
          },
        }),
      ],
    });
    const [, row] = transactionsToCsv([tricky]).split('\n');
    expect(row).toBe(
      '2025-06-03,"Joint, ""Main""","\'=HYPERLINK(""http://x"")",\'+Shop,Food & Dining,-5.75,,a; b,'
    );
  });

  it('includes your notes', () => {
    const noted = account({
      transactions: [txn({ notes: 'Lunch with Sam, split 50/50' })],
    });
    const [, row] = transactionsToCsv([noted]).split('\n');
    expect(row).toMatch(/-5\.75,,,"Lunch with Sam, split 50\/50"$/);
  });
});
