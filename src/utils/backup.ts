// src/utils/backup.ts
import {
  Account,
  AccountType,
  MerchantInfo,
  Transaction,
} from '../types/financial';
import { IMPORTED_ACCOUNT_PREFIX, isImportedAccount } from './csvImport';
import { EXTERNAL_ACCOUNT_ID } from './transfers';
import { Budgets, cleanBudgets } from './budgets';
import { CategoryRules, cleanCategoryRules } from './categoryRules';

// Backups hold the imported accounts only: demo accounts are regenerated on
// every load.
export const BACKUP_APP = 'FinanceApp';
export const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  accounts: Account[];
  settings: {
    showDemoAccounts: boolean;
    budgets: Budgets;
    categoryRules: CategoryRules;
  };
}

export const createBackup = (
  accounts: Account[],
  showDemoAccounts: boolean,
  budgets: Budgets = {},
  now: Date = new Date(),
  categoryRules: CategoryRules = {}
): Backup => ({
  app: BACKUP_APP,
  version: BACKUP_VERSION,
  exportedAt: now.toISOString(),
  accounts: accounts.filter(isImportedAccount),
  settings: { showDemoAccounts, budgets, categoryRules },
});

const ACCOUNT_TYPES: AccountType[] = [
  'CHECKING',
  'SAVINGS',
  'CREDIT',
  'BUSINESS_CHECKING',
  'BUSINESS_SAVINGS',
  'BUSINESS_CREDIT',
  'INVESTMENT',
  'LOAN',
];

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isDate = (value: unknown): value is string =>
  isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value);

export class BackupError extends Error {}

const readTransaction = (
  raw: unknown,
  accountId: string,
  where: string
): Transaction => {
  if (
    !isObject(raw) ||
    !isString(raw.id) ||
    !isDate(raw.date) ||
    !isAmount(raw.amount) ||
    !isString(raw.description)
  ) {
    throw new BackupError(
      `${where} is missing its id, date, amount or description.`
    );
  }
  const merchant: Record<string, any> = isObject(raw.cleanMerchant)
    ? raw.cleanMerchant
    : {};
  const category = isString(raw.category) ? raw.category : 'Other';
  const cleanMerchant: MerchantInfo = {
    cleanName: isString(merchant.cleanName)
      ? merchant.cleanName
      : raw.description,
    logo: isString(merchant.logo) ? merchant.logo : '',
    suggestedCategory: isString(merchant.suggestedCategory)
      ? merchant.suggestedCategory
      : category,
    original: isString(merchant.original) ? merchant.original : raw.description,
  };
  const timestamp = isString(raw.createdAt) ? raw.createdAt : raw.date;
  return {
    id: raw.id,
    accountId,
    description: raw.description,
    amount: raw.amount,
    date: raw.date,
    category,
    tags: Array.isArray(raw.tags) ? raw.tags.filter(isString) : [],
    pending: raw.pending === true,
    cleanMerchant,
    ...(isString(raw.transferAccountId)
      ? { transferAccountId: raw.transferAccountId }
      : {}),
    ...(raw.notTransfer === true ? { notTransfer: true } : {}),
    ...(raw.manual === true ? { manual: true } : {}),
    ...(isString(raw.notes) ? { notes: raw.notes } : {}),
    createdAt: timestamp,
    updatedAt: isString(raw.updatedAt) ? raw.updatedAt : timestamp,
  };
};

const readAccount = (raw: unknown, index: number): Account => {
  const where = `Account ${index + 1}`;
  if (
    !isObject(raw) ||
    !isString(raw.id) ||
    !raw.id.startsWith(IMPORTED_ACCOUNT_PREFIX) ||
    !isString(raw.name) ||
    !ACCOUNT_TYPES.includes(raw.type) ||
    !isAmount(raw.balance) ||
    !Array.isArray(raw.transactions)
  ) {
    throw new BackupError(`${where} isn't an imported account.`);
  }
  const now = new Date().toISOString();
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    balance: raw.balance,
    accountNumber: isString(raw.accountNumber)
      ? raw.accountNumber
      : 'CSV import',
    bankName: isString(raw.bankName) ? raw.bankName : 'Imported',
    isActive: raw.isActive !== false,
    createdAt: isString(raw.createdAt) ? raw.createdAt : now,
    updatedAt: isString(raw.updatedAt) ? raw.updatedAt : now,
    transactions: raw.transactions.map((txn: unknown, i: number) =>
      readTransaction(txn, raw.id, `${where}, transaction ${i + 1},`)
    ),
    importSettings: {
      flipSigns: raw.importSettings?.flipSigns === true,
    },
  };
};

// Reads a backup file, checking every account and transaction. Throws a
// BackupError explaining what's wrong rather than restoring part of a file.
export const parseBackup = (text: string): Backup => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError("This file isn't a FinanceApp backup.");
  }
  if (
    !isObject(data) ||
    data.app !== BACKUP_APP ||
    !Array.isArray(data.accounts)
  ) {
    throw new BackupError("This file isn't a FinanceApp backup.");
  }
  if (data.version !== BACKUP_VERSION) {
    throw new BackupError(
      'This backup was made by a newer version of FinanceApp.'
    );
  }
  const accounts = data.accounts.map(readAccount);
  if (new Set(accounts.map((account) => account.id)).size !== accounts.length) {
    throw new BackupError('This backup lists the same account twice.');
  }
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: isString(data.exportedAt) ? data.exportedAt : '',
    accounts,
    settings: {
      showDemoAccounts: data.settings?.showDemoAccounts === true,
      budgets: cleanBudgets(data.settings?.budgets),
      categoryRules: cleanCategoryRules(data.settings?.categoryRules),
    },
  };
};

// Spreadsheets run cells starting with these as formulas, so a bank
// description like "=HYPERLINK(...)" is quoted as plain text.
const FORMULA_START = /^[=+\-@\t\r]/;

const csvCell = (value: string): string => {
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const TRANSACTIONS_CSV_HEADER = [
  'Date',
  'Account',
  'Description',
  'Merchant',
  'Category',
  'Amount',
  'Transfer account',
  'Tags',
  'Notes',
];

// One row per transaction, oldest first. Amounts are the effect on the
// account: negative for money out.
export const transactionsToCsv = (accounts: Account[]): string => {
  const names = new Map(accounts.map((account) => [account.id, account.name]));
  const rows = accounts
    .flatMap((account) =>
      (account.transactions || []).map((txn) => ({ account, txn }))
    )
    .sort(
      (a, b) =>
        a.txn.date.localeCompare(b.txn.date) ||
        a.account.name.localeCompare(b.account.name)
    )
    .map(({ account, txn }) =>
      [
        txn.date,
        csvCell(account.name),
        csvCell(txn.description),
        csvCell(txn.cleanMerchant?.cleanName ?? ''),
        csvCell(txn.category),
        txn.amount.toFixed(2),
        csvCell(
          txn.transferAccountId === EXTERNAL_ACCOUNT_ID
            ? 'Account not in FinanceApp'
            : txn.transferAccountId
            ? names.get(txn.transferAccountId) ?? txn.transferAccountId
            : ''
        ),
        csvCell(txn.tags.join('; ')),
        csvCell(txn.notes ?? ''),
      ].join(',')
    );
  return [TRANSACTIONS_CSV_HEADER.join(','), ...rows].join('\n') + '\n';
};
