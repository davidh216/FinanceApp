import React from 'react';
import { render, screen } from '@testing-library/react';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../Dashboard';

// Tests run on 15 June 2025 in America/New_York (see src/test/clock.ts and
// src/testGlobalSetup.js), and the mock data is seeded, so these totals are
// the same on every run. The expected values were worked out from the raw
// mock transactions by comparing "YYYY-MM-DD" date strings, independently
// of the app's own date handling.

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

describe('Dashboard totals (personal accounts, June 2025)', () => {
  it('shows the total balance', () => {
    renderDashboard();
    expect(screen.getByTestId('kpi-balance')).toHaveTextContent('$123,045.85');
  });

  it('compares balances with the end of May', () => {
    renderDashboard();
    // Personal accounts on 31 May: $119,325.97 (today's balances with June's
    // transactions undone). The balance is up $3,719.88, which is exactly
    // June's income minus spending: loan payments move money between the
    // user's own accounts.
    expect(screen.getByTestId('kpi-balance')).toHaveTextContent(
      '+3.1%(+$3,719.88)'
    );
    // Assets were $438,213.03; $318,887.06 was owed, so debt went down.
    const [assets, liabilities] = screen.getAllByText(/^Total:/);
    expect(assets).toHaveTextContent('+0.5% (+$2,080.64)');
    expect(liabilities).toHaveTextContent('-0.5% (-$1,639.24)');
  });

  it('shows the savings rate as a percentage', () => {
    renderDashboard();
    // June: (7,847.90 - 4,128.02) / 7,847.90 = 47.4%. May: 75.0%, so the
    // change is in percentage points, not dollars.
    expect(screen.getByTestId('kpi-savings-rate')).toHaveTextContent(
      '47.4%-27.6 pts vs last month'
    );
  });

  it("shows this month's income and spending", () => {
    renderDashboard();
    // 1–15 June across the personal accounts. Loan payments ($2,238.10)
    // are transfers from checking, so they aren't spending.
    expect(screen.getByTestId('kpi-income')).toHaveTextContent('$7,847.90');
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent('$4,128.02');
  });

  it('compares against the whole of May', () => {
    renderDashboard();
    // May: income $13,355.22, spending $3,342.11. Spending includes two
    // transactions dated 1 May, which a UTC date parse would drop into April.
    expect(screen.getByTestId('kpi-income')).toHaveTextContent(
      '-41.2%(-$5,507.32)'
    );
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent(
      '+23.5%(+$785.91)'
    );
  });

  it('totals assets and liabilities by group', () => {
    renderDashboard();
    // Checking + savings + home value, and credit card + mortgage + loans.
    const [assets, liabilities] = screen.getAllByText(/^Total:/);
    expect(assets).toHaveTextContent('Total: $440,293.67');
    expect(liabilities).toHaveTextContent('Total: $317,247.82');
    expect(screen.getByText(/^Net:/)).toHaveTextContent('Net: $123,045.85');
  });
});
