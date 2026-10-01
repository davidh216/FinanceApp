import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../FinancialContext';
import { Dashboard } from '../../components/dashboard/Dashboard';
import { Account } from '../../types/financial';
import {
  AccountStore,
  LEGACY_ACCOUNTS_KEY,
  indexedDbAccountStore,
} from '../../utils/accountStore';
import { installFakeIndexedDb } from '../../testUtils/fakeIndexedDb';

type User = ReturnType<typeof userEvent.setup>;

const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '06/02/2025,PAYROLL DEPOSIT,2500.00\n' +
  '06/03/2025,STARBUCKS STORE 1234,-5.75\n';

const savings: Account = {
  id: 'acc_import_savings',
  name: 'Vacation Savings',
  type: 'SAVINGS',
  balance: 1234,
  accountNumber: 'CSV import',
  bankName: 'Imported',
  isActive: true,
  createdAt: '2025-06-01T00:00:00.000Z',
  updatedAt: '2025-06-01T00:00:00.000Z',
  transactions: [],
};

const renderApp = (accountStore?: AccountStore) =>
  render(
    <FinancialProvider accountStore={accountStore}>
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
};

const savedNames = async () =>
  ((await indexedDbAccountStore.load()) ?? []).map((acc) => acc.name);

describe('Keeping your accounts in IndexedDB', () => {
  beforeEach(() => {
    window.localStorage.clear();
    installFakeIndexedDb();
  });

  it('moves saved accounts over on first load, then saves changes there', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(LEGACY_ACCOUNTS_KEY, JSON.stringify([savings]));
    const { unmount } = renderApp();

    expect(screen.getByRole('status')).toHaveTextContent('Loading your data…');
    expect(await screen.findByTestId('net-worth-total')).toHaveTextContent(
      '$1,234.00'
    );
    expect(window.localStorage.getItem(LEGACY_ACCOUNTS_KEY)).toBeNull();
    expect(await savedNames()).toEqual(['Vacation Savings']);

    await importChecking(user);
    await waitFor(async () =>
      expect(await savedNames()).toEqual(['Vacation Savings', 'Checking'])
    );
    // Nothing goes back to localStorage.
    expect(window.localStorage.getItem(LEGACY_ACCOUNTS_KEY)).toBeNull();

    // A reload reads them back.
    unmount();
    renderApp();
    expect(await screen.findByTestId('net-worth-total')).toHaveTextContent(
      '$3,728.25'
    );
    expect(screen.queryByTestId('storage-error')).not.toBeInTheDocument();
  });

  it('warns when a change could not be saved', async () => {
    const user = userEvent.setup();
    const full: AccountStore = {
      kind: 'indexeddb',
      load: async () => [],
      save: async () => {
        throw new DOMException('Full', 'QuotaExceededError');
      },
    };
    renderApp(full);
    await screen.findByTestId('net-worth-total');
    await importChecking(user);

    expect(await screen.findByTestId('storage-error')).toHaveTextContent(
      "Your latest changes couldn't be saved in this browser"
    );
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Back up now' }));
    });
    expect(
      screen.getByRole('heading', { name: 'Export and back up' })
    ).toBeInTheDocument();
  });

  it("doesn't save over accounts that failed to load", async () => {
    const user = userEvent.setup();
    const save = jest.fn(async () => {});
    const unreadable: AccountStore = {
      kind: 'indexeddb',
      load: async () => {
        throw new Error('Unreadable');
      },
      save,
    };
    renderApp(unreadable);
    expect(await screen.findByTestId('storage-error')).toHaveTextContent(
      "Your saved accounts couldn't be loaded, so changes won't be saved"
    );
    await importChecking(user);
    expect(save).not.toHaveBeenCalled();
  });
});
