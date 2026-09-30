// src/types/financial.ts
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bank {
  id: string;
  name: string;
  fullName: string;
  logo: string;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  accountNumber: string;
  bankName: string;
  limit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  transactions?: Transaction[];
  // Remembered between CSV imports into the same account.
  importSettings?: {
    flipSigns: boolean;
  };
}

export type AccountType =
  | 'CHECKING'
  | 'SAVINGS'
  | 'CREDIT'
  | 'BUSINESS_CHECKING'
  | 'BUSINESS_SAVINGS'
  | 'BUSINESS_CREDIT'
  | 'INVESTMENT'
  | 'LOAN';

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  tags: string[];
  pending: boolean;
  cleanMerchant: MerchantInfo;
  // Set on both halves of a transfer between the user's own accounts (such
  // as a loan payment from checking): the other account's id. Transfers are
  // neither income nor spending.
  transferAccountId?: string;
  // Set when the user unlinked a transfer: automatic matching leaves this
  // transaction alone from then on.
  notTransfer?: boolean;
  // Entered by hand rather than imported; these can be deleted.
  manual?: boolean;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantInfo {
  cleanName: string;
  logo: string;
  suggestedCategory: string;
  original: string;
  confidence?: number;
}

export interface TagCategory {
  name: string;
  color: string;
  icon: string;
  parentCategory?: string;
  isSystemTag: boolean;
}

export interface FinancialTrend {
  period: string;
  income: number;
  spending: number;
  balance: number;
  netFlow: number;
  transactionCount: number;
}

export interface KPIData {
  title: string;
  value: number;
  change: number;
  isPositive: boolean;
  trendData: number[];
  period: TimePeriod;
}

export type TimePeriod =
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | '5year'
  | 'custom';

export interface CustomDateRange {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  label: string;
}

export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  categories?: string[];
  tags?: string[];
  accountIds?: string[];
  transactionTypes?: ('income' | 'expense')[];
  status?: ('pending' | 'cleared')[];
  searchTerm?: string;
}

export interface SortOption {
  field: 'date' | 'amount' | 'description' | 'category';
  direction: 'asc' | 'desc';
}

export interface FinancialState {
  accounts: Account[];
  transactions: Transaction[];
  selectedAccount: Account | null;
  currentScreen: 'dashboard' | 'accounts' | 'transactions' | 'account-detail';
  selectedPeriod: TimePeriod;
  customDateRange?: CustomDateRange;
  isLoading: boolean;
  error: string | null;
  filters: FilterOptions;
  sortBy: string;
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netWorth: number;
  debtToIncomeRatio: number;
  savingsRate: number;
  // Add comparison data for trends
  previousPeriodIncome?: number;
  previousPeriodExpenses?: number;
  // Total balance at the end of the previous period, and that date
  // ("YYYY-MM-DD"), reconstructed from transactions.
  previousPeriodBalance?: number;
  previousPeriodEndDate?: string;
  // "YYYY-MM-DD" bounds of the selected period and the one before it.
  periodStartDate?: string;
  periodEndDate?: string;
  previousPeriodStartDate?: string;
  periodLabel?: string;
}

export interface BudgetGoal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  period: TimePeriod;
  isActive: boolean;
}

export type FinancialAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SELECT_ACCOUNT'; payload: Account | null }
  | {
      type: 'CHANGE_SCREEN';
      payload: 'dashboard' | 'accounts' | 'transactions' | 'account-detail';
    }
  | { type: 'CHANGE_PERIOD'; payload: TimePeriod }
  | { type: 'SET_CUSTOM_DATE_RANGE'; payload: CustomDateRange }
  | { type: 'ADD_TAG'; payload: { transactionId: string; tag: string } }
  | { type: 'REMOVE_TAG'; payload: { transactionId: string; tag: string } }
  | {
      type: 'SET_CATEGORY';
      payload: { transactionId: string; category: string };
    }
  // Every non-transfer transaction from a merchant (by merchantKey).
  | {
      type: 'SET_MERCHANT_CATEGORY';
      payload: { merchantKey: string; category: string };
    }
  | { type: 'CONNECT_ACCOUNT'; payload: Account }
  | { type: 'REMOVE_ACCOUNT'; payload: string }
  | { type: 'REPLACE_ACCOUNT'; payload: Account }
  // Replaces every imported account with these (restoring a backup).
  | { type: 'RESTORE_IMPORTED_ACCOUNTS'; payload: Account[] }
  | { type: 'APPLY_FILTERS'; payload: FilterOptions }
  | { type: 'VIEW_ACCOUNT_DETAIL'; payload: Account };

export class FinancialError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'FinancialError';
  }
}

export type ErrorCode =
  | 'BANK_CONNECTION_FAILED'
  | 'INVALID_CREDENTIALS'
  | 'TRANSACTION_SYNC_ERROR'
  | 'ACCOUNT_NOT_FOUND'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';
