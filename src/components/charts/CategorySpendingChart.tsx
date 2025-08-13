import React, { useMemo } from 'react';
import { Transaction, TimePeriod } from '../../types/financial';
import { BaseChart } from './BaseChart';
import { processCategorySpendingData, CHART_COLORS } from '../../utils/chartUtils';

interface CategorySpendingChartProps {
  transactions: Transaction[];
  period: TimePeriod;
  height?: string | number;
  className?: string;
  onDataPointClick?: (dataPoint: any) => void;
  loading?: boolean;
  error?: string | null;
}

export const CategorySpendingChart: React.FC<CategorySpendingChartProps> = ({
  transactions,
  period,
  height = 300,
  className = '',
  onDataPointClick,
  loading = false,
  error = null,
}) => {
  const chartData = useMemo(() => {
    const dataPoints = processCategorySpendingData(transactions, period);
    
    // Generate colors for categories
    const colors = [
      CHART_COLORS.primary,
      CHART_COLORS.secondary,
      CHART_COLORS.accent,
      CHART_COLORS.danger,
      CHART_COLORS.warning,
      CHART_COLORS.info,
      CHART_COLORS.purple,
      CHART_COLORS.pink,
    ];
    
    return {
      labels: dataPoints.map(point => point.label),
      datasets: [
        {
          label: 'Spending by Category',
          data: dataPoints.map(point => point.value),
          backgroundColor: colors.slice(0, dataPoints.length),
          borderColor: colors.slice(0, dataPoints.length).map(color => color + '80'),
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };
  }, [transactions, period]);

  const handleChartClick = (event: any, elements: any[]) => {
    if (elements.length > 0 && onDataPointClick) {
      const dataIndex = elements[0].index;
      const dataPoints = processCategorySpendingData(transactions, period);
      onDataPointClick(dataPoints[dataIndex]);
    }
  };

  const customOptions = {
    plugins: {
      title: {
        display: true,
        text: `Spending by Category - ${period.charAt(0).toUpperCase() + period.slice(1)}`,
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

  // Calculate summary statistics
  const summary = useMemo(() => {
    const dataPoints = processCategorySpendingData(transactions, period);
    const totalSpending = dataPoints.reduce((sum, point) => sum + point.value, 0);
    const topCategory = dataPoints[0];
    const topCategoryPercentage = totalSpending > 0 ? (topCategory.value / totalSpending) * 100 : 0;
    
    return {
      totalSpending,
      topCategory: topCategory?.label || 'None',
      topCategoryAmount: topCategory?.value || 0,
      topCategoryPercentage,
      categoryCount: dataPoints.length,
    };
  }, [transactions, period]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Spending by Category
        </h3>
        <p className="text-sm text-gray-600">
          Breakdown of your expenses by category
        </p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <BaseChart
            type="doughnut"
            data={chartData}
            options={customOptions}
            height={height}
            onChartClick={handleChartClick}
            loading={loading}
            error={error}
          />
        </div>
        
        {!loading && !error && (
          <div className="lg:w-48 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                ${summary.totalSpending.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Spending</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-blue-900 mb-1">
                {summary.topCategory}
              </div>
              <div className="text-sm text-blue-700">
                ${summary.topCategoryAmount.toLocaleString()} ({summary.topCategoryPercentage.toFixed(1)}%)
              </div>
              <div className="text-xs text-blue-600">Top Category</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-lg font-semibold text-gray-900 mb-1">
                {summary.categoryCount}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        )}
      </div>
      
      {!loading && !error && chartData.labels.length === 0 && (
        <div className="mt-4 text-center text-gray-500">
          <p>No spending data available for this period</p>
        </div>
      )}
    </div>
  );
}; 