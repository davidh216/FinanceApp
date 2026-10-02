import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../FinancialContext';
import { FileSyncProvider } from '../FileSyncContext';
import { Dashboard } from '../../components/dashboard/Dashboard';
import { Account } from '../../types/financial';
import { createBackup } from '../../utils/backup';
import {
  FILE_SYNC_STORAGE_KEY,
  FileAccess,
  Permission,
  SyncFile,
} from '../../utils/fileSync';

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
  importSettings: { flipSigns: false },
};

// A backup holding only the savings account, "saved" at `exportedAt`.
const savingsFile = (exportedAt: string) =>
  JSON.stringify({
    ...createBackup([savings], { budgets: { Groceries: 400 } }),
    exportedAt,
  });

interface FakeFile extends SyncFile {
  contents: string;
  writes: number;
}

const fakeFile = (
  contents = '',
  permission: Permission = 'granted'
): FakeFile => {
  const file: FakeFile = {
    name: 'finance-data.json',
    contents,
    writes: 0,
    queryPermission: async () => permission,
    requestPermission: async () => 'granted',
    read: async () => file.contents,
    write: async (text: string) => {
      file.contents = text;
      file.writes += 1;
    },
  };
  return file;
};

const fakeAccess = (
  options: { remembered?: SyncFile; picked?: SyncFile } = {}
): FileAccess & { remembered: SyncFile | null } => {
  const access = {
    supported: true,
    remembered: options.remembered ?? null,
    pickNewFile: async () => options.picked ?? null,
    pickExistingFile: async () => options.picked ?? null,
    loadRememberedFile: async () => access.remembered,
    rememberFile: async (file: SyncFile | null) => {
      access.remembered = file;
    },
  };
  return access;
};

const renderApp = (fileAccess: FileAccess) =>
  render(
    <FinancialProvider>
      <FileSyncProvider fileAccess={fileAccess}>
        <Dashboard />
      </FileSyncProvider>
    </FinancialProvider>
  );

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

const openData = (user: User) =>
  click(user, screen.getByRole('button', { name: /Export Data/ }));

const saved = (file: FakeFile) => JSON.parse(file.contents);

// The accounts this browser now holds.
const browserAccounts = () =>
  JSON.parse(
    window.localStorage.getItem('financeapp.importedAccounts') || '[]'
  ).map((a: Account) => a.name);

const setMeta = (lastSyncedAt: string, pending: boolean) =>
  window.localStorage.setItem(
    FILE_SYNC_STORAGE_KEY,
    JSON.stringify({ lastSyncedAt, pending })
  );

