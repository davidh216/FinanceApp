import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

type User = ReturnType<typeof userEvent.setup>;

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

const click = async (user: User, element: HTMLElement) => {
  await act(async () => {
    await user.click(element);
  });
};

const type = async (user: User, field: HTMLElement, value: string) => {
  await act(async () => {
    await user.clear(field);
    await user.type(field, value);
  });
};

const stored = () =>
  JSON.parse(
    window.localStorage.getItem('financeapp.importedAccounts') || '[]'
  );

const addByHand = async (
  user: User,
  kind: string,
  name: string,
  amount: string
) => {
  await click(user, screen.getByRole('button', { name: /Add Account/ }));
  await click(user, screen.getByTestId('add-account-manual'));
  await act(async () => {
    await user.selectOptions(screen.getByLabelText('What is it?'), kind);
  });
  await type(user, screen.getByLabelText('Name'), name);
  await type(user, screen.getByRole('textbox', { name: /worth|owed/ }), amount);
  await click(user, screen.getByTestId('save-manual-account'));
};

describe('Accounts entered by hand', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds a house, then updates its value', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await addByHand(user, '🏠 Property', 'Home', '425,000');

    // Its page opens.
    expect(screen.getByTestId('account-name')).toHaveTextContent('Home');
    expect(screen.getByTestId('account-info')).toHaveTextContent(
      '🏠 Property • Entered by hand'
    );
    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$425,000.00'
    );
    // No statements to import for a house.
    expect(screen.queryByTestId('import-more-button')).not.toBeInTheDocument();
    expect(stored()[0]).toMatchObject({
      name: 'Home',
      balance: 425000,
      manual: true,
    });

    await click(user, screen.getByTestId('update-balance-button'));
    expect(screen.getByTestId('balance-change')).toHaveTextContent(
      'Balance on that day: $425,000.00'
    );
    await type(
      user,
      screen.getByRole('textbox', { name: 'Balance' }),
      '440000'
    );
    expect(screen.getByTestId('balance-change')).toHaveTextContent(
      "A balance update of +$15,000.00 is recorded on that day. It isn't counted as income or spending."
    );
    await click(user, screen.getByTestId('save-balance'));

    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$440,000.00'
    );
    expect(screen.getByText('⚖️ Balance update')).toBeInTheDocument();
    expect(stored()[0].transactions[0]).toMatchObject({
      amount: 15000,
      adjustment: true,
    });

    // Deleting the update undoes it.
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
    await click(
      user,
      screen.getByRole('button', { name: 'Delete Balance update' })
    );
    confirm.mockRestore();
    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$425,000.00'
    );
  });

  it('adds a loan as a debt and takes the amount owed', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await addByHand(user, '🏦 Loan', 'Car loan', '12500');

    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$12,500.00'
    );
    expect(stored()[0]).toMatchObject({ type: 'LOAN', balance: -12500 });

    await click(user, screen.getByTestId('update-balance-button'));
    const owed = screen.getByRole('textbox', { name: 'Amount owed' });
    await type(user, owed, '-5');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter the amount owed as a positive number'
    );
    expect(screen.getByTestId('save-balance')).toBeDisabled();
    // A payment brought it down.
    await type(user, owed, '12,000');
    expect(screen.getByTestId('balance-change')).toHaveTextContent(
      'Owed on that day: $12,500.00'
    );
    await click(user, screen.getByTestId('save-balance'));
    expect(stored()[0].balance).toBe(-12000);
  });

  it("won't add without a name and a valid amount", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await click(user, screen.getByRole('button', { name: /Add Account/ }));
    await click(user, screen.getByTestId('add-account-manual'));
    expect(screen.getByTestId('save-manual-account')).toBeDisabled();
    await type(user, screen.getByLabelText('Name'), 'Wallet');
    await type(
      user,
      screen.getByRole('textbox', { name: "What it's worth" }),
      'lots'
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByTestId('save-manual-account')).toBeDisabled();
    await type(
      user,
      screen.getByRole('textbox', { name: "What it's worth" }),
      '0'
    );
    expect(screen.getByTestId('save-manual-account')).toBeEnabled();
  });
});
