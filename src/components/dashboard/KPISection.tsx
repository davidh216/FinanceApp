// Update the KPISection component in src/components/dashboard/KPISection.tsx

import React from 'react';
import { KPICard } from '../ui/KPICard';
import { FinancialSummary, TimePeriod, Budget } from '../../types/financial';

interface KPISectionProps {
  summary: FinancialSummary;
  totalBalance: number;
  period: TimePeriod;
  budgets?: Budget[];
  balanceTrend?: number[];
  incomeTrend?: number[];
  expenseTrend?: number[];
  savingsTrend?: number[];
}

export const KPISection: React.FC<KPISectionProps> = ({
  summary,
  totalBalance,
  period,
  budgets = [],
  balanceTrend = [],
  incomeTrend = [],
  expenseTrend = [],
  savingsTrend = [],
}) => {
  // Dynamic titles based on period
  const getPeriodLabel = (period: TimePeriod): string => {
    switch (period) {
      case 'day':
        return 'Daily';
      case 'week':
        return 'Weekly';
      case 'month':
        return 'Monthly';
      case 'quarter':
        return 'Quarterly';
      case 'year':
        return 'Yearly';
      case '5year':
        return '5-Year';
      default:
        return 'Monthly';
    }
  };

  const periodLabel = getPeriodLabel(period);

  // Calculate trend changes (mock for now, but you could calculate real trends)
  const calculateTrendChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Calculate previous period data for trend calculation
  const prevIncome =
    summary.previousPeriodIncome || summary.monthlyIncome * 0.9;
  const prevExpenses =
    summary.previousPeriodExpenses || summary.monthlyExpenses * 1.1;
  const prevBalance = totalBalance * 0.95; // Mock previous balance

  // Calculate value changes
  const balanceValueChange = totalBalance - prevBalance;
  const incomeValueChange = summary.monthlyIncome - prevIncome;
  const expenseValueChange = summary.monthlyExpenses - prevExpenses;
  const savingsValueChange =
    summary.savingsRate * 100 -
    (prevIncome > 0 ? (prevIncome - prevExpenses) / prevIncome : 0) * 100;

  // Calculate budget metrics
  const activeBudgets = budgets.filter(budget => budget.isActive);
  const totalBudgeted = activeBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = activeBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const overBudgetCategories = activeBudgets.filter(budget => budget.spent > budget.amount).length;
  const budgetUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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

      {/* Budget KPIs - Show only if there are active budgets */}
      {activeBudgets.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <KPICard
              title="Total Budgeted"
              value={totalBudgeted}
              change={0} // No change calculation for now
              valueChange={0}
              isPositive={true}
              color="blue"
              period={period}
            />

            <KPICard
              title="Total Spent"
              value={totalSpent}
              change={0}
              valueChange={0}
              isPositive={totalSpent <= totalBudgeted}
              color={totalSpent > totalBudgeted ? 'red' : 'green'}
              period={period}
            />

            <KPICard
              title="Budget Utilization"
              value={budgetUtilization}
              change={0}
              valueChange={0}
              isPositive={budgetUtilization <= 100}
              isCurrency={false}
              color={budgetUtilization > 100 ? 'red' : budgetUtilization > 80 ? 'orange' : 'green'}
              period={period}
            />

            <KPICard
              title="Over Budget Categories"
              value={overBudgetCategories}
              change={0}
              valueChange={0}
              isPositive={overBudgetCategories === 0}
              isCurrency={false}
              color={overBudgetCategories > 0 ? 'red' : 'green'}
              period={period}
            />
          </div>
        </div>
      )}
    </div>
  );
};
