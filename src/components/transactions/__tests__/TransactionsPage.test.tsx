import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';
import { PAGE_SIZE } from '../TransactionsPage';

type User = ReturnType<typeof userEvent.setup>;

const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '06/02/2025,PAYROLL DEPOSIT,3000.00\n' +
  '06/03/2025,CHASE CREDIT CRD AUTOPAY,-500.00\n' +
  '06/04/2025,STARBUCKS STORE 1234,-5.75\n';

const CARD_CSV =
  'Date,Description,Amount\n' +
  '06/05/2025,PAYMENT THANK YOU,500.00\n' +
  '06/08/2025,AMAZON MKTPLACE,-80.00\n' +
  '06/12/2025,STARBUCKS #88,-4.25\n';

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

const importCsv = async (user: User, contents: string, name: string) => {
  await click(user, screen.getByRole('button', { name: /Import CSV/ }));
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([contents], `${name}.csv`, { type: 'text/csv' })
    );
  });
  await waitFor(() => {
    expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
  });
  await click(user, screen.getByTestId('confirm-import'));
  await click(user, screen.getByTestId('back-button'));
};

const openAll = async (user: User) => {
  await click(
    user,
    screen.getByRole('button', { name: /View all transactions/ })
  );
};

const rows = () =>
  within(screen.getByTestId('transaction-list')).getAllByTestId(
    /^transaction-txn/
  );

const summary = () => screen.getByTestId('transactions-summary');

describe('All transactions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('lists every account, newest first, with account names', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importCsv(user, CHECKING_CSV, 'Checking');
    await importCsv(user, CARD_CSV, 'Card');
    await openAll(user);

    expect(
      screen.getByRole('heading', { name: 'All transactions' })
    ).toBeInTheDocument();
    expect(rows()).toHaveLength(6);
    expect(rows()[0]).toHaveTextContent('2025-06-12');
    expect(rows()[0]).toHaveTextContent('Card');
    // The autopay and card payment are a transfer, not income or spending.
    expect(summary()).toHaveTextContent(
      '6 transactions · Income $3,000.00 · Spending $90.00'
    );

    await click(user, screen.getByTestId('back-button'));
    expect(
      screen.queryByRole('heading', { name: 'All transactions' })
    ).not.toBeInTheDocument();
  });

  it('searches and filters across accounts, and clears', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importCsv(user, CHECKING_CSV, 'Checking');
    await importCsv(user, CARD_CSV, 'Card');
    await openAll(user);

    await act(async () => {
      await user.type(screen.getByLabelText('Search'), 'starbucks');
    });
    // Both Starbucks purchases, one from each account.
    expect(summary()).toHaveTextContent(
      '2 transactions · Income $0.00 · Spending $10.00'
    );

    await act(async () => {
      await user.selectOptions(screen.getByLabelText('Account'), 'Card');
    });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent('STARBUCKS #88');

    await click(user, screen.getByRole('button', { name: 'Clear filters' }));
    expect(rows()).toHaveLength(6);
    expect(screen.getByLabelText('Search')).toHaveValue('');

    await act(async () => {
      await user.selectOptions(screen.getByLabelText('Category'), 'Transfers');
    });
    expect(summary()).toHaveTextContent('2 transactions');
    expect(summary()).not.toHaveTextContent('Transfers');

    await act(async () => {
      await user.selectOptions(screen.getByLabelText('Category'), '');
      await user.type(screen.getByLabelText('From'), '2025-06-05');
      await user.type(screen.getByLabelText('To'), '2025-06-08');
    });
    expect(rows().map((row) => row.textContent)).toEqual([
      expect.stringContaining('AMAZON MKTPLACE'),
      expect.stringContaining('PAYMENT THANK YOU'),
    ]);

    await act(async () => {
      await user.type(screen.getByLabelText('Search'), 'nothing like this');
    });
    expect(screen.getByTestId('transactions-empty')).toHaveTextContent(
      'No transactions match these filters.'
    );
  });

  it('opens from the Recent Activity header too, and pages long lists', async () => {
    const user = userEvent.setup();
    renderDashboard();
    // The demo has hundreds of transactions.
    await click(user, screen.getByRole('button', { name: /^View All$/ }));

    expect(rows()).toHaveLength(PAGE_SIZE);
    await click(user, screen.getByRole('button', { name: /Show 100 more/ }));
    expect(rows()).toHaveLength(PAGE_SIZE * 2);
    expect(screen.getByText(/^Showing 200 of/)).toBeInTheDocument();
  });

  it('can fix a category from the list', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importCsv(user, CHECKING_CSV, 'Checking');
    await openAll(user);

    const starbucks = rows().find((row) =>
      row.textContent?.includes('STARBUCKS')
    )!;
    await click(user, within(starbucks).getByTestId('category-button'));
    await click(user, screen.getByRole('menuitem', { name: /Entertainment/ }));

    await act(async () => {
      await user.selectOptions(
        screen.getByLabelText('Category'),
        'Entertainment'
      );
    });
    expect(rows()).toHaveLength(1);
  });
});
