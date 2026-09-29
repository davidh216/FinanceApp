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

const uploadFile = async (
  user: ReturnType<typeof userEvent.setup>,
  contents: string,
  fileName: string
) => {
  const file = new File([contents], fileName, { type: 'text/csv' });
  await act(async () => {
    await user.upload(screen.getByTestId('csv-file-input'), file);
  });
  await waitFor(() => {
    expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
  });
};

const importFile = async (
  user: ReturnType<typeof userEvent.setup>,
  contents: string,
  fileName: string
) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Import CSV/ }));
  });
  await uploadFile(user, contents, fileName);
};

const confirmImport = async (user: ReturnType<typeof userEvent.setup>) => {
  await act(async () => {
    await user.click(screen.getByTestId('confirm-import'));
  });
};

// Opens the import dialog from an imported account's detail page.
const importMore = async (
  user: ReturnType<typeof userEvent.setup>,
  contents: string
) => {
  await act(async () => {
    await user.click(screen.getByTestId('import-more-button'));
  });
  await uploadFile(user, contents, 'next-month.csv');
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
      screen.getByText(/2 transactions ready to import, 1 row skipped/)
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

  it('shows tags added on the account page straight away', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importFile(user, CHASE_CSV, 'Chase Checking.csv');
    await confirmImport(user);

    const list = within(screen.getByTestId('transaction-list'));
    await act(async () => {
      await user.click(list.getByText('Suggest: Food & Dining'));
    });
    expect(list.queryByText('Suggest: Food & Dining')).not.toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '')[0]
        .transactions[1].tags
    ).toEqual(['Food & Dining']);
  });

  describe('into an existing account', () => {
    // Overlaps CHASE_CSV by two transactions and adds one new one.
    const NEXT_CSV =
      'Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\n' +
      'DEBIT,01/14/2025,STARBUCKS STORE 1234,-5.75,DEBIT_CARD,994.25,,\n' +
      'CREDIT,01/15/2025,ACME PAYROLL PPD,2500.00,ACH_CREDIT,3494.25,,\n' +
      'DEBIT,01/20/2025,SHELL OIL 57444,-30.00,DEBIT_CARD,3464.25,,\n';

    it('adds only new transactions and updates the balance', async () => {
      const user = userEvent.setup();
      renderDashboard();
      await importFile(user, CHASE_CSV, 'Chase Checking.csv');
      await confirmImport(user);

      await importMore(user, NEXT_CSV);
      const dialog = within(screen.getByRole('dialog'));
      expect(dialog.getByTestId('import-target')).toHaveDisplayValue(
        'Chase Checking'
      );
      expect(dialog.getByTestId('import-summary')).toHaveTextContent(
        '1 new transaction to import, 2 already in Chase Checking will be skipped.'
      );
      expect(
        dialog.queryByTestId('account-name-input')
      ).not.toBeInTheDocument();
      await confirmImport(user);

      expect(screen.getByText('Transactions (3)')).toBeInTheDocument();
      expect(screen.getByTestId('account-balance')).toHaveTextContent(
        '$2,464.25'
      );
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '');
      expect(stored).toHaveLength(1);
      expect(stored[0].transactions).toHaveLength(3);
      expect(
        new Set(stored[0].transactions.map((t: { id: string }) => t.id)).size
      ).toBe(3);
    });

    it('refuses a file that is entirely already imported', async () => {
      const user = userEvent.setup();
      renderDashboard();
      await importFile(user, CHASE_CSV, 'Chase Checking.csv');
      await confirmImport(user);

      await importMore(user, CHASE_CSV);
      expect(screen.getByTestId('import-summary')).toHaveTextContent(
        'Everything in this file is already in Chase Checking'
      );
      expect(screen.getByTestId('confirm-import')).toBeDisabled();
    });

    it('can still create a new account instead', async () => {
      const user = userEvent.setup();
      renderDashboard();
      await importFile(user, CHASE_CSV, 'Chase Checking.csv');
      await confirmImport(user);

      await importMore(user, NEXT_CSV);
      await act(async () => {
        await user.selectOptions(
          screen.getByTestId('import-target'),
          'New account'
        );
      });
      expect(screen.getByTestId('import-summary')).toHaveTextContent(
        '3 transactions ready to import'
      );
      await act(async () => {
        await user.clear(screen.getByTestId('account-name-input'));
        await user.type(screen.getByTestId('account-name-input'), 'Savings');
      });
      await confirmImport(user);

      expect(screen.getByTestId('account-name')).toHaveTextContent('Savings');
      expect(
        JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '')
      ).toHaveLength(2);
    });

    it('remembers "flip signs" for the account', async () => {
      const user = userEvent.setup();
      renderDashboard();
      await importFile(
        user,
        'Date,Description,Amount\n01/01/2025,TARGET,25.00\n',
        'Visa.csv'
      );
      await act(async () => {
        await user.click(screen.getByTestId('flip-signs'));
      });
      await confirmImport(user);

      await importMore(
        user,
        'Date,Description,Amount\n01/01/2025,TARGET,25.00\n01/02/2025,COSTCO,80.00\n'
      );
      expect(screen.getByTestId('flip-signs')).toBeChecked();
      // With the sign flipped the same way, TARGET matches the earlier import.
      expect(screen.getByTestId('import-summary')).toHaveTextContent(
        '1 new transaction to import, 1 already in Visa will be skipped'
      );
    });
  });
});