describe('Auto-saving to a file', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("explains when the browser can't save to files", async () => {
    const user = userEvent.setup();
    renderApp({ ...fakeAccess(), supported: false });
    await openData(user);
    expect(screen.getByText(/Open FinanceApp in Chrome or Edge/)).toBeVisible();
    expect(screen.queryByTestId('sync-indicator')).not.toBeInTheDocument();
  });

  it('saves to a new file, then saves every change', async () => {
    const user = userEvent.setup();
    const file = fakeFile();
    const access = fakeAccess({ picked: file });
    renderApp(access);
    await importChecking(user);
    await openData(user);
    await click(user, screen.getByTestId('sync-create'));

    expect(saved(file).accounts.map((a: Account) => a.name)).toEqual([
      'Checking',
    ]);
    expect(access.remembered).toBe(file);
    expect(screen.getByTestId('sync-summary')).toHaveTextContent(
      'Every change is saved to finance-data.json. Last saved'
    );
    expect(screen.getByTestId('sync-indicator')).toHaveTextContent(
      'Saved to file'
    );

    // A change reaches the file shortly after.
    await click(user, screen.getByRole('button', { name: 'Close' }));
    await click(user, screen.getByTestId('demo-toggle'));
    await waitFor(() =>
      expect(saved(file).settings.showDemoAccounts).toBe(true)
    );

    // So does a new savings goal.
    await click(user, screen.getByRole('button', { name: 'Add a goal' }));
    const goalName = screen.getByLabelText('Name');
    const goalTarget = screen.getByLabelText('Target');
    await act(async () => {
      await user.type(goalName, 'Emergency fund');
      await user.type(goalTarget, '10000');
    });
    await click(user, screen.getByTestId('save-goal'));
    await waitFor(() =>
      expect(saved(file).settings.goals).toEqual([
        expect.objectContaining({ name: 'Emergency fund', target: 10000 }),
      ])
    );
    expect(
      JSON.parse(window.localStorage.getItem(FILE_SYNC_STORAGE_KEY) || '')
    ).toEqual({ lastSyncedAt: saved(file).exportedAt, pending: false });
  });

  it('opens an existing file and uses its data', async () => {
    const user = userEvent.setup();
    const file = fakeFile(savingsFile('2025-06-10T08:00:00.000Z'));
    renderApp(fakeAccess({ picked: file }));
    await openData(user);
    await click(user, screen.getByTestId('sync-open'));

    expect(screen.getByTestId('sync-summary')).toHaveTextContent(
      'Every change is saved to finance-data.json'
    );
    await click(user, screen.getByRole('button', { name: 'Close' }));
    expect(browserAccounts()).toEqual(['Vacation Savings']);
    expect(
      JSON.parse(window.localStorage.getItem('financeapp.budgets') || '')
    ).toEqual({ Groceries: 400 });
  });

  it("asks before an existing file replaces this browser's accounts", async () => {
    const user = userEvent.setup();
    const file = fakeFile(savingsFile('2025-06-10T08:00:00.000Z'));
    renderApp(fakeAccess({ picked: file }));
    await importChecking(user);
    await openData(user);
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
    await click(user, screen.getByTestId('sync-open'));
    expect(confirm).toHaveBeenCalledWith(
      'Use finance-data.json? Its 1 account replace the 1 account in this browser.'
    );
    confirm.mockRestore();
    // Nothing changed.
    expect(screen.getByTestId('sync-create')).toBeInTheDocument();
    expect(file.writes).toBe(0);
  });

  it("won't use a file that isn't FinanceApp data", async () => {
    const user = userEvent.setup();
    renderApp(fakeAccess({ picked: fakeFile('{"hello": 1}') }));
    await openData(user);
    await click(user, screen.getByTestId('sync-open'));
    expect(screen.getByRole('alert')).toHaveTextContent(
      "That file isn't a FinanceApp data file."
    );
    expect(screen.getByTestId('sync-create')).toBeInTheDocument();
  });

  it('reconnects after a restart and loads a file changed elsewhere', async () => {
    const user = userEvent.setup();
    setMeta('2025-06-01T00:00:00.000Z', false);
    const file = fakeFile(savingsFile('2025-06-12T00:00:00.000Z'), 'prompt');
    renderApp(fakeAccess({ remembered: file }));

    const reconnect = await screen.findByRole('button', {
      name: /Reconnect file/,
    });
    await click(user, reconnect);
    expect(browserAccounts()).toEqual(['Vacation Savings']);
    expect(screen.getByTestId('sync-indicator')).toHaveTextContent(
      'Saved to file'
    );
  });

  it("reconnects and saves this browser's changes to an unchanged file", async () => {
    const user = userEvent.setup();
    const file = fakeFile(savingsFile('2025-06-12T00:00:00.000Z'), 'prompt');
    setMeta('2025-06-12T00:00:00.000Z', false);
    renderApp(fakeAccess({ remembered: file }));
    await screen.findByRole('button', { name: /Reconnect file/ });

    // Changed while the file wasn't connected.
    await importChecking(user);
    await click(user, screen.getByRole('button', { name: /Reconnect file/ }));
    expect(saved(file).accounts.map((a: Account) => a.name)).toEqual([
      'Checking',
    ]);
  });

  it('lets you choose when both the file and this browser changed', async () => {
    const user = userEvent.setup();
    const file = fakeFile(savingsFile('2025-06-12T00:00:00.000Z'));
    setMeta('2025-06-01T00:00:00.000Z', true);
    renderApp(fakeAccess({ remembered: file }));

    const indicator = await screen.findByRole('button', {
      name: /File changed/,
    });
    await click(user, indicator);
    expect(screen.getByTestId('sync-conflict')).toHaveTextContent(
      'finance-data.json was changed somewhere else'
    );
    await click(user, screen.getByTestId('keep-file'));
    expect(browserAccounts()).toEqual(['Vacation Savings']);
    expect(screen.getByTestId('sync-indicator')).toHaveTextContent(
      'Saved to file'
    );
  });

  it('stops auto-saving and forgets the file', async () => {
    const user = userEvent.setup();
    const file = fakeFile(savingsFile('2025-06-12T00:00:00.000Z'));
    setMeta('2025-06-12T00:00:00.000Z', false);
    const access = fakeAccess({ remembered: file });
    renderApp(access);
    await screen.findByText('Saved to file');

    await openData(user);
    await click(user, screen.getByTestId('sync-stop'));
    expect(access.remembered).toBeNull();
    expect(window.localStorage.getItem(FILE_SYNC_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId('sync-create')).toBeInTheDocument();
    expect(screen.queryByTestId('sync-indicator')).not.toBeInTheDocument();
  });
});
