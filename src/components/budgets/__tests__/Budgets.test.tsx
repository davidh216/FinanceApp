import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

const BUDGETS_KEY = 'financeapp.budgets';

// June 2025 (the test clock's month), plus one May purchase that doesn't
// count towards June's budgets.
const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '05/30/2025,AMAZON MKTPLACE,-999.00\n' +
  '06/02/2025,PAYROLL DEPOSIT,3000.00\n' +
  '06/03/2025,STARBUCKS STORE 1234,-5.75\n' +
  '06/04/2025,AMAZON MKTPLACE,-80.00\n' +
  '06/05/2025,SHELL OIL 57444,-45.00\n';

type User = ReturnType<typeof userEvent.setup>;

const renderDashboard = () =>
  render(
    <FinancialProvider>
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
  await act(async () => {
    await user.click(screen.getByTestId('back-button'));
  });
};

const openBudgets = async (user: User) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Set Budget/ }));
  });
};

const setLimit = async (user: User, category: string, value: string) => {
  const input = screen.getByLabelText(`Monthly budget for ${category}`);
  await act(async () => {
    await user.clear(input);
    if (value) await user.type(input, value);
  });
};

const save = async (user: User) => {
  await act(async () => {
    await user.click(screen.getByTestId('save-budgets'));
  });
};

describe('Monthly budgets', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("tracks this month's spending against each budget", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    expect(screen.queryByTestId('budgets-card')).not.toBeInTheDocument();

    await openBudgets(user);
    // May's $999 Amazon order isn't June spending.
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'ShoppingSpent this month: $80.00'
    );
    await setLimit(user, 'Shopping', '100');
    await setLimit(user, 'Food & Dining', '5');
    await setLimit(user, 'Transportation', '200');
    await save(user);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('budgets-card')).toHaveTextContent(
      'Budgets · June'
    );
    expect(screen.getByTestId('budgets-summary')).toHaveTextContent(
      '1 of 3 over budget'
    );
    const food = screen.getByTestId('budget-Food & Dining');
    expect(food).toHaveAttribute('data-status', 'over');
    expect(food).toHaveTextContent('$5.75 of $5.00');
    expect(food).toHaveTextContent('$0.75 over');
    const shopping = screen.getByTestId('budget-Shopping');
    expect(shopping).toHaveAttribute('data-status', 'near');
    expect(shopping).toHaveTextContent('$80.00 of $100.00');
    expect(shopping).toHaveTextContent('$20.00 left');
    expect(screen.getByTestId('budget-Transportation')).toHaveAttribute(
      'data-status',
      'ok'
    );
    // Most used first.
    expect(
      within(screen.getByTestId('budgets-card'))
        .getAllByRole('progressbar')
        .map((bar) => bar.getAttribute('aria-label'))
    ).toEqual([
      'Food & Dining budget used',
      'Shopping budget used',
      'Transportation budget used',
    ]);
  });

  it('keeps budgets after a reload, and lets you change or remove them', async () => {
    const user = userEvent.setup();
    const { unmount } = renderDashboard();
    await importChecking(user);
    await openBudgets(user);
    await setLimit(user, 'Shopping', '$1,000');
    await setLimit(user, 'Travel', '300.50');
    await save(user);
    expect(JSON.parse(window.localStorage.getItem(BUDGETS_KEY) || '')).toEqual({
      Shopping: 1000,
      Travel: 300.5,
    });
    unmount();

    renderDashboard();
    expect(screen.getByTestId('budgets-summary')).toHaveTextContent(
      'All 2 within budget'
    );

    await act(async () => {
      await user.click(
        within(screen.getByTestId('budgets-card')).getByRole('button', {
          name: 'Edit',
        })
      );
    });
    // The form starts from the saved budgets.
    expect(screen.getByLabelText('Monthly budget for Travel')).toHaveValue(
      '300.50'
    );
    await setLimit(user, 'Travel', '');
    await save(user);
    expect(screen.queryByTestId('budget-Travel')).not.toBeInTheDocument();

    await openBudgets(user);
    await setLimit(user, 'Shopping', '');
    await save(user);
    expect(screen.queryByTestId('budgets-card')).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(BUDGETS_KEY) || '')).toEqual(
      {}
    );
  });

  it('rejects amounts that are not above zero', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await openBudgets(user);
    await setLimit(user, 'Shopping', '-50');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Budgets must be amounts above zero'
    );
    expect(screen.getByTestId('save-budgets')).toBeDisabled();

    await setLimit(user, 'Shopping', 'abc');
    expect(screen.getByTestId('save-budgets')).toBeDisabled();

    await setLimit(user, 'Shopping', '50');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('save-budgets')).toBeEnabled();
  });

  it('does not offer a budget for income', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await openBudgets(user);
    expect(
      screen.queryByLabelText('Monthly budget for Income')
    ).not.toBeInTheDocument();
  });
});

describe('Budget rollover and history', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("carries last month's overspend and warns on the dashboard", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await openBudgets(user);
    await setLimit(user, 'Shopping', '500');
    await act(async () => {
      await user.click(screen.getByLabelText('Roll over Shopping'));
    });
    await save(user);

    // May went $499 over, so June's $500 has $1 left, and $80 is spent.
    const row = screen.getByTestId('budget-Shopping');
    expect(row).toHaveTextContent('$80.00 of $1.00');
    expect(screen.getByTestId('carried-Shopping')).toHaveTextContent(
      '$499.00 over last month'
    );
    expect(screen.getByTestId('over-budget-alert')).toHaveTextContent(
      'Over budget in June: Shopping by $79.00'
    );
    expect(
      JSON.parse(
        window.localStorage.getItem('financeapp.budgetRollover') || '[]'
      )
    ).toEqual(['Shopping']);
    expect(screen.getByTestId('history-Shopping')).toHaveAttribute(
      'aria-label',
      'Shopping, last six months: Jan $0.00, Feb $0.00, Mar $0.00, Apr $0.00, May $999.00, Jun $80.00'
    );

    // Without rollover, June is back to its own $500.
    await openBudgets(user);
    await act(async () => {
      await user.click(screen.getByLabelText('Roll over Shopping'));
    });
    await save(user);
    expect(screen.getByTestId('budget-Shopping')).toHaveTextContent(
      '$80.00 of $500.00'
    );
    expect(screen.queryByTestId('over-budget-alert')).not.toBeInTheDocument();
  });
});
