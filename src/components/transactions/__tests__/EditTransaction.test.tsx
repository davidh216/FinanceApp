import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

const STORAGE_KEY = 'financeapp.importedAccounts';

type User = ReturnType<typeof userEvent.setup>;

// Ending balance $2,494.25.
const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '06/02/2025,PAYROLL DEPOSIT,2500.00\n' +
  '06/03/2025,STARBUCKS STORE 1234,-5.75\n';

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

// Imports the account and leaves its page open.
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
};

const fill = async (user: User, label: string, value: string) => {
  const field = screen.getByLabelText(label);
  await act(async () => {
    await user.clear(field);
    await user.type(field, value);
  });
};

const stored = () =>
  JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '')[0];

const openEdit = async (user: User, name: string) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: `Edit ${name}` }));
  });
};

const saveEdit = async (user: User) => {
  await act(async () => {
    await user.click(screen.getByTestId('save-edit'));
  });
};

const storedTxn = (description: string) =>
  stored().transactions.find(
    (t: { description: string }) => t.description === description
  );

describe('Editing transactions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renames an imported transaction and adds a note', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await openEdit(user, 'Starbucks');

    // What the bank reported is shown, not editable.
    expect(screen.getByTestId('imported-details')).toHaveTextContent(
      'STARBUCKS STORE 1234-$5.752025-06-03'
    );
    expect(screen.queryByLabelText('Date')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Amount')).not.toBeInTheDocument();
    // Blank while it's the usual name.
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'placeholder',
      'Starbucks'
    );

    await fill(user, 'Name', 'Morning coffee');
    await fill(user, 'Note', 'With Sam from work');
    await saveEdit(user);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Morning coffee')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-note')).toHaveTextContent(
      'With Sam from work'
    );
    expect(storedTxn('STARBUCKS STORE 1234')).toMatchObject({
      amount: -5.75,
      notes: 'With Sam from work',
      cleanMerchant: { cleanName: 'Morning coffee' },
    });
    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$2,494.25'
    );

    // Opening it again shows what you saved.
    await openEdit(user, 'Morning coffee');
    expect(screen.getByLabelText('Name')).toHaveValue('Morning coffee');
    expect(screen.getByLabelText('Note')).toHaveValue('With Sam from work');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('fixes a transaction you added by hand', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await act(async () => {
      await user.click(screen.getByTestId('add-transaction-button'));
    });
    await fill(user, 'Description', 'Farmrs market');
    await fill(user, 'Amount', '23.50');
    await act(async () => {
      await user.click(screen.getByTestId('save-transaction'));
    });
    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$2,470.75'
    );

    await openEdit(user, 'Farmrs Market');
    expect(screen.getByLabelText('Amount')).toHaveValue('23.50');
    await fill(user, 'Date', '2025-06-01');
    await fill(user, 'Description', 'Farmers market');
    await fill(user, 'Amount', '30');
    // The name follows the description you fixed.
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'placeholder',
      'Farmers Market'
    );
    await saveEdit(user);

    expect(screen.getByText('Farmers Market')).toBeInTheDocument();
    expect(screen.queryByText('Farmrs Market')).not.toBeInTheDocument();
    expect(storedTxn('Farmers market')).toMatchObject({
      date: '2025-06-01',
      amount: -30,
      manual: true,
    });
    // 23.50 out became 30.00 out.
    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$2,464.25'
    );

    await openEdit(user, 'Farmers Market');
    await fill(user, 'Amount', '0');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter an amount above zero'
    );
    expect(screen.getByTestId('save-edit')).toBeDisabled();
  });
});
