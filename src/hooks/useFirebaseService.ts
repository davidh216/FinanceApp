import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createDataService, DataService, DataServiceConfig } from '../services/DataService';
import { Account, Transaction, FinancialSummary, TimePeriod, CustomDateRange } from '../types/financial';

interface UseFirebaseServiceReturn {
  dataService: DataService | null;
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refreshAccounts: () => Promise<void>;
  refreshTransactions: (accountId?: string, filters?: any) => Promise<void>;
  subscribeToRealTimeUpdates: (accountId?: string) => () => void;
}

export const useFirebaseService = (): UseFirebaseServiceReturn => {
  const { currentUser } = useAuth();
  const [dataService, setDataService] = useState<DataService | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize data service when user is available
  useEffect(() => {
    if (currentUser) {
      const config: DataServiceConfig = {
        useMockData: false, // Use Firebase in production
        apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
        apiKey: process.env.REACT_APP_API_KEY,
      };

      try {
        const service = createDataService(config, currentUser.id);
        setDataService(service);
        setError(null);
      } catch (err) {
        console.error('Error creating data service:', err);
        setError('Failed to initialize data service');
      }
    } else {
      setDataService(null);
      setAccounts([]);
      setTransactions([]);
    }
  }, [currentUser]);

  // Load initial data
  useEffect(() => {
    if (dataService && currentUser) {
      loadInitialData();
    }
  }, [dataService, currentUser]);

  const loadInitialData = async () => {
    if (!dataService) return;

    try {
      setLoading(true);
      setError(null);

      // Load accounts and transactions in parallel
      const [accountsData, transactionsData] = await Promise.all([
        dataService.getAccounts(),
        dataService.getTransactions(),
      ]);

      setAccounts(accountsData);
      setTransactions(transactionsData);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const refreshAccounts = useCallback(async () => {
    if (!dataService) return;

    try {
      setError(null);
      const accountsData = await dataService.getAccounts();
      setAccounts(accountsData);
    } catch (err) {
      console.error('Error refreshing accounts:', err);
      setError('Failed to refresh accounts');
    }
  }, [dataService]);

  const refreshTransactions = useCallback(async (accountId?: string, filters?: any) => {
    if (!dataService) return;

    try {
      setError(null);
      const transactionsData = await dataService.getTransactions(accountId, filters);
      setTransactions(transactionsData);
    } catch (err) {
      console.error('Error refreshing transactions:', err);
      setError('Failed to refresh transactions');
    }
  }, [dataService]);

  const subscribeToRealTimeUpdates = useCallback((accountId?: string) => {
    if (!dataService || !('subscribeToAccounts' in dataService)) {
      return () => {}; // Return empty cleanup function
    }

    // Subscribe to accounts updates
    const accountsUnsubscribe = (dataService as any).subscribeToAccounts((updatedAccounts: Account[]) => {
      setAccounts(updatedAccounts);
    });

    // Subscribe to transactions updates
    const transactionsUnsubscribe = (dataService as any).subscribeToTransactions((updatedTransactions: Transaction[]) => {
      setTransactions(updatedTransactions);
    }, accountId);

    // Return cleanup function
    return () => {
      accountsUnsubscribe();
      transactionsUnsubscribe();
    };
  }, [dataService]);

  return {
    dataService,
    accounts,
    transactions,
    loading,
    error,
    refreshAccounts,
    refreshTransactions,
    subscribeToRealTimeUpdates,
  };
}; 