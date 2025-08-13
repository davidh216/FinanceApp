import React, { useMemo } from 'react';
import { BaseChart } from './BaseChart';
import { Budget, Transaction, TimePeriod } from '../../types/financial';
import { CHART_COLORS } from '../../utils/chartUtils';

interface BudgetVsActualChartProps {
  budgets: Budget[];
  transactions: Transaction[];
  period: TimePeriod;
  height?: number;
  className?: string;
  onDataPointClick?: (dataPoint: any) => void;
  loading?: boolean;
  error?: string | null;
}

export const BudgetVsActualChart: React.FC<BudgetVsActualChartProps> = ({
  budgets,
  transactions,
  period,
  height = 300,
  className = '',
  onDataPointClick,
  loading = false,
  error = null,
}) => {
  const chartData = useMemo(() => {
    if (!budgets.length) {
      return { labels: [], datasets: [] };
    }

    // Filter active budgets
    const activeBudgets = budgets.filter(budget => budget.isActive);
    
    // Calculate actual spending for each budget category
    const budgetVsActual = activeBudgets.map(budget => {
      const relevantTransactions = transactions.filter(tx => 
        tx.category === budget.category &&
        new Date(tx.date) >= new Date(budget.startDate) &&
        new Date(tx.date) <= new Date(budget.endDate) &&
        tx.amount < 0 // Only expenses
      );
      
      const actualSpending = Math.abs(relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0));
      
      return {
        category: budget.category,
        budgeted: budget.amount,
        actual: actualSpending,
        remaining: budget.amount - actualSpending,
        percentage: (actualSpending / budget.amount) * 100,
      };
    });

    // Sort by percentage (most over budget first)
    budgetVsActual.sort((a, b) => b.percentage - a.percentage);

    const labels = budgetVsActual.map(item => item.category);
    const budgetedData = budgetVsActual.map(item => item.budgeted);
    const actualData = budgetVsActual.map(item => item.actual);

    return {
      labels,
      datasets: [
        {
          label: 'Budgeted',
          data: budgetedData,
          backgroundColor: CHART_COLORS.blue,
          borderColor: CHART_COLORS.blue,
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Actual',
          data: actualData,
          backgroundColor: budgetVsActual.map(item => 
            item.percentage > 100 ? CHART_COLORS.red : 
            item.percentage > 80 ? CHART_COLORS.orange : 
            CHART_COLORS.green
          ),
          borderColor: budgetVsActual.map(item => 
            item.percentage > 100 ? CHART_COLORS.red : 
            item.percentage > 80 ? CHART_COLORS.orange : 
            CHART_COLORS.green
          ),
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [budgets, transactions, period]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Budget vs Actual Spending',
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
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
          color: '#374151',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const category = context.label;
            
            // Find the budget data for this category
            const budgetData = budgets.find(b => b.category === category);
            if (budgetData && context.datasetIndex === 1) { // Actual spending
              const percentage = (value / budgetData.amount) * 100;
              const status = percentage > 100 ? 'Over Budget' : 
                           percentage > 80 ? 'Near Limit' : 'On Track';
              return `${label}: $${value.toLocaleString()} (${percentage.toFixed(1)}% - ${status})`;
            }
            
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
        ticks: {
          maxRotation: 45,
          minRotation: 0,
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
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }), [budgets]);

  const handleChartClick = (event: any, elements: any[]) => {
    if (elements.length > 0 && onDataPointClick) {
      const dataIndex = elements[0].index;
      const datasetIndex = elements[0].datasetIndex;
      const category = chartData.labels[dataIndex];
      
      const budget = budgets.find(b => b.category === category);
      if (budget) {
        onDataPointClick({
          category,
          budgeted: budget.amount,
          actual: chartData.datasets[1].data[dataIndex],
          type: datasetIndex === 0 ? 'budgeted' : 'actual',
          budget,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>Error loading budget chart: {error}</p>
        </div>
      </div>
    );
  }

  if (!budgets.length) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Budget vs Actual Spending
          </h3>
          <p className="text-gray-500 mb-4">
            No budgets found. Create budgets to see spending comparisons.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Budget vs Actual Spending
        </h3>
        <p className="text-sm text-gray-600">
          Compare your budgeted amounts with actual spending by category
        </p>
      </div>
      
      <BaseChart
        type="bar"
        data={chartData}
        options={chartOptions}
        height={height}
        width="100%"
        onChartClick={handleChartClick}
        loading={loading}
        error={error}
      />
      
      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {budgets.filter(b => b.isActive).length}
          </div>
          <div className="text-gray-500">Active Budgets</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {budgets.filter(b => b.isActive && b.spent <= b.amount).length}
          </div>
          <div className="text-gray-500">On Track</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {budgets.filter(b => b.isActive && b.spent > b.amount).length}
          </div>
          <div className="text-gray-500">Over Budget</div>
        </div>
      </div>
    </div>
  );
}; 