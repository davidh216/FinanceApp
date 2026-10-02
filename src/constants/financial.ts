// src/constants/financial.ts
import {
  TagCategory,
  MerchantInfo,
  Account,
  Transaction,
} from '../types/financial';
import { createRandom, RandomFn } from '../utils/random';
import { toLocalDateString } from '../utils/date';

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

// Mock data is generated from seeded random numbers, so the same account
// always gets the same transactions for a given calendar month: reloading
// shows the same data, and past months don't change as time moves on.
const monthSeed = (accountId: string, date: Date) =>
  `${accountId}:${date.getFullYear()}-${date.getMonth() + 1}`;

const pendingRoll = (random: RandomFn) => random() < 0.1;

// Bills, subscriptions and pay that come on the same day each month for
// the same amount, so the demo has regular payments to find.
interface ScheduledPayment {
  merchant: string;
  day: number;
  amount: number;
}

const MONTHLY_SCHEDULES: Record<string, ScheduledPayment[]> = {
  acc_checking: [
    { merchant: 'COMCAST', day: 8, amount: -89.99 },
    { merchant: 'VERIZON', day: 22, amount: -75.0 },
  ],
  acc_credit: [
    { merchant: 'SPOTIFY', day: 3, amount: -10.99 },
    { merchant: 'NETFLIX', day: 12, amount: -15.49 },
    { merchant: 'APPLE', day: 19, amount: -2.99 },
  ],
  acc_savings: [{ merchant: 'INTEREST', day: 28, amount: 14.2 }],
  // Client work paid into the business account.
  acc_business: [{ merchant: 'FREELANCE', day: 5, amount: 4800.0 }],
};

// Paid every other Friday into checking, counted from this one.
const PAYDAY_ANCHOR = new Date(2024, 0, 5);
const PAYCHECK = 3200.0;

const paydaysIn = (year: number, month: number): number[] => {
  const days: number[] = [];
  const first = new Date(year, month, 1).getTime();
  const daysSince = Math.round((first - PAYDAY_ANCHOR.getTime()) / 86400000);
  const offset = (((14 - (daysSince % 14)) % 14) + 14) % 14;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1 + offset; day <= daysInMonth; day += 14) days.push(day);
  return days;
};

// Random purchases come from these: income, bills and subscriptions are
// scheduled instead.
const SCHEDULED_CATEGORIES = ['Income', 'Subscriptions', 'Utilities'];

