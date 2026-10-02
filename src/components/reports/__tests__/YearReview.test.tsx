import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

type User = ReturnType<typeof userEvent.setup>;

// The test clock is 15 June 2025, so 2025 runs to 15 June.
const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '12/20/2024,DELTA AIR LINES,-400.00\n' +
  '05/10/2025,AMAZON MKTPLACE,-50.00\n' +
  '05/20/2025,SHELL OIL 57444,-30.00\n' +
  '06/02/2025,PAYROLL DEPOSIT,3000.00\n' +
  '06/03/2025,STARBUCKS STORE 1234,-20.00\n' +
  '06/04/2025,AMAZON MKTPLACE,-80.00\n' +
  '06/05/2025,CHASE CREDIT CRD AUTOPAY,-500.00\n';

const CARD_CSV =
  'Date,Description,Amount\n06/06/2025,PAYMENT THANK YOU,500.00\n';

const importCsv = async (user: User, contents: string, name: string) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Import CSV/ }));
  });
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([contents], `${name}.csv`, { type: 'text/csv' })
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

const openReview = async (user: User) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: 'Year in review' }));
  });
};

describe('Year in review', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('sums up the year so far', async () => {
    const user = userEvent.setup();
    render(
      <FinancialProvider>
        <Dashboard />
      </FinancialProvider>
    );
    await importCsv(user, CHECKING_CSV, 'Checking');
    // The card side of the autopay makes it a transfer, not spending.
    await importCsv(user, CARD_CSV, 'Card');
    await openReview(user);

    const dialog = screen.getByRole('dialog', { name: '2025 in review' });
    expect(screen.getByTestId('review-range')).toHaveTextContent(
      'Jan 1 – Jun 15, 2025 (so far)'
    );
    expect(screen.getByTestId('review-income')).toHaveTextContent(
      'Income$3,000.00'
    );
    // The transactions start in December 2024, so there's no comparing.
    expect(screen.getByTestId('review-spending')).toHaveTextContent(
      /^Spending\$180\.00$/
    );
    expect(screen.getByTestId('review-saved')).toHaveTextContent(
      'Saved$2,820.0094% of income'
    );

    const highlights = screen.getByTestId('review-highlights');
    expect(highlights).toHaveTextContent('Biggest purchase: $80.00');
    expect(highlights).toHaveTextContent('on Jun 4');
    expect(highlights).toHaveTextContent(
      'You spent the most in June ($100.00)'
    );
    expect(highlights).toHaveTextContent('You saved the most in June');
    expect(highlights).toHaveTextContent('5 transactions');

    const categories = within(screen.getByTestId('review-categories'))
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(categories).toHaveLength(3);
    expect(categories[0]).toMatch(/Shopping\$130\.00 72%/);
    expect(categories[1]).toMatch(/Transportation\$30\.00 17%/);
    expect(categories[2]).toMatch(/Food & Dining\$20\.00 11%/);

    expect(
      within(screen.getByTestId('review-merchants')).getAllByRole('listitem')[0]
    ).toHaveTextContent(/× 2\$130\.00/);

    const rows = within(screen.getByTestId('review-months')).getAllByRole(
      'row'
    );
    // A header and January to June.
    expect(rows).toHaveLength(7);
    expect(rows[6]).toHaveTextContent('June$3,000.00$100.00+$2,900.00');

    await act(async () => {
      await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows earlier years', async () => {
    const user = userEvent.setup();
    render(
      <FinancialProvider>
        <Dashboard />
      </FinancialProvider>
    );
    await importCsv(user, CHECKING_CSV, 'Checking');
    await openReview(user);

    const year = screen.getByTestId('review-year');
    expect(
      within(year)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['2025', '2024']);
    await act(async () => {
      await user.selectOptions(year, '2024');
    });

    expect(
      screen.getByRole('dialog', { name: '2024 in review' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('review-range')).toHaveTextContent(
      'Jan 1 – Dec 31, 2024'
    );
    expect(screen.getByTestId('review-data-start')).toHaveTextContent(
      'Your transactions start on Dec 20, 2024, so this covers 2024 from then.'
    );
    expect(screen.getByTestId('review-net-worth')).toHaveTextContent(
      'since Dec 20'
    );
    expect(screen.getByTestId('review-spending')).toHaveTextContent(
      'Spending$400.00'
    );
    expect(
      within(screen.getByTestId('review-months')).getAllByRole('row')
    ).toHaveLength(13);
    // Nothing came in, so nothing was saved.
    expect(screen.getByTestId('review-highlights')).not.toHaveTextContent(
      'You saved the most'
    );
  });
});
