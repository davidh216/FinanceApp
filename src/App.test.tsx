import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FinanceApp', () => {
  render(<App />);
  const element = screen.getByText(/FinanceApp is Ready/i);
  expect(element).toBeInTheDocument();
});
