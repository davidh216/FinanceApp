import React, { useState } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { DateRangePicker } from '../ui/DateRangePicker';
import { Bell, Eye, EyeOff, RefreshCw } from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const {
    state,
    setCustomDateRange,
    isPrivacyMode,
    togglePrivacyMode,
    accountFilter,
    setAccountFilter,
  } = useFinancial();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);





  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setCustomDateRange(startDate, endDate, 'Custom Range');
  };

  const handleRefresh = () => {
    // For now, just show an alert. In a real app, this would refresh the data
    alert('Refreshing data...');
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  FinanceApp
                </h1>
                <div className="flex items-center">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    DEMO
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Type Filter - Centered */}
          {state.accounts.length > 0 && (
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setAccountFilter('personal')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  accountFilter === 'personal'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => setAccountFilter('business')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  accountFilter === 'business'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Business
              </button>
              <button
                onClick={() => setAccountFilter('both')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  accountFilter === 'both'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Both
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Privacy Toggle */}
            <button
              onClick={togglePrivacyMode}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title={isPrivacyMode ? 'Show amounts' : 'Hide amounts'}
            >
              {isPrivacyMode ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>

            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onDateRangeSelect={handleDateRangeSelect}
        currentStartDate={state.customDateRange?.startDate}
        currentEndDate={state.customDateRange?.endDate}
      />
    </header>
  );
};
