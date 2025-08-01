import React from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { DEFAULT_PERIODS } from '../../constants/financial';
import { Button } from '../ui/Button';
import { CheckCircle, Plus, Settings, Bell } from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const { state, changePeriod } = useFinancial();

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

          {/* Period Selector */}
          {state.accounts.length > 0 && (
            <div className="hidden md:flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {DEFAULT_PERIODS.map((period) => (
                <button
                  key={period}
                  onClick={() => changePeriod(period)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    state.selectedPeriod === period
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            {state.accounts.length > 0 && (
              <div className="hidden sm:flex items-center text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4 mr-1.5" />
                <span className="text-sm font-medium">
                  {state.accounts.length} account
                  {state.accounts.length !== 1 ? 's' : ''} connected
                </span>
              </div>
            )}

            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* Add Account Button */}
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              size="sm"
              onClick={() => alert('Bank connection coming soon!')}
            >
              Add Account
            </Button>

            {/* User Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
