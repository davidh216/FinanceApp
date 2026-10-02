import React from 'react';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

type User = ReturnType<typeof userEvent.setup>;

const CSV = [
  'Date,Description,Amount',
  '06/02/2025,AMZN Mktp US*2K4,-25.00',
  '06/04/2025,AMZN Mktp US*7Q1,-12.50',
  '06/05/2025,CORNER BAKERY,-8.00',
].join('\n');

const click = async (user: User, el: HTMLElement) => {
  await act(async () => {
    await user.click(el);
  });
};

const stored = () =>
  JSON.parse(
    window.localStorage.getItem('financeapp.importedAccounts') || '[]'
  );

describe('Keyword category rules', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds a rule that changes existing transactions and future imports', async () => {
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
    await click(user, screen.getByTestId('back-button'));
    await click(
      user,
      screen.getByRole('button', { name: 'All Transactions', exact: true })
    );
    await click(
      user,
      screen.getByRole('button', { name: /Categories and rules/ })
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Description contains'), 'amzn');
      await user.selectOptions(
        within(screen.getByRole('dialog')).getByLabelText('Category'),
        'Shopping'
      );
    });
    expect(screen.getByTestId('rule-matches')).toHaveTextContent(
      'Also change 2 transactions you already have'
    );
    await click(user, screen.getByTestId('add-keyword-rule'));
    expect(screen.getByTestId('rules-list')).toHaveTextContent(
      'Contains "amzn" → 🛍️ Shopping'
    );
    expect(
      JSON.parse(
        window.localStorage.getItem('financeapp.categoryRules') || '{}'
      )
    ).toEqual({ 'contains:amzn': 'Shopping' });
    const categories = stored()[0].transactions.map(
      (t: { description: string; category: string }) => [
        t.description,
        t.category,
      ]
    );
    expect(categories).toEqual(
      expect.arrayContaining([
        ['AMZN Mktp US*2K4', 'Shopping'],
        ['AMZN Mktp US*7Q1', 'Shopping'],
      ])
    );
    expect(categories).not.toContainEqual(['CORNER BAKERY', 'Shopping']);

    // And removing it.
    await click(
      user,
      screen.getByRole('button', { name: 'Remove the rule for "amzn"' })
    );
    expect(screen.queryByTestId('rules-list')).not.toBeInTheDocument();
  });
});
