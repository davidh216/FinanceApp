import { useMemo } from 'react';
import { Account, Transaction, TimePeriod, FinancialSummary } from '../types/financial';
import { calculateFinancialSummary, generateTrendData } from '../utils/periodCalculations';
import { filterTransactionsByAccountType } from '../utils/transactionUtils';

export interface DashboardData {
  filteredAccounts: Account[];
  filteredTotalBalance: number;
  filteredSummary: FinancialSummary;
  trendData: any;
  allTransactions: Transaction[];
  hasAccounts: boolean;
}

export interface UseDashboardDataProps {
  accounts: Account[];
  accountFilter: 'personal' | 'business' | 'both';
  selectedPeriod: TimePeriod;
  customDateRange?: any;
  isLoading: boolean;
}

export const useDashboardData = ({
  accounts,
  accountFilter,
  selectedPeriod,
  customDateRange,
  isLoading,
}: UseDashboardDataProps): DashboardData => {
  // Filter accounts based on accountFilter
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account: Account) => {
      if (accountFilter === 'both') return true;
      if (accountFilter === 'personal')
        return !account.type.includes('BUSINESS');
      if (accountFilter === 'business')
        return account.type.includes('BUSINESS');
      return true;
    });
  }, [accounts, accountFilter]);

  // Calculate filtered total balance
  const filteredTotalBalance = useMemo(() => {
    return filteredAccounts.reduce(
      (sum: number, account: Account) => sum + account.balance,
      0
    );
  }, [filteredAccounts]);

  // Get all transactions from accounts
  const allTransactions = useMemo(() => {
    return accounts.flatMap(account => account.transactions || []);
  }, [accounts]);

  // Calculate filtered summary using utility functions
  const filteredSummary = useMemo(() => {
    const filteredTransactions = filterTransactionsByAccountType(accounts, accountFilter);
    return calculateFinancialSummary(
      filteredTransactions,
      selectedPeriod,
      customDateRange,
      filteredTotalBalance
    );
  }, [accounts, accountFilter, selectedPeriod, customDateRange, filteredTotalBalance]);

  // Generate trend data using utility functions
  const trendData = useMemo(() => {
    const filteredTransactions = filterTransactionsByAccountType(accounts, accountFilter);
    return generateTrendData(filteredTransactions, selectedPeriod);
  }, [accounts, accountFilter, selectedPeriod]);

  const hasAccounts = accounts.length > 0;

  return {
    filteredAccounts,
    filteredTotalBalance,
    filteredSummary,
    trendData,
    allTransactions,
    hasAccounts,
  };
}; 