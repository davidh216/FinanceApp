import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

type User = ReturnType<typeof userEvent.setup>;

// The test clock is 15 June 2025, so "this month" is 1–15 June, compared
// with the whole of May.
const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '05/10/2025,AMAZON MKTPLACE,-50.00\n' +
  '05/20/2025,SHELL OIL 57444,-30.00\n' +
  '06/02/2025,PAYROLL DEPOSIT,3000.00\n' +
  '06/03/2025,STARBUCKS STORE 1234,-20.00\n' +
  '06/04/2025,AMAZON MKTPLACE,-80.00\n' +
  '06/05/2025,CHASE CREDIT CRD AUTOPAY,-500.00\n';

const CARD_CSV =
  'Date,Description,Amount\n06/06/2025,PAYMENT THANK YOU,500.00\n';

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

const importCsv = async (user: User, contents: string, name: string) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Import CSV/ }));
  });
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([contents], `${name}.csv`, { type: 'text/csv' })
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

const openReport = async (user: User) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Generate Report/ }));
  });
};

const cells = (category: string) =>
  within(screen.getByTestId(`report-row-${category}`))
    .getAllByRole('cell')
    .map((cell) => cell.textContent?.replace(/[▲▼]/, ''));

describe('Spending report', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('breaks down spending by category against the period before', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importCsv(user, CHECKING_CSV, 'Checking');
    // The card side of the autopay makes it a transfer, not spending.
    await importCsv(user, CARD_CSV, 'Card');
    await openReport(user);

    expect(screen.getByTestId('report-period')).toHaveTextContent(
      'Jun 1 – Jun 15, 2025, compared with May 1 – May 31, 2025'
    );
    expect(screen.getByTestId('report-total')).toHaveTextContent(
      'Total spent$100.00+$20.00 vs $80.00 the period before'
    );
    // It matches the dashboard's spending card.
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent('$100.00');

    expect(cells('Shopping')).toEqual([
      'Shopping',
      '$80.00',
      '80%',
      '$50.00',
      '+$30.00',
    ]);
    expect(cells('Food & Dining')).toEqual([
      'Food & Dining',
      '$20.00',
      '20%',
      '$0.00',
      '+$20.00',
    ]);
    // Nothing on fuel this month, down from $30.
    expect(cells('Transportation')).toEqual([
      'Transportation',
      '$0.00',
      '0%',
      '$30.00',
      '-$30.00',
    ]);
    expect(
      within(screen.getByTestId('report-table')).queryByText('Transfer')
    ).not.toBeInTheDocument();
  });

  it('follows the selected period', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importCsv(user, CHECKING_CSV, 'Checking');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Y' }));
    });
    await openReport(user);

    expect(screen.getByTestId('report-period')).toHaveTextContent(
      'Jan 1 – Jun 15, 2025, compared with Jan 1 – Dec 31, 2024'
    );
    // May and June, with the unmatched autopay counted as spending.
    expect(screen.getByTestId('report-total')).toHaveTextContent('$680.00');
  });

  it('says so when there is nothing to report', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importCsv(
      user,
      'Date,Description,Amount\n06/02/2025,PAYROLL DEPOSIT,3000.00\n',
      'Checking'
    );
    await openReport(user);
    expect(screen.getByTestId('report-empty')).toHaveTextContent(
      'No spending in either period.'
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Close' }));
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
