import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

const STORAGE_KEY = 'financeapp.importedAccounts';

const CHASE_CSV =
  'Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\n' +
  'DEBIT,01/14/2025,STARBUCKS STORE 1234,-5.75,DEBIT_CARD,994.25,,\n' +
  'CREDIT,01/15/2025,ACME PAYROLL PPD,2500.00,ACH_CREDIT,3494.25,,\n' +
  'DEBIT,not a date,BROKEN ROW,-1.00,DEBIT_CARD,0,,\n';

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

const importFile = async (
  user: ReturnType<typeof userEvent.setup>,
  contents: string,
  fileName: string
) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Import CSV/ }));
  });
  const file = new File([contents], fileName, { type: 'text/csv' });
  await act(async () => {
    await user.upload(screen.getByTestId('csv-file-input'), file);
  });
  await waitFor(() => {
    expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
  });
};

describe('CSV import', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('previews, imports and opens the new account', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importFile(user, CHASE_CSV, 'Chase Checking.csv');

    expect(screen.getByTestId('account-name-input')).toHaveValue(
      'Chase Checking'
    );
    expect(
      screen.getByText(/2 transactions ready to import, 1 rows skipped/)
    ).toBeInTheDocument();
    // Scope to the dialog: the dashboard behind it shows random mock
    // transactions that can include the same merchant.
    expect(
      within(screen.getByRole('dialog')).getByText('Starbucks')
    ).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByTestId('confirm-import'));
    });

    expect(screen.getByTestId('account-name')).toHaveTextContent(
      'Chase Checking'
    );
    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$2,494.25'
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps imported accounts after a reload and lets you remove them', async () => {
    const user = userEvent.setup();
    const { unmount } = renderDashboard();
    await importFile(user, CHASE_CSV, 'Chase Checking.csv');
    await act(async () => {
      await user.click(screen.getByTestId('confirm-import'));
    });
    unmount();

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '');
    expect(stored).toHaveLength(1);
    expect(stored[0].transactions).toHaveLength(2);

    renderDashboard();
    for (const button of screen.getAllByRole('button', { name: /Assets/ })) {
      await act(async () => {
        await user.click(button);
      });
    }
    await act(async () => {
      await user.click(screen.getAllByText('Chase Checking')[0]);
    });

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    await act(async () => {
      await user.click(screen.getByTestId('remove-account-button'));
    });
    confirmSpy.mockRestore();

    expect(screen.queryByText('Chase Checking')).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '')).toEqual(
      []
    );
  });

  it('does not offer removal for built-in accounts', async () => {
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
    expect(screen.getByTestId('account-name')).toHaveTextContent(
      'Primary Checking'
    );
    expect(
      screen.queryByTestId('remove-account-button')
    ).not.toBeInTheDocument();
  });

  it('shows an error for a file with no transactions', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Import CSV/ }));
    });
    await act(async () => {
      await user.upload(
        screen.getByTestId('csv-file-input'),
        new File(['Date,Description,Amount\n'], 'empty.csv', {
          type: 'text/csv',
        })
      );
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No transactions found'
    );
  });
});
