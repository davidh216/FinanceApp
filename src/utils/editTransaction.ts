// src/utils/editTransaction.ts
import { Account } from '../types/financial';
import { categorizeMerchant } from './csvImport';

const round = (value: number) => Math.round(value * 100) / 100;

export interface TransactionEdit {
  // The name shown for the transaction. Blank uses the description's.
  name: string;
  // Blank removes the note.
  notes: string;
  // Only transactions you added by hand can change these: an imported
  // transaction is what your bank reported.
  date?: string;
  description?: string;
  // Signed: negative for money out.
  amount?: number;
}

// The account with one transaction edited. A new amount moves the account's
// balance by the difference, as adding or deleting the transaction would.
export const editTransaction = (
  account: Account,
  transactionId: string,
  edit: TransactionEdit,
  now: Date = new Date()
): Account => {
  const txn = (account.transactions || []).find((t) => t.id === transactionId);
  if (!txn) return account;

  const manual = txn.manual === true;
  const date = manual && edit.date ? edit.date : txn.date;
  const description =
    manual && edit.description?.trim()
      ? edit.description.trim()
      : txn.description;
  const amount =
    manual && edit.amount !== undefined && edit.amount !== 0
      ? round(edit.amount)
      : txn.amount;
  const name =
    edit.name.trim().replace(/\s+/g, ' ') ||
    categorizeMerchant(description, amount).cleanName;
  const notes = edit.notes.trim();

  const { notes: _oldNotes, ...rest } = txn;
  const edited = {
    ...rest,
    date,
    description,
    amount,
    cleanMerchant: {
      ...txn.cleanMerchant,
      cleanName: name,
      ...(manual ? { original: description } : {}),
    },
    ...(notes ? { notes } : {}),
    updatedAt: now.toISOString(),
  };

  return {
    ...account,
    balance: round(account.balance + amount - txn.amount),
    transactions: (account.transactions || [])
      .map((t) => (t.id === transactionId ? edited : t))
      .sort((a, b) => b.date.localeCompare(a.date)),
    updatedAt: now.toISOString(),
  };
};
