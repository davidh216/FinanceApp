import { useMemo, useState, useCallback } from 'react';
import { Transaction, Account, TimePeriod, FilterOptions } from '../types/financial';
import { exportTransactions, exportSummary } from '../utils/exportUtils';

export interface ChartData {
  balanceTrend: any;
  incomeExpense: any;
  categorySpending: any;
  summary: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netFlow: number;
    savingsRate: number;
    topCategory: string;
    topCategoryAmount: number;
  };
}

export const useCharts = (
  transactions: Transaction[],
  accounts: Account[],
  period: TimePeriod,
  filters: FilterOptions
) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    
    const periodTransactions = transactions.filter(t => {
      // Apply basic period filtering (you can enhance this)
      const transactionDate = new Date(t.date);
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      return transactionDate >= startDate && transactionDate <= now;
    });

    const totalIncome = periodTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = Math.abs(periodTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));
    
    const netFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netFlow / totalIncome) * 100 : 0;

    // Calculate top category
    const categoryMap = new Map<string, number>();
    periodTransactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const category = t.category || 'Uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + Math.abs(t.amount));
      });

    const topCategory = Array.from(categoryMap.entries())
      .sort(([, a], [, b]) => b - a)[0] || ['None', 0];

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      netFlow,
      savingsRate,
      topCategory: topCategory[0],
      topCategoryAmount: topCategory[1],
    };
  }, [transactions, accounts, period]);

  // Export functionality
  const handleExportTransactions = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      // Filter transactions based on current filters
      let filteredTransactions = [...transactions];
      
      // Apply basic filtering (you can enhance this based on your FilterOptions)
      if (filters.dateRange) {
        filteredTransactions = filteredTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          const startDate = new Date(filters.dateRange!.start);
          const endDate = new Date(filters.dateRange!.end);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      }
      
      if (filters.categories && filters.categories.length > 0) {
        filteredTransactions = filteredTransactions.filter(t =>
          filters.categories!.includes(t.category)
        );
      }
      
      const filename = `transactions_${period}_${new Date().toISOString().split('T')[0]}.csv`;
      exportTransactions(filteredTransactions, filename);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [transactions, filters, period]);

  const handleExportSummary = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      const summaryData = {
        totalBalance: summary.totalBalance,
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses,
        netSavings: summary.netFlow,
        period: period,
      };
      
      const filename = `financial_summary_${period}_${new Date().toISOString().split('T')[0]}.csv`;
      exportSummary(summaryData, filename);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [summary, period]);

  // Chart data processing
  const chartData = useMemo((): ChartData => {
    return {
      balanceTrend: {
        transactions,
        accounts,
        period,
      },
      incomeExpense: {
        transactions,
        period,
      },
      categorySpending: {
        transactions,
        period,
      },
      summary,
    };
  }, [transactions, accounts, period, summary]);

  // Refresh functionality
  const refreshCharts = useCallback(() => {
    // This would typically trigger a data refresh
    // For now, we'll just return a promise that resolves immediately
    return Promise.resolve();
  }, []);

  return {
    chartData,
    summary,
    isExporting,
    exportError,
    handleExportTransactions,
    handleExportSummary,
    refreshCharts,
  };
}; 