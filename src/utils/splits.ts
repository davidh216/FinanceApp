// src/utils/splits.ts
// Splitting one transaction between categories.
import { Account, Transaction, TransactionSplit } from '../types/financial';
import { isCashflow } from './cashflow';

const toCents = (value: number) => Math.round(value * 100);

// The categories a transaction's money goes to: its parts when it's split,
// else the whole amount in its one category.
export const categoryParts = (txn: Transaction): TransactionSplit[] =>
  txn.splits && txn.splits.length > 1 && isCashflow(txn)
    ? txn.splits
    : [{ category: txn.category, amount: txn.amount }];

export const isSplit = (txn: Transaction): boolean =>
  categoryParts(txn).length > 1;

// Whether any of the transaction's money is in `category`.
export const hasCategory = (txn: Transaction, category: string): boolean =>
  categoryParts(txn).some((part) => part.category === category);

// Why these parts can't split a transaction of `amount`, or null when they
// can. Part amounts are signed like the transaction's.
export const splitError = (
  amount: number,
  parts: TransactionSplit[]
): string | null => {
  if (parts.length < 2) return 'Split it into at least two parts.';
  if (parts.some((part) => !part.category)) {
    return 'Choose a category for each part.';
  }
  if (new Set(parts.map((part) => part.category)).size !== parts.length) {
    return 'Use each category once.';
  }
  if (
    parts.some(
      (part) =>
        !Number.isFinite(part.amount) ||
        toCents(part.amount) === 0 ||
        Math.sign(part.amount) !== Math.sign(amount)
    )
  ) {
    return 'Give each part an amount.';
  }
  const left =
    toCents(amount) - parts.reduce((s, p) => s + toCents(p.amount), 0);
  if (left !== 0) {
    return `The parts need to add up to the total: ${(
      Math.abs(left) / 100
    ).toFixed(2)} ${
      left * Math.sign(amount) > 0 ? 'left to assign' : 'too much'
    }.`;
  }
  return null;
};

const largest = (parts: TransactionSplit[]) =>
  parts.reduce((best, part) =>
    Math.abs(part.amount) > Math.abs(best.amount) ? part : best
  );

// The transaction split into `parts`, or back to one category (the largest
// part's) with null. Parts that don't fit are ignored.
export const withSplits = (
  txn: Transaction,
  parts: TransactionSplit[] | null
): Transaction => {
  const { splits: old, ...rest } = txn;
  if (parts === null || !isCashflow(txn)) {
    const category =
      old && old.length > 0 ? largest(old).category : txn.category;
    return { ...rest, category };
  }
  if (splitError(txn.amount, parts) !== null) return txn;
  const splits = parts.map((part) => ({
    category: part.category,
    amount: toCents(part.amount) / 100,
  }));
  return { ...rest, category: largest(splits).category, splits };
};

// The account with one transaction split (or unsplit).
export const splitTransaction = (
  account: Account,
  transactionId: string,
  parts: TransactionSplit[] | null,
  now: Date = new Date()
): Account => ({
  ...account,
  transactions: (account.transactions || []).map((txn) =>
    txn.id === transactionId
      ? { ...withSplits(txn, parts), updatedAt: now.toISOString() }
      : txn
  ),
  updatedAt: now.toISOString(),
});

// Moves money in `from` to `to`, in the category and in any part. Parts
// that end up in the same category are joined, and a split left with one
// part isn't a split any more.
export const replaceCategory = (
  txn: Transaction,
  from: string,
  to: string
): Transaction => {
  if (!hasCategory(txn, from)) return txn;
  if (!isSplit(txn)) {
    return {
      ...txn,
      category: to,
      cleanMerchant: { ...txn.cleanMerchant, suggestedCategory: to },
    };
  }
  const totals = new Map<string, number>();
  for (const part of txn.splits!) {
    const category = part.category === from ? to : part.category;
    totals.set(category, (totals.get(category) || 0) + toCents(part.amount));
  }
  const parts = Array.from(totals, ([category, cents]) => ({
    category,
    amount: cents / 100,
  }));
  const { splits: _old, ...rest } = txn;
  return parts.length > 1
    ? { ...rest, category: largest(parts).category, splits: parts }
    : { ...rest, category: parts[0].category };
};

// Reads parts from a backup, which may be hand-edited: kept only when they
// split the amount exactly.
export const cleanSplits = (
  value: unknown,
  amount: number
): TransactionSplit[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const parts = value
    .filter(
      (part): part is TransactionSplit =>
        typeof part === 'object' &&
        part !== null &&
        typeof part.category === 'string' &&
        typeof part.amount === 'number'
    )
    .map((part) => ({ category: part.category, amount: part.amount }));
  return parts.length === value.length && splitError(amount, parts) === null
    ? parts
    : undefined;
};

// "Groceries 80.00, Household 20.00" for exports.
export const describeSplits = (txn: Transaction): string =>
  categoryParts(txn)
    .map((part) => `${part.category} ${Math.abs(part.amount).toFixed(2)}`)
    .join(', ');
