// src/utils/transactionFilters.ts
import { Transaction } from '../types/financial';
import { isTransfer } from './cashflow';

export interface TransactionFilters {
  // Matches the merchant, description, category, a tag or the note.
  search: string;
  // '' for every account.
  accountId: string;
  // '' for every category; 'Transfer' for transfers.
  category: string;
  // Inclusive "YYYY-MM-DD" bounds; '' for open-ended.
  from: string;
  to: string;
}

export const NO_FILTERS: TransactionFilters = {
  search: '',
  accountId: '',
  category: '',
  from: '',
  to: '',
};

export const hasFilters = (filters: TransactionFilters): boolean =>
  Object.values(filters).some((value) => value.trim() !== '');

export const filterTransactions = (
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] => {
  const search = filters.search.trim().toLowerCase();
  return transactions.filter((txn) => {
    if (filters.accountId && txn.accountId !== filters.accountId) return false;
    if (filters.category) {
      const matches =
        filters.category === 'Transfer'
          ? isTransfer(txn)
          : !isTransfer(txn) && txn.category === filters.category;
      if (!matches) return false;
    }
    // Dates compare as strings, so there's no timezone conversion.
    if (filters.from && txn.date < filters.from) return false;
    if (filters.to && txn.date > filters.to) return false;
    if (search) {
      const haystack = [
        txn.cleanMerchant.cleanName,
        txn.description,
        txn.category,
        ...txn.tags,
        txn.notes ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
};
