import React, { useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface BaseChartProps {
  type: 'line' | 'bar' | 'doughnut' | 'pie';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      fill?: boolean;
      tension?: number;
    }>;
  };
  options?: any;
  height?: string | number;
  width?: string | number;
  className?: string;
  onChartClick?: (event: any, elements: any[]) => void;
  loading?: boolean;
  error?: string | null;
}

export const BaseChart: React.FC<BaseChartProps> = ({
  type,
  data,
  options = {},
  height = 400,
  width = '100%',
  className = '',
  onChartClick,
  loading = false,
  error = null,
}) => {
  const chartRef = useRef<ChartJS>(null);
  const [chartInstance, setChartInstance] = useState<ChartJS | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      setChartInstance(chartRef.current);
    }
  }, []);

  // Handle chart click events
  const handleClick = (event: any, elements: any[]) => {
    if (onChartClick) {
      onChartClick(event, elements);
    }
  };

  // Default options based on chart type
  const getDefaultOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
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
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context: any) {
              const label = context.dataset.label || '';
              const value = context.parsed.y || context.parsed;
              return `${label}: $${value.toLocaleString()}`;
            },
          },
        },
      },
      onClick: handleClick,
    };

    switch (type) {
      case 'line':
        return {
          ...baseOptions,
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                maxRotation: 45,
                color: '#6B7280',
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
              ticks: {
                color: '#6B7280',
                callback: function(value: any) {
                  return '$' + value.toLocaleString();
                },
              },
            },
          },
          elements: {
            point: {
              radius: 4,
              hoverRadius: 6,
            },
            line: {
              tension: 0.4,
            },
          },
        };
      case 'bar':
        return {
          ...baseOptions,
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                color: '#6B7280',
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
              ticks: {
                color: '#6B7280',
                callback: function(value: any) {
                  return '$' + value.toLocaleString();
                },
              },
            },
          },
        };
      case 'doughnut':
      case 'pie':
        return {
          ...baseOptions,
          cutout: type === 'doughnut' ? '60%' : undefined,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              ...baseOptions.plugins.legend,
              position: 'right' as const,
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

  const mergedOptions = {
    ...getDefaultOptions(),
    ...options,
  };

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`}
      style={{ height, width }}
    >
      <Chart
        ref={chartRef}
        type={type}
        data={data}
        options={mergedOptions}
      />
    </div>
  );
}; 