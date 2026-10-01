import { Transaction } from '../../types/financial';
import {
  NO_FILTERS,
  filterTransactions,
  hasFilters,
} from '../transactionFilters';

const txn = (
  id: string,
  overrides: Partial<Transaction> & { merchant?: string }
): Transaction => ({
  id,
  accountId: 'chk',
  description: overrides.description ?? id.toUpperCase(),
  amount: -10,
  date: '2025-06-10',
  category: 'Other',
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: overrides.merchant ?? id,
    logo: '',
    suggestedCategory: 'Other',
    original: '',
  },
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const TXNS = [
  txn('coffee', {
    merchant: 'Starbucks',
    description: 'STARBUCKS STORE 1234',
    category: 'Food & Dining',
    date: '2025-06-01',
    notes: 'Meeting with Sam',
  }),
  txn('groceries', {
    merchant: 'Whole Foods',
    category: 'Groceries',
    tags: ['Weekly shop'],
    date: '2025-06-15',
    accountId: 'card',
  }),
  txn('payment', {
    merchant: 'Payment',
    category: 'Transfer',
    transferAccountId: 'card',
    amount: -500,
    date: '2025-06-20',
  }),
];

const ids = (filters: Partial<typeof NO_FILTERS>) =>
  filterTransactions(TXNS, { ...NO_FILTERS, ...filters }).map((t) => t.id);

describe('filterTransactions', () => {
  it('returns everything without filters', () => {
    expect(ids({})).toEqual(['coffee', 'groceries', 'payment']);
    expect(hasFilters(NO_FILTERS)).toBe(false);
  });

  it('searches merchant, description, category, tags and notes, ignoring case', () => {
    expect(ids({ search: 'starbucks' })).toEqual(['coffee']);
    expect(ids({ search: 'store 1234' })).toEqual(['coffee']);
    expect(ids({ search: 'GROCERIES' })).toEqual(['groceries']);
    expect(ids({ search: 'weekly' })).toEqual(['groceries']);
    expect(ids({ search: 'with sam' })).toEqual(['coffee']);
    expect(ids({ search: '  ' })).toHaveLength(3);
  });

  it('filters by account and category, with transfers on their own', () => {
    expect(ids({ accountId: 'card' })).toEqual(['groceries']);
    expect(ids({ category: 'Food & Dining' })).toEqual(['coffee']);
    expect(ids({ category: 'Transfer' })).toEqual(['payment']);
  });

  it('filters by date, including both ends', () => {
    expect(ids({ from: '2025-06-15' })).toEqual(['groceries', 'payment']);
    expect(ids({ to: '2025-06-15' })).toEqual(['coffee', 'groceries']);
    expect(ids({ from: '2025-06-02', to: '2025-06-15' })).toEqual([
      'groceries',
    ]);
    expect(hasFilters({ ...NO_FILTERS, from: '2025-06-02' })).toBe(true);
  });
});
