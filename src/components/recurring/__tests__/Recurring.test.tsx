import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

// Test clock: 15 June 2025.
const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '03/12/2025,NETFLIX.COM,-15.49\n' +
  '04/11/2025,NETFLIX.COM,-15.49\n' +
  '05/12/2025,NETFLIX.COM,-17.99\n' +
  '03/03/2025,SPOTIFY USA,-10.99\n' +
  '04/03/2025,SPOTIFY USA,-10.99\n' +
  '05/03/2025,SPOTIFY USA,-10.99\n' +
  '06/03/2025,SPOTIFY USA,-10.99\n' +
  '03/08/2025,AMAZON MKTPLACE,-80.00\n' +
  '05/20/2025,AMAZON MKTPLACE,-12.00\n' +
  '06/01/2025,AMAZON MKTPLACE,-240.00\n';

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

describe('Recurring payments', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('lists subscriptions from imported transactions', async () => {
    const user = userEvent.setup();
    renderDashboard();
    // The demo's purchases are random, so none look recurring.
    expect(screen.queryByTestId('recurring-card')).not.toBeInTheDocument();

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

    const card = screen.getByTestId('recurring-card');
    expect(card).toHaveTextContent('2 found from regular payments');
    expect(card).toHaveTextContent('1 went up');
    expect(screen.getByTestId('recurring-total')).toHaveTextContent(
      '$28.98/month'
    );
    expect(screen.getByTestId('recurring-netflix')).toHaveTextContent(
      'NetflixMonthly · next around Jun 12, 2025$17.99▲ was $15.49'
    );
    expect(screen.getByTestId('recurring-spotify')).toHaveTextContent(
      'Monthly · next around Jul 3, 2025$10.99'
    );
    // Irregular Amazon orders aren't recurring.
    expect(screen.queryByTestId('recurring-amazon')).not.toBeInTheDocument();
  });
});
