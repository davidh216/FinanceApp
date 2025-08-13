import React, { useMemo } from 'react';
import { Transaction, Account, TimePeriod, Budget } from '../../types/financial';
import { BaseChart } from './BaseChart';
import { BudgetVsActualChart } from './BudgetVsActualChart';
import { 
  processBalanceTrendData, 
  processIncomeExpenseData, 
  processCategorySpendingData,
  CHART_COLORS 
} from '../../utils/chartUtils';

export type ChartType = 'balance' | 'income-expense' | 'category' | 'budget-vs-actual';

export interface ChartConfig {
  type: ChartType;
  title: string;
  description: string;
  height?: number;
  width?: string | number;
  className?: string;
  options?: any;
}

export interface ChartFactoryProps {
  chartType: ChartType;
  transactions: Transaction[];
  accounts: Account[];
  period: TimePeriod;
  budgets?: Budget[];
  height?: number;
  className?: string;
  onDataPointClick?: (dataPoint: any, chartType: ChartType) => void;
  loading?: boolean;
  error?: string | null;
  customOptions?: any;
}

export const ChartFactory: React.FC<ChartFactoryProps> = ({
  chartType,
  transactions,
  accounts,
  period,
  budgets = [],
  height = 300,
  className = '',
  onDataPointClick,
  loading = false,
  error = null,
  customOptions = {},
}) => {
  const chartConfig = useMemo(() => getChartConfig(chartType, period), [chartType, period]);

  const chartData = useMemo(() => {
    switch (chartType) {
      case 'balance': {
        const dataPoints = processBalanceTrendData(transactions, accounts, period);
        return {
          labels: dataPoints.map(point => point.label),
          datasets: [{
            label: 'Balance',
            data: dataPoints.map(point => point.value),
            borderColor: CHART_COLORS.primary,
            backgroundColor: CHART_COLORS.primary + '20',
            fill: true,
            tension: 0.4,
          }]
        };
      }
      case 'income-expense': {
        const { income, expenses } = processIncomeExpenseData(transactions, period);
        return {
          labels: income.map(point => point.label),
          datasets: [
            {
              label: 'Income',
              data: income.map(point => point.value),
              backgroundColor: CHART_COLORS.success,
              borderColor: CHART_COLORS.success,
            },
            {
              label: 'Expenses',
              data: expenses.map(point => point.value),
              backgroundColor: CHART_COLORS.danger,
              borderColor: CHART_COLORS.danger,
            }
          ]
        };
      }
      case 'category': {
        const dataPoints = processCategorySpendingData(transactions, period);
        return {
          labels: dataPoints.map(point => point.label),
          datasets: [{
            label: 'Spending',
            data: dataPoints.map(point => point.value),
            backgroundColor: dataPoints.map((_, index) => 
              Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length]
            ),
            borderColor: dataPoints.map((_, index) => 
              Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length]
            ),
          }]
        };
      }
      case 'budget-vs-actual':
        // Budget vs actual is handled by dedicated component
        return { labels: [], datasets: [] };
      default:
        return { labels: [], datasets: [] };
    }
  }, [chartType, transactions, accounts, period]);

  const chartOptions = useMemo(() => {
    const baseOptions = getBaseOptions(chartType, chartConfig.title);
    return { ...baseOptions, ...customOptions };
  }, [chartType, chartConfig.title, customOptions]);

  const handleChartClick = (event: any, elements: any[]) => {
    if (elements.length > 0 && onDataPointClick) {
      const dataIndex = elements[0].index;
      const datasetIndex = elements[0].datasetIndex;
      
      // Get the appropriate data point based on chart type
      let dataPoint: any;
      switch (chartType) {
        case 'balance':
          dataPoint = processBalanceTrendData(transactions, accounts, period)[dataIndex];
          break;
        case 'income-expense':
          const { income, expenses } = processIncomeExpenseData(transactions, period);
          dataPoint = datasetIndex === 0 ? income[dataIndex] : expenses[dataIndex];
          dataPoint.type = datasetIndex === 0 ? 'income' : 'expense';
          break;
        case 'category':
          dataPoint = processCategorySpendingData(transactions, period)[dataIndex];
          break;
        default:
          dataPoint = null;
      }
      
      if (dataPoint) {
        onDataPointClick(dataPoint, chartType);
      }
    }
  };

  // Special handling for budget vs actual chart
  if (chartType === 'budget-vs-actual') {
    return (
      <BudgetVsActualChart
        budgets={budgets}
        transactions={transactions}
        period={period}
        height={height}
        className={className}
        onDataPointClick={(dataPoint) => onDataPointClick?.(dataPoint, chartType)}
        loading={loading}
        error={error}
      />
    );
  }

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
          <p>Error loading chart: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <BaseChart
        type={getChartType(chartType)}
        data={chartData}
        options={chartOptions}
        height={height}
        width="100%"
        onChartClick={handleChartClick}
        loading={loading}
        error={error}
      />
    </div>
  );
};

// Helper functions
const getChartConfig = (chartType: ChartType, period: TimePeriod): { title: string; description: string } => {
  const periodText = period.charAt(0).toUpperCase() + period.slice(1);
  
  switch (chartType) {
    case 'balance':
      return {
        title: 'Balance Trend',
        description: `Shows your account balance over the ${period} period`
      };
    case 'income-expense':
      return {
        title: 'Income vs Expenses',
        description: `Compares your income and expenses for the ${period}`
      };
    case 'category':
      return {
        title: 'Spending by Category',
        description: `Breakdown of your spending by category for the ${period}`
      };
    case 'budget-vs-actual':
      return {
        title: 'Budget vs Actual',
        description: `Shows how your spending compares to your budget for the ${period}`
      };
    default:
      return {
        title: 'Chart',
        description: 'Financial data visualization'
      };
  }
};

const getChartType = (chartType: ChartType): 'line' | 'bar' | 'doughnut' | 'pie' => {
  switch (chartType) {
    case 'balance':
      return 'line';
    case 'income-expense':
      return 'bar';
    case 'category':
      return 'doughnut';
    case 'budget-vs-actual':
      return 'bar';
    default:
      return 'line';
  }
};

const getBaseOptions = (chartType: ChartType, title: string) => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
         plugins: {
       title: {
         display: false,
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
      },
    },
  };

  // Add chart-specific options
  switch (chartType) {
    case 'balance':
      return {
        ...baseOptions,
        scales: {
          y: {
            ticks: {
              callback: function(value: any) {
                return '$' + value.toLocaleString();
              },
            },
          },
        },
        plugins: {
          ...baseOptions.plugins,
          tooltip: {
            ...baseOptions.plugins.tooltip,
            callbacks: {
              label: function(context: any) {
                const value = context.parsed.y;
                return `Balance: $${value.toLocaleString()}`;
              },
            },
          },
        },
      };
    case 'income-expense':
      return {
        ...baseOptions,
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
        plugins: {
          ...baseOptions.plugins,
          tooltip: {
            ...baseOptions.plugins.tooltip,
            callbacks: {
              label: function(context: any) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: $${value.toLocaleString()}`;
              },
            },
          },
        },
      };
    case 'category':
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: {
            position: 'right' as const,
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11,
              },
            },
          },
          tooltip: {
            ...baseOptions.plugins.tooltip,
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: $${value.toLocaleString()} (${percentage}%)`;
              },
            },
          },
        },
      };
    default:
      return baseOptions;
  }
}; 