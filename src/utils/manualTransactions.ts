// src/utils/manualTransactions.ts
import { Account, Transaction } from '../types/financial';
import { categorizeMerchant, parseAmount } from './csvImport';
import { CategoryRules, merchantKey } from './categoryRules';

const round = (value: number) => Math.round(value * 100) / 100;

// A positive amount typed by hand ("12.50", "$1,200"), or null. The sign
// comes from choosing money in or out, not from the number.
export const parseManualAmount = (raw: string): number | null => {
  const amount = parseAmount(raw);
  return amount !== null && amount > 0 ? amount : null;
};

// The category a description suggests: a remembered choice for the
// merchant, otherwise the usual guess.
export const suggestCategory = (
  description: string,
  amount: number,
  rules: CategoryRules
): string => {
  const merchant = categorizeMerchant(description.trim(), amount);
  return rules[merchantKey(merchant)] ?? merchant.suggestedCategory;
};

let sequence = 0;

export const createManualTransaction = (
  details: {
    accountId: string;
    date: string;
    description: string;
    // Signed: negative for money out.
    amount: number;
    category: string;
  },
  now: Date = new Date()
): Transaction => {
  const description = details.description.trim();
  const merchant = categorizeMerchant(description, details.amount);
  sequence += 1;
  return {
    id: `txn_${details.accountId}_manual_${now
      .getTime()
      .toString(36)}_${sequence}`,
    accountId: details.accountId,
    description,
    amount: round(details.amount),
    date: details.date,
    category: details.category,
    tags: [],
    pending: false,
    cleanMerchant: { ...merchant, suggestedCategory: details.category },
    manual: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
};

// The account with `txn` added, newest first, and its balance moved by the
// transaction's amount, as an import would.
export const addTransaction = (
  account: Account,
  txn: Transaction
): Account => ({
  ...account,
  balance: round(account.balance + txn.amount),
  transactions: [...(account.transactions || []), txn].sort((a, b) =>
    b.date.localeCompare(a.date)
  ),
  updatedAt: new Date().toISOString(),
});

// The reverse of addTransaction.
export const removeTransaction = (
  account: Account,
  transactionId: string
): Account => {
  const txn = (account.transactions || []).find((t) => t.id === transactionId);
  if (!txn) return account;
  return {
    ...account,
    balance: round(account.balance - txn.amount),
    transactions: (account.transactions || []).filter(
      (t) => t.id !== transactionId
    ),
    updatedAt: new Date().toISOString(),
  };
};
