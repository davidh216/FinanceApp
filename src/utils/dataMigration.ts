import { Account, Transaction } from '../types/financial';
import { MOCK_ACCOUNTS } from '../constants/financial';
import { createDataService, DataServiceConfig } from '../services/DataService';
import { useState } from 'react';

interface MigrationProgress {
  accounts: number;
  transactions: number;
  totalAccounts: number;
  totalTransactions: number;
  status: 'idle' | 'migrating' | 'completed' | 'error';
  error?: string;
}

interface MigrationResult {
  success: boolean;
  accountsMigrated: number;
  transactionsMigrated: number;
  error?: string;
}

export class DataMigrationService {
  private config: DataServiceConfig;
  private userId: string;
  private dataService: any;

  constructor(config: DataServiceConfig, userId: string) {
    this.config = config;
    this.userId = userId;
    this.dataService = createDataService(config, userId);
  }

  /**
   * Migrate mock data to Firebase
   */
  async migrateMockDataToFirebase(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult> {
    try {
      // Initialize progress
      const totalAccounts = MOCK_ACCOUNTS.length;
      const totalTransactions = MOCK_ACCOUNTS.reduce(
        (sum, account) => sum + (account.transactions?.length || 0),
        0
      );

      let accountsMigrated = 0;
      let transactionsMigrated = 0;

      // Update progress
      const updateProgress = (status: MigrationProgress['status'], error?: string) => {
        onProgress?.({
          accounts: accountsMigrated,
          transactions: transactionsMigrated,
          totalAccounts,
          totalTransactions,
          status,
          error,
        });
      };

      updateProgress('migrating');

      // Migrate accounts
      for (const mockAccount of MOCK_ACCOUNTS) {
        try {
          // Create account without transactions first
          const accountData = {
            ...mockAccount,
            transactions: undefined, // Remove transactions from account
          };

          await this.dataService.updateAccount(accountData);
          accountsMigrated++;

          // Migrate transactions for this account
          if (mockAccount.transactions) {
            for (const transaction of mockAccount.transactions) {
              try {
                await this.dataService.updateTransaction(transaction);
                transactionsMigrated++;
              } catch (error) {
                console.error(`Failed to migrate transaction ${transaction.id}:`, error);
                // Continue with other transactions
              }
            }
          }

          updateProgress('migrating');
        } catch (error) {
          console.error(`Failed to migrate account ${mockAccount.id}:`, error);
          // Continue with other accounts
        }
      }

      updateProgress('completed');

      return {
        success: true,
        accountsMigrated,
        transactionsMigrated,
      };
    } catch (error) {
      console.error('Migration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      onProgress?.({
        accounts: 0,
        transactions: 0,
        totalAccounts: MOCK_ACCOUNTS.length,
        totalTransactions: MOCK_ACCOUNTS.reduce(
          (sum, account) => sum + (account.transactions?.length || 0),
          0
        ),
        status: 'error',
        error: errorMessage,
      });

      return {
        success: false,
        accountsMigrated: 0,
        transactionsMigrated: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if user has existing data in Firebase
   */
  async hasExistingData(): Promise<boolean> {
    try {
      const accounts = await this.dataService.getAccounts();
      const transactions = await this.dataService.getTransactions();
      
      return accounts.length > 0 || transactions.length > 0;
    } catch (error) {
      console.error('Error checking existing data:', error);
      return false;
    }
  }

  /**
   * Get migration statistics
   */
  async getMigrationStats(): Promise<{
    mockAccounts: number;
    mockTransactions: number;
    firebaseAccounts: number;
    firebaseTransactions: number;
  }> {
    const mockAccounts = MOCK_ACCOUNTS.length;
    const mockTransactions = MOCK_ACCOUNTS.reduce(
      (sum, account) => sum + (account.transactions?.length || 0),
      0
    );

    let firebaseAccounts = 0;
    let firebaseTransactions = 0;

    try {
      const accounts = await this.dataService.getAccounts();
      const transactions = await this.dataService.getTransactions();
      
      firebaseAccounts = accounts.length;
      firebaseTransactions = transactions.length;
    } catch (error) {
      console.error('Error getting Firebase stats:', error);
    }

    return {
      mockAccounts,
      mockTransactions,
      firebaseAccounts,
      firebaseTransactions,
    };
  }

  /**
   * Clear all Firebase data (for testing/reset purposes)
   */
  async clearFirebaseData(): Promise<void> {
    try {
      const accounts = await this.dataService.getAccounts();
      const transactions = await this.dataService.getTransactions();

      // Delete all transactions first
      for (const transaction of transactions) {
        await this.dataService.deleteTransaction(transaction.id);
      }

      // Delete all accounts
      for (const account of accounts) {
        await this.dataService.deleteAccount(account.id);
      }
    } catch (error) {
      console.error('Error clearing Firebase data:', error);
      throw error;
    }
  }
}

/**
 * Hook for data migration
 */
export const useDataMigration = (userId: string) => {
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress>({
    accounts: 0,
    transactions: 0,
    totalAccounts: 0,
    totalTransactions: 0,
    status: 'idle',
  });

  const [isMigrating, setIsMigrating] = useState(false);

  const startMigration = async () => {
    if (isMigrating) return;

    setIsMigrating(true);
    
    const config: DataServiceConfig = {
      useMockData: false,
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
      apiKey: process.env.REACT_APP_API_KEY,
    };

    const migrationService = new DataMigrationService(config, userId);
    
    try {
      await migrationService.migrateMockDataToFirebase(setMigrationProgress);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const checkExistingData = async () => {
    const config: DataServiceConfig = {
      useMockData: false,
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
      apiKey: process.env.REACT_APP_API_KEY,
    };

    const migrationService = new DataMigrationService(config, userId);
    return await migrationService.hasExistingData();
  };

  const getStats = async () => {
    const config: DataServiceConfig = {
      useMockData: false,
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
      apiKey: process.env.REACT_APP_API_KEY,
    };

    const migrationService = new DataMigrationService(config, userId);
    return await migrationService.getMigrationStats();
  };

  return {
    migrationProgress,
    isMigrating,
    startMigration,
    checkExistingData,
    getStats,
  };
}; 