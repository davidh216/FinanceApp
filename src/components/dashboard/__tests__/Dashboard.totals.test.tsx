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
      '-41.2%($5,507.32)'
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
