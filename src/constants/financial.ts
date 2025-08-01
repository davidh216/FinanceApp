// src/constants/financial.ts
import {
  TagCategory,
  MerchantInfo,
  Account,
  Transaction,
} from '../types/financial';

export const TAG_CATEGORIES: Record<string, TagCategory> = {
  'Food & Dining': {
    name: 'Food & Dining',
    color: 'bg-green-100 text-green-800',
    icon: '🍔',
    isSystemTag: true,
  },
  Groceries: {
    name: 'Groceries',
    color: 'bg-emerald-100 text-emerald-800',
    icon: '🛒',
    parentCategory: 'Food & Dining',
    isSystemTag: true,
  },
  Transportation: {
    name: 'Transportation',
    color: 'bg-blue-100 text-blue-800',
    icon: '⛽',
    isSystemTag: true,
  },
  Shopping: {
    name: 'Shopping',
    color: 'bg-purple-100 text-purple-800',
    icon: '🛍️',
    isSystemTag: true,
  },
  Entertainment: {
    name: 'Entertainment',
    color: 'bg-pink-100 text-pink-800',
    icon: '🎬',
    isSystemTag: true,
  },
  Utilities: {
    name: 'Utilities',
    color: 'bg-orange-100 text-orange-800',
    icon: '🏠',
    isSystemTag: true,
  },
  Healthcare: {
    name: 'Healthcare',
    color: 'bg-red-100 text-red-800',
    icon: '🏥',
    isSystemTag: true,
  },
  Business: {
    name: 'Business',
    color: 'bg-gray-100 text-gray-800',
    icon: '💼',
    isSystemTag: true,
  },
  Income: {
    name: 'Income',
    color: 'bg-teal-100 text-teal-800',
    icon: '💰',
    isSystemTag: true,
  },
  Travel: {
    name: 'Travel',
    color: 'bg-indigo-100 text-indigo-800',
    icon: '✈️',
    isSystemTag: true,
  },
  Subscriptions: {
    name: 'Subscriptions',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '📱',
    isSystemTag: true,
  },
  Other: {
    name: 'Other',
    color: 'bg-slate-100 text-slate-800',
    icon: '📝',
    isSystemTag: true,
  },
};

export const MERCHANT_PATTERNS: Record<
  string,
  Omit<MerchantInfo, 'original'>
> = {
  AMAZON: {
    cleanName: 'Amazon',
    logo: '📦',
    suggestedCategory: 'Shopping',
    confidence: 0.95,
  },
  EBAY: {
    cleanName: 'eBay',
    logo: '🏷️',
    suggestedCategory: 'Shopping',
    confidence: 0.95,
  },
  ETSY: {
    cleanName: 'Etsy',
    logo: '🎨',
    suggestedCategory: 'Shopping',
    confidence: 0.95,
  },
  STARBUCKS: {
    cleanName: 'Starbucks',
    logo: '☕',
    suggestedCategory: 'Food & Dining',
    confidence: 0.95,
  },
  MCDONALD: {
    cleanName: "McDonald's",
    logo: '🍟',
    suggestedCategory: 'Food & Dining',
    confidence: 0.95,
  },
  SUBWAY: {
    cleanName: 'Subway',
    logo: '🥪',
    suggestedCategory: 'Food & Dining',
    confidence: 0.95,
  },
  CHIPOTLE: {
    cleanName: 'Chipotle',
    logo: '🌯',
    suggestedCategory: 'Food & Dining',
    confidence: 0.95,
  },
  DOORDASH: {
    cleanName: 'DoorDash',
    logo: '🚚',
    suggestedCategory: 'Food & Dining',
    confidence: 0.95,
  },
  'UBER EATS': {
    cleanName: 'Uber Eats',
    logo: '🍽️',
    suggestedCategory: 'Food & Dining',
    confidence: 0.95,
  },
  KROGER: {
    cleanName: 'Kroger',
    logo: '🛒',
    suggestedCategory: 'Groceries',
    confidence: 0.95,
  },
  WALMART: {
    cleanName: 'Walmart',
    logo: '🏪',
    suggestedCategory: 'Groceries',
    confidence: 0.95,
  },
  TARGET: {
    cleanName: 'Target',
    logo: '🎯',
    suggestedCategory: 'Shopping',
    confidence: 0.95,
  },
  COSTCO: {
    cleanName: 'Costco',
    logo: '📦',
    suggestedCategory: 'Groceries',
    confidence: 0.95,
  },
  'WHOLE FOODS': {
    cleanName: 'Whole Foods',
    logo: '🥬',
    suggestedCategory: 'Groceries',
    confidence: 0.95,
  },
  SHELL: {
    cleanName: 'Shell',
    logo: '⛽',
    suggestedCategory: 'Transportation',
    confidence: 0.95,
  },
  EXXON: {
    cleanName: 'ExxonMobil',
    logo: '⛽',
    suggestedCategory: 'Transportation',
    confidence: 0.95,
  },
  BP: {
    cleanName: 'BP',
    logo: '⛽',
    suggestedCategory: 'Transportation',
    confidence: 0.95,
  },
  UBER: {
    cleanName: 'Uber',
    logo: '🚗',
    suggestedCategory: 'Transportation',
    confidence: 0.95,
  },
  LYFT: {
    cleanName: 'Lyft',
    logo: '🚙',
    suggestedCategory: 'Transportation',
    confidence: 0.95,
  },
  NETFLIX: {
    cleanName: 'Netflix',
    logo: '🎬',
    suggestedCategory: 'Subscriptions',
    confidence: 0.95,
  },
  SPOTIFY: {
    cleanName: 'Spotify',
    logo: '🎵',
    suggestedCategory: 'Subscriptions',
    confidence: 0.95,
  },
  APPLE: {
    cleanName: 'Apple',
    logo: '🍎',
    suggestedCategory: 'Subscriptions',
    confidence: 0.9,
  },
  GOOGLE: {
    cleanName: 'Google',
    logo: '🔍',
    suggestedCategory: 'Subscriptions',
    confidence: 0.85,
  },
  MICROSOFT: {
    cleanName: 'Microsoft',
    logo: '💻',
    suggestedCategory: 'Subscriptions',
    confidence: 0.9,
  },
  VERIZON: {
    cleanName: 'Verizon',
    logo: '📱',
    suggestedCategory: 'Utilities',
    confidence: 0.95,
  },
  ATT: {
    cleanName: 'AT&T',
    logo: '📱',
    suggestedCategory: 'Utilities',
    confidence: 0.95,
  },
  COMCAST: {
    cleanName: 'Comcast',
    logo: '📺',
    suggestedCategory: 'Utilities',
    confidence: 0.95,
  },
  CVS: {
    cleanName: 'CVS Pharmacy',
    logo: '💊',
    suggestedCategory: 'Healthcare',
    confidence: 0.95,
  },
  WALGREENS: {
    cleanName: 'Walgreens',
    logo: '💊',
    suggestedCategory: 'Healthcare',
    confidence: 0.95,
  },
  PAYROLL: {
    cleanName: 'Salary',
    logo: '💰',
    suggestedCategory: 'Income',
    confidence: 0.95,
  },
  FREELANCE: {
    cleanName: 'Freelance Payment',
    logo: '💼',
    suggestedCategory: 'Income',
    confidence: 0.9,
  },
  DIVIDEND: {
    cleanName: 'Investment Dividend',
    logo: '📈',
    suggestedCategory: 'Income',
    confidence: 0.95,
  },
  INTEREST: {
    cleanName: 'Interest Payment',
    logo: '🏦',
    suggestedCategory: 'Income',
    confidence: 0.95,
  },
};

