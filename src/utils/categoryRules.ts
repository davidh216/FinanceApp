// src/utils/categoryRules.ts
import { MerchantInfo, Transaction } from '../types/financial';
import { TAG_CATEGORIES } from '../constants/financial';
import { isCashflow } from './cashflow';

// The category you chose for a merchant, keyed by merchantKey.
export type CategoryRules = Record<string, string>;

// Transactions from the same merchant share a clean name ("Starbucks" for
// "STARBUCKS STORE 1234" and "STARBUCKS #88"), so rules key on that.
export const merchantKey = (merchant: MerchantInfo): string =>
  merchant.cleanName.trim().replace(/\s+/g, ' ').toLowerCase();

export const isSameMerchant = (a: Transaction, b: Transaction): boolean =>
  merchantKey(a.cleanMerchant) === merchantKey(b.cleanMerchant);

// Gives a transaction its merchant's remembered category. Transfers keep
// theirs: a rule is about spending, not money moving between accounts.
export const applyCategoryRule = (
  txn: Transaction,
  rules: CategoryRules
): Transaction => {
  const category = rules[merchantKey(txn.cleanMerchant)];
  if (!category || !isCashflow(txn) || category === txn.category) return txn;
  return {
    ...txn,
    category,
    cleanMerchant: { ...txn.cleanMerchant, suggestedCategory: category },
  };
};

// Keeps rules that name a known category. Used for saved rules and
// backups, which may be hand-edited.
export const cleanCategoryRules = (value: unknown): CategoryRules => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  const rules: CategoryRules = {};
  for (const [key, category] of Object.entries(value)) {
    if (
      key.trim() !== '' &&
      typeof category === 'string' &&
      Object.prototype.hasOwnProperty.call(TAG_CATEGORIES, category)
    ) {
      rules[key] = category;
    }
  }
  return rules;
};
