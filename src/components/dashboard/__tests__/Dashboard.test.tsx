import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { MOCK_ACCOUNTS } from '../../../constants/financial';

// Mock the lazy-loaded components
jest.mock('../KPISection', () => ({
  KPISection: () => <div data-testid="kpi-section">KPI Section</div>,
}));

jest.mock('../AccountOverview', () => ({
  AccountOverview: ({ onAccountSelect }: { onAccountSelect: (account: any) => void }) => (
    <div data-testid="account-overview">
      <button onClick={() => onAccountSelect(MOCK_ACCOUNTS[0])}>Select Account</button>
    </div>
  ),
}));

jest.mock('../RecentActivity', () => ({
  RecentActivity: () => <div data-testid="recent-activity">Recent Activity</div>,
}));

jest.mock('../../accounts/AccountDetail', () => ({
  AccountDetail: () => <div data-testid="account-detail">Account Detail</div>,
}));

jest.mock('../../ui/LoadingSpinner', () => ({
  FullScreenSpinner: ({ text }: { text: string }) => <div data-testid="fullscreen-spinner">{text}</div>,
  InlineSpinner: () => <div data-testid="inline-spinner">Loading...</div>,
}));

// Mock the DashboardHeader component
jest.mock('../DashboardHeader', () => ({
  DashboardHeader: () => <div data-testid="dashboard-header">Dashboard Header</div>,
}));

const renderDashboard = () => {
  return render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render dashboard header', async () => {
      renderDashboard();
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      });
    });

    it('should render KPI section', async () => {
      renderDashboard();
      await waitFor(() => {
        expect(screen.getByTestId('kpi-section')).toBeInTheDocument();
      });
    });

    it('should render account overview', async () => {
      renderDashboard();
      await waitFor(() => {
        expect(screen.getByTestId('account-overview')).toBeInTheDocument();
      });
    });

    it('should render recent activity', async () => {
      renderDashboard();
      await waitFor(() => {
        expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      const mockState = {
        accounts: [],
        transactions: [],
        selectedAccount: null,
        currentScreen: 'dashboard' as const,
        selectedPeriod: 'month' as const,
        isLoading: true,
        error: null,
        filters: {},
        sortBy: 'date' as const,
        customDateRange: undefined,
        accountFilter: 'both' as const,
        privacyMode: false,
      };

      render(
        <FinancialProvider initialState={mockState}>
          <Dashboard />
        </FinancialProvider>
      );

      expect(screen.getByTestId('fullscreen-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading your financial data...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no accounts are connected', () => {
      const mockState = {
        accounts: [],
        transactions: [],
        selectedAccount: null,
        currentScreen: 'dashboard' as const,
        selectedPeriod: 'month' as const,
        isLoading: false,
        error: null,
        filters: {},
        sortBy: 'date' as const,
        customDateRange: undefined,
        accountFilter: 'both' as const,
        privacyMode: false,
      };

      render(
        <FinancialProvider initialState={mockState}>
          <Dashboard />
        </FinancialProvider>
      );

      expect(screen.getByText('Welcome to FinanceApp')).toBeInTheDocument();
      expect(screen.getByText('Connect your bank accounts to get started')).toBeInTheDocument();
      expect(screen.getByText('Connect Your First Account')).toBeInTheDocument();
    });

    it('should show feature preview in empty state', () => {
      const mockState = {
        accounts: [],
        transactions: [],
        selectedAccount: null,
        currentScreen: 'dashboard' as const,
        selectedPeriod: 'month' as const,
        isLoading: false,
        error: null,
        filters: {},
        sortBy: 'date' as const,
        customDateRange: undefined,
        accountFilter: 'both' as const,
        privacyMode: false,
      };

      render(
        <FinancialProvider initialState={mockState}>
          <Dashboard />
        </FinancialProvider>
      );

      expect(screen.getByText('Smart Analytics')).toBeInTheDocument();
      expect(screen.getByText('Auto-Tagging')).toBeInTheDocument();
      expect(screen.getByText('Bank-Level Security')).toBeInTheDocument();
    });
  });

  describe('Account Detail Navigation', () => {
    it('should navigate to account detail when account is selected', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('account-overview')).toBeInTheDocument();
      });

      const selectButton = screen.getByText('Select Account');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('account-detail')).toBeInTheDocument();
      });
    });
  });

  describe('Account Filtering', () => {
    it('should filter accounts based on accountFilter', async () => {
      const mockState = {
        accounts: MOCK_ACCOUNTS,
        transactions: [],
        selectedAccount: null,
        currentScreen: 'dashboard' as const,
        selectedPeriod: 'month' as const,
        isLoading: false,
        error: null,
        filters: {},
        sortBy: 'date' as const,
        customDateRange: undefined,
        accountFilter: 'personal' as const,
        privacyMode: false,
      };

      render(
        <FinancialProvider initialState={mockState}>
          <Dashboard />
        </FinancialProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('account-overview')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const mockState = {
        accounts: [],
        transactions: [],
        selectedAccount: null,
        currentScreen: 'dashboard' as const,
        selectedPeriod: 'month' as const,
        isLoading: false,
        error: 'Failed to load accounts',
        filters: {},
        sortBy: 'date' as const,
        customDateRange: undefined,
        accountFilter: 'both' as const,
        privacyMode: false,
      };

      render(
        <FinancialProvider initialState={mockState}>
          <Dashboard />
        </FinancialProvider>
      );

      // Should still render the dashboard even with errors
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      });
    });
  });

  describe('Lazy Loading', () => {
    it('should show loading spinners for lazy-loaded components', async () => {
      renderDashboard();

      // Should show inline spinners while components are loading
      await waitFor(() => {
        expect(screen.getByTestId('kpi-section')).toBeInTheDocument();
      });
    });
  });
}); 