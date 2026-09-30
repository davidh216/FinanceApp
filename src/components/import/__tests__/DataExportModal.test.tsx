import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';
import * as files from '../../../utils/files';

const STORAGE_KEY = 'financeapp.importedAccounts';

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

const importCsv = async (
  user: ReturnType<typeof userEvent.setup>,
  contents: string,
  fileName: string
) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Import CSV/ }));
  });
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
  await act(async () => {
    await user.click(screen.getByTestId('back-button'));
  });
};

const openExport = async (user: ReturnType<typeof userEvent.setup>) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Export Data/ }));
  });
};

const chooseBackup = async (
  user: ReturnType<typeof userEvent.setup>,
  contents: string
) => {
  await act(async () => {
    await user.upload(
      screen.getByTestId('backup-file-input'),
      new File([contents], 'backup.json', { type: 'application/json' })
    );
  });
};

describe('Export and backup', () => {
  let download: jest.SpyInstance;

  beforeEach(() => {
    window.localStorage.clear();
    download = jest.spyOn(files, 'downloadFile').mockImplementation(() => {});
  });

  afterEach(() => {
    download.mockRestore();
  });

  it('backs up imported accounts and restores them into a fresh browser', async () => {
    const user = userEvent.setup();
    const { unmount } = renderDashboard();
    await importCsv(user, CHECKING_CSV, 'My Checking.csv');

    await openExport(user);
    expect(screen.getByTestId('backup-summary')).toHaveTextContent(
      '1 account, 2 transactions, with their tags and transfer links.'
    );
    await act(async () => {
      await user.click(screen.getByTestId('download-backup'));
    });
    expect(download).toHaveBeenCalledTimes(1);
    const [fileName, contents, type] = download.mock.calls[0];
    expect(fileName).toBe('financeapp-backup-2025-06-15.json');
    expect(type).toBe('application/json');
    unmount();

    // A new browser: nothing saved, so only the demo shows.
    window.localStorage.clear();
    renderDashboard();
    expect(screen.getByTestId('kpi-balance')).toHaveTextContent('$123,045.85');
    await openExport(user);
    expect(screen.getByTestId('download-backup')).toBeDisabled();

    await chooseBackup(user, contents);
    expect(screen.getByTestId('restore-summary')).toHaveTextContent(
      'This backup has 1 account and 2 transactions.'
    );
    await act(async () => {
      await user.click(screen.getByTestId('confirm-restore'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('kpi-balance')).toHaveTextContent('$2,494.25');
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('My Checking');
    expect(stored[0].transactions).toHaveLength(2);
  });

  it('replaces the imported accounts you already have', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importCsv(user, CHECKING_CSV, 'My Checking.csv');
    await openExport(user);
    await act(async () => {
      await user.click(screen.getByTestId('download-backup'));
    });
    const backup = download.mock.calls[0][1];
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Close' }));
    });

    await importCsv(
      user,
      'Date,Description,Amount\n06/05/2025,DEPOSIT,100.00\n',
      'Savings.csv'
    );
    await openExport(user);
    await chooseBackup(user, backup);
    expect(screen.getByTestId('restore-summary')).toHaveTextContent(
      'Restoring replaces your 2 imported accounts.'
    );
    await act(async () => {
      await user.click(screen.getByTestId('confirm-restore'));
    });

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '');
    expect(stored.map((a: { name: string }) => a.name)).toEqual([
      'My Checking',
    ]);
  });

  it('explains why a file cannot be restored, and changes nothing', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importCsv(user, CHECKING_CSV, 'My Checking.csv');
    await openExport(user);

    await chooseBackup(user, '{"hello": "world"}');
    expect(screen.getByRole('alert')).toHaveTextContent(
      "This file isn't a FinanceApp backup."
    );
    expect(screen.queryByTestId('confirm-restore')).not.toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '')
    ).toHaveLength(1);
  });

  it('exports the transactions you are viewing as a CSV', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importCsv(user, CHECKING_CSV, 'My Checking.csv');
    await openExport(user);
    await act(async () => {
      await user.click(screen.getByTestId('export-csv'));
    });

    const [fileName, contents, type] = download.mock.calls[0];
    expect(fileName).toBe('financeapp-transactions-2025-06-15.csv');
    expect(type).toBe('text/csv');
    // Demo accounts are hidden, so only your own transactions.
    expect(contents.trim().split('\n')).toEqual([
      'Date,Account,Description,Merchant,Category,Amount,Transfer account,Tags',
      '2025-06-02,My Checking,PAYROLL DEPOSIT,Salary,Income,2500.00,,',
      '2025-06-03,My Checking,STARBUCKS STORE 1234,Starbucks,Food & Dining,-5.75,,',
    ]);
  });
});
