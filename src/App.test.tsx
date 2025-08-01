import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FinanceApp with account navigation', () => {
  render(<App />);
  
  // Should render the main dashboard
  const element = screen.getByText(/FinanceApp/i);
  expect(element).toBeInTheDocument();
  
  // Should have navigation elements
  expect(screen.getByText(/Financial Overview/i)).toBeInTheDocument();
});
