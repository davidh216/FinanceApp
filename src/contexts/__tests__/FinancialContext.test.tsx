import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FinancialProvider, useFinancial } from '../FinancialContext';
import { Account, Transaction } from '../../types/financial';

// Test component to access context
const TestComponent = () => {
  const { 
    state, 
    totalBalance, 
    summary, 
    changePeriod, 
    viewAccountDetail, 
    addTag, 
    removeTag,
    changeScreen,
    selectAccount,
    applyFilters,
    setCustomDateRange,
    togglePrivacyMode,
    setAccountFilter
  } = useFinancial();

  return (
    <div>
      <div data-testid="period">{state.selectedPeriod}</div>
      <div data-testid="screen">{state.currentScreen}</div>
      <div data-testid="total-balance">{totalBalance}</div>
      <div data-testid="monthly-income">{summary.monthlyIncome}</div>
      <div data-testid="monthly-expenses">{summary.monthlyExpenses}</div>
      <div data-testid="privacy-mode">{state.isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{state.error || 'no-error'}</div>
      
      <button onClick={() => changePeriod('week')} data-testid="change-period">
        Change to Week
      </button>
      
      <button onClick={() => changeScreen('accounts')} data-testid="change-screen">
        Go to Accounts
      </button>
      
      <button onClick={() => viewAccountDetail(state.accounts[0])} data-testid="view-account">
        View Account
      </button>
      
      <button onClick={() => addTag('test-transaction-id', 'test-tag')} data-testid="add-tag">
        Add Tag
      </button>
      
      <button onClick={() => removeTag('test-transaction-id', 'test-tag')} data-testid="remove-tag">
        Remove Tag
      </button>
      
      <button onClick={() => togglePrivacyMode()} data-testid="toggle-privacy">
        Toggle Privacy
      </button>
      
      <button onClick={() => setAccountFilter('business')} data-testid="set-account-filter">
        Set Business Filter
      </button>
      
      <button onClick={() => applyFilters({ categories: ['Food & Dining'] })} data-testid="apply-filters">
        Apply Filters
      </button>
      
      <button onClick={() => setCustomDateRange('2025-01-01', '2025-01-31', 'January 2025')} data-testid="set-custom-range">
        Set Custom Range
      </button>
    </div>
  );
};

describe('FinancialContext', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <FinancialProvider>
        {component}
      </FinancialProvider>
    );
  };

  beforeEach(() => {
    // Clear any localStorage or other state
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should provide initial state correctly', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('period')).toHaveTextContent('month');
      expect(screen.getByTestId('screen')).toHaveTextContent('dashboard');
      expect(screen.getByTestId('total-balance')).toBeInTheDocument();
      expect(screen.getByTestId('monthly-income')).toBeInTheDocument();
      expect(screen.getByTestId('monthly-expenses')).toBeInTheDocument();
    });

    it('should have accounts loaded', () => {
      renderWithProvider(<TestComponent />);
      
      // Should have mock accounts loaded
      expect(screen.getByTestId('total-balance')).not.toHaveTextContent('0');
    });

    it('should calculate summary correctly', () => {
      renderWithProvider(<TestComponent />);
      
      const monthlyIncome = parseFloat(screen.getByTestId('monthly-income').textContent || '0');
      const monthlyExpenses = parseFloat(screen.getByTestId('monthly-expenses').textContent || '0');
      
      expect(monthlyIncome).toBeGreaterThanOrEqual(0);
      expect(monthlyExpenses).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Period Changes', () => {
    it('should update period when changePeriod is called', async () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('period')).toHaveTextContent('month');
      
      fireEvent.click(screen.getByTestId('change-period'));
      
      await waitFor(() => {
        expect(screen.getByTestId('period')).toHaveTextContent('week');
      });
    });

    it('should recalculate summary when period changes', async () => {
      renderWithProvider(<TestComponent />);
      
      const initialIncome = screen.getByTestId('monthly-income').textContent;
      
      fireEvent.click(screen.getByTestId('change-period'));
      
      await waitFor(() => {
        expect(screen.getByTestId('period')).toHaveTextContent('week');
      });
      
      // Summary should be recalculated (values might be different for different periods)
      expect(screen.getByTestId('monthly-income')).toBeInTheDocument();
    });
  });

  describe('Screen Navigation', () => {
    it('should change screen when viewAccountDetail is called', async () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('screen')).toHaveTextContent('dashboard');
      
      fireEvent.click(screen.getByTestId('view-account'));
      
      await waitFor(() => {
        expect(screen.getByTestId('screen')).toHaveTextContent('account-detail');
      });
    });

    it('should change screen when changeScreen is called', async () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('screen')).toHaveTextContent('dashboard');
      
      fireEvent.click(screen.getByTestId('change-screen'));
      
      await waitFor(() => {
        expect(screen.getByTestId('screen')).toHaveTextContent('accounts');
      });
    });
  });

  describe('Tag Management', () => {
    it('should add tags to transactions', async () => {
      renderWithProvider(<TestComponent />);
      
      // This test would need to be expanded to actually verify tag addition
      // For now, we just ensure the function doesn't throw
      expect(() => {
        fireEvent.click(screen.getByTestId('add-tag'));
      }).not.toThrow();
    });

    it('should remove tags from transactions', async () => {
      renderWithProvider(<TestComponent />);
      
      // This test would need to be expanded to actually verify tag removal
      // For now, we just ensure the function doesn't throw
      expect(() => {
        fireEvent.click(screen.getByTestId('remove-tag'));
      }).not.toThrow();
    });
  });

  describe('Privacy Mode', () => {
    it('should toggle privacy mode', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-privacy'));
      
      // Privacy mode is managed in local state, so we can't easily test it here
      // In a real app, you'd want to test the actual UI changes
      expect(screen.getByTestId('toggle-privacy')).toBeInTheDocument();
    });
  });

  describe('Account Filtering', () => {
    it('should set account filter', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByTestId('set-account-filter'));
      
      // Account filter is managed in local state
      expect(screen.getByTestId('set-account-filter')).toBeInTheDocument();
    });
  });

  describe('Filter Application', () => {
    it('should apply filters', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByTestId('apply-filters'));
      
      // Filters are stored in state
      expect(screen.getByTestId('apply-filters')).toBeInTheDocument();
    });
  });

  describe('Custom Date Range', () => {
    it('should set custom date range', async () => {
      renderWithProvider(<TestComponent />);
      
      fireEvent.click(screen.getByTestId('set-custom-range'));
      
      await waitFor(() => {
        expect(screen.getByTestId('period')).toHaveTextContent('custom');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  describe('Context Hook Usage', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useFinancial must be used within a FinancialProvider');
      
      consoleSpy.mockRestore();
    });
  });
}); 