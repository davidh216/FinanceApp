import { Transaction, Account, TimePeriod, FinancialSummary } from '../types/financial';
import { format, subDays, subWeeks, subMonths, subQuarters, subYears, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export interface ChartDataPoint {
  label: string;
  value: number;
  date: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'doughnut' | 'pie';
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options: any;
}

// Color palette for charts
export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  info: '#06B6D4',
  success: '#22C55E',
  purple: '#8B5CF6',
  pink: '#EC4899',
  gray: '#6B7280',
  lightGray: '#E5E7EB',
  darkGray: '#374151',
  // Additional colors for charts
  blue: '#3B82F6',
  red: '#EF4444',
  orange: '#F97316',
  green: '#22C55E',
};

// Generate gradient colors for charts
export const generateGradientColors = (baseColor: string, opacity: number = 0.1): string => {
  return `${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
};

// Process transactions for balance trend chart
export const processBalanceTrendData = (
  transactions: Transaction[],
  accounts: Account[],
  period: TimePeriod,
  dataPoints: number = 12
): ChartDataPoint[] => {
  const dataPointsArray: ChartDataPoint[] = [];
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Get date range based on period
  const endDate = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'day':
      startDate = subDays(endDate, dataPoints - 1);
      break;
    case 'week':
      startDate = subWeeks(endDate, dataPoints - 1);
      break;
    case 'month':
      startDate = subMonths(endDate, dataPoints - 1);
      break;
    case 'quarter':
      startDate = subQuarters(endDate, dataPoints - 1);
      break;
    case 'year':
      startDate = subYears(endDate, dataPoints - 1);
      break;
    default:
      startDate = subMonths(endDate, dataPoints - 1);
  }

  // Generate data points
  for (let i = 0; i < dataPoints; i++) {
    let currentDate: Date;
    
    // Calculate the correct date based on period
    switch (period) {
      case 'day':
        currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        break;
      case 'week':
        currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (i * 7));
        break;
      case 'month':
        currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);
        break;
      case 'quarter':
        currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + (i * 3));
        break;
      case 'year':
        currentDate = new Date(startDate);
        currentDate.setFullYear(startDate.getFullYear() + i);
        break;
      default:
        currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);
    }
    
    // Calculate balance for this date (simplified - in real app, you'd calculate actual balance)
    const balanceChange = transactions
      .filter(t => new Date(t.date) <= currentDate)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalBalance + balanceChange;
    
    dataPointsArray.push({
      label: format(currentDate, getDateFormat(period)),
      value: balance,
      date: currentDate.toISOString(),
    });
  }

  return dataPointsArray;
};

// Process transactions for income vs expenses chart
export const processIncomeExpenseData = (
  transactions: Transaction[],
  period: TimePeriod,
  dataPoints: number = 12
): { income: ChartDataPoint[], expenses: ChartDataPoint[] } => {
  const incomeData: ChartDataPoint[] = [];
  const expenseData: ChartDataPoint[] = [];
  
  const endDate = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'day':
      startDate = subDays(endDate, dataPoints - 1);
      break;
    case 'week':
      startDate = subWeeks(endDate, dataPoints - 1);
      break;
    case 'month':
      startDate = subMonths(endDate, dataPoints - 1);
      break;
    case 'quarter':
      startDate = subQuarters(endDate, dataPoints - 1);
      break;
    case 'year':
      startDate = subYears(endDate, dataPoints - 1);
      break;
    default:
      startDate = subMonths(endDate, dataPoints - 1);
  }

  for (let i = 0; i < dataPoints; i++) {
    let currentDate: Date;
    
    // Calculate the correct date based on period
    switch (period) {
      case 'day':
        currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        break;
      case 'week':
        currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (i * 7));
        break;
      case 'month':
        currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);
        break;
      case 'quarter':
        currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + (i * 3));
        break;
      case 'year':
        currentDate = new Date(startDate);
        currentDate.setFullYear(startDate.getFullYear() + i);
        break;
      default:
        currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);
    }
    
    const periodStart = getPeriodStart(currentDate, period);
    const periodEnd = getPeriodEnd(currentDate, period);
    
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= periodStart && transactionDate <= periodEnd;
    });
    
    const income = periodTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = Math.abs(periodTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
    
    incomeData.push({
      label: format(currentDate, getDateFormat(period)),
      value: income,
      date: currentDate.toISOString(),
    });
    
    expenseData.push({
      label: format(currentDate, getDateFormat(period)),
      value: expenses,
      date: currentDate.toISOString(),
    });
  }

  return { income: incomeData, expenses: expenseData };
};

// Process transactions for category spending breakdown
export const processCategorySpendingData = (
  transactions: Transaction[],
  period: TimePeriod
): ChartDataPoint[] => {
  const categoryMap = new Map<string, number>();
  
  // Get date range based on period - same logic as other charts
  const endDate = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'day':
      startDate = subDays(endDate, 30); // Last 30 days for daily view
      break;
    case 'week':
      startDate = subWeeks(endDate, 12); // Last 12 weeks
      break;
    case 'month':
      startDate = subMonths(endDate, 12); // Last 12 months
      break;
    case 'quarter':
      startDate = subQuarters(endDate, 4); // Last 4 quarters
      break;
    case 'year':
      startDate = subYears(endDate, 5); // Last 5 years
      break;
    default:
      startDate = subMonths(endDate, 12);
  }

  // Filter transactions for the period
  const periodTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= endDate && t.amount < 0;
  });

  // Group by category
  periodTransactions.forEach(transaction => {
    const category = transaction.category || 'Uncategorized';
    const amount = Math.abs(transaction.amount);
    categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
  });

  // Convert to chart data points
  const dataPoints: ChartDataPoint[] = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      label: category,
      value: amount,
      date: new Date().toISOString(),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 categories

  return dataPoints;
};

// Process data for savings rate progress chart
export const processSavingsRateData = (
  summary: FinancialSummary,
  period: TimePeriod
): ChartDataPoint[] => {
  const currentSavingsRate = summary.savingsRate * 100;
  const targetSavingsRate = 20; // 20% target
  
  return [
    {
      label: 'Current',
      value: currentSavingsRate,
      date: new Date().toISOString(),
    },
    {
      label: 'Target',
      value: targetSavingsRate,
      date: new Date().toISOString(),
    },
  ];
};

// Helper functions
const getDateFormat = (period: TimePeriod): string => {
  switch (period) {
    case 'day':
      return 'MMM dd';
    case 'week':
      return 'MMM dd';
    case 'month':
      return 'MMM yyyy';
    case 'quarter':
      return 'Qo yyyy';
    case 'year':
      return 'yyyy';
    default:
      return 'MMM dd';
  }
};

const getPeriodStart = (date: Date, period: TimePeriod): Date => {
  switch (period) {
    case 'day':
      return startOfDay(date);
    case 'week':
      return startOfWeek(date);
    case 'month':
      return startOfMonth(date);
    case 'quarter':
      return startOfQuarter(date);
    case 'year':
      return startOfYear(date);
    default:
      return startOfMonth(date);
  }
};

const getPeriodEnd = (date: Date, period: TimePeriod): Date => {
  switch (period) {
    case 'day':
      return endOfDay(date);
    case 'week':
      return endOfWeek(date);
    case 'month':
      return endOfMonth(date);
    case 'quarter':
      return endOfQuarter(date);
    case 'year':
      return endOfYear(date);
    default:
      return endOfMonth(date);
  }
};

// Default chart options
export const getDefaultChartOptions = (type: 'line' | 'bar' | 'doughnut' | 'pie') => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;
            return `${label}: $${value.toLocaleString()}`;
          },
        },
      },
    },
  };

  switch (type) {
    case 'line':
      return {
        ...baseOptions,
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              maxRotation: 45,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              callback: function(value: any) {
                return '$' + value.toLocaleString();
              },
            },
          },
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6,
          },
          line: {
            tension: 0.4,
          },
        },
      };
    case 'bar':
      return {
        ...baseOptions,
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              callback: function(value: any) {
                return '$' + value.toLocaleString();
              },
            },
          },
        },
      };
    case 'doughnut':
    case 'pie':
      return {
        ...baseOptions,
        cutout: type === 'doughnut' ? '60%' : undefined,
        plugins: {
          ...baseOptions.plugins,
          legend: {
            ...baseOptions.plugins.legend,
            position: 'right' as const,
          },
        },
      };
    default:
      return baseOptions;
  }
}; 