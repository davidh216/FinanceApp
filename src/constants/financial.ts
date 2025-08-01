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

// Add some more business-focused merchant patterns
export const BUSINESS_MERCHANT_PATTERNS: Record<
  string,
  Omit<MerchantInfo, 'original'>
> = {
  'OFFICE DEPOT': {
    cleanName: 'Office Depot',
    logo: '🖥️',
    suggestedCategory: 'Business',
    confidence: 0.95,
  },
  ZOOM: {
    cleanName: 'Zoom',
    logo: '📹',
    suggestedCategory: 'Business',
    confidence: 0.95,
  },
  SLACK: {
    cleanName: 'Slack',
    logo: '💬',
    suggestedCategory: 'Business',
    confidence: 0.95,
  },
  AWS: {
    cleanName: 'Amazon Web Services',
    logo: '☁️',
    suggestedCategory: 'Business',
    confidence: 0.95,
  },
  GITHUB: {
    cleanName: 'GitHub',
    logo: '👨‍💻',
    suggestedCategory: 'Business',
    confidence: 0.95,
  },
  QUICKBOOKS: {
    cleanName: 'QuickBooks',
    logo: '📊',
    suggestedCategory: 'Business',
    confidence: 0.95,
  },
};

// Add loan payment merchant patterns
export const LOAN_MERCHANT_PATTERNS: Record<
  string,
  Omit<MerchantInfo, 'original'>
> = {
  'QUICKEN LOANS': {
    cleanName: 'Quicken Loans',
    logo: '🏠',
    suggestedCategory: 'Loan Payment',
    confidence: 0.95,
  },
  NELNET: {
    cleanName: 'Nelnet',
    logo: '🎓',
    suggestedCategory: 'Loan Payment',
    confidence: 0.95,
  },
  'SALLIE MAE': {
    cleanName: 'Sallie Mae',
    logo: '🎓',
    suggestedCategory: 'Loan Payment',
    confidence: 0.95,
  },
  'FEDLOAN SERVICING': {
    cleanName: 'FedLoan Servicing',
    logo: '🎓',
    suggestedCategory: 'Loan Payment',
    confidence: 0.95,
  },
  'GREAT LAKES': {
    cleanName: 'Great Lakes',
    logo: '🎓',
    suggestedCategory: 'Loan Payment',
    confidence: 0.95,
  },
};

// FIXED: Update the generateMockTransactions function in src/constants/financial.ts

