// src/utils/categoryRules.ts
import { MerchantInfo, Transaction } from '../types/financial';
import { TAG_CATEGORIES } from '../constants/financial';
import { isCashflow } from './cashflow';
import { isSplit } from './splits';

// The category you chose for a merchant, keyed by merchantKey, and keyword
// rules ("description contains AMZN"), keyed KEYWORD_PREFIX + the keyword
// in lower case. Both live in one map so they're stored and backed up
// together.
export type CategoryRules = Record<string, string>;

export const KEYWORD_PREFIX = 'contains:';

export const keywordRuleKey = (keyword: string): string =>
  KEYWORD_PREFIX + keyword.trim().replace(/\s+/g, ' ').toLowerCase();

export const isKeywordRule = (key: string): boolean =>
  key.startsWith(KEYWORD_PREFIX);

export const keywordOf = (key: string): string =>
  key.slice(KEYWORD_PREFIX.length);

// Keyword rules, longest keyword first: the most specific wins.
export const keywordRules = (
  rules: CategoryRules
): { key: string; keyword: string; category: string }[] =>
  Object.entries(rules)
    .filter(([key]) => isKeywordRule(key))
    .map(([key, category]) => ({ key, keyword: keywordOf(key), category }))
    .filter((rule) => rule.keyword !== '')
    .sort(
      (a, b) =>
        b.keyword.length - a.keyword.length ||
        a.keyword.localeCompare(b.keyword)
    );

export const matchesKeyword = (
  txn: { description: string; cleanMerchant: MerchantInfo },
  keyword: string
): boolean =>
  `${txn.description} ${txn.cleanMerchant.cleanName}`
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .includes(keyword);

// The category your rules give a transaction: a merchant's remembered
// category first, then the most specific keyword it contains.
export const ruleCategory = (
  txn: { description: string; cleanMerchant: MerchantInfo },
  rules: CategoryRules
): string | undefined =>
  rules[merchantKey(txn.cleanMerchant)] ??
  keywordRules(rules).find((rule) => matchesKeyword(txn, rule.keyword))
    ?.category;

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
  const category = ruleCategory(txn, rules);
  // A split is a choice you made for that one transaction.
  if (
    !category ||
    !isCashflow(txn) ||
    isSplit(txn) ||
    category === txn.category
  ) {
    return txn;
  }
  return {
    ...txn,
    category,
    cleanMerchant: { ...txn.cleanMerchant, suggestedCategory: category },
  };
};

// Keeps rules that name a known category: a built-in one or one of
// `customNames`. Used for saved rules and backups, which may be hand-edited.
export const cleanCategoryRules = (
  value: unknown,
  customNames: string[] = []
): CategoryRules => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  const rules: CategoryRules = {};
  for (const [key, category] of Object.entries(value)) {
    if (
      key.trim() !== '' &&
      typeof category === 'string' &&
      (Object.prototype.hasOwnProperty.call(TAG_CATEGORIES, category) ||
        customNames.includes(category))
    ) {
      rules[key] = category;
    }
  }
  return rules;
};
