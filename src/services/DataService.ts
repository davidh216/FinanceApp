import { Account, Transaction, FinancialSummary, TimePeriod, CustomDateRange } from '../types/financial';
import { MOCK_ACCOUNTS } from '../constants/financial';
import { calculateFinancialSummary } from '../utils/periodCalculations';
import { 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { 
  db, 
  getUserAccountsCollection, 
  getUserTransactionsCollection, 
  getAccountDocRef, 
  getTransactionDocRef 
} from '../config/firebase';

export interface DataServiceConfig {
  useMockData: boolean;
  apiBaseUrl?: string;
  apiKey?: string;
}

export interface DataServiceResponse<T> {
  data: T;
  error?: string;
  loading: boolean;
}

export interface DataService {
  // Account operations
  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | null>;
  updateAccount(account: Account): Promise<Account>;
  deleteAccount(id: string): Promise<boolean>;
  
  // Transaction operations
  getTransactions(accountId?: string, filters?: any): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | null>;
  updateTransaction(transaction: Transaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  
  // Financial summary operations
  getFinancialSummary(
    period: TimePeriod,
    customDateRange?: CustomDateRange,
    accountFilter?: string
  ): Promise<FinancialSummary>;
  
  // Utility operations
  searchTransactions(query: string): Promise<Transaction[]>;
  getTransactionStats(accountId?: string): Promise<any>;
}

class MockDataService implements DataService {
  private accounts: Account[] = MOCK_ACCOUNTS;
  private transactions: Transaction[] = [];

  constructor() {
    // Generate mock transactions for all accounts
    this.generateMockTransactions();
  }

  private generateMockTransactions(): void {
    this.transactions = [];
    this.accounts.forEach(account => {
      // Generate 20-50 transactions per account
      const transactionCount = Math.floor(Math.random() * 30) + 20;
      
      for (let i = 0; i < transactionCount; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Random date within last 90 days
        
        const amount = Math.random() > 0.6 ? 
          -(Math.random() * 500 + 10) : // 40% chance of expense
          (Math.random() * 2000 + 100); // 60% chance of income
        
        this.transactions.push({
          id: `${account.id}-tx-${i}`,
          accountId: account.id,
          amount,
          date: date.toISOString(),
          description: this.generateMockDescription(amount),
          category: this.generateMockCategory(amount),
          tags: this.generateMockTags(amount),
          pending: false,
          cleanMerchant: {
            cleanName: this.generateMockMerchant(amount),
            logo: '',
            suggestedCategory: this.generateMockCategory(amount),
            original: this.generateMockMerchant(amount),
          },
          createdAt: date.toISOString(),
          updatedAt: date.toISOString(),
        });
      }
    });
  }

  private generateMockDescription(amount: number): string {
    const descriptions = amount > 0 ? [
      'Salary Deposit',
      'Freelance Payment',
      'Investment Dividend',
      'Refund',
      'Bonus Payment'
    ] : [
      'Grocery Store',
      'Gas Station',
      'Restaurant',
      'Online Purchase',
      'Utility Bill',
      'Subscription',
      'Entertainment'
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateMockMerchant(amount: number): string {
    const merchants = amount > 0 ? [
      'Employer Corp',
      'Freelance Platform',
      'Investment Bank',
      'Online Store'
    ] : [
      'Walmart',
      'Shell Gas',
      'McDonald\'s',
      'Amazon',
      'Netflix',
      'Spotify',
      'Electric Company'
    ];
    
    return merchants[Math.floor(Math.random() * merchants.length)];
  }

  private generateMockCategory(amount: number): string {
    const categories = amount > 0 ? [
      'Income',
      'Investment',
      'Refund'
    ] : [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Utilities',
      'Healthcare'
    ];
    
    return categories[Math.floor(Math.random() * categories.length)];
  }

  private generateMockTags(amount: number): string[] {
    const tags = amount > 0 ? ['income', 'salary'] : ['expense', 'daily'];
    
    // Add random tags
    const allTags = ['groceries', 'transport', 'entertainment', 'utilities', 'shopping'];
    const randomTag = allTags[Math.floor(Math.random() * allTags.length)];
    if (Math.random() > 0.5) {
      tags.push(randomTag);
    }
    
    return tags;
  }

  async getAccounts(): Promise<Account[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...this.accounts];
  }

  async getAccount(id: string): Promise<Account | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return this.accounts.find(account => account.id === id) || null;
  }

  async updateAccount(account: Account): Promise<Account> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = this.accounts.findIndex(a => a.id === account.id);
    if (index !== -1) {
      this.accounts[index] = account;
    }
    return account;
  }

  async deleteAccount(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = this.accounts.findIndex(account => account.id === id);
    if (index !== -1) {
      this.accounts.splice(index, 1);
      // Remove associated transactions
      this.transactions = this.transactions.filter(tx => tx.accountId !== id);
      return true;
    }
    return false;
  }

  async getTransactions(accountId?: string, filters?: any): Promise<Transaction[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    let filteredTransactions = [...this.transactions];
    
    if (accountId) {
      filteredTransactions = filteredTransactions.filter(tx => tx.accountId === accountId);
    }
    
    // Apply filters if provided
    if (filters) {
      if (filters.category) {
        filteredTransactions = filteredTransactions.filter(tx => tx.category === filters.category);
      }
      if (filters.type) {
        const isIncome = filters.type === 'income';
        filteredTransactions = filteredTransactions.filter(tx => (tx.amount > 0) === isIncome);
      }
      if (filters.dateRange) {
        const { startDate, endDate } = filters.dateRange;
        filteredTransactions = filteredTransactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= startDate && txDate <= endDate;
        });
      }
    }
    
    return filteredTransactions;
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return this.transactions.find(transaction => transaction.id === id) || null;
  }

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = this.transactions.findIndex(tx => tx.id === transaction.id);
    if (index !== -1) {
      this.transactions[index] = transaction;
    }
    return transaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = this.transactions.findIndex(transaction => transaction.id === id);
    if (index !== -1) {
      this.transactions.splice(index, 1);
      return true;
    }
    return false;
  }

  async getFinancialSummary(
    period: TimePeriod,
    customDateRange?: CustomDateRange,
    accountFilter?: string
  ): Promise<FinancialSummary> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let filteredTransactions = [...this.transactions];
    
    // Filter by account type if specified
    if (accountFilter && accountFilter !== 'both') {
      const filteredAccounts = this.accounts.filter(account => {
        if (accountFilter === 'personal') return !account.type.includes('BUSINESS');
        if (accountFilter === 'business') return account.type.includes('BUSINESS');
        return true;
      });
      const accountIds = filteredAccounts.map(account => account.id);
      filteredTransactions = filteredTransactions.filter(tx => accountIds.includes(tx.accountId));
    }
    
    const totalBalance = this.accounts.reduce((sum, account) => sum + account.balance, 0);
    
    return calculateFinancialSummary(filteredTransactions, period, customDateRange, totalBalance);
  }

  async searchTransactions(query: string): Promise<Transaction[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const lowerQuery = query.toLowerCase();
    
    return this.transactions.filter(transaction => 
      transaction.description.toLowerCase().includes(lowerQuery) ||
      transaction.cleanMerchant.cleanName.toLowerCase().includes(lowerQuery) ||
      transaction.category.toLowerCase().includes(lowerQuery) ||
      transaction.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async getTransactionStats(accountId?: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let filteredTransactions = [...this.transactions];
    if (accountId) {
      filteredTransactions = filteredTransactions.filter(tx => tx.accountId === accountId);
    }
    
    const totalIncome = filteredTransactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const categoryStats = filteredTransactions.reduce((stats, tx) => {
      const category = tx.category;
      if (!stats[category]) {
        stats[category] = { count: 0, total: 0 };
      }
      stats[category].count++;
      stats[category].total += Math.abs(tx.amount);
      return stats;
    }, {} as Record<string, { count: number; total: number }>);
    
    return {
      totalTransactions: filteredTransactions.length,
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      categoryStats,
      averageTransactionAmount: filteredTransactions.length > 0 
        ? filteredTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / filteredTransactions.length 
        : 0
    };
  }
}

class FirebaseDataService implements DataService {
  private config: DataServiceConfig;
  private userId: string;

  constructor(config: DataServiceConfig, userId: string) {
    this.config = config;
    this.userId = userId;
  }

  // Helper method to convert Firestore timestamp to ISO string
  private convertTimestamp(timestamp: Timestamp | string): string {
    if (typeof timestamp === 'string') return timestamp;
    return timestamp.toDate().toISOString();
  }

  // Helper method to convert ISO string to Firestore timestamp
  private convertToTimestamp(dateString: string): Timestamp {
    return Timestamp.fromDate(new Date(dateString));
  }

  // Helper method to convert Firestore document to Account
  private convertFirestoreToAccount(doc: DocumentData): Account {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      type: data.type,
      balance: data.balance || 0,
      accountNumber: data.accountNumber || '',
      bankName: data.bankName || '',
      limit: data.limit,
      isActive: data.isActive !== false,
      createdAt: this.convertTimestamp(data.createdAt || serverTimestamp()),
      updatedAt: this.convertTimestamp(data.updatedAt || serverTimestamp()),
    };
  }

  // Helper method to convert Firestore document to Transaction
  private convertFirestoreToTransaction(doc: DocumentData): Transaction {
    const data = doc.data();
    return {
      id: doc.id,
      accountId: data.accountId,
      description: data.description,
      amount: data.amount,
      date: this.convertTimestamp(data.date),
      category: data.category,
      tags: data.tags || [],
      pending: data.pending || false,
      cleanMerchant: data.cleanMerchant || {
        cleanName: data.merchant || '',
        logo: '',
        suggestedCategory: data.category || '',
        original: data.merchant || '',
      },
      notes: data.notes,
      receiptUrl: data.receiptUrl,
      createdAt: this.convertTimestamp(data.createdAt || serverTimestamp()),
      updatedAt: this.convertTimestamp(data.updatedAt || serverTimestamp()),
    };
  }

  async getAccounts(): Promise<Account[]> {
    try {
      const accountsRef = getUserAccountsCollection(this.userId);
      const querySnapshot = await getDocs(accountsRef);
      
      return querySnapshot.docs.map(doc => this.convertFirestoreToAccount(doc));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw new Error('Failed to fetch accounts');
    }
  }

  async getAccount(id: string): Promise<Account | null> {
    try {
      const accountRef = getAccountDocRef(this.userId, id);
      const accountSnap = await getDoc(accountRef);
      
      if (accountSnap.exists()) {
        return this.convertFirestoreToAccount(accountSnap);
      }
      return null;
    } catch (error) {
      console.error('Error fetching account:', error);
      throw new Error('Failed to fetch account');
    }
  }

  async updateAccount(account: Account): Promise<Account> {
    try {
      const accountRef = getAccountDocRef(this.userId, account.id);
      const updatedAccount = {
        ...account,
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(accountRef, updatedAccount);
      return account;
    } catch (error) {
      console.error('Error updating account:', error);
      throw new Error('Failed to update account');
    }
  }

  async deleteAccount(id: string): Promise<boolean> {
    try {
      const accountRef = getAccountDocRef(this.userId, id);
      await deleteDoc(accountRef);
      
      // Also delete associated transactions
      const transactionsRef = getUserTransactionsCollection(this.userId);
      const transactionsQuery = query(transactionsRef, where('accountId', '==', id));
      const transactionsSnap = await getDocs(transactionsQuery);
      
      const deletePromises = transactionsSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Failed to delete account');
    }
  }

  async getTransactions(accountId?: string, filters?: any): Promise<Transaction[]> {
    try {
      const transactionsRef = getUserTransactionsCollection(this.userId);
      const constraints: QueryConstraint[] = [orderBy('date', 'desc')];
      
      if (accountId) {
        constraints.push(where('accountId', '==', accountId));
      }
      
      // Apply filters
      if (filters) {
        if (filters.category) {
          constraints.push(where('category', '==', filters.category));
        }
        if (filters.type) {
          const isIncome = filters.type === 'income';
          constraints.push(where('amount', isIncome ? '>' : '<', 0));
        }
        if (filters.dateRange) {
          constraints.push(
            where('date', '>=', this.convertToTimestamp(filters.dateRange.startDate)),
            where('date', '<=', this.convertToTimestamp(filters.dateRange.endDate))
          );
        }
      }
      
      const transactionsQuery = query(transactionsRef, ...constraints);
      const querySnapshot = await getDocs(transactionsQuery);
      
      return querySnapshot.docs.map(doc => this.convertFirestoreToTransaction(doc));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    try {
      const transactionRef = getTransactionDocRef(this.userId, id);
      const transactionSnap = await getDoc(transactionRef);
      
      if (transactionSnap.exists()) {
        return this.convertFirestoreToTransaction(transactionSnap);
      }
      return null;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error('Failed to fetch transaction');
    }
  }

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const transactionRef = getTransactionDocRef(this.userId, transaction.id);
      const updatedTransaction = {
        ...transaction,
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(transactionRef, updatedTransaction);
      return transaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const transactionRef = getTransactionDocRef(this.userId, id);
      await deleteDoc(transactionRef);
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  }

  async getFinancialSummary(
    period: TimePeriod,
    customDateRange?: CustomDateRange,
    accountFilter?: string
  ): Promise<FinancialSummary> {
    try {
      // Get all transactions for the period
      const transactions = await this.getTransactions();
      
      // Filter by account type if specified
      let filteredTransactions = transactions;
      if (accountFilter && accountFilter !== 'both') {
        const accounts = await this.getAccounts();
        const filteredAccounts = accounts.filter(account => {
          if (accountFilter === 'personal') return !account.type.includes('BUSINESS');
          if (accountFilter === 'business') return account.type.includes('BUSINESS');
          return true;
        });
        const accountIds = filteredAccounts.map(account => account.id);
        filteredTransactions = transactions.filter(tx => accountIds.includes(tx.accountId));
      }
      
      const totalBalance = (await this.getAccounts()).reduce((sum, account) => sum + account.balance, 0);
      
      return calculateFinancialSummary(filteredTransactions, period, customDateRange, totalBalance);
    } catch (error) {
      console.error('Error calculating financial summary:', error);
      throw new Error('Failed to calculate financial summary');
    }
  }

  async searchTransactions(query: string): Promise<Transaction[]> {
    try {
      // Firestore doesn't support full-text search, so we'll fetch all transactions and filter client-side
      // In production, you might want to use Algolia or similar for better search
      const transactions = await this.getTransactions();
      const lowerQuery = query.toLowerCase();
      
      return transactions.filter(transaction => 
        transaction.description.toLowerCase().includes(lowerQuery) ||
        transaction.cleanMerchant.cleanName.toLowerCase().includes(lowerQuery) ||
        transaction.category.toLowerCase().includes(lowerQuery) ||
        transaction.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Error searching transactions:', error);
      throw new Error('Failed to search transactions');
    }
  }

  async getTransactionStats(accountId?: string): Promise<any> {
    try {
      const transactions = await this.getTransactions(accountId);
      
      const totalIncome = transactions
        .filter(tx => tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const totalExpenses = transactions
        .filter(tx => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      const categoryStats = transactions.reduce((stats, tx) => {
        const category = tx.category;
        if (!stats[category]) {
          stats[category] = { count: 0, total: 0 };
        }
        stats[category].count++;
        stats[category].total += Math.abs(tx.amount);
        return stats;
      }, {} as Record<string, { count: number; total: number }>);
      
      return {
        totalTransactions: transactions.length,
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        categoryStats,
        averageTransactionAmount: transactions.length > 0 
          ? transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / transactions.length 
          : 0
      };
    } catch (error) {
      console.error('Error calculating transaction stats:', error);
      throw new Error('Failed to calculate transaction stats');
    }
  }

  // Real-time listeners for live data synchronization
  subscribeToAccounts(callback: (accounts: Account[]) => void) {
    const accountsRef = getUserAccountsCollection(this.userId);
    return onSnapshot(accountsRef, (snapshot) => {
      const accounts = snapshot.docs.map(doc => this.convertFirestoreToAccount(doc));
      callback(accounts);
    });
  }

  subscribeToTransactions(callback: (transactions: Transaction[]) => void, accountId?: string) {
    const transactionsRef = getUserTransactionsCollection(this.userId);
    const constraints: QueryConstraint[] = [orderBy('date', 'desc')];
    
    if (accountId) {
      constraints.push(where('accountId', '==', accountId));
    }
    
    const transactionsQuery = query(transactionsRef, ...constraints);
    return onSnapshot(transactionsQuery, (snapshot) => {
      const transactions = snapshot.docs.map(doc => this.convertFirestoreToTransaction(doc));
      callback(transactions);
    });
  }
}

export function createDataService(config: DataServiceConfig, userId?: string): DataService {
  if (config.useMockData) {
    return new MockDataService();
  } else {
    if (!userId) {
      throw new Error('User ID is required for Firebase DataService');
    }
    return new FirebaseDataService(config, userId);
  }
}

// Export classes for testing
export { MockDataService, FirebaseDataService };

// Default export for convenience
export default createDataService; 