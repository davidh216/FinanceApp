// src/utils/balances.ts
import { Account } from '../types/financial';

// The account's balance at the end of `date` ("YYYY-MM-DD"): today's balance
// with every later transaction undone. Amounts are recorded as their effect
// on the account, so a loan payment received is positive and moves the
// negative loan balance towards zero, like a credit card payment. Dates are
// compared as strings, so no timezone conversion is involved.
export const balanceAsOf = (account: Account, date: string): number => {
  const later = (account.transactions || []).filter((txn) => txn.date > date);
  const undone = later.reduce((sum, txn) => sum + txn.amount, 0);
  return Math.round((account.balance - undone) * 100) / 100;
};

export const totalBalanceAsOf = (accounts: Account[], date: string): number =>
  Math.round(
    accounts.reduce((sum, account) => sum + balanceAsOf(account, date), 0) * 100
  ) / 100;
