import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  change: number;
  isPositive: boolean;
  isCurrency?: boolean;
  color?: 'red' | 'green' | 'blue' | 'purple';
  trendData?: number[];
  period?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  isPositive,
  isCurrency = true,
  color = 'blue',
  trendData = [],
  period = 'month',
}) => {
  const colorClasses = {
    red: 'text-red-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  };

  const strokeColors = {
    red: '#ef4444',
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#a855f7',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>

      <p className={`text-2xl font-bold mb-2 ${colorClasses[color]}`}>
        {isCurrency ? '$' : ''}
        {Math.abs(value).toLocaleString('en-US', {
          minimumFractionDigits: isCurrency ? 2 : 0,
        })}
      </p>

      {/* Mini Trend Chart */}
      {trendData.length > 0 && (
        <div className="h-8 mb-2 relative">
          <svg className="w-full h-full" viewBox="0 0 100 32">
            {(() => {
              const maxVal = Math.max(...trendData);
              const minVal = Math.min(...trendData);
              const range = maxVal - minVal || 1;

              const points = trendData
                .map((val, index) => {
                  const x = (index / (trendData.length - 1)) * 100;
                  const y = 32 - ((val - minVal) / range) * 24 - 4;
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <>
                  <polyline
                    fill="none"
                    stroke={strokeColors[color]}
                    strokeWidth="2"
                    points={points}
                    className="drop-shadow-sm"
                  />
                  <circle
                    cx={trendData.length > 1 ? 100 : 50}
                    cy={
                      trendData.length > 1
                        ? 32 -
                          ((trendData[trendData.length - 1] - minVal) / range) *
                            24 -
                          4
                        : 16
                    }
                    r="2"
                    fill={strokeColors[color]}
                    className="drop-shadow-sm"
                  />
                </>
              );
            })()}
          </svg>
        </div>
      )}

      {/* Change Indicator */}
      <div
        className={`flex items-center text-sm ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {change >= 0 ? (
          <TrendingUp className="w-4 h-4 mr-1" />
        ) : (
          <TrendingDown className="w-4 h-4 mr-1" />
        )}
        <span>
          {change >= 0 ? '+' : ''}
          {change.toFixed(1)}% vs last {period}
        </span>
      </div>
    </div>
  );
};
