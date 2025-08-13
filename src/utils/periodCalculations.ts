import { TimePeriod, CustomDateRange, Transaction, FinancialSummary } from '../types/financial';

/**
 * Calculate period boundaries based on the selected period and optional custom date range
 */
export const calculatePeriodBoundaries = (
  period: TimePeriod, 
  customRange?: CustomDateRange
): { startDate: Date; endDate: Date; periodLabel: string } => {
  const today = new Date();
  
  switch (period) {
    case 'day':
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        endDate: today,
        periodLabel: 'daily'
      };
    case 'week':
      const dayOfWeek = today.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysToSubtract),
        endDate: today,
        periodLabel: 'weekly'
      };
    case 'month':
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: today,
        periodLabel: 'monthly'
      };
    case 'quarter':
      const currentQuarter = Math.floor(today.getMonth() / 3);
      return {
        startDate: new Date(today.getFullYear(), currentQuarter * 3, 1),
        endDate: today,
        periodLabel: 'quarterly'
      };
    case 'year':
      return {
        startDate: new Date(today.getFullYear(), 0, 1),
        endDate: today,
        periodLabel: 'yearly'
      };
    case '5year':
      return {
        startDate: new Date(today.getFullYear() - 5, 0, 1),
        endDate: today,
        periodLabel: '5-year'
      };
    case 'custom':
      if (customRange) {
        return {
          startDate: new Date(customRange.startDate),
          endDate: new Date(customRange.endDate),
          periodLabel: customRange.label || 'custom'
        };
      }
      // fallback to month
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: today,
        periodLabel: 'monthly'
      };
    default:
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: today,
        periodLabel: 'monthly'
      };
  }
};

/**
 * Calculate previous period boundaries for comparison
 */
export const calculatePreviousPeriodBoundaries = (
  period: TimePeriod,
  currentStartDate: Date
): { startDate: Date; endDate: Date } => {
  const today = new Date();
  
  switch (period) {
    case 'day':
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
        endDate: new Date(currentStartDate.getTime() - 1)
      };
    case 'week':
      const prevWeekDaysToSubtract = (today.getDay() === 0 ? 6 : today.getDay() - 1) + 7;
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - prevWeekDaysToSubtract),
        endDate: new Date(currentStartDate.getTime() - 1)
      };
    case 'month':
      return {
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        endDate: new Date(currentStartDate.getTime() - 1)
      };
    case 'quarter':
      const prevQuarter = Math.floor(today.getMonth() / 3) - 1;
      const prevQuarterStart = prevQuarter >= 0
        ? new Date(today.getFullYear(), prevQuarter * 3, 1)
        : new Date(today.getFullYear() - 1, 9, 1); // Q4 of previous year
      return {
        startDate: prevQuarterStart,
        endDate: new Date(currentStartDate.getTime() - 1)
      };
    case 'year':
      return {
        startDate: new Date(today.getFullYear() - 1, 0, 1),
        endDate: new Date(currentStartDate.getTime() - 1)
      };
    case '5year':
      return {
        startDate: new Date(today.getFullYear() - 10, 0, 1),
        endDate: new Date(currentStartDate.getTime() - 1)
      };
    default:
      return {
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        endDate: new Date(currentStartDate.getTime() - 1)
      };
  }
};

/**
 * Filter transactions for a specific date range
 */
export const filterTransactionsByDateRange = (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] => {
  return transactions.filter(txn => {
    const txnDate = new Date(txn.date);
    return txnDate >= startDate && txnDate <= endDate;
  });
};

/**
 * Calculate financial summary for a given period
 */
