import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

const STORAGE_KEY = 'financeapp.importedAccounts';

const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '06/02/2025,PAYROLL DEPOSIT,3000.00\n' +
  '06/03/2025,CHASE CREDIT CRD AUTOPAY,-500.00\n' +
  '06/04/2025,STARBUCKS STORE 1234,-5.75\n' +
  '06/06/2025,VENMO CASHOUT,300.00\n';

// The card statement shows the checking account's autopay arriving.
const CARD_CSV =
  'Date,Description,Amount\n' +
  '06/04/2025,AMAZON MKTPLACE,-80.00\n' +
  '06/05/2025,PAYMENT THANK YOU,500.00\n';

type User = ReturnType<typeof userEvent.setup>;

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

const uploadCsv = async (user: User, contents: string, fileName: string) => {
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([contents], fileName, { type: 'text/csv' })
    );
  });
  await waitFor(() => {
    expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
  });
  await act(async () => {
    await user.click(screen.getByTestId('confirm-import'));
  });
};

// Imports a new account and leaves its page open.
const importAccount = async (user: User, contents: string, name: string) => {
  if (screen.queryByTestId('back-button')) {
    await act(async () => {
      await user.click(screen.getByTestId('back-button'));
    });
  }
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Import CSV/ }));
  });
  await uploadCsv(user, contents, `${name}.csv`);
};

const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '');

const storedTxn = (description: string) =>
  stored()
    .flatMap((a: any) => a.transactions)
    .find((t: any) => t.description === description);

const row = (description: string) => {
  const txn = storedTxn(description);
  return within(screen.getByTestId(`transaction-${txn.id}`));
};

const openMenu = async (user: User, description: string) => {
  await act(async () => {
    await user.click(row(description).getByTestId('category-button'));
  });
};

const pick = async (user: User, name: string | RegExp) => {
  await act(async () => {
    await user.click(screen.getByRole('menuitem', { name }));
  });
};

describe('Fixing categories and transfers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('changes a category, and keeps it through a re-import', async () => {
    const user = userEvent.setup();
    const { unmount } = renderDashboard();
    await importAccount(user, CHECKING_CSV, 'Checking');

    expect(
      row('STARBUCKS STORE 1234').getByTestId('category-button')
    ).toHaveTextContent('Food & Dining');
    await openMenu(user, 'STARBUCKS STORE 1234');
    await pick(user, /Entertainment/);

    expect(
      row('STARBUCKS STORE 1234').getByTestId('category-button')
    ).toHaveTextContent('Entertainment');
    expect(storedTxn('STARBUCKS STORE 1234').category).toBe('Entertainment');

    // Importing the same statement again skips it as a duplicate, so the
    // choice survives.
    await act(async () => {
      await user.click(screen.getByTestId('import-more-button'));
    });
    await uploadCsv(user, CHECKING_CSV, 'Checking.csv');
    unmount();

    expect(storedTxn('STARBUCKS STORE 1234').category).toBe('Entertainment');
    expect(stored()[0].transactions).toHaveLength(4);
  });

  it('unlinks a wrong transfer on both sides and counts it again', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importAccount(user, CHECKING_CSV, 'Checking');
    await importAccount(user, CARD_CSV, 'Card');

    expect(
      row('PAYMENT THANK YOU').getByTestId('category-button')
    ).toHaveTextContent('Transfer');
    expect(screen.getByTestId('stat-transfers')).toHaveTextContent('+$500.00');
    // "Transfer" isn't a tag, so it isn't suggested as one.
    expect(row('PAYMENT THANK YOU').queryByText(/Suggest:/)).toBeNull();

    await openMenu(user, 'PAYMENT THANK YOU');
    expect(screen.getByRole('menu')).toHaveTextContent(
      'Transfer with Checking'
    );
    await pick(user, 'Not a transfer');

    expect(
      row('PAYMENT THANK YOU').getByTestId('category-button')
    ).toHaveTextContent('Income');
    expect(screen.queryByTestId('stat-transfers')).not.toBeInTheDocument();
    expect(screen.getByTestId('stat-income')).toHaveTextContent('$500.00');
    // The checking side is unlinked too, and neither is matched again.
    for (const description of [
      'PAYMENT THANK YOU',
      'CHASE CREDIT CRD AUTOPAY',
    ]) {
      expect(storedTxn(description).transferAccountId).toBeUndefined();
      expect(storedTxn(description).notTransfer).toBe(true);
    }
  });

  it('marks a missed transfer, including with an account not in the app', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importAccount(user, CHECKING_CSV, 'Checking');

    expect(screen.getByTestId('stat-income')).toHaveTextContent('$3,300.00');
    await openMenu(user, 'VENMO CASHOUT');
    await pick(user, /Transfer with an account not in FinanceApp/);

    expect(
      row('VENMO CASHOUT').getByTestId('category-button')
    ).toHaveTextContent('Transfer');
    expect(screen.getByTestId('stat-income')).toHaveTextContent('$3,000.00');
    expect(screen.getByTestId('stat-transfers')).toHaveTextContent('+$300.00');
    expect(storedTxn('VENMO CASHOUT').transferAccountId).toBe('external');
  });

  it('marks a transfer with another imported account on both sides', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importAccount(user, CHECKING_CSV, 'Checking');
    await importAccount(user, CARD_CSV, 'Card');
    await openMenu(user, 'PAYMENT THANK YOU');
    await pick(user, 'Not a transfer');

    await openMenu(user, 'PAYMENT THANK YOU');
    await pick(user, /Transfer with Checking/);

    const checking = stored().find((a: any) => a.name === 'Checking');
    const card = stored().find((a: any) => a.name === 'Card');
    expect(storedTxn('PAYMENT THANK YOU').transferAccountId).toBe(checking.id);
    expect(storedTxn('CHASE CREDIT CRD AUTOPAY').transferAccountId).toBe(
      card.id
    );
  });

  it('lets you recategorise demo transactions but not change their transfers', async () => {
    const user = userEvent.setup();
    renderDashboard();
    for (const button of screen.getAllByRole('button', { name: /Assets/ })) {
      await act(async () => {
        await user.click(button);
      });
    }
    await act(async () => {
      await user.click(screen.getAllByText('Primary Checking')[0]);
    });

    const list = within(screen.getByTestId('transaction-list'));
    const buttons = list.getAllByTestId('category-button');
    const loanPayment = buttons.find((b) =>
      b.textContent?.includes('Transfer')
    );
    expect(loanPayment).toBeDisabled();

    const other = buttons.find((b) => !b.textContent?.includes('Transfer'))!;
    await act(async () => {
      await user.click(other);
    });
    expect(screen.getByRole('menu')).not.toHaveTextContent(
      'A transfer between your own accounts'
    );
  });
});
