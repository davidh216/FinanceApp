import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../Dashboard';

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

describe('Dashboard actions', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    window.localStorage.clear();
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    // Nothing on the dashboard is a "coming soon" placeholder any more.
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it.each([
    ['Add Transaction', 'Add a transaction'],
    ['Import CSV', 'Import transactions from CSV'],
    ['Set Budget', 'Monthly budgets'],
    ['Generate Report', 'Spending by category'],
    ['Export Data', 'Export and back up'],
  ])('%s opens "%s"', async (action, title) => {
    const user = userEvent.setup();
    renderDashboard();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: action }));
    });
    expect(screen.getByRole('dialog')).toHaveTextContent(title);
  });

  it('All Transactions opens the transactions page', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await act(async () => {
      await user.click(
        screen.getByRole('button', { name: 'All Transactions' })
      );
    });
    expect(
      screen.getByRole('heading', { name: 'All transactions' })
    ).toBeInTheDocument();
  });

  it('Add Account opens the CSV import, which is how accounts are added', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Add Account/ }));
    });
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Import transactions from CSV'
    );
  });

  it('has no refresh, notification or calculator controls', () => {
    renderDashboard();
    expect(screen.queryByTitle('Refresh data')).not.toBeInTheDocument();
    expect(screen.queryByText('Refresh All')).not.toBeInTheDocument();
    expect(screen.queryByText(/Last updated/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Calculator' })
    ).not.toBeInTheDocument();
  });
});
