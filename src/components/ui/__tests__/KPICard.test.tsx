import React from 'react';
import { render, screen } from '@testing-library/react';
import { FinancialProvider } from '../../../contexts/FinancialContext';
import { KPICard } from '../KPICard';

const renderCard = (props: Partial<React.ComponentProps<typeof KPICard>>) =>
  render(
    <FinancialProvider>
      <KPICard
        title="Income"
        value={1200}
        change={20}
        valueChange={200}
        isPositive
        period="month"
        testId="card"
        {...props}
      />
    </FinancialProvider>
  );

describe('KPICard', () => {
  it('shows the percent and dollar change', () => {
    renderCard({});
    expect(screen.getByTestId('card')).toHaveTextContent(
      '$1,200.00+20.0%(+$200.00) vs last month'
    );
  });

  it('shows only the dollar change when there is no percentage', () => {
    // Previous value was zero: a percentage would be meaningless.
    renderCard({ change: null, valueChange: 1200 });
    expect(screen.getByTestId('card')).toHaveTextContent(
      '$1,200.00+$1,200.00 vs last month'
    );
    expect(screen.getByTestId('card')).not.toHaveTextContent('%');
  });

  it('shows percentages in points', () => {
    renderCard({
      value: 18.88,
      change: null,
      valueChange: -39.34,
      isCurrency: false,
    });
    expect(screen.getByTestId('card')).toHaveTextContent(
      '18.9%-39.3 pts vs last month'
    );
  });
});
