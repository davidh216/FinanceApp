// src/utils/accountSettings.ts
import { Account, AccountType } from '../types/financial';
import { LIABILITY_ACCOUNT_TYPES } from './csvImport';

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CREDIT', label: 'Credit card' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'BUSINESS_CHECKING', label: 'Business checking' },
  { value: 'BUSINESS_SAVINGS', label: 'Business savings' },
  { value: 'BUSINESS_CREDIT', label: 'Business credit card' },
];

export const isLiabilityType = (type: AccountType): boolean =>
  LIABILITY_ACCOUNT_TYPES.includes(type);

// Closed accounts drop out of account lists and pickers; their history
// still counts everywhere.
export const isClosed = (account: Account): boolean =>
  account.isActive === false;

export interface AccountSettings {
  name: string;
  type: AccountType;
  closed: boolean;
}

// The balance an account would have as `type`: debts are stored as negative
// balances, so moving between a debt and anything else flips its sign. A
// card imported as checking then counts as money owed.
export const balanceForType = (account: Account, type: AccountType): number =>
  isLiabilityType(type) === isLiabilityType(account.type)
    ? account.balance
    : isLiabilityType(type)
    ? -Math.abs(account.balance)
    : Math.abs(account.balance);

export const applyAccountSettings = (
  account: Account,
  settings: AccountSettings,
  now: Date = new Date()
): Account => ({
  ...account,
  name: settings.name.trim() || account.name,
  type: settings.type,
  balance: balanceForType(account, settings.type),
  isActive: !settings.closed,
  updatedAt: now.toISOString(),
});
