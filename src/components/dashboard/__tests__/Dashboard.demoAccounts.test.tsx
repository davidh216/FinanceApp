import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../Dashboard';

const SHOW_DEMO_KEY = 'financeapp.showDemoAccounts';

// Ending balance $2,494.25.
const CHECKING_CSV =
  'Date,Description,Amount\n' +
  '06/02/2025,PAYROLL DEPOSIT,2500.00\n' +
  '06/03/2025,STARBUCKS STORE 1234,-5.75\n';

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

const importChecking = async (user: ReturnType<typeof userEvent.setup>) => {
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /Import CSV/ }));
  });
  await act(async () => {
    await user.upload(
      screen.getByTestId('csv-file-input'),
      new File([CHECKING_CSV], 'My Checking.csv', { type: 'text/csv' })
    );
  });
  await waitFor(() => {
    expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
  });
  await act(async () => {
    await user.click(screen.getByTestId('confirm-import'));
  });
  // Back from the new account's page to the dashboard.
  await act(async () => {
    await user.click(screen.getByTestId('back-button'));
  });
};

const openAssets = async (user: ReturnType<typeof userEvent.setup>) => {
  for (const button of screen.getAllByRole('button', { name: /Assets/ })) {
    await act(async () => {
      await user.click(button);
    });
  }
};

describe('Demo accounts', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the demo until you import an account', () => {
    renderDashboard();
    expect(screen.getByTestId('demo-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('demo-toggle')).not.toBeInTheDocument();
    expect(screen.getByTestId('kpi-balance')).toHaveTextContent('$123,045.85');
  });

  it('hides the demo accounts once you import one', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);

    // Totals are your own money only.
    expect(screen.getByTestId('kpi-balance')).toHaveTextContent('$2,494.25');
    expect(screen.getByTestId('kpi-income')).toHaveTextContent('$2,500.00');
    expect(screen.getByTestId('kpi-spending')).toHaveTextContent('$5.75');
    expect(screen.queryByTestId('demo-badge')).not.toBeInTheDocument();
    expect(screen.getByTestId('demo-toggle')).toHaveTextContent(
      'Show demo accounts'
    );
    // There are no business accounts to switch to.
    expect(
      screen.queryByRole('button', { name: 'Business' })
    ).not.toBeInTheDocument();

    await openAssets(user);
    expect(screen.getAllByText('My Checking').length).toBeGreaterThan(0);
    expect(screen.queryByText('Primary Checking')).not.toBeInTheDocument();
  });

  it('can show the demo again, and remembers that after a reload', async () => {
    const user = userEvent.setup();
    const { unmount } = renderDashboard();
    await importChecking(user);

    await act(async () => {
      await user.click(screen.getByTestId('demo-toggle'));
    });
    // $123,045.85 of demo accounts plus $2,494.25 imported.
    expect(screen.getByTestId('kpi-balance')).toHaveTextContent('$125,540.10');
    expect(screen.getByTestId('demo-badge')).toBeInTheDocument();
    expect(screen.getByTestId('demo-toggle')).toHaveTextContent(
      'Hide demo accounts'
    );
    expect(window.localStorage.getItem(SHOW_DEMO_KEY)).toBe('true');
    unmount();

    renderDashboard();
    expect(screen.getByTestId('kpi-balance')).toHaveTextContent('$125,540.10');

    await act(async () => {
      await user.click(screen.getByTestId('demo-toggle'));
    });
    expect(screen.getByTestId('kpi-balance')).toHaveTextContent('$2,494.25');
  });

  it('brings the demo back when you remove your last imported account', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await importChecking(user);
    await openAssets(user);
    await act(async () => {
      await user.click(screen.getAllByText('My Checking')[0]);
    });

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    await act(async () => {
      await user.click(screen.getByTestId('remove-account-button'));
    });
    confirmSpy.mockRestore();

    expect(screen.getByTestId('kpi-balance')).toHaveTextContent('$123,045.85');
    expect(screen.getByTestId('demo-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('demo-toggle')).not.toBeInTheDocument();
  });
});