// Mock data generator
export const generateMockTransactions = (
  accountId: string,
  count: number = 10
): Transaction[] => {
  const merchants = Object.keys(MERCHANT_PATTERNS);
  const transactions: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    const merchantKey = merchants[Math.floor(Math.random() * merchants.length)];
    const merchantInfo = MERCHANT_PATTERNS[merchantKey];
    const isIncome = Math.random() < 0.2; // 20% chance of income
    const amount = isIncome
      ? Math.random() * 2000 + 1000 // Income: $1000-$3000
      : -(Math.random() * 200 + 10); // Expense: $10-$210

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    transactions.push({
      id: `txn_${accountId}_${i}`,
      accountId,
      description: `${merchantKey} #${Math.floor(Math.random() * 1000)}`,
      amount: Math.round(amount * 100) / 100,
      date: date.toISOString().split('T')[0],
      category: merchantInfo.suggestedCategory,
      tags: Math.random() > 0.5 ? [merchantInfo.suggestedCategory] : [],
      pending: Math.random() < 0.1,
      cleanMerchant: {
        ...merchantInfo,
        original: `${merchantKey} #${Math.floor(Math.random() * 1000)}`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'acc_checking',
    name: 'Primary Checking',
    type: 'CHECKING',
    balance: 2543.67,
    accountNumber: '****1234',
    bankName: 'Chase Bank',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: generateMockTransactions('acc_checking', 15),
  },
  {
    id: 'acc_savings',
    name: 'High Yield Savings',
    type: 'SAVINGS',
    balance: 12750.0,
    accountNumber: '****5678',
    bankName: 'Ally Bank',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: generateMockTransactions('acc_savings', 5),
  },
  {
    id: 'acc_credit',
    name: 'Rewards Credit Card',
    type: 'CREDIT',
    balance: -1247.82,
    accountNumber: '****9012',
    bankName: 'Chase Bank',
    limit: 5000,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: generateMockTransactions('acc_credit', 12),
  },
];

export const DEFAULT_PERIODS = ['month', 'quarter', 'year'] as const;

export const VALIDATION_RULES = {
  ACCOUNT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  TRANSACTION_DESCRIPTION: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
  },
  TAG_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9\s&-]+$/,
  },
  AMOUNT: {
    MIN: -999999.99,
    MAX: 999999.99,
  },
};

export const ERROR_MESSAGES = {
  BANK_CONNECTION_FAILED:
    'Unable to connect to your bank. Please check your credentials.',
  INVALID_CREDENTIALS: 'Invalid username or password.',
  TRANSACTION_SYNC_ERROR: 'Failed to sync transactions. Please try again.',
  ACCOUNT_NOT_FOUND: 'Account not found.',
  INSUFFICIENT_PERMISSIONS: "You don't have permission to perform this action.",
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait and try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};
