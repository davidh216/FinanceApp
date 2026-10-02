// src/utils/transfers.ts
import { Account, Transaction } from '../types/financial';
import { isCashflow, isTransfer } from './cashflow';
import { categorizeMerchant, isImportedAccount } from './csvImport';

// The other side of a transfer to or from an account that isn't in the app,
// such as a friend's bank account or a card you haven't imported.
export const EXTERNAL_ACCOUNT_ID = 'external';

// Payments between accounts post a few days apart (a card payment leaves
// checking on the 3rd and reaches the card on the 5th).
export const TRANSFER_MATCH_DAYS = 5;

// At least one side of a transfer is described as a payment or transfer.
// Requiring this keeps an unrelated $50 purchase and $50 refund apart.
const TRANSFER_DESCRIPTION =
  /\b(PAYMENTS?|PMT|AUTO ?PAY|AUTOMATIC PAYMENT|E-?PAYMENT|EPAY|TRANSFERS?|XFER|TFR)\b/i;

export const looksLikeTransfer = (description: string): boolean =>
  TRANSFER_DESCRIPTION.test(description);

const dayNumber = (date: string): number => {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
};

const cents = (amount: number) => Math.round(amount * 100);

export interface TransferMatch {
  // A transaction being imported...
  transactionId: string;
  // ...and the transaction in another account it pairs with.
  otherAccountId: string;
  otherTransactionId: string;
}

// Pairs incoming transactions with opposite transactions in other accounts:
// equal and opposite amounts, dates within TRANSFER_MATCH_DAYS, and at least
// one side described as a payment or transfer. Each transaction is matched at
// most once, to the closest date.
export const findTransferMatches = (
  incoming: Transaction[],
  accountId: string,
  otherAccounts: Account[]
): TransferMatch[] => {
  const candidates = otherAccounts
    .filter((account) => account.id !== accountId)
    .flatMap((account) =>
      (account.transactions || [])
        .filter((txn) => isCashflow(txn) && !txn.notTransfer)
        .map((txn) => ({ account, txn }))
    );
  const used = new Set<string>();
  const matches: TransferMatch[] = [];

  for (const txn of incoming) {
    if (!isCashflow(txn) || txn.notTransfer || txn.amount === 0) continue;
    let best: { account: Account; txn: Transaction; gap: number } | null = null;
    for (const candidate of candidates) {
      const key = `${candidate.account.id}:${candidate.txn.id}`;
      const gap = Math.abs(dayNumber(candidate.txn.date) - dayNumber(txn.date));
      if (
        used.has(key) ||
        cents(candidate.txn.amount) !== -cents(txn.amount) ||
        gap > TRANSFER_MATCH_DAYS ||
        !(
          looksLikeTransfer(txn.description) ||
          looksLikeTransfer(candidate.txn.description)
        )
      ) {
        continue;
      }
      if (!best || gap < best.gap) best = { ...candidate, gap };
    }
    if (best) {
      used.add(`${best.account.id}:${best.txn.id}`);
      matches.push({
        transactionId: txn.id,
        otherAccountId: best.account.id,
        otherTransactionId: best.txn.id,
      });
    }
  }

  return matches;
};

const asTransfer = (txn: Transaction, otherAccountId: string): Transaction => ({
  ...txn,
  notTransfer: undefined,
  transferAccountId: otherAccountId,
  // A transfer is neither income nor spending, so it has no parts.
  splits: undefined,
  category: 'Transfer',
  cleanMerchant: { ...txn.cleanMerchant, suggestedCategory: 'Transfer' },
});

// Marks both sides of each match as a transfer (and categorises them as
// one, replacing a guess like "Income" for a card payment). Returns the
// incoming transactions and any other accounts that changed.
export const linkTransfers = (
  incoming: Transaction[],
  accountId: string,
  otherAccounts: Account[],
  matches: TransferMatch[]
): { transactions: Transaction[]; changedAccounts: Account[] } => {
  const byTransaction = new Map(matches.map((m) => [m.transactionId, m]));
  const transactions = incoming.map((txn) => {
    const match = byTransaction.get(txn.id);
    return match ? asTransfer(txn, match.otherAccountId) : txn;
  });

  const changedAccounts = otherAccounts
    .filter((account) => matches.some((m) => m.otherAccountId === account.id))
    .map((account) => {
      const linked = new Set(
        matches
          .filter((m) => m.otherAccountId === account.id)
          .map((m) => m.otherTransactionId)
      );
      return {
        ...account,
        transactions: (account.transactions || []).map((txn) =>
          linked.has(txn.id) ? asTransfer(txn, accountId) : txn
        ),
      };
    });

  return { transactions, changedAccounts };
};

