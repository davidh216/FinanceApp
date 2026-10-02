import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../../dashboard/Dashboard';

type User = ReturnType<typeof userEvent.setup>;

// Savings at 6,000, grown by 500 a month for three months.
const SAVINGS_CSV =
  'Date,Description,Amount\n' +
  '04/01/2025,TRANSFER FROM CHECKING,500\n' +
  '05/01/2025,TRANSFER FROM CHECKING,500\n' +
  '06/01/2025,TRANSFER FROM CHECKING,500\n';

const click = async (user: User, element: HTMLElement) => {
  await act(async () => {
    await user.click(element);
  });
};

const fill = async (user: User, label: string, value: string) => {
  const field = screen.getByLabelText(label);
  await act(async () => {
    await user.clear(field);
    await user.type(field, value);
  });
};

const storedGoals = () =>
  JSON.parse(window.localStorage.getItem('financeapp.goals') || '[]');

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

describe('Savings goals', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds a goal tracked by hand and shows what each month needs', async () => {
    const user = userEvent.setup();
    renderDashboard();
    expect(screen.getByTestId('goals-card')).toHaveTextContent(
      'Set a goal, like an emergency fund or a trip'
    );
    await click(user, screen.getByRole('button', { name: 'Add a goal' }));
    await fill(user, 'Name', 'Trip to Japan');
    await fill(user, 'Target', '5,000');
    await fill(user, 'By (optional)', '2025-10');
    await fill(user, 'Saved so far', '2500');
    await click(user, screen.getByTestId('save-goal'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('goals-card')).toHaveTextContent(
      'Trip to Japan$2,500.00 of $5,000.00Save $500.00 a month to reach it by October 2025.'
    );
    expect(storedGoals()).toEqual([
      expect.objectContaining({
        name: 'Trip to Japan',
        target: 5000,
        saved: 2500,
        by: '2025-10',
      }),
    ]);
  });

  it("tracks an account's balance and compares your pace", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await click(user, screen.getByRole('button', { name: /Import CSV/ }));
    await act(async () => {
      await user.upload(
        screen.getByTestId('csv-file-input'),
        new File([SAVINGS_CSV], 'Savings.csv', { type: 'text/csv' })
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId('confirm-import')).toBeInTheDocument();
    });
    await act(async () => {
      await user.type(screen.getByLabelText(/Current balance/), '6000');
    });
    await click(user, screen.getByTestId('confirm-import'));
    await click(user, screen.getByTestId('back-button'));

    await click(user, screen.getByRole('button', { name: 'Add a goal' }));
    await fill(user, 'Name', 'Emergency fund');
    await fill(user, 'Target', '10000');
    await fill(user, 'By (optional)', '2025-12');
    await act(async () => {
      await user.selectOptions(
        screen.getByLabelText('Track it with'),
        "Savings's balance"
      );
    });
    expect(screen.queryByLabelText('Saved so far')).not.toBeInTheDocument();
    await click(user, screen.getByTestId('save-goal'));

    expect(screen.getByTestId('goals-card')).toHaveTextContent(
      "Emergency fund$6,000.00 of $10,000.00Behind: needs $571.43 a month until December 2025, and you're saving $500.00 a month."
    );

    // Editing it: more time puts it on track.
    await click(user, screen.getByRole('button', { name: /^Emergency fund:/ }));
    await fill(user, 'By (optional)', '2026-03');
    await click(user, screen.getByTestId('save-goal'));
    expect(screen.getByTestId('goals-card')).toHaveTextContent(
      'On track: $400.00 a month until March 2026'
    );

    // And deleting it.
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
    await click(user, screen.getByRole('button', { name: /^Emergency fund:/ }));
    await click(user, screen.getByRole('button', { name: 'Delete' }));
    confirm.mockRestore();
    expect(storedGoals()).toEqual([]);
  });

  it('needs a name and a target, and a month that has not passed', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await click(user, screen.getByRole('button', { name: 'Add a goal' }));
    expect(screen.getByTestId('save-goal')).toBeDisabled();
    await fill(user, 'Name', 'Car');
    await fill(user, 'Target', 'lots');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a target');
    await fill(user, 'Target', '8000');
    await fill(user, 'By (optional)', '2025-01');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose this month or a later one.'
    );
    expect(screen.getByTestId('save-goal')).toBeDisabled();
    await fill(user, 'By (optional)', '2025-06');
    expect(screen.getByTestId('save-goal')).toBeEnabled();
  });
});
