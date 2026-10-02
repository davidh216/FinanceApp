import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppInstall } from '../AppInstall';

describe('Installing the app', () => {
  it('offers to install once the browser allows it', async () => {
    const user = userEvent.setup();
    render(<AppInstall />);
    expect(screen.queryByTestId('install-app')).not.toBeInTheDocument();

    const prompt = jest.fn(async () => {});
    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });
    const preventDefault = jest.spyOn(event, 'preventDefault');
    act(() => {
      window.dispatchEvent(event);
    });
    // The browser's own bar is replaced by the button.
    expect(preventDefault).toHaveBeenCalled();

    await act(async () => {
      await user.click(screen.getByTestId('install-app'));
    });
    expect(prompt).toHaveBeenCalled();
    // A prompt can only be shown once.
    expect(screen.queryByTestId('install-app')).not.toBeInTheDocument();
  });

  it('tells you when a new version is ready', () => {
    render(<AppInstall />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent('financeapp:update-ready', { detail: {} })
      );
    });
    expect(screen.getByTestId('update-ready')).toHaveTextContent(
      'New version: reload'
    );
  });
});
