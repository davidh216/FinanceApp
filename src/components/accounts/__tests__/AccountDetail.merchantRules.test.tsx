import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

const ACCOUNTS_KEY = 'financeapp.importedAccounts';
const RULES_KEY = 'financeapp.categoryRules';

type User = ReturnType<typeof userEvent.setup>;

// Three Starbucks purchases under two descriptions, and one from Amazon.
const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '06/01/2025,STARBUCKS STORE 1234,-5.75\n' +
  '06/03/2025,STARBUCKS #88,-4.25\n' +
  '06/05/2025,STARBUCKS STORE 1234,-6.00\n' +
  '06/06/2025,AMAZON MKTPLACE,-80.00\n';

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

const uploadCsv = async (user: User, contents: string) => {
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([contents], 'Checking.csv', { type: 'text/csv' })
    );
  });
  await waitFor(() => {
    expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
  });
};

const importChecking = async (user: User) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Import CSV/ }));
  });
  await uploadCsv(user, CHECKING_CSV);
  await act(async () => {
    await user.click(screen.getByTestId('confirm-import'));
  });
};

const stored = () =>
  JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || '')[0].transactions;

const categoryOf = (date: string) =>
  stored().find((t: { date: string }) => t.date === date).category;

const openMenu = async (user: User, date: string) => {
  const id = stored().find((t: { date: string }) => t.date === date).id;
  await act(async () => {
    await user.click(
      within(screen.getByTestId(`transaction-${id}`)).getByTestId(
        'category-button'
      )
    );
  });
};

const choose = async (user: User, category: RegExp) => {
  await act(async () => {
    await user.click(screen.getByRole('menuitem', { name: category }));
  });
};

describe('Remembering categories per merchant', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('changes every transaction from the merchant when asked', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await openMenu(user, '2025-06-01');

    const menu = within(screen.getByRole('menu'));
    expect(menu.getByTestId('apply-to-merchant')).not.toBeChecked();
    expect(
      menu.getByText(/Use for every Starbucks transaction/)
    ).toHaveTextContent('2 others, and future imports');
    await act(async () => {
      await user.click(menu.getByTestId('apply-to-merchant'));
    });
    await choose(user, /Entertainment/);

    expect(categoryOf('2025-06-01')).toBe('Entertainment');
    expect(categoryOf('2025-06-03')).toBe('Entertainment');
    expect(categoryOf('2025-06-05')).toBe('Entertainment');
    expect(categoryOf('2025-06-06')).toBe('Shopping');
    expect(JSON.parse(window.localStorage.getItem(RULES_KEY) || '')).toEqual({
      starbucks: 'Entertainment',
    });
  });

  it('changes just the one transaction by default', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await openMenu(user, '2025-06-01');
    await choose(user, /Entertainment/);

    expect(categoryOf('2025-06-01')).toBe('Entertainment');
    expect(categoryOf('2025-06-03')).toBe('Food & Dining');
    expect(window.localStorage.getItem(RULES_KEY)).toBeNull();
  });

  it('applies the remembered category to later imports', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await openMenu(user, '2025-06-01');
    await act(async () => {
      await user.click(screen.getByTestId('apply-to-merchant'));
    });
    await choose(user, /Entertainment/);

    await act(async () => {
      await user.click(screen.getByTestId('import-more-button'));
    });
    await uploadCsv(
      user,
      'Date,Description,Amount\n06/10/2025,STARBUCKS STORE 999,-3.50\n'
    );
    // The preview already shows it as it will be saved.
    expect(
      within(screen.getByRole('dialog')).getByText('Entertainment')
    ).toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByTestId('confirm-import'));
    });
    expect(categoryOf('2025-06-10')).toBe('Entertainment');
  });

  it('shows a remembered choice, and can forget it', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await openMenu(user, '2025-06-01');
    await act(async () => {
      await user.click(screen.getByTestId('apply-to-merchant'));
    });
    await choose(user, /Entertainment/);

    await openMenu(user, '2025-06-03');
    // A remembered merchant keeps its rule unless you untick it.
    expect(screen.getByTestId('apply-to-merchant')).toBeChecked();
    expect(screen.getByTestId('merchant-rule')).toHaveTextContent(
      'Starbucks is always Entertainment'
    );
    await act(async () => {
      await user.click(screen.getByRole('menuitem', { name: 'Forget' }));
    });

    expect(JSON.parse(window.localStorage.getItem(RULES_KEY) || '')).toEqual(
      {}
    );
    // Categories already set stay as they are.
    expect(categoryOf('2025-06-03')).toBe('Entertainment');
    await openMenu(user, '2025-06-03');
    expect(screen.getByTestId('apply-to-merchant')).not.toBeChecked();
    expect(screen.queryByTestId('merchant-rule')).not.toBeInTheDocument();
  });
});
