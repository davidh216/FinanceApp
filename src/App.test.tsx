import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FinanceApp dashboard', () => {
  render(<App />);
  const element = screen.getByText(/FinanceApp/i);
  expect(element).toBeInTheDocument();
});
