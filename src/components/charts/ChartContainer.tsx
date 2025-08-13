import React, { useState } from 'react';
import { Transaction, Account, TimePeriod, Budget } from '../../types/financial';
import { ChartFactory, ChartType } from './ChartFactory';
import { Button } from '../ui/Button';
import { Download, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

/**
 * ChartContainer - Financial Analytics Dashboard
 * 
 * Layout Changes (Sprint 6):
 * - Changed from horizontal columns to vertical rows layout
 * - Improved mobile experience and data flow
 * - Charts start collapsed (200px height) and can expand to 600px
 * - Removed redundant container header, moved export button to individual charts
 * - Maintained ChartFactory pattern and performance optimizations
 */

interface ChartContainerProps {
  transactions: Transaction[];
  accounts: Account[];
  period: TimePeriod;
  budgets?: Budget[];
  loading?: boolean;
  error?: string | null;
  onExport?: () => void;
  onRefresh?: () => void;
}

const CHART_CONFIGS: Array<{
  type: ChartType;
  title: string;
  description: string;
}> = [
  {
    type: 'balance',
    title: 'Balance Trend',
    description: 'Track your account balance over time'
  },
  {
    type: 'income-expense',
    title: 'Income vs Expenses',
    description: 'Compare your income and spending patterns'
  },
  {
    type: 'category',
    title: 'Spending by Category',
    description: 'See where your money is going'
  },
  {
    type: 'budget-vs-actual',
    title: 'Budget vs Actual',
    description: 'Compare your spending to your budgets'
  }
];

export const ChartContainer: React.FC<ChartContainerProps> = ({
  transactions,
  accounts,
  period,
  budgets = [],
  loading = false,
  error = null,
  onExport,
  onRefresh,
}) => {
  const [expandedChart, setExpandedChart] = useState<ChartType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleDataPointClick = (dataPoint: any, chartType: ChartType) => {
    console.log(`${chartType} data point clicked:`, dataPoint);
    // You can implement navigation or detailed view here
  };

  const toggleChartExpansion = (chartType: ChartType) => {
    setExpandedChart(expandedChart === chartType ? null : chartType);
  };

  const renderChartCard = (chartConfig: typeof CHART_CONFIGS[0]) => {
    const isExpanded = expandedChart === chartConfig.type;
    
    return (
      <div 
        key={chartConfig.type}
        className="bg-white rounded-lg shadow-sm border transition-all duration-300"
      >
                 {/* Chart Header */}
         <div className="p-4 border-b border-gray-200">
           <div className="flex items-center justify-between">
             <div>
               <h3 className="text-lg font-semibold text-gray-900">
                 {chartConfig.title}
               </h3>
               <p className="text-sm text-gray-600">
                 {chartConfig.description}
               </p>
             </div>
            
                         <div className="flex items-center space-x-2">
               {/* Export Button */}
               <Button
                 onClick={onExport}
                 disabled={loading}
                 variant="outline"
                 size="sm"
                 className="flex items-center space-x-1"
               >
                 <Download className="w-4 h-4" />
                 <span>Export</span>
               </Button>

               {/* Refresh Button */}
               <Button
                 onClick={handleRefresh}
                 disabled={isRefreshing}
                 variant="outline"
                 size="sm"
                 className="flex items-center space-x-1"
               >
                 <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                 <span>Refresh</span>
               </Button>

               {/* Expand/Collapse Button */}
               <Button
                 onClick={() => toggleChartExpansion(chartConfig.type)}
                 variant="outline"
                 size="sm"
                 className="flex items-center space-x-1"
               >
                 {isExpanded ? (
                   <>
                     <Minimize2 className="w-4 h-4" />
                     <span>Collapse</span>
                   </>
                 ) : (
                   <>
                     <Maximize2 className="w-4 h-4" />
                     <span>Expand</span>
                   </>
                 )}
               </Button>
             </div>
          </div>
        </div>

        {/* Chart Content */}
        <div className="p-4">
          <ChartFactory
            chartType={chartConfig.type}
            transactions={transactions}
            accounts={accounts}
            period={period}
            budgets={budgets}
            height={isExpanded ? 600 : 200}
            loading={loading}
            error={error}
            onDataPointClick={handleDataPointClick}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Charts Grid - Vertical rows layout for improved mobile experience and data flow */}
      <div className="grid grid-cols-1 gap-6 max-w-full">
        {CHART_CONFIGS.map(renderChartCard)}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading charts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">Error loading charts: {error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 