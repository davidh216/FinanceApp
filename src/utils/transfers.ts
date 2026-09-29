// src/utils/transfers.ts
import { Account, Transaction } from '../types/financial';
import { isTransfer } from './cashflow';

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
        .filter((txn) => !isTransfer(txn))
        .map((txn) => ({ account, txn }))
    );
  const used = new Set<string>();
  const matches: TransferMatch[] = [];

  for (const txn of incoming) {
    if (isTransfer(txn) || txn.amount === 0) continue;
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
  transferAccountId: otherAccountId,
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
