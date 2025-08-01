import React from 'react';
import { KPICard } from '../ui/KPICard';
import { FinancialSummary, TimePeriod } from '../../types/financial';

interface KPISectionProps {
  summary: FinancialSummary;
  totalBalance: number;
  period: TimePeriod;
  trendData?: number[];
}

export const KPISection: React.FC<KPISectionProps> = ({
  summary,
  totalBalance,
  period,
  trendData = [],
}) => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Financial Overview
        </h2>
        <p className="text-gray-600">
          Your financial health at a glance for the current {period}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Balance"
          value={totalBalance}
          change={5.2}
          isPositive={totalBalance >= 0}
          color={totalBalance < 0 ? 'red' : 'green'}
          trendData={trendData}
          period={period}
        />

        <KPICard
          title={`Income (${period})`}
          value={summary.monthlyIncome}
          change={8.1}
          isPositive={true}
          color="green"
          trendData={trendData}
          period={period}
        />

        <KPICard
          title={`Spending (${period})`}
          value={summary.monthlyExpenses}
          change={-3.4}
          isPositive={true} // ❌ SPENDING DECREASE = GOOD (but show as negative change)
          color="red"
          trendData={trendData}
          period={period}
        />

        <KPICard
          title="Savings Rate"
          value={summary.savingsRate * 100}
          change={2.1}
          isPositive={true}
          isCurrency={false}
          color="blue"
          trendData={trendData}
          period={period}
        />
      </div>
    </div>
  );
};