export const generateMockTransactions = (
  accountId: string,
  count: number = 10
): Transaction[] => {
  const merchants = Object.keys(MERCHANT_PATTERNS);
  const transactions: Transaction[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const merchantKey = merchants[Math.floor(Math.random() * merchants.length)];
    const merchantInfo = MERCHANT_PATTERNS[merchantKey];
    const isIncome = Math.random() < 0.2; // 20% chance of income
    const amount = isIncome
      ? Math.random() * 2000 + 1000 // Income: $1000-$3000
      : -(Math.random() * 200 + 10); // Expense: $10-$210

    // FIX: Better date generation that ensures current month data
    let transactionDate: Date;

    if (i < count * 0.7) {
      // 70% of transactions in current month
      transactionDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        Math.floor(Math.random() * today.getDate()) + 1
      );
    } else {
      // 30% of transactions in past months (for historical data)
      transactionDate = new Date(today);
      transactionDate.setDate(
        today.getDate() - Math.floor(Math.random() * 60 + 30)
      ); // 30-90 days ago
    }

    transactions.push({
      id: `txn_${accountId}_${i}`,
      accountId,
      description: `${merchantKey} #${Math.floor(Math.random() * 1000)}`,
      amount: Math.round(amount * 100) / 100,
      date: transactionDate.toISOString().split('T')[0],
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

// Enhanced mock data generation in src/constants/financial.ts

// Add this new function for generating historical transactions
export const generateHistoricalTransactions = (
  accountId: string,
  monthsBack: number = 12,
  transactionsPerMonth: number = 15
): Transaction[] => {
  // Check if this is a loan account
  if (accountId.includes('mortgage') || accountId.includes('student_loan')) {
    return generateLoanTransactions(accountId, monthsBack);
  }

  const merchants = Object.keys(MERCHANT_PATTERNS);
  const transactions: Transaction[] = [];
  const today = new Date();

  // Generate transactions for each month going back
  for (let monthOffset = 0; monthOffset < monthsBack; monthOffset++) {
    const targetDate = new Date(
      today.getFullYear(),
      today.getMonth() - monthOffset,
      1
    );
    const daysInMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0
    ).getDate();

    // Generate seasonal spending patterns
    const seasonalMultiplier = getSeasonalMultiplier(targetDate.getMonth());
    const monthlyTransactionCount = Math.floor(
      transactionsPerMonth * seasonalMultiplier
    );

    for (let i = 0; i < monthlyTransactionCount; i++) {
      const merchantKey =
        merchants[Math.floor(Math.random() * merchants.length)];
      const merchantInfo = MERCHANT_PATTERNS[merchantKey];

      // More realistic income/expense patterns
      let amount: number;
      let isIncome = false;

      if (merchantInfo.suggestedCategory === 'Income' || Math.random() < 0.15) {
        // Income transactions (salary, freelance, etc.)
        isIncome = true;
        if (merchantKey.includes('PAYROLL')) {
          amount = 3500 + Math.random() * 1500; // Salary: $3500-$5000
        } else if (merchantKey.includes('FREELANCE')) {
          amount = 500 + Math.random() * 2000; // Freelance: $500-$2500
        } else {
          amount = 100 + Math.random() * 500; // Other income: $100-$600
        }
      } else {
        // Expense transactions with category-based amounts
        amount = -getCategoryExpenseAmount(merchantInfo.suggestedCategory);
      }

      // Random day in the month
      const dayOfMonth = Math.floor(Math.random() * daysInMonth) + 1;
      const transactionDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        dayOfMonth
      );

      transactions.push({
        id: `txn_${accountId}_${monthOffset}_${i}`,
        accountId,
        description: `${merchantKey} #${Math.floor(Math.random() * 1000)}`,
        amount: Math.round(amount * 100) / 100,
        date: transactionDate.toISOString().split('T')[0],
        category: merchantInfo.suggestedCategory,
        tags: Math.random() > 0.3 ? [merchantInfo.suggestedCategory] : [], // 70% tagged
        pending: monthOffset === 0 && Math.random() < 0.1, // Only current month can be pending
        cleanMerchant: {
          ...merchantInfo,
          original: `${merchantKey} #${Math.floor(Math.random() * 1000)}`,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

// Generate loan-specific transactions
const generateLoanTransactions = (
  accountId: string,
  monthsBack: number = 12
): Transaction[] => {
  const transactions: Transaction[] = [];
  const today = new Date();

  // Determine loan type and payment amount
  let loanMerchant: string;
  let monthlyPayment: number;

  if (accountId.includes('mortgage')) {
    loanMerchant = 'QUICKEN LOANS';
    monthlyPayment = 1850 + Math.random() * 200; // $1850-$2050 monthly mortgage payment
  } else if (accountId.includes('student_loan_1')) {
    loanMerchant = 'NELNET';
    monthlyPayment = 150 + Math.random() * 50; // $150-$200 monthly student loan payment
  } else {
    loanMerchant = 'SALLIE MAE';
    monthlyPayment = 120 + Math.random() * 40; // $120-$160 monthly student loan payment
  }

  // Generate one payment per month
  for (let monthOffset = 0; monthOffset < monthsBack; monthOffset++) {
    const targetDate = new Date(
      today.getFullYear(),
      today.getMonth() - monthOffset,
      1
    );
    const daysInMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0
    ).getDate();

    // Payment is usually made between 1st and 15th of the month
    const dayOfMonth = Math.floor(Math.random() * 15) + 1;
    const transactionDate = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      dayOfMonth
    );

    // Small variation in payment amount
    const paymentAmount = monthlyPayment + (Math.random() * 20 - 10); // ±$10 variation

    transactions.push({
      id: `txn_${accountId}_${monthOffset}`,
      accountId,
      description: `Monthly Payment #${Math.floor(Math.random() * 1000)}`,
      amount: -Math.round(paymentAmount * 100) / 100, // Negative for payments
      date: transactionDate.toISOString().split('T')[0],
      category: 'Loan Payment',
      tags: ['Loan Payment'],
      pending: monthOffset === 0 && Math.random() < 0.1, // Only current month can be pending
      cleanMerchant: {
        cleanName: loanMerchant,
        logo: accountId.includes('mortgage') ? '🏠' : '🎓',
        suggestedCategory: 'Loan Payment',
        original: `Monthly Payment #${Math.floor(Math.random() * 1000)}`,
        confidence: 0.95,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

// Seasonal spending multipliers (higher in holiday seasons, etc.)
const getSeasonalMultiplier = (month: number): number => {
  const seasonalFactors = {
    0: 1.1, // January - New Year expenses
    1: 0.9, // February - slower month
    2: 1.0, // March - normal
    3: 1.0, // April - normal
    4: 1.1, // May - spring spending
    5: 1.2, // June - vacation season
    6: 1.2, // July - vacation season
    7: 1.1, // August - back to school
    8: 1.0, // September - normal
    9: 1.0, // October - normal
    10: 1.3, // November - Black Friday
    11: 1.4, // December - Holiday season
  };
  return seasonalFactors[month as keyof typeof seasonalFactors] || 1.0;
};

// Category-based expense amounts for more realistic spending
const getCategoryExpenseAmount = (category: string): number => {
  const categoryAmounts = {
    'Food & Dining': () => 15 + Math.random() * 85, // $15-$100
    Groceries: () => 50 + Math.random() * 150, // $50-$200
    Transportation: () => 25 + Math.random() * 75, // $25-$100
    Shopping: () => 30 + Math.random() * 270, // $30-$300
    Entertainment: () => 20 + Math.random() * 80, // $20-$100
    Utilities: () => 80 + Math.random() * 120, // $80-$200
    Healthcare: () => 40 + Math.random() * 160, // $40-$200
    Business: () => 25 + Math.random() * 175, // $25-$200
    Travel: () => 100 + Math.random() * 400, // $100-$500
    Subscriptions: () => 10 + Math.random() * 40, // $10-$50
    Other: () => 20 + Math.random() * 80, // $20-$100
  };

  const amountGenerator =
    categoryAmounts[category as keyof typeof categoryAmounts];
  return amountGenerator ? amountGenerator() : 25 + Math.random() * 75;
};

// Update the MOCK_ACCOUNTS to use historical data
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
    transactions: generateHistoricalTransactions('acc_checking', 15, 20), // 15 months, ~20 per month
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
    transactions: generateHistoricalTransactions('acc_savings', 15, 3), // 15 months, ~3 per month (savings has fewer transactions)
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
    transactions: generateHistoricalTransactions('acc_credit', 15, 25), // 15 months, ~25 per month (credit cards used more)
  },
  {
    id: 'acc_business',
    name: 'Business Checking',
    type: 'BUSINESS_CHECKING',
    balance: 5420.33,
    accountNumber: '****3456',
    bankName: 'Wells Fargo',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: generateHistoricalTransactions('acc_business', 12, 12), // 12 months, ~12 per month
  },
  {
    id: 'acc_home_value',
    name: 'Home Value',
    type: 'INVESTMENT',
    balance: 425000.0, // Home value as asset
    accountNumber: '🏠',
    bankName: 'Property Asset',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: [], // No transactions for home value
  },
  {
    id: 'acc_mortgage',
    name: 'Home Mortgage',
    type: 'LOAN',
    balance: -285000.0, // Negative balance for loans
    accountNumber: '****7890',
    bankName: 'Quicken Loans',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: generateHistoricalTransactions('acc_mortgage', 15, 1), // 15 months, ~1 per month (monthly payments)
  },
  {
    id: 'acc_student_loan_1',
    name: 'Federal Student Loan',
    type: 'LOAN',
    balance: -18500.0, // Negative balance for loans
    accountNumber: '****2345',
    bankName: 'Nelnet',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: generateHistoricalTransactions('acc_student_loan_1', 15, 1), // 15 months, ~1 per month (monthly payments)
  },
  {
    id: 'acc_student_loan_2',
    name: 'Private Student Loan',
    type: 'LOAN',
    balance: -12500.0, // Negative balance for loans
    accountNumber: '****6789',
    bankName: 'Sallie Mae',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transactions: generateHistoricalTransactions('acc_student_loan_2', 15, 1), // 15 months, ~1 per month (monthly payments)
  },
];

export const DEFAULT_PERIODS = [
  'day',
  'week',
  'month',
  'quarter',
  'year',
  '5year',
  'custom',
] as const;

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
