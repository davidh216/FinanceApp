import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

type User = ReturnType<typeof userEvent.setup>;

// This bank puts the merchant in "Memo"; "Payee" is a reference.
const JUNE =
  'Posted On,Memo,Payee,Value\n' +
  '06/02/2025,PAYROLL DEPOSIT,REF 1,2500.00\n' +
  '06/03/2025,STARBUCKS STORE 1234,REF 2,-5.75\n';
const JULY = [
  'Posted On,Memo,Payee,Value',
  '07/01/2025,CHIPOTLE 88,REF 3,-12.40',
].join('\n');

const stored = () =>
  JSON.parse(
    window.localStorage.getItem('financeapp.importedAccounts') || '[]'
  );

const choose = async (user: User, text: string) => {
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([text], 'Checking.csv', { type: 'text/csv' })
    );
  });
  await waitFor(() => {
    expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
  });
};

describe('Remembered import columns', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses the columns you chose for an account's next import", async () => {
    const user = userEvent.setup();
    render(
      <FinancialProvider>
        <Dashboard />
      </FinancialProvider>
    );
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Import CSV/ }));
    });
    await choose(user, JUNE);
    expect(screen.getByTestId('columns-note')).toHaveTextContent(
      "Your choices are remembered for this account's next import."
    );
    // The guess was Payee; this bank's merchant is in Memo.
    expect(screen.getByTestId('map-description')).toHaveDisplayValue('Payee');
    await act(async () => {
      await user.selectOptions(screen.getByTestId('map-description'), 'Memo');
      await user.click(screen.getByTestId('confirm-import'));
    });
    expect(stored()[0].importSettings).toEqual({
      flipSigns: false,
      columns: {
        date: 'Posted On',
        description: 'Memo',
        amount: 'Value',
      },
    });

    await act(async () => {
      await user.click(screen.getByTestId('import-more-button'));
    });
    await choose(user, JULY);
    expect(screen.getByTestId('map-description')).toHaveDisplayValue('Memo');
    expect(screen.getByTestId('columns-note')).toHaveTextContent(
      'The columns you chose for Checking last time.'
    );
    await act(async () => {
      await user.click(screen.getByTestId('confirm-import'));
    });
    expect(screen.getByText('Chipotle')).toBeInTheDocument();
  });
});
