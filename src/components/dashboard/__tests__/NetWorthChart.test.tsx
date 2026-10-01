import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../Dashboard';

type User = ReturnType<typeof userEvent.setup>;

// Ending balance $2,494.25, all of it from June.
const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '06/02/2025,PAYROLL DEPOSIT,2500.00\n' +
  '06/03/2025,STARBUCKS STORE 1234,-5.75\n';

const click = async (user: User, element: HTMLElement) => {
  await act(async () => {
    await user.click(element);
  });
};

const importChecking = async (user: User) => {
  await click(user, screen.getByRole('button', { name: /Import CSV/ }));
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([CHECKING_CSV], 'Checking.csv', { type: 'text/csv' })
    );
  });
  await waitFor(() => {
    expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
  });
  await click(user, screen.getByTestId('confirm-import'));
  await click(user, screen.getByTestId('back-button'));
};

describe('Net worth chart', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows today's net worth and each month's account balances", async () => {
    const user = userEvent.setup();
    render(
      <FinancialProvider>
        <Dashboard />
      </FinancialProvider>
    );
    await importChecking(user);

    expect(screen.getByTestId('net-worth-total')).toHaveTextContent(
      '$2,494.25'
    );
    // The test clock is 15 June 2025, so the chart starts in July 2024.
    expect(screen.getByTestId('net-worth-summary')).toHaveTextContent(
      'Up $2,494.25 since the end of July 2024'
    );
    expect(screen.getByTestId('net-worth-detail')).toHaveTextContent(
      'TodayOwn $2,494.25 · Owe $0.00 · Net $2,494.25Checking$2,494.25'
    );

    // Before the June transactions the account was empty.
    await click(
      user,
      screen.getByRole('button', {
        name: 'Net worth at the end of May 2025: $0.00',
      })
    );
    expect(screen.getByTestId('net-worth-detail')).toHaveTextContent(
      'End of May 2025Own $0.00 · Owe $0.00 · Net $0.00Checking$0.00'
    );
    expect(
      screen.getByRole('button', {
        name: 'Net worth at the end of May 2025: $0.00',
      })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Net worth today: $2,494.25' })
    ).toHaveAttribute('aria-pressed', 'false');

    // An account's name opens it.
    await click(user, screen.getByRole('button', { name: 'Checking' }));
    expect(screen.getByTestId('account-name')).toHaveTextContent('Checking');
  });
});
