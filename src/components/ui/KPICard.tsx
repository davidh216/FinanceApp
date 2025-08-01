import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';

interface KPICardProps {
  title: string;
  value: number;
  change: number;
  valueChange?: number; // Dollar value change
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
  valueChange,
  isPositive,
  isCurrency = true,
  color = 'blue',
  trendData = [],
  period = 'month',
}) => {
  const { isPrivacyMode } = useFinancial();

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
    <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium text-gray-600">{title}</h3>
      </div>

      <p className={`text-xl font-bold mb-1 ${colorClasses[color]}`}>
        {isPrivacyMode ? (
          <span className="text-gray-400">••••••</span>
        ) : (
          <>
            {isCurrency ? '$' : ''}
            {Math.abs(value).toLocaleString('en-US', {
              minimumFractionDigits: isCurrency ? 2 : 0,
            })}
          </>
        )}
      </p>

      {/* Mini Trend Chart */}
      {trendData.length > 0 && (
        <div className="h-6 mb-1 relative">
          <svg className="w-full h-full" viewBox="0 0 100 24">
            {(() => {
              const maxVal = Math.max(...trendData);
              const minVal = Math.min(...trendData);
              const range = maxVal - minVal || 1;

              const points = trendData
                .map((val, index) => {
                  const x = (index / (trendData.length - 1)) * 100;
                  const y = 24 - ((val - minVal) / range) * 18 - 3;
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <>
                  <polyline
                    fill="none"
                    stroke={strokeColors[color]}
                    strokeWidth="1.5"
                    points={points}
                    className="drop-shadow-sm"
                  />
                  <circle
                    cx={trendData.length > 1 ? 100 : 50}
                    cy={
                      trendData.length > 1
                        ? 24 -
                          ((trendData[trendData.length - 1] - minVal) / range) *
                            18 -
                          3
                        : 12
                    }
                    r="1.5"
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
        className={`flex items-center text-xs ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {change >= 0 ? (
          <TrendingUp className="w-3 h-3 mr-1" />
        ) : (
          <TrendingDown className="w-3 h-3 mr-1" />
        )}
        <span>
          {change >= 0 ? '+' : ''}
          {change.toFixed(1)}%
          {valueChange !== undefined && (
            <span className="ml-1">
              ({valueChange >= 0 ? '+' : ''}$
              {Math.abs(valueChange).toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
              )
            </span>
          )}
          {' vs last '}
          {period}
        </span>
      </div>
    </div>
  );
};
