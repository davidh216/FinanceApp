import React, { useMemo } from 'react';
import { Transaction, Account, TimePeriod } from '../../types/financial';
import { BaseChart } from './BaseChart';
import { processBalanceTrendData, CHART_COLORS } from '../../utils/chartUtils';

interface BalanceTrendChartProps {
  transactions: Transaction[];
  accounts: Account[];
  period: TimePeriod;
  height?: string | number;
  className?: string;
  onDataPointClick?: (dataPoint: any) => void;
  loading?: boolean;
  error?: string | null;
}

export const BalanceTrendChart: React.FC<BalanceTrendChartProps> = ({
  transactions,
  accounts,
  period,
  height = 300,
  className = '',
  onDataPointClick,
  loading = false,
  error = null,
}) => {
  const chartData = useMemo(() => {
    const dataPoints = processBalanceTrendData(transactions, accounts, period);
    
    return {
      labels: dataPoints.map(point => point.label),
      datasets: [
        {
          label: 'Balance',
          data: dataPoints.map(point => point.value),
          borderColor: CHART_COLORS.primary,
          backgroundColor: CHART_COLORS.primary + '20',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: CHART_COLORS.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [transactions, accounts, period]);

  const handleChartClick = (event: any, elements: any[]) => {
    if (elements.length > 0 && onDataPointClick) {
      const dataIndex = elements[0].index;
      const dataPoints = processBalanceTrendData(transactions, accounts, period);
      onDataPointClick(dataPoints[dataIndex]);
    }
  };

  const customOptions = {
    plugins: {
      title: {
        display: true,
        text: `Balance Trend - ${period.charAt(0).toUpperCase() + period.slice(1)}`,
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
            const value = context.parsed.y;
            return `Balance: $${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Balance Trend
        </h3>
        <p className="text-sm text-gray-600">
          Track your account balance over time
        </p>
      </div>
      
      <BaseChart
        type="line"
        data={chartData}
        options={customOptions}
        height={height}
        onChartClick={handleChartClick}
        loading={loading}
        error={error}
      />
      
      {!loading && !error && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">Current Balance:</span>
            <span className="ml-2 text-green-600 font-semibold">
              ${accounts.reduce((sum, account) => sum + account.balance, 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="font-medium">Period:</span>
            <span className="ml-2 capitalize">{period}</span>
          </div>
        </div>
      )}
    </div>
  );
}; 