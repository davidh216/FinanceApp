import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../Dashboard';
import { formatDateRange } from '../../../utils/date';

type User = ReturnType<typeof userEvent.setup>;

// The test clock is 15 June 2025. The range picked below is 1–10 May, so
// the period before it is the ten days 21–30 April.
const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '04/20/2025,AMAZON MKTPLACE,-999.00\n' +
  '04/21/2025,AMAZON MKTPLACE,-40.00\n' +
  '04/30/2025,STARBUCKS STORE 1234,-10.00\n' +
  '05/01/2025,PAYROLL DEPOSIT,3000.00\n' +
  '05/01/2025,AMAZON MKTPLACE,-80.00\n' +
  '05/10/2025,SHELL OIL 57444,-20.00\n' +
  '05/11/2025,AMAZON MKTPLACE,-999.00\n' +
  '06/02/2025,PAYROLL DEPOSIT,3000.00\n';

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

const importChecking = async (user: User) => {
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

const click = async (user: User, name: string | RegExp) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name }));
  });
};

const pickMay1To10 = async (user: User) => {
  await click(user, 'Custom');
  // The calendar opens on the current month, June.
  expect(
    screen.getByRole('dialog', { name: 'Select date range' })
  ).toHaveTextContent('June 2025');
  await click(user, 'Previous month');
  await click(user, 'May 1, 2025');
  await click(user, 'May 10, 2025');
  await click(user, 'Apply');
};

describe('Custom date range', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('opens a date picker from the Custom button', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await click(user, 'Custom');
    expect(
      screen.getByRole('dialog', { name: 'Select date range' })
    ).toBeInTheDocument();
    await click(user, 'Close');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('covers exactly the chosen days, compared with the days before', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await pickMay1To10(user);

    // The button shows the range, and the cards say what they compare.
    expect(
      screen.getByRole('button', { name: 'May 1 – May 10, 2025' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('kpi-income')).toHaveTextContent(
      'Income (Custom range)'
    );
    // 1 and 10 May are both included; 11 May and June are not.
    expect(screen.getByTestId('kpi-income')).toHaveTextContent('$3,000.00');
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent('$100.00');
    // 21–30 April: $50 of spending ($999 on the 20th is too early).
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent(
      '+100.0%(+$50.00) vs last period'
    );

    await click(user, /Generate Report/);
    expect(screen.getByTestId('report-period')).toHaveTextContent(
      'May 1 – May 10, 2025, compared with Apr 21 – Apr 30, 2025'
    );
    expect(screen.getByTestId('report-total')).toHaveTextContent(
      '$100.00+$50.00 vs $50.00 the period before'
    );
  });

  it('reopens on the chosen range', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await pickMay1To10(user);
    await click(user, 'May 1 – May 10, 2025');

    const dialog = screen.getByRole('dialog', { name: 'Select date range' });
    expect(dialog).toHaveTextContent('May 2025');
    // Not 30 April, as parsing "2025-05-01" as UTC would show here.
    expect(dialog).toHaveTextContent('May 1, 2025 → May 10, 2025');
    expect(screen.getByRole('button', { name: 'May 1, 2025' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('goes back to a preset period', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await pickMay1To10(user);
    await click(user, 'M');

    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
    expect(screen.getByTestId('kpi-income')).toHaveTextContent(
      'Income (Monthly)'
    );
    expect(screen.getByTestId('kpi-income')).toHaveTextContent('$3,000.00');
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent('$0.00');
  });
});

describe('formatDateRange', () => {
  it('shows the year once when both dates share it', () => {
    expect(formatDateRange('2025-05-01', '2025-05-10')).toBe(
      'May 1 – May 10, 2025'
    );
    expect(formatDateRange('2024-12-20', '2025-01-05')).toBe(
      'Dec 20, 2024 – Jan 5, 2025'
    );
    expect(formatDateRange('2025-05-01', '2025-05-01')).toBe('May 1, 2025');
  });
});