export const generateHistoricalTransactions = (
  accountId: string,
  monthsBack: number = 12,
  transactionsPerMonth: number = 15,
  today: Date = new Date()
): Transaction[] => {
  // Check if this is a loan account
  if (accountId.includes('mortgage') || accountId.includes('student_loan')) {
    return generateLoanTransactions(accountId, monthsBack, today);
  }

  const merchants = Object.keys(MERCHANT_PATTERNS).filter(
    (key) =>
      !SCHEDULED_CATEGORIES.includes(MERCHANT_PATTERNS[key].suggestedCategory)
  );
  const transactions: Transaction[] = [];

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
    // The whole month is drawn, then days after today are left out: a
    // transaction looks the same whichever day of the month you look.
    const lastDay = monthOffset === 0 ? today.getDate() : daysInMonth;
    const random = createRandom(monthSeed(accountId, targetDate));
    const dated = (day: number) =>
      new Date(targetDate.getFullYear(), targetDate.getMonth(), day);

    const scheduled: (ScheduledPayment & { id: string })[] = [
      ...(MONTHLY_SCHEDULES[accountId] || []).map((payment, n) => ({
        ...payment,
        day: Math.min(payment.day, daysInMonth),
        id: `bill${n}`,
      })),
      ...(accountId === LOAN_PAYMENT_ACCOUNT_ID
        ? paydaysIn(targetDate.getFullYear(), targetDate.getMonth()).map(
            (day) => ({
              merchant: 'PAYROLL',
              day,
              amount: PAYCHECK,
              id: `pay${day}`,
            })
          )
        : []),
    ];
    for (const payment of scheduled) {
      if (payment.day > lastDay) continue;
      const merchantInfo = MERCHANT_PATTERNS[payment.merchant];
      const date = dated(payment.day);
      transactions.push({
        id: `txn_${monthSeed(accountId, targetDate)}_${payment.id}`,
        accountId,
        description: payment.merchant,
        amount: payment.amount,
        date: toLocalDateString(date),
        category: merchantInfo.suggestedCategory,
        tags: [merchantInfo.suggestedCategory],
        pending: false,
        cleanMerchant: { ...merchantInfo, original: payment.merchant },
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      });
    }

    // Generate seasonal spending patterns
    const seasonalMultiplier = getSeasonalMultiplier(targetDate.getMonth());
    const monthlyTransactionCount = Math.floor(
      transactionsPerMonth * seasonalMultiplier
    );

    for (let i = 0; i < monthlyTransactionCount; i++) {
      const merchantKey = merchants[Math.floor(random() * merchants.length)];
      const merchantInfo = MERCHANT_PATTERNS[merchantKey];

      const amount = -getCategoryExpenseAmount(
        merchantInfo.suggestedCategory,
        random
      );
      const dayOfMonth = Math.floor(random() * daysInMonth) + 1;
      const transactionDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        dayOfMonth
      );

      const tagged = random() > 0.3; // 70% tagged
      const pending = pendingRoll(random) && monthOffset === 0;
      const reference = Math.floor(random() * 1000);
      const original = Math.floor(random() * 1000);
      if (dayOfMonth > lastDay) continue;

      transactions.push({
        id: `txn_${monthSeed(accountId, targetDate)}_${i}`,
        accountId,
        description: `${merchantKey} #${reference}`,
        amount: Math.round(amount * 100) / 100,
        date: toLocalDateString(transactionDate),
        category: merchantInfo.suggestedCategory,
        tags: tagged ? [merchantInfo.suggestedCategory] : [],
        // Only the current month can be pending.
        pending,
        cleanMerchant: {
          ...merchantInfo,
          original: `${merchantKey} #${original}`,
        },
        createdAt: transactionDate.toISOString(),
        updatedAt: transactionDate.toISOString(),
      });
    }
  }

  return transactions.sort((a, b) => b.date.localeCompare(a.date));
};

// Loan payments are transfers from this account.
export const LOAN_PAYMENT_ACCOUNT_ID = 'acc_checking';

// Generate loan-specific transactions
const generateLoanTransactions = (
  accountId: string,
  monthsBack: number,
  today: Date
): Transaction[] => {
  const transactions: Transaction[] = [];
  const random = createRandom(accountId);

  // Determine loan type and payment amount
  let loanMerchant: string;
  let monthlyPayment: number;

  if (accountId.includes('mortgage')) {
    loanMerchant = 'QUICKEN LOANS';
    monthlyPayment = 1850 + random() * 200; // $1850-$2050 monthly mortgage payment
  } else if (accountId.includes('student_loan_1')) {
    loanMerchant = 'NELNET';
    monthlyPayment = 150 + random() * 50; // $150-$200 monthly student loan payment
  } else {
    loanMerchant = 'SALLIE MAE';
    monthlyPayment = 120 + random() * 40; // $120-$160 monthly student loan payment
  }

  // Generate one payment per month
  for (let monthOffset = 0; monthOffset < monthsBack; monthOffset++) {
    const targetDate = new Date(
      today.getFullYear(),
      today.getMonth() - monthOffset,
      1
    );
    const monthRandom = createRandom(monthSeed(accountId, targetDate));
    // Drawn but unused (the day used to be random), so the payment amounts
    // below stay as they were.
    monthRandom();
    // Each loan is paid on the same day every month.
    const dayOfMonth = accountId.includes('mortgage')
      ? 1
      : accountId.includes('student_loan_1')
      ? 10
      : 15;
    // Not paid yet this month.
    if (monthOffset === 0 && dayOfMonth > today.getDate()) continue;
    const transactionDate = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      dayOfMonth
    );

    // Small variation in payment amount
    const paymentAmount = monthlyPayment + (monthRandom() * 20 - 10); // ±$10 variation

    transactions.push({
      id: `txn_${monthSeed(accountId, targetDate)}`,
      accountId,
      description: `Monthly Payment #${Math.floor(monthRandom() * 1000)}`,
      // A payment received reduces what is owed. The matching outflow from
      // checking is added in MOCK_ACCOUNTS (see paymentFromChecking).
      amount: Math.round(paymentAmount * 100) / 100,
      date: toLocalDateString(transactionDate),
      category: 'Loan Payment',
      transferAccountId: LOAN_PAYMENT_ACCOUNT_ID,
      tags: ['Loan Payment'],
      pending: pendingRoll(monthRandom) && monthOffset === 0, // Only current month can be pending
      cleanMerchant: {
        cleanName: LOAN_MERCHANT_PATTERNS[loanMerchant].cleanName,
        logo: accountId.includes('mortgage') ? '🏠' : '🎓',
        suggestedCategory: 'Loan Payment',
        original: `Monthly Payment #${Math.floor(monthRandom() * 1000)}`,
        confidence: 0.95,
      },
      createdAt: transactionDate.toISOString(),
      updatedAt: transactionDate.toISOString(),
    });
  }

  return transactions.sort((a, b) => b.date.localeCompare(a.date));
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
const getCategoryExpenseAmount = (
  category: string,
  random: RandomFn
): number => {
  const categoryAmounts = {
    'Food & Dining': () => 15 + random() * 85, // $15-$100
    Groceries: () => 50 + random() * 150, // $50-$200
    Transportation: () => 25 + random() * 75, // $25-$100
    Shopping: () => 30 + random() * 270, // $30-$300
    Entertainment: () => 20 + random() * 80, // $20-$100
    Utilities: () => 80 + random() * 120, // $80-$200
    Healthcare: () => 40 + random() * 160, // $40-$200
    Business: () => 25 + random() * 175, // $25-$200
    Travel: () => 100 + random() * 400, // $100-$500
    Subscriptions: () => 10 + random() * 40, // $10-$50
    Other: () => 20 + random() * 80, // $20-$100
  };

  const amountGenerator =
    categoryAmounts[category as keyof typeof categoryAmounts];
  return amountGenerator ? amountGenerator() : 25 + random() * 75;
};

// The checking side of a loan payment: the same payment as money going out.
const paymentFromChecking = (loanPayment: Transaction): Transaction => ({
  ...loanPayment,
  id: `${loanPayment.id}_from_checking`,
  accountId: LOAN_PAYMENT_ACCOUNT_ID,
  amount: -loanPayment.amount,
  transferAccountId: loanPayment.accountId,
});

const MORTGAGE_PAYMENTS = generateHistoricalTransactions('acc_mortgage', 15, 1);
const STUDENT_LOAN_1_PAYMENTS = generateHistoricalTransactions(
  'acc_student_loan_1',
  15,
  1
);
const STUDENT_LOAN_2_PAYMENTS = generateHistoricalTransactions(
  'acc_student_loan_2',
  15,
  1
);
const CHECKING_TRANSACTIONS = [
  ...generateHistoricalTransactions('acc_checking', 15, 20),
  ...[
    ...MORTGAGE_PAYMENTS,
    ...STUDENT_LOAN_1_PAYMENTS,
    ...STUDENT_LOAN_2_PAYMENTS,
  ].map(paymentFromChecking),
].sort((a, b) => b.date.localeCompare(a.date));

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
    // 15 months, ~20 per month, plus the loan payments made from checking.
    transactions: CHECKING_TRANSACTIONS,
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
    transactions: MORTGAGE_PAYMENTS, // 15 months of monthly payments
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
    transactions: STUDENT_LOAN_1_PAYMENTS, // 15 months of monthly payments
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
    transactions: STUDENT_LOAN_2_PAYMENTS, // 15 months of monthly payments
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
