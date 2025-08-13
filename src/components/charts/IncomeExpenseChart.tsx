import React, { useMemo } from 'react';
import { Transaction, TimePeriod } from '../../types/financial';
import { BaseChart } from './BaseChart';
import { processIncomeExpenseData, CHART_COLORS } from '../../utils/chartUtils';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
  period: TimePeriod;
  height?: string | number;
  className?: string;
  onDataPointClick?: (dataPoint: any) => void;
  loading?: boolean;
  error?: string | null;
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
  transactions,
  period,
  height = 300,
  className = '',
  onDataPointClick,
  loading = false,
  error = null,
}) => {
  const chartData = useMemo(() => {
    const { income, expenses } = processIncomeExpenseData(transactions, period);
    
    return {
      labels: income.map(point => point.label),
      datasets: [
        {
          label: 'Income',
          data: income.map(point => point.value),
          backgroundColor: CHART_COLORS.success,
          borderColor: CHART_COLORS.success,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Expenses',
          data: expenses.map(point => point.value),
          backgroundColor: CHART_COLORS.danger,
          borderColor: CHART_COLORS.danger,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [transactions, period]);

  const handleChartClick = (event: any, elements: any[]) => {
    if (elements.length > 0 && onDataPointClick) {
      const dataIndex = elements[0].index;
      const datasetIndex = elements[0].datasetIndex;
      const { income, expenses } = processIncomeExpenseData(transactions, period);
      const dataPoint = datasetIndex === 0 ? income[dataIndex] : expenses[dataIndex];
      onDataPointClick({ ...dataPoint, type: datasetIndex === 0 ? 'income' : 'expense' });
    }
  };

  const customOptions = {
    plugins: {
      title: {
        display: true,
        text: `Income vs Expenses - ${period.charAt(0).toUpperCase() + period.slice(1)}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#374151',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    const { income, expenses } = processIncomeExpenseData(transactions, period);
    const totalIncome = income.reduce((sum, point) => sum + point.value, 0);
    const totalExpenses = expenses.reduce((sum, point) => sum + point.value, 0);
    const netFlow = totalIncome - totalExpenses;
    
    return {
      totalIncome,
      totalExpenses,
      netFlow,
      savingsRate: totalIncome > 0 ? (netFlow / totalIncome) * 100 : 0,
    };
  }, [transactions, period]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Income vs Expenses
        </h3>
        <p className="text-sm text-gray-600">
          Compare your income and spending patterns
        </p>
      </div>
      
      <BaseChart
        type="bar"
        data={chartData}
        options={customOptions}
        height={height}
        onChartClick={handleChartClick}
        loading={loading}
        error={error}
      />
      
      {!loading && !error && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-600 font-medium">Total Income</div>
            <div className="text-green-600 font-semibold">
              ${summary.totalIncome.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 font-medium">Total Expenses</div>
            <div className="text-red-600 font-semibold">
              ${summary.totalExpenses.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 font-medium">Net Flow</div>
            <div className={`font-semibold ${summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${summary.netFlow.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-600 font-medium">Savings Rate</div>
            <div className={`font-semibold ${summary.savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.savingsRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 