import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../Dashboard';

// Test clock: 15 June 2025, so the chart covers July 2024 – June 2025.
const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '04/15/2025,AMAZON MKTPLACE,-200.00\n' +
  '05/10/2025,PAYROLL DEPOSIT,3000.00\n' +
  '05/31/2025,AMAZON MKTPLACE,-1000.00\n' +
  '06/01/2025,PAYROLL DEPOSIT,3000.00\n' +
  '06/03/2025,STARBUCKS STORE 1234,-500.00\n';

type User = ReturnType<typeof userEvent.setup>;

const renderWithImport = async (user: User) => {
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Import CSV/ }));
  });
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([CHECKING_CSV], 'Checking.csv', { type: 'text/csv' })
    );
  });
  await waitFor(() => {
    expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
  });
  await act(async () => {
    await user.click(screen.getByTestId('confirm-import'));
  });
  await act(async () => {
    await user.click(screen.getByTestId('back-button'));
  });
};

describe('Cash flow chart', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('summarises what was saved over 12 months', async () => {
    const user = userEvent.setup();
    await renderWithImport(user);
    // 6,000 in, 1,700 out. The average leaves out June, which isn't over.
    expect(screen.getByTestId('cashflow-summary')).toHaveTextContent(
      'Saved $4,300.00 over 12 months · +$163.64 a month on average'
    );
    const labels = within(screen.getByTestId('cashflow-card'))
      .getAllByRole('button', { name: /Open the spending report/ })
      .map((b) => b.textContent);
    expect(labels[0]).toBe('Jul');
    expect(labels[11]).toBe('Jun');
  });

  it("shows a month's figures on focus, and its report on click", async () => {
    const user = userEvent.setup();
    await renderWithImport(user);
    const april = screen.getByRole('button', { name: /^April 2025:/ });
    expect(april).toHaveAccessibleName(
      'April 2025: income $0.00, spending $200.00, overspent $200.00. Open the spending report.'
    );

    await act(async () => {
      april.focus();
    });
    expect(screen.getByTestId('cashflow-tooltip')).toHaveTextContent(
      'April 2025$0.00Income$200.00SpendingOverspent $200.00'
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^May 2025:/ }));
    });
    expect(screen.getByTestId('report-period')).toHaveTextContent(
      'May 1 – May 31, 2025, compared with Apr 1 – Apr 30, 2025'
    );
    expect(screen.getByTestId('report-total')).toHaveTextContent(
      '$1,000.00+$800.00 vs $200.00'
    );
  });

  it('marks the current month as in progress', async () => {
    const user = userEvent.setup();
    await renderWithImport(user);
    expect(
      screen.getByRole('button', { name: /^June 2025 so far:/ })
    ).toBeInTheDocument();
  });

  it('has a table view with every month', async () => {
    const user = userEvent.setup();
    await renderWithImport(user);
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Show as a table' }));
    });
    const rows = within(screen.getByTestId('cashflow-table')).getAllByRole(
      'row'
    );
    // Header plus 12 months, newest first.
    expect(rows).toHaveLength(13);
    expect(rows[1]).toHaveTextContent(
      'June 2025 (so far)$3,000.00$500.00+$2,500.00'
    );
    expect(rows[2]).toHaveTextContent('May 2025$3,000.00$1,000.00+$2,000.00');
  });
});
