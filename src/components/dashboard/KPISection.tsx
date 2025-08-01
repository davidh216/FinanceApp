// Update the KPISection component in src/components/dashboard/KPISection.tsx

import React from 'react';
import { KPICard } from '../ui/KPICard';
import { FinancialSummary, TimePeriod } from '../../types/financial';

interface KPISectionProps {
  summary: FinancialSummary;
  totalBalance: number;
  period: TimePeriod;
  balanceTrend?: number[];
  incomeTrend?: number[];
  expenseTrend?: number[];
  savingsTrend?: number[];
}

export const KPISection: React.FC<KPISectionProps> = ({
  summary,
  totalBalance,
  period,
  balanceTrend = [],
  incomeTrend = [],
  expenseTrend = [],
  savingsTrend = [],
}) => {
  // Dynamic titles based on period
  const getPeriodLabel = (period: TimePeriod): string => {
    switch (period) {
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'quarter': return 'Quarterly';
      case 'year': return 'Yearly';
      case '5year': return '5-Year';
      default: return 'Monthly';
    }
  };

  const periodLabel = getPeriodLabel(period);

  // Calculate trend changes (mock for now, but you could calculate real trends)
  const calculateTrendChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Calculate previous period data for trend calculation
  const prevIncome = summary.previousPeriodIncome || summary.monthlyIncome * 0.9;
  const prevExpenses = summary.previousPeriodExpenses || summary.monthlyExpenses * 1.1;
  const prevBalance = totalBalance * 0.95; // Mock previous balance

  // Calculate value changes
  const balanceValueChange = totalBalance - prevBalance;
  const incomeValueChange = summary.monthlyIncome - prevIncome;
  const expenseValueChange = summary.monthlyExpenses - prevExpenses;
  const savingsValueChange = (summary.savingsRate * 100) - ((prevIncome > 0 ? (prevIncome - prevExpenses) / prevIncome : 0) * 100);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Balance"
          value={totalBalance}
          change={calculateTrendChange(totalBalance, prevBalance)}
          valueChange={balanceValueChange}
          isPositive={totalBalance >= prevBalance}
          color={totalBalance < 0 ? 'red' : 'green'}
          trendData={balanceTrend}
          period={period}
        />

        <KPICard
          title={`Income (${periodLabel})`}
          value={summary.monthlyIncome}
          change={calculateTrendChange(summary.monthlyIncome, prevIncome)}
          valueChange={incomeValueChange}
          isPositive={summary.monthlyIncome >= prevIncome}
          color="green"
          trendData={incomeTrend}
          period={period}
        />

        <KPICard
          title={`Spending (${periodLabel})`}
          value={summary.monthlyExpenses}
          change={calculateTrendChange(summary.monthlyExpenses, prevExpenses)}
          valueChange={expenseValueChange}
          isPositive={summary.monthlyExpenses <= prevExpenses} // Lower spending is better
          color="red"
          trendData={expenseTrend}
          period={period}
        />

        <KPICard
          title="Savings Rate"
          value={summary.savingsRate * 100}
          change={2.1} // Mock change for now
          valueChange={savingsValueChange}
          isPositive={true}
          isCurrency={false}
          color="blue"
          trendData={savingsTrend}
          period={period}
        />
      </div>
    </div>
  );
};
