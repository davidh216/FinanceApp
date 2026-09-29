// src/utils/balances.ts
import { Account, Transaction } from '../types/financial';
import { isImportedAccount } from './csvImport';

// How a transaction changed its account's balance. Amounts are normally
// recorded as their effect on the account, as in bank exports. The built-in
// demo loan accounts are the exception: they record each payment as money
// going out (a negative amount), though a payment reduces what is owed and
// moves the negative loan balance towards zero.
export const balanceEffect = (account: Account, txn: Transaction): number =>
  account.type === 'LOAN' && !isImportedAccount(account)
    ? -txn.amount
    : txn.amount;

// The account's balance at the end of `date` ("YYYY-MM-DD"): today's balance
// with every later transaction undone. Dates are compared as strings, so no
// timezone conversion is involved.
export const balanceAsOf = (account: Account, date: string): number => {
  const later = (account.transactions || []).filter((txn) => txn.date > date);
  const undone = later.reduce(
    (sum, txn) => sum + balanceEffect(account, txn),
    0
  );
  return Math.round((account.balance - undone) * 100) / 100;
};

export const totalBalanceAsOf = (accounts: Account[], date: string): number =>
  Math.round(
    accounts.reduce((sum, account) => sum + balanceAsOf(account, date), 0) * 100
  ) / 100;
