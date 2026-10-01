import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

// Rent on the 1st, Netflix on the 20th, paid every other Friday. The test
// clock is 15 June 2025.
const CHECKING_CSV = [
  'Date,Description,Amount',
  '03/01/2025,RENT PAYMENT,-1200.00',
  '04/01/2025,RENT PAYMENT,-1200.00',
  '05/01/2025,RENT PAYMENT,-1200.00',
  '06/01/2025,RENT PAYMENT,-1200.00',
  '03/20/2025,NETFLIX.COM,-15.99',
  '04/20/2025,NETFLIX.COM,-15.99',
  '05/20/2025,NETFLIX.COM,-15.99',
  '05/02/2025,ACME PAYROLL,900.00',
  '05/16/2025,ACME PAYROLL,900.00',
  '05/30/2025,ACME PAYROLL,900.00',
  '06/13/2025,ACME PAYROLL,900.00',
].join('\n');

const importWithBalance = async (balance: string) => {
  const user = userEvent.setup();
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
    await user.type(screen.getByLabelText(/Current balance/), balance);
  });
  await act(async () => {
    await user.click(screen.getByTestId('confirm-import'));
  });
  await act(async () => {
    await user.click(screen.getByTestId('back-button'));
  });
};

describe('Coming up', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('lists the bills and paychecks due in the next 30 days', async () => {
    await importWithBalance('400');
    expect(screen.getByTestId('upcoming-totals')).toHaveTextContent(
      'Bills $1,215.99 · Income $1,800.00'
    );
    expect(screen.getByTestId('upcoming-card')).toHaveTextContent(
      'NetflixJun 20, 2025 · Checking-$15.99' +
        'SalaryJun 27, 2025 · Checking+$900.00' +
        'Rent PaymentJul 1, 2025 · Checking-$1,200.00' +
        'SalaryJul 11, 2025 · Checking+$900.00'
    );
    // 400 - 15.99 + 900 - 1,200 = 84.01 at the lowest: no warning.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('upcoming-card')).toHaveTextContent(
      'Checking$400.00 now → $984.01'
    );
  });

  it('warns before the balance would go below zero', async () => {
    await importWithBalance('100');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Checking could go below $0 around Jul 1, 2025, to -$215.99, unless money comes in first.'
    );
  });
});
