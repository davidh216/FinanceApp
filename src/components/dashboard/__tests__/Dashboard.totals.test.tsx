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
    // Personal accounts on 31 May: $117,087.87 (today's balances with June's
    // transactions undone), so the balance is up $5,957.98.
    expect(screen.getByTestId('kpi-balance')).toHaveTextContent(
      '+5.1%(+$5,957.98)'
    );
    // Assets were $435,974.93; $318,887.06 was owed, so debt went down.
    const [assets, liabilities] = screen.getAllByText(/^Total:/);
    expect(assets).toHaveTextContent('+1.0% (+$4,318.74)');
    expect(liabilities).toHaveTextContent('-0.5% (-$1,639.24)');
  });

  it('shows the savings rate as a percentage', () => {
    renderDashboard();
    // June: (7,847.90 - 6,366.12) / 7,847.90 = 18.9%. May: 58.2%, so the
    // change is in percentage points, not dollars.
    expect(screen.getByTestId('kpi-savings-rate')).toHaveTextContent('18.9%');
    expect(screen.getByTestId('kpi-savings-rate')).toHaveTextContent(
      '18.9%-39.3 pts vs last month'
    );
  });

  it("shows this month's income and spending", () => {
    renderDashboard();
    // 1–15 June: 60 transactions across the personal accounts.
    expect(screen.getByTestId('kpi-income')).toHaveTextContent('$7,847.90');
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent('$6,366.12');
  });

  it('compares against the whole of May', () => {
    renderDashboard();
    // May: income $13,355.22, spending $5,580.16. Spending includes two
    // transactions dated 1 May, which a UTC date parse would drop into April.
    expect(screen.getByTestId('kpi-income')).toHaveTextContent(
      '-41.2%(-$5,507.32)'
    );
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent(
      '+14.1%(+$785.96)'
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
