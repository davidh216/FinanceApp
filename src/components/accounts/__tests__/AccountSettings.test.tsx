import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

type User = ReturnType<typeof userEvent.setup>;

// A card exported like a bank account: $500 left as a positive balance.
const CARD_CSV =
  'Date,Description,Amount\n06/03/2025,STARBUCKS STORE 1234,-5.75\n';

const click = async (user: User, element: HTMLElement) => {
  await act(async () => {
    await user.click(element);
  });
};

const stored = () =>
  JSON.parse(
    window.localStorage.getItem('financeapp.importedAccounts') || '[]'
  );

const importAsChecking = async (user: User) => {
  await click(user, screen.getByRole('button', { name: /Import CSV/ }));
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([CARD_CSV], 'Visa.csv', { type: 'text/csv' })
    );
  });
  await waitFor(() => {
    expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
  });
  await act(async () => {
    await user.type(screen.getByLabelText(/Current balance/), '500');
  });
  await click(user, screen.getByTestId('confirm-import'));
};

const openSettings = (user: User) =>
  click(user, screen.getByTestId('account-settings-button'));

describe('Account settings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renames an account and fixes its type', async () => {
    const user = userEvent.setup();
    render(
      <FinancialProvider>
        <Dashboard />
      </FinancialProvider>
    );
    await importAsChecking(user);
    expect(screen.getByTestId('account-balance')).toHaveTextContent('$500.00');

    await openSettings(user);
    const name = screen.getByLabelText('Name');
    await act(async () => {
      await user.clear(name);
      await user.type(name, 'Visa card');
      await user.selectOptions(screen.getByLabelText('Type'), 'Credit card');
    });
    expect(screen.getByTestId('type-change-note')).toHaveTextContent(
      'Its balance will count as $500.00 owed, a debt in your net worth.'
    );
    await click(user, screen.getByTestId('save-account-settings'));

    expect(screen.getByTestId('account-name')).toHaveTextContent('Visa card');
    expect(screen.getByTestId('account-balance')).toHaveTextContent('$500.00');
    expect(stored()[0]).toMatchObject({
      name: 'Visa card',
      type: 'CREDIT',
      balance: -500,
    });
  });

  it('hides a closed account from lists but keeps its history', async () => {
    const user = userEvent.setup();
    render(
      <FinancialProvider>
        <Dashboard />
      </FinancialProvider>
    );
    await importAsChecking(user);
    await openSettings(user);
    await click(user, screen.getByLabelText(/This account is closed/));
    await click(user, screen.getByTestId('save-account-settings'));
    expect(screen.getByTestId('account-info')).toHaveTextContent('Closed');
    expect(stored()[0].isActive).toBe(false);

    await click(user, screen.getByTestId('back-button'));
    // Gone from the overview, which now lists nothing, until asked for.
    expect(
      screen.queryByRole('button', { name: /Assets/ })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('toggle-closed-accounts')).toHaveTextContent(
      'Show 1 closed account'
    );
    await click(user, screen.getByTestId('toggle-closed-accounts'));
    expect(screen.getByRole('button', { name: /Assets/ })).toBeInTheDocument();
    // Its balance still counts.
    expect(screen.getByTestId('net-worth-total')).toHaveTextContent('$500.00');

    // Not offered when adding a transaction.
    await click(user, screen.getByRole('button', { name: /Add Transaction/ }));
    expect(screen.getByTestId('add-needs-account')).toBeInTheDocument();
  });
});
