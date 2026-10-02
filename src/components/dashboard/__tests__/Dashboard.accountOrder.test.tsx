import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { Dashboard } from '../Dashboard';

const renderDashboard = () =>
  render(
    <FinancialProvider>
      <Dashboard />
    </FinancialProvider>
  );

// The personal assets, top to bottom, from their "move up" buttons.
const assetOrder = () =>
  screen
    .getAllByRole('button', { name: /^Move .* up$/ })
    .map((button) =>
      button.getAttribute('aria-label')!.replace(/^Move | up$/g, '')
    );

describe('Reordering accounts', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('moves an account within its group, and remembers it', async () => {
    const user = userEvent.setup();
    const { unmount } = renderDashboard();
    await act(async () => {
      await user.click(screen.getAllByRole('button', { name: /Assets/ })[0]);
    });
    const before = assetOrder();
    expect(before.length).toBeGreaterThan(1);
    // The first can't go further up.
    expect(
      screen.getByRole('button', { name: `Move ${before[0]} up` })
    ).toBeDisabled();

    await act(async () => {
      await user.click(
        screen.getByRole('button', { name: `Move ${before[1]} up` })
      );
    });
    const after = [before[1], before[0], ...before.slice(2)];
    expect(assetOrder()).toEqual(after);
    expect(
      JSON.parse(window.localStorage.getItem('financeapp.accountOrder') || '[]')
        .length
    ).toBeGreaterThan(1);

    // Still in that order after a reload.
    unmount();
    renderDashboard();
    await act(async () => {
      await user.click(screen.getAllByRole('button', { name: /Assets/ })[0]);
    });
    expect(assetOrder()).toEqual(after);
  });
});
