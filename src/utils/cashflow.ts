// src/utils/cashflow.ts
import { Transaction } from '../types/financial';

// Money moving between the user's own accounts (like a loan payment from
// checking) is neither income nor spending.
export const isTransfer = (txn: Transaction): boolean =>
  txn.transferAccountId !== undefined;

export const incomeOf = (transactions: Transaction[]): number =>
  transactions
    .filter((txn) => !isTransfer(txn) && txn.amount > 0)
    .reduce((sum, txn) => sum + txn.amount, 0);

// Returned as a positive number.
export const spendingOf = (transactions: Transaction[]): number =>
  Math.abs(
    transactions
      .filter((txn) => !isTransfer(txn) && txn.amount < 0)
      .reduce((sum, txn) => sum + txn.amount, 0)
  );

// Net money moved in (positive) or out (negative) by transfers.
export const transfersOf = (transactions: Transaction[]): number =>
  transactions.filter(isTransfer).reduce((sum, txn) => sum + txn.amount, 0);
