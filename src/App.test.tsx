import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FinanceApp text', () => {
  render(<App />);
  const linkElement = screen.getByText(/FinanceApp is Ready/i);
  expect(linkElement).toBeInTheDocument();
});