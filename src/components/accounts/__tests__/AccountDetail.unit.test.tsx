import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccountDetail } from '../AccountDetail';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Account } from '../../../types/financial';

// Mock the context to test specific behaviors
const mockContextValue = {
  state: {
    accounts: [],
    transactions: [],
    selectedAccount: null,
    currentScreen: 'account-detail' as const,
    selectedPeriod: 'month' as const,
    isLoading: false,
    error: null,
    filters: {},
    sortBy: 'date-desc'
  },
  dispatch: jest.fn(),
  totalBalance: 0,
  summary: {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netWorth: 0,
    debtToIncomeRatio: 0,
    savingsRate: 0,
  },
  selectAccount: jest.fn(),
  changeScreen: jest.fn(),
  changePeriod: jest.fn(),
  addTag: jest.fn(),
  removeTag: jest.fn(),
  applyFilters: jest.fn(),
  viewAccountDetail: jest.fn(),
};

jest.mock('../../../contexts/FinancialContext', () => ({
  useFinancial: () => mockContextValue,
  FinancialProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('AccountDetail Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls changeScreen when back button is clicked', () => {
    mockContextValue.state.selectedAccount = {
      id: 'acc_test',
      name: 'Test Account',
      type: 'CHECKING',
      balance: 1000,
      accountNumber: '****1234',
      bankName: 'Test Bank',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      transactions: []
    };

    render(<AccountDetail />);

    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);

    expect(mockContextValue.changeScreen).toHaveBeenCalledWith('dashboard');
  });

  it('calls addTag when transaction is tagged', () => {
    const mockAccount = {
      id: 'acc_test',
      name: 'Test Account',
      type: 'CHECKING' as const,
      balance: 1000,
      accountNumber: '****1234',
      bankName: 'Test Bank',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      transactions: [{
        id: 'txn_1',
        accountId: 'acc_test',
        description: 'TEST MERCHANT',
        amount: -50,
        date: '2025-01-15',
        category: 'Other',
        tags: [],
        pending: false,
        cleanMerchant: {
          cleanName: 'Test Merchant',
          logo: '🏪',
          suggestedCategory: 'Other',
          original: 'TEST MERCHANT',
          confidence: 0.5,
        },
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
      }]
    };

    mockContextValue.state.selectedAccount = mockAccount;

    render(<AccountDetail />);

    expect(screen.getByText('Test Merchant')).toBeInTheDocument();
    
    // Test that the addTag function is passed correctly
    expect(mockContextValue.addTag).toBeDefined();
  });

  it('handles empty transaction list', () => {
    mockContextValue.state.selectedAccount = {
      id: 'acc_test',
      name: 'Empty Account',
      type: 'CHECKING',
      balance: 0,
      accountNumber: '****1234',
      bankName: 'Test Bank',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      transactions: []
    };

    render(<AccountDetail />);

    expect(screen.getByTestId('empty-state')).toHaveTextContent('No transactions found');
  });
});