export const calculateFinancialSummary = (
  transactions: Transaction[],
  period: TimePeriod,
  customRange?: CustomDateRange,
  totalBalance: number = 0
): FinancialSummary => {
  const { startDate, endDate, periodLabel } = calculatePeriodBoundaries(period, customRange);
  
  const periodTransactions = filterTransactionsByDateRange(transactions, startDate, endDate);

  const periodIncome = periodTransactions
    .filter(txn => txn.amount > 0)
    .reduce((sum, txn) => sum + txn.amount, 0);

  const periodExpenses = Math.abs(
    periodTransactions
      .filter(txn => txn.amount < 0)
      .reduce((sum, txn) => sum + txn.amount, 0)
  );

  const savingsRate = periodIncome > 0 ? (periodIncome - periodExpenses) / periodIncome : 0;

  // Calculate previous period for comparison
  const { startDate: prevStartDate, endDate: prevEndDate } = calculatePreviousPeriodBoundaries(period, startDate);
  const prevPeriodTransactions = filterTransactionsByDateRange(transactions, prevStartDate, prevEndDate);

  const prevPeriodIncome = prevPeriodTransactions
    .filter(txn => txn.amount > 0)
    .reduce((sum, txn) => sum + txn.amount, 0);

  const prevPeriodExpenses = Math.abs(
    prevPeriodTransactions
      .filter(txn => txn.amount < 0)
      .reduce((sum, txn) => sum + txn.amount, 0)
  );

  return {
    totalBalance,
    monthlyIncome: Math.round(periodIncome * 100) / 100,
    monthlyExpenses: Math.round(periodExpenses * 100) / 100,
    netWorth: totalBalance,
    debtToIncomeRatio: periodIncome > 0 ? periodExpenses / periodIncome : 0,
    savingsRate: Math.max(0, savingsRate),
    previousPeriodIncome: prevPeriodIncome,
    previousPeriodExpenses: prevPeriodExpenses,
    periodLabel,
  };
};

/**
 * Generate trend data for charts based on selected period
 */
export const generateTrendData = (
  transactions: Transaction[],
  period: TimePeriod,
  dataPoints: number = 30
): {
  balance: number[];
  income: number[];
  expenses: number[];
  savings: number[];
} => {
  const today = new Date();
  const balanceTrend: number[] = [];
  const incomeTrend: number[] = [];
  const expenseTrend: number[] = [];
  const savingsTrend: number[] = [];

  // Determine interval based on period
  let intervalDays: number;
  switch (period) {
    case 'day':
      intervalDays = 1 / 24; // Hourly
      break;
    case 'week':
      intervalDays = 1; // Daily
      break;
    case 'month':
      intervalDays = 1; // Daily
      break;
    case 'quarter':
      intervalDays = 7; // Weekly
      break;
    case 'year':
      intervalDays = 30; // Monthly
      break;
    case '5year':
      intervalDays = 30; // Monthly
      break;
    default:
      intervalDays = 1;
  }

  // Generate trend data for each data point
  for (let i = dataPoints - 1; i >= 0; i--) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - i * intervalDays);

    const startDate = new Date(targetDate);
    startDate.setDate(targetDate.getDate() - intervalDays);

    const periodTransactions = filterTransactionsByDateRange(transactions, startDate, targetDate);

    // Calculate balance at this point
    const transactionsUpToDate = filterTransactionsByDateRange(transactions, new Date(0), targetDate);
    const balanceAtDate = transactionsUpToDate.reduce((sum, txn) => sum + txn.amount, 0);
    balanceTrend.push(Math.max(0, balanceAtDate));

    // Calculate income for this period
    const periodIncome = periodTransactions
      .filter(txn => txn.amount > 0)
      .reduce((sum, txn) => sum + txn.amount, 0);
    incomeTrend.push(periodIncome);

    // Calculate expenses for this period
    const periodExpenses = Math.abs(
      periodTransactions
        .filter(txn => txn.amount < 0)
        .reduce((sum, txn) => sum + txn.amount, 0)
    );
    expenseTrend.push(periodExpenses);

    // Calculate savings rate for this period
    const savingsRate = periodIncome > 0 ? (periodIncome - periodExpenses) / periodIncome : 0;
    savingsTrend.push(Math.max(0, savingsRate * 100)); // Convert to percentage
  }

  return {
    balance: balanceTrend,
    income: incomeTrend,
    expenses: expenseTrend,
    savings: savingsTrend,
  };
}; 