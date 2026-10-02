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
    // Personal accounts on 31 May: $122,963.54 (today's balances with June's
    // transactions undone). The balance is up $82.31, which is exactly
    // June's income minus spending: loan payments move money between the
    // user's own accounts.
    expect(screen.getByTestId('kpi-balance')).toHaveTextContent(
      '+0.1%(+$82.31)'
    );
    // Assets were $441,058.18; $318,094.64 was owed, so debt went down.
    const [assets, liabilities] = screen.getAllByText(/^Total:/);
    expect(assets).toHaveTextContent('-0.2% (-$764.51)');
    expect(liabilities).toHaveTextContent('-0.3% (-$846.82)');
  });

  it('shows the savings rate as a percentage', () => {
    renderDashboard();
    // June: (3,200.00 - 3,117.69) / 3,200.00 = 2.6%. May: 19.5%, so the
    // change is in percentage points, not dollars.
    expect(screen.getByTestId('kpi-savings-rate')).toHaveTextContent(
      '2.6%-17.0 pts vs last month'
    );
  });

  it("shows this month's income and spending", () => {
    renderDashboard();
    // 1–15 June across the personal accounts: one paycheck (6 June). Loan
    // payments ($2,238.10) are transfers from checking, so they aren't
    // spending.
    expect(screen.getByTestId('kpi-income')).toHaveTextContent('$3,200.00');
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent('$3,117.69');
  });

  it('compares against the whole of May', () => {
    renderDashboard();
    // May: income $6,414.20 (two paychecks and savings interest), spending
    // $5,160.66. Spending includes three transactions dated 1 May, which a
    // UTC date parse would drop into April.
    expect(screen.getByTestId('kpi-income')).toHaveTextContent(
      '-50.1%(-$3,214.20)'
    );
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent(
      '-39.6%(-$2,042.97)'
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
