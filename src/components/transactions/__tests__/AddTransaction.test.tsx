import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
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

const openForm = async (user: User) => {
  await act(async () => {
    await user.click(screen.getByTestId('add-transaction-button'));
  });
};

const save = async (user: User) => {
  await act(async () => {
    await user.click(screen.getByTestId('save-transaction'));
  });
};

describe('Adding transactions by hand', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds money out to the account and its balance', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await openForm(user);

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByLabelText('Account')).toHaveDisplayValue('Checking');
    // Defaults to today, the test clock's 15 June.
    expect(dialog.getByLabelText('Date')).toHaveValue('2025-06-15');
    await fill(user, 'Date', '2025-06-10');
    await fill(user, 'Description', 'Farmers market');
    await fill(user, 'Amount', '23.50');
    // Nothing to go on, so Other; you can pick something better.
    expect(dialog.getByLabelText('Category')).toHaveDisplayValue('📝 Other');
    await act(async () => {
      await user.selectOptions(dialog.getByLabelText('Category'), 'Groceries');
    });
    await save(user);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$2,470.75'
    );
    expect(screen.getByText('Transactions (3)')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
    const added = stored().transactions.find(
      (t: { description: string }) => t.description === 'Farmers market'
    );
    expect(added).toMatchObject({
      date: '2025-06-10',
      amount: -23.5,
      category: 'Groceries',
      manual: true,
    });
    expect(stored().balance).toBe(2470.75);
  });

  it('suggests a category as you type, and handles money in', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await openForm(user);

    await fill(user, 'Description', 'Starbucks');
    expect(screen.getByLabelText('Category')).toHaveDisplayValue(
      '🍔 Food & Dining'
    );
    await fill(user, 'Description', 'Cash gift from Grandma');
    await act(async () => {
      await user.click(screen.getByRole('radio', { name: 'Money in' }));
    });
    expect(screen.getByLabelText('Category')).toHaveDisplayValue('💰 Income');
    await fill(user, 'Amount', '$1,000');
    await save(user);

    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$3,494.25'
    );
  });

  it('will not save without a valid amount', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await openForm(user);
    await fill(user, 'Description', 'Lunch');
    expect(screen.getByTestId('save-transaction')).toBeDisabled();

    await fill(user, 'Amount', '-12');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter an amount above zero'
    );
    expect(screen.getByTestId('save-transaction')).toBeDisabled();

    await fill(user, 'Amount', '12');
    expect(screen.getByTestId('save-transaction')).toBeEnabled();
  });

  it('deletes a manual transaction and restores the balance', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await openForm(user);
    await fill(user, 'Description', 'Farmers market');
    await fill(user, 'Amount', '23.50');
    await save(user);

    // Imported transactions can't be deleted one by one.
    expect(screen.getAllByRole('button', { name: /^Delete / })).toHaveLength(1);
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    await act(async () => {
      await user.click(
        screen.getByRole('button', { name: 'Delete Farmers market' })
      );
    });
    confirmSpy.mockRestore();

    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$2,494.25'
    );
    expect(stored().transactions).toHaveLength(2);
    expect(screen.queryByText('Manual')).not.toBeInTheDocument();
  });

  it('adds from the dashboard too, and explains when there is nowhere to add', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Add Transaction/ }));
    });
    expect(screen.getByTestId('add-needs-account')).toHaveTextContent(
      'import a CSV from your bank first'
    );
    await act(async () => {
      // The footer's Close; the ✕ in the corner is labelled the same.
      await user.click(screen.getAllByRole('button', { name: 'Close' })[1]);
    });

    await importChecking(user);
    await act(async () => {
      await user.click(screen.getByTestId('back-button'));
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Add Transaction/ }));
    });
    await fill(user, 'Description', 'Parking');
    await fill(user, 'Amount', '4.25');
    await save(user);
    // This month's spending on the dashboard includes it.
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent('$10.00');
  });
});