// The transaction in `other` that pairs with `txn`: the opposite amount,
// linked back to txn's account (or, when `linked` is false, not a transfer
// yet and within TRANSFER_MATCH_DAYS), with the closest date.
const findCounterpart = (
  txn: Transaction,
  accountId: string,
  other: Account,
  linked: boolean
): Transaction | undefined => {
  let best: { txn: Transaction; gap: number } | undefined;
  for (const candidate of other.transactions || []) {
    const gap = Math.abs(dayNumber(candidate.date) - dayNumber(txn.date));
    const pairs = linked
      ? candidate.transferAccountId === accountId
      : isCashflow(candidate) && gap <= TRANSFER_MATCH_DAYS;
    if (!pairs || cents(candidate.amount) !== -cents(txn.amount)) continue;
    if (!best || gap < best.gap) best = { txn: candidate, gap };
  }
  return best?.txn;
};

const updateTransaction = (
  account: Account,
  id: string,
  update: (txn: Transaction) => Transaction
): Account => ({
  ...account,
  transactions: (account.transactions || []).map((txn) =>
    txn.id === id ? update(txn) : txn
  ),
});

const findTransaction = (accounts: Account[], transactionId: string) => {
  for (const account of accounts) {
    const txn = (account.transactions || []).find(
      (t) => t.id === transactionId
    );
    if (txn) return { account, txn };
  }
  return undefined;
};

// Back to ordinary income or spending, categorised from the description
// again, and never matched automatically after this.
const asNotTransfer = (txn: Transaction): Transaction => {
  const { suggestedCategory } = categorizeMerchant(txn.description, txn.amount);
  return {
    ...txn,
    transferAccountId: undefined,
    notTransfer: true,
    category: suggestedCategory,
    cleanMerchant: { ...txn.cleanMerchant, suggestedCategory },
  };
};

// Undoes a transfer, on both sides when the other side is in another
// imported account. Returns the accounts that changed.
export const unlinkTransfer = (
  accounts: Account[],
  transactionId: string
): Account[] => {
  const found = findTransaction(accounts, transactionId);
  if (!found || !isTransfer(found.txn)) return [];
  const { account, txn } = found;
  const changed = [updateTransaction(account, txn.id, asNotTransfer)];
  const other = accounts.find(
    (a) =>
      a.id === txn.transferAccountId &&
      a.id !== account.id &&
      isImportedAccount(a)
  );
  const counterpart = other && findCounterpart(txn, account.id, other, true);
  if (other && counterpart) {
    changed.push(updateTransaction(other, counterpart.id, asNotTransfer));
  }
  return changed;
};

// Records a transaction as a transfer to or from `otherAccountId` (another
// imported account, or EXTERNAL_ACCOUNT_ID). When that account has the
// matching opposite transaction, both sides are linked. Returns the
// accounts that changed.
export const markAsTransfer = (
  accounts: Account[],
  transactionId: string,
  otherAccountId: string
): Account[] => {
  const found = findTransaction(accounts, transactionId);
  if (!found || otherAccountId === found.account.id) return [];
  const { account, txn } = found;
  const other = accounts.find((a) => a.id === otherAccountId);
  if (!other && otherAccountId !== EXTERNAL_ACCOUNT_ID) return [];
  const changed = [
    updateTransaction(account, txn.id, (t) => asTransfer(t, otherAccountId)),
  ];
  const counterpart = other && findCounterpart(txn, account.id, other, false);
  if (other && counterpart) {
    changed.push(
      updateTransaction(other, counterpart.id, (t) => asTransfer(t, account.id))
    );
  }
  return changed;
};
