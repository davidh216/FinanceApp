import React from 'react';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

type User = ReturnType<typeof userEvent.setup>;

const CSV = [
  'Date,Description,Amount',
  '06/02/2025,CHEWY.COM,-60.00',
  '06/04/2025,PETCO 1234,-25.00',
  '06/05/2025,CORNER BAKERY,-8.00',
].join('\n');

const click = async (user: User, el: HTMLElement) => {
  await act(async () => {
    await user.click(el);
  });
};

const storedTxn = (description: string) =>
  JSON.parse(window.localStorage.getItem('financeapp.importedAccounts') || '[]')
    .flatMap((a: any) => a.transactions)
    .find((t: any) => t.description === description);

const row = (description: string) =>
  within(screen.getByTestId(`transaction-${storedTxn(description).id}`));

const storedCategories = () =>
  JSON.parse(
    window.localStorage.getItem('financeapp.customCategories') || '[]'
  );

// Imports the statement and leaves its account page open.
const renderWithImport = async (user: User) => {
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );
  await click(user, screen.getByRole('button', { name: /Import CSV/ }));
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([CSV], 'Card.csv', { type: 'text/csv' })
    );
  });
  await click(user, await screen.findByTestId('confirm-import'));
};

const openCategories = async (user: User) => {
  await click(user, screen.getByTestId('back-button'));
  await click(
    user,
    screen.getByRole('button', { name: 'All Transactions', exact: true })
  );
  await click(
    user,
    screen.getByRole('button', { name: /Categories and rules/ })
  );
};

describe('Custom categories', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds a category you can use, and removes it again', async () => {
    const user = userEvent.setup();
    await renderWithImport(user);
    await openCategories(user);
    const dialog = within(screen.getByRole('dialog'));

    // A built-in name is taken, whatever its case.
    await act(async () => {
      await user.type(dialog.getByLabelText('New category name'), 'groceries');
    });
    expect(dialog.getByRole('alert')).toHaveTextContent(
      "There's already a category called groceries."
    );
    expect(dialog.getByTestId('add-category')).toBeDisabled();

    await act(async () => {
      await user.clear(dialog.getByLabelText('New category name'));
      await user.type(dialog.getByLabelText('New category name'), 'Pets');
      await user.selectOptions(dialog.getByLabelText('Icon'), '🐶');
    });
    await click(user, dialog.getByTestId('add-category'));
    expect(dialog.getByTestId('custom-categories')).toHaveTextContent(
      '🐶 Pets'
    );
    expect(dialog.getByLabelText('New category name')).toHaveValue('');
    expect(storedCategories()).toEqual([{ name: 'Pets', icon: '🐶' }]);

    // It's offered for keyword rules straight away.
    await act(async () => {
      await user.type(dialog.getByLabelText('Description contains'), 'petco');
      await user.selectOptions(dialog.getByLabelText('Category'), 'Pets');
    });
    await click(user, dialog.getByTestId('add-keyword-rule'));
    expect(dialog.getByTestId('rules-list')).toHaveTextContent(
      'Contains "petco" → 🐶 Pets'
    );
    await click(user, dialog.getByRole('button', { name: 'Close' }));
    expect(row('PETCO 1234').getByTestId('category-button')).toHaveTextContent(
      '🐶Pets'
    );

    // And in each transaction's category menu.
    await click(user, row('CHEWY.COM').getByTestId('category-button'));
    await click(user, screen.getByRole('menuitem', { name: /Pets/ }));
    expect(row('CHEWY.COM').getByTestId('category-button')).toHaveTextContent(
      '🐶Pets'
    );
    expect(storedTxn('CHEWY.COM').category).toBe('Pets');

    // Removing it moves its transactions to Other and drops its rule.
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
    await click(
      user,
      screen.getByRole('button', { name: /Categories and rules/ })
    );
    await click(
      user,
      screen.getByRole('button', { name: 'Remove the Pets category' })
    );
    expect(confirm).toHaveBeenCalledWith(
      'Remove the Pets category? Its 2 transactions will become Other. Its budget and rules go too.'
    );
    confirm.mockRestore();
    expect(screen.queryByTestId('custom-categories')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rules-list')).not.toBeInTheDocument();
    expect(storedCategories()).toEqual([]);
    expect(storedTxn('CHEWY.COM').category).toBe('Other');
    expect(storedTxn('PETCO 1234').category).toBe('Other');
  });

  it('can be budgeted for', async () => {
    window.localStorage.setItem(
      'financeapp.customCategories',
      JSON.stringify([{ name: 'Pets', icon: '🐶' }])
    );
    const user = userEvent.setup();
    render(
      <FinancialProvider>
        <Dashboard />
      </FinancialProvider>
    );
    await click(user, screen.getByRole('button', { name: /Set Budget/ }));
    expect(
      within(screen.getByRole('dialog')).getByText('Pets')
    ).toBeInTheDocument();
  });
});
