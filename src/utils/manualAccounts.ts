// src/utils/manualAccounts.ts
// Accounts you enter by hand (a house, a car, investments, cash, a private
// loan) and balance updates, for those and any imported account.
import { Account, AccountType, Transaction } from '../types/financial';
import { IMPORTED_ACCOUNT_PREFIX } from './csvImport';
import { balanceAsOf } from './balances';
import { addTransaction } from './manualTransactions';

const round = (value: number) => Math.round(value * 100) / 100;

export interface ManualAccountKind {
  key: string;
  label: string;
  icon: string;
  type: AccountType;
  // Something you owe: its balance is stored as a negative number.
  owed: boolean;
}

export const MANUAL_ACCOUNT_KINDS: ManualAccountKind[] = [
  {
    key: 'property',
    label: 'Property',
    icon: '🏠',
    type: 'INVESTMENT',
    owed: false,
  },
  {
    key: 'vehicle',
    label: 'Vehicle',
    icon: '🚗',
    type: 'INVESTMENT',
    owed: false,
  },
  {
    key: 'investments',
    label: 'Investments',
    icon: '📈',
    type: 'INVESTMENT',
    owed: false,
  },
  { key: 'cash', label: 'Cash', icon: '💵', type: 'CHECKING', owed: false },
  {
    key: 'other-asset',
    label: 'Something else you own',
    icon: '💼',
    type: 'INVESTMENT',
    owed: false,
  },
  { key: 'loan', label: 'Loan', icon: '🏦', type: 'LOAN', owed: true },
  {
    key: 'credit-card',
    label: 'Credit card',
    icon: '💳',
    type: 'CREDIT',
    owed: true,
  },
  {
    key: 'other-debt',
    label: 'Something else you owe',
    icon: '🧾',
    type: 'LOAN',
    owed: true,
  },
];

let sequence = 0;
const uniqueSuffix = (now: Date) => {
  sequence += 1;
  return `${now.getTime().toString(36)}_${sequence}`;
};

// `amount` is what it's worth, or what you owe, as a positive number.
export const createManualAccount = (
  details: { name: string; kind: ManualAccountKind; amount: number },
  now: Date = new Date()
): Account => ({
  id: `${IMPORTED_ACCOUNT_PREFIX}manual_${uniqueSuffix(now)}`,
  name: details.name.trim(),
  type: details.kind.type,
  balance: round(details.kind.owed ? -details.amount : details.amount),
  accountNumber: 'Entered by hand',
  bankName: `${details.kind.icon} ${details.kind.label}`,
  isActive: true,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  transactions: [],
  manual: true,
});

export const BALANCE_UPDATE_NAME = 'Balance update';

// The account with its balance at the end of `date` set to `target`. The
// difference is recorded as a balance-update transaction on that date, so
// later transactions stay as they were and the history before it doesn't
// change. Unchanged when the balance is already `target`.
export const updateBalance = (
  account: Account,
  target: number,
  date: string,
  now: Date = new Date()
): Account => {
  const difference = round(target - balanceAsOf(account, date));
  if (difference === 0) return account;
  const adjustment: Transaction = {
    id: `txn_${account.id}_adjustment_${uniqueSuffix(now)}`,
    accountId: account.id,
    description: BALANCE_UPDATE_NAME,
    amount: difference,
    date,
    category: 'Adjustment',
    tags: [],
    pending: false,
    cleanMerchant: {
      cleanName: BALANCE_UPDATE_NAME,
      logo: '⚖️',
      suggestedCategory: 'Adjustment',
      original: BALANCE_UPDATE_NAME,
    },
    // Can be deleted, like other transactions you add.
    manual: true,
    adjustment: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  return addTransaction(account, adjustment);
};
