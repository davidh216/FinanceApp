import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';
import { CARD_OFX_XML, CHECKING_OFX_SGML } from '../../../test/ofxSamples';

type User = ReturnType<typeof userEvent.setup>;

const stored = () =>
  JSON.parse(
    window.localStorage.getItem('financeapp.importedAccounts') || '[]'
  );

const choose = async (user: User, text: string, name: string) => {
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([text], name, { type: 'application/x-ofx' })
    );
  });
  await waitFor(() => {
    expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
  });
};

describe('Importing an OFX statement', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('fills in the account from the statement and skips repeats', async () => {
    const user = userEvent.setup();
    render(
      <FinancialProvider>
        <Dashboard />
      </FinancialProvider>
    );
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Import CSV/ }));
    });
    await choose(user, CARD_OFX_XML, 'Visa.qfx');

    // Type and balance come from the statement; no columns to choose.
    expect(screen.getByLabelText('Account name')).toHaveValue('Visa');
    expect(screen.getByLabelText('Account type')).toHaveDisplayValue(
      'Credit card'
    );
    expect(screen.getByLabelText(/Amount owed/)).toHaveValue('1234.56');
    expect(screen.getByTestId('ofx-note')).toBeInTheDocument();
    expect(screen.queryByTestId('flip-signs')).not.toBeInTheDocument();
    await act(async () => {
      await user.click(screen.getByTestId('confirm-import'));
    });

    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$1,234.56'
    );
    expect(stored()[0]).toMatchObject({ type: 'CREDIT', balance: -1234.56 });
    expect(
      stored()[0].transactions.map((t: { bankId: string }) => t.bankId)
    ).toEqual(['CC-78', 'CC-77']);

    // A later statement repeating CC-78 adds only the new charge.
    const later = CARD_OFX_XML.replace('CC-77', 'CC-79').replace(
      '20250610000000',
      '20250614000000'
    );
    await act(async () => {
      await user.click(screen.getByTestId('import-more-button'));
    });
    await choose(user, later, 'Visa-2.qfx');
    expect(screen.getByTestId('import-summary')).toHaveTextContent(
      '1 already in Visa will be skipped'
    );
    await act(async () => {
      await user.click(screen.getByTestId('confirm-import'));
    });
    expect(stored()[0].transactions).toHaveLength(3);
  });

  it('reads an OFX 1.x checking statement', async () => {
    const user = userEvent.setup();
    render(
      <FinancialProvider>
        <Dashboard />
      </FinancialProvider>
    );
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Import CSV/ }));
    });
    await choose(user, CHECKING_OFX_SGML, 'Checking.ofx');
    expect(screen.getByLabelText('Account type')).toHaveDisplayValue(
      'Checking'
    );
    await act(async () => {
      await user.click(screen.getByTestId('confirm-import'));
    });
    expect(screen.getByTestId('account-balance')).toHaveTextContent(
      '$3,446.40'
    );
    expect(screen.getByText('Joe&S Diner')).toBeInTheDocument();
  });
});
