import { createDataService, MockDataService, FirebaseDataService } from '../DataService';
import { MOCK_ACCOUNTS } from '../../constants/financial';

describe('DataService', () => {
  describe('createDataService', () => {
    it('should create MockDataService when useMockData is true', () => {
      const service = createDataService({ useMockData: true });
      expect(service).toBeInstanceOf(MockDataService);
    });

    it('should create FirebaseDataService when useMockData is false', () => {
      const service = createDataService({ 
        useMockData: false, 
        apiBaseUrl: 'https://api.example.com',
        apiKey: 'test-key' 
      }, 'test-user-id');
      expect(service).toBeInstanceOf(FirebaseDataService);
    });
  });

  describe('MockDataService', () => {
    let service: MockDataService;

    beforeEach(() => {
      service = new MockDataService();
    });

    describe('Account operations', () => {
      it('should get all accounts', async () => {
        const accounts = await service.getAccounts();
        expect(accounts).toHaveLength(MOCK_ACCOUNTS.length);
        expect(accounts[0]).toHaveProperty('id');
        expect(accounts[0]).toHaveProperty('name');
        expect(accounts[0]).toHaveProperty('balance');
      });

      it('should get account by id', async () => {
        const account = await service.getAccount(MOCK_ACCOUNTS[0].id);
        expect(account).toEqual(MOCK_ACCOUNTS[0]);
      });

      it('should return null for non-existent account', async () => {
        const account = await service.getAccount('non-existent-id');
        expect(account).toBeNull();
      });

      it('should update account', async () => {
        const updatedAccount = { ...MOCK_ACCOUNTS[0], name: 'Updated Account' };
        const result = await service.updateAccount(updatedAccount);
        expect(result.name).toBe('Updated Account');
        
        const retrieved = await service.getAccount(MOCK_ACCOUNTS[0].id);
        expect(retrieved?.name).toBe('Updated Account');
      });

      it('should delete account', async () => {
        const accountId = MOCK_ACCOUNTS[0].id;
        const result = await service.deleteAccount(accountId);
        expect(result).toBe(true);
        
        const retrieved = await service.getAccount(accountId);
        expect(retrieved).toBeNull();
      });

      it('should return false when deleting non-existent account', async () => {
        const result = await service.deleteAccount('non-existent-id');
        expect(result).toBe(false);
      });
    });

    describe('Transaction operations', () => {
      it('should get transactions for all accounts', async () => {
        const transactions = await service.getTransactions();
        expect(transactions.length).toBeGreaterThan(0);
        expect(transactions[0]).toHaveProperty('id');
        expect(transactions[0]).toHaveProperty('accountId');
        expect(transactions[0]).toHaveProperty('amount');
      });

      it('should get transactions for specific account', async () => {
        const accountId = MOCK_ACCOUNTS[0].id;
        const transactions = await service.getTransactions(accountId);
        expect(transactions.every(tx => tx.accountId === accountId)).toBe(true);
      });

      it('should filter transactions by category', async () => {
        const transactions = await service.getTransactions(undefined, { category: 'Food & Dining' });
        expect(transactions.every(tx => tx.category === 'Food & Dining')).toBe(true);
      });

      it('should filter transactions by type', async () => {
        const transactions = await service.getTransactions(undefined, { type: 'income' });
        expect(transactions.every(tx => tx.amount > 0)).toBe(true);
      });

      it('should filter transactions by date range', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');
        const transactions = await service.getTransactions(undefined, { 
          dateRange: { startDate, endDate } 
        });
        
        transactions.forEach(tx => {
          const txDate = new Date(tx.date);
          expect(txDate >= startDate && txDate <= endDate).toBe(true);
        });
      });

      it('should get transaction by id', async () => {
        const allTransactions = await service.getTransactions();
        const transaction = await service.getTransaction(allTransactions[0].id);
        expect(transaction).toEqual(allTransactions[0]);
      });

      it('should return null for non-existent transaction', async () => {
        const transaction = await service.getTransaction('non-existent-id');
        expect(transaction).toBeNull();
      });

      it('should update transaction', async () => {
        const allTransactions = await service.getTransactions();
        const updatedTransaction = { ...allTransactions[0], description: 'Updated Description' };
        const result = await service.updateTransaction(updatedTransaction);
        expect(result.description).toBe('Updated Description');
      });

      it('should delete transaction', async () => {
        const allTransactions = await service.getTransactions();
        const transactionId = allTransactions[0].id;
        const result = await service.deleteTransaction(transactionId);
        expect(result).toBe(true);
        
        const retrieved = await service.getTransaction(transactionId);
        expect(retrieved).toBeNull();
      });
    });

    describe('Financial summary operations', () => {
      it('should get financial summary for all accounts', async () => {
        const summary = await service.getFinancialSummary('month');
        expect(summary).toHaveProperty('totalIncome');
        expect(summary).toHaveProperty('totalExpenses');
        expect(summary).toHaveProperty('netAmount');
        expect(summary).toHaveProperty('savingsRate');
      });

      it('should get financial summary for personal accounts', async () => {
        const summary = await service.getFinancialSummary('month', undefined, 'personal');
        expect(summary).toHaveProperty('totalIncome');
        expect(summary).toHaveProperty('totalExpenses');
      });

      it('should get financial summary for business accounts', async () => {
        const summary = await service.getFinancialSummary('month', undefined, 'business');
        expect(summary).toHaveProperty('totalIncome');
        expect(summary).toHaveProperty('totalExpenses');
      });
    });

    describe('Search operations', () => {
      it('should search transactions by description', async () => {
        const results = await service.searchTransactions('Salary');
        expect(results.length).toBeGreaterThan(0);
        expect(results.every(tx => 
          tx.description.toLowerCase().includes('salary') ||
          tx.cleanMerchant.cleanName.toLowerCase().includes('salary') ||
          tx.category.toLowerCase().includes('salary') ||
          tx.tags.some(tag => tag.toLowerCase().includes('salary'))
        )).toBe(true);
      });

      it('should search transactions by merchant', async () => {
        const results = await service.searchTransactions('Amazon');
        expect(results.every(tx => 
          tx.description.toLowerCase().includes('amazon') ||
          tx.cleanMerchant.cleanName.toLowerCase().includes('amazon') ||
          tx.category.toLowerCase().includes('amazon') ||
          tx.tags.some(tag => tag.toLowerCase().includes('amazon'))
        )).toBe(true);
      });

      it('should return empty array for no matches', async () => {
        const results = await service.searchTransactions('NonExistentTerm');
        expect(results).toEqual([]);
      });
    });

    describe('Transaction statistics', () => {
      it('should get transaction stats for all accounts', async () => {
        const stats = await service.getTransactionStats();
        expect(stats).toHaveProperty('totalTransactions');
        expect(stats).toHaveProperty('totalIncome');
        expect(stats).toHaveProperty('totalExpenses');
        expect(stats).toHaveProperty('netAmount');
        expect(stats).toHaveProperty('categoryStats');
        expect(stats).toHaveProperty('averageTransactionAmount');
      });

      it('should get transaction stats for specific account', async () => {
        const accountId = MOCK_ACCOUNTS[0].id;
        const stats = await service.getTransactionStats(accountId);
        expect(stats).toHaveProperty('totalTransactions');
        expect(stats).toHaveProperty('totalIncome');
        expect(stats).toHaveProperty('totalExpenses');
      });
    });
  });

  describe('FirebaseDataService', () => {
    let service: FirebaseDataService;

    beforeEach(() => {
      service = new FirebaseDataService({ useMockData: false }, 'test-user-id');
    });

    it('should throw error for getAccounts', async () => {
      await expect(service.getAccounts()).rejects.toThrow('Firebase integration not yet implemented');
    });

    it('should throw error for getAccount', async () => {
      await expect(service.getAccount('test-id')).rejects.toThrow('Firebase integration not yet implemented');
    });

    it('should throw error for updateAccount', async () => {
      await expect(service.updateAccount(MOCK_ACCOUNTS[0])).rejects.toThrow('Firebase integration not yet implemented');
    });

    it('should throw error for deleteAccount', async () => {
      await expect(service.deleteAccount('test-id')).rejects.toThrow('Firebase integration not yet implemented');
    });

    it('should throw error for getTransactions', async () => {
      await expect(service.getTransactions()).rejects.toThrow('Firebase integration not yet implemented');
    });

    it('should throw error for getTransaction', async () => {
      await expect(service.getTransaction('test-id')).rejects.toThrow('Firebase integration not yet implemented');
    });

    it('should throw error for updateTransaction', async () => {
      const mockTransaction = {
        id: 'test-id',
        accountId: 'account-id',
        amount: 100,
        date: new Date().toISOString(),
        description: 'Test',
        category: 'Test Category',
        tags: ['test'],
        pending: false,
        cleanMerchant: {
          cleanName: 'Test Merchant',
          logo: '',
          suggestedCategory: 'Test Category',
          original: 'Test Merchant',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await expect(service.updateTransaction(mockTransaction)).rejects.toThrow('Firebase integration not yet implemented');
    });

    it('should throw error for deleteTransaction', async () => {
      await expect(service.deleteTransaction('test-id')).rejects.toThrow('Firebase integration not yet implemented');
    });

    it('should throw error for getFinancialSummary', async () => {
      await expect(service.getFinancialSummary('month')).rejects.toThrow('Firebase integration not yet implemented');
    });

    it('should throw error for searchTransactions', async () => {
      await expect(service.searchTransactions('test')).rejects.toThrow('Firebase integration not yet implemented');
    });

    it('should throw error for getTransactionStats', async () => {
      await expect(service.getTransactionStats()).rejects.toThrow('Firebase integration not yet implemented');
    });
  });
}); 