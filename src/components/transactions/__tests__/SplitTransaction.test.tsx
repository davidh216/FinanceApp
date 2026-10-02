import React from 'react';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

type User = ReturnType<typeof userEvent.setup>;

// The test clock is 15 June 2025.
const CSV = [
  'Date,Description,Amount',
  '06/02/2025,TARGET 00012345,-100.00',
  '06/04/2025,CORNER BAKERY,-8.00',
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

const openSplit = async (user: User) => {
  await click(user, row('TARGET 00012345').getByTestId('category-button'));
  await click(
    user,
    screen.getByRole('menuitem', { name: /Split between|Change the split/ })
  );
};

describe('Splitting a transaction', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('divides it between categories, and counts each part', async () => {
    const user = userEvent.setup();
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
    const category = storedTxn('TARGET 00012345').category;

    await openSplit(user);
    const dialog = within(
      screen.getByRole('dialog', { name: 'Split between categories' })
    );
    // It starts with everything in the current category.
    expect(dialog.getByLabelText('Part 1 category')).toHaveValue(category);
    expect(dialog.getByLabelText('Part 1 amount')).toHaveValue('100.00');
    expect(dialog.getByTestId('save-split')).toBeDisabled();

    await act(async () => {
      await user.clear(dialog.getByLabelText('Part 1 amount'));
      await user.type(dialog.getByLabelText('Part 1 amount'), '30');
    });
    expect(dialog.getByTestId('split-remaining')).toHaveTextContent(
      '$70.00 left to assign'
    );
    await act(async () => {
      await user.selectOptions(
        dialog.getByLabelText('Part 2 category'),
        'Groceries'
      );
      await user.type(dialog.getByLabelText('Part 2 amount'), '70');
    });
    expect(dialog.getByTestId('split-remaining')).toHaveTextContent(
      'All $100.00 assigned'
    );
    await click(user, dialog.getByTestId('save-split'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      row('TARGET 00012345').getByTestId('category-button')
    ).toHaveTextContent('✂️Split ▾');
    expect(storedTxn('TARGET 00012345').splits).toEqual([
      { category, amount: -30 },
      { category: 'Groceries', amount: -70 },
    ]);

    // The spending report counts each part in its own category.
    await click(user, screen.getByTestId('back-button'));
    await click(user, screen.getByRole('button', { name: /Generate Report/ }));
    expect(
      within(screen.getByTestId('report-row-Groceries')).getAllByRole('cell')[1]
    ).toHaveTextContent('$70.00');
    expect(screen.getByTestId('report-total')).toHaveTextContent('$108.00');
  });

  it('can be changed and undone', async () => {
    const user = userEvent.setup();
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

    await openSplit(user);
    let dialog = within(screen.getByRole('dialog'));
    await act(async () => {
      await user.clear(dialog.getByLabelText('Part 1 amount'));
      await user.type(dialog.getByLabelText('Part 1 amount'), '40');
      await user.selectOptions(
        dialog.getByLabelText('Part 2 category'),
        'Travel'
      );
      await user.type(dialog.getByLabelText('Part 2 amount'), '50');
    });
    // A third part starts with what's left.
    await click(user, dialog.getByRole('button', { name: /Add a part/ }));
    expect(dialog.getByLabelText('Part 3 amount')).toHaveValue('10.00');
    await act(async () => {
      await user.selectOptions(
        dialog.getByLabelText('Part 3 category'),
        'Travel'
      );
    });
    expect(dialog.getByRole('alert')).toHaveTextContent(
      'Use each category once.'
    );
    await act(async () => {
      await user.selectOptions(
        dialog.getByLabelText('Part 3 category'),
        'Groceries'
      );
    });
    await click(user, dialog.getByTestId('save-split'));
    expect(storedTxn('TARGET 00012345').splits).toHaveLength(3);

    // Reopening shows the parts; undoing keeps the largest one's category.
    await openSplit(user);
    dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByLabelText('Part 2 amount')).toHaveValue('50.00');
    await click(user, dialog.getByRole('button', { name: 'Undo split' }));
    expect(storedTxn('TARGET 00012345').splits).toBeUndefined();
    expect(storedTxn('TARGET 00012345').category).toBe('Travel');

    // Choosing one category from the menu also ends a split.
    await openSplit(user);
    dialog = within(screen.getByRole('dialog'));
    await act(async () => {
      await user.clear(dialog.getByLabelText('Part 1 amount'));
      await user.type(dialog.getByLabelText('Part 1 amount'), '60');
      await user.selectOptions(
        dialog.getByLabelText('Part 2 category'),
        'Groceries'
      );
      await user.type(dialog.getByLabelText('Part 2 amount'), '40');
    });
    await click(user, dialog.getByTestId('save-split'));
    await click(user, row('TARGET 00012345').getByTestId('category-button'));
    await click(user, screen.getByRole('menuitem', { name: /Entertainment/ }));
    expect(storedTxn('TARGET 00012345').splits).toBeUndefined();
    expect(storedTxn('TARGET 00012345').category).toBe('Entertainment');
  });
});
