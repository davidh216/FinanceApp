import React, { useState } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { FileSyncIndicator } from './FileSyncIndicator';
import { DataExportModal } from '../import/DataExportModal';

export const DashboardHeader: React.FC = () => {
  const {
    isPrivacyMode,
    togglePrivacyMode,
    accountFilter,
    setAccountFilter,
    hasImportedAccounts,
    hasBusinessAccounts,
    showDemoAccounts,
    setShowDemoAccounts,
    storageError,
  } = useFinancial();
  // Opened from the auto-save status when it needs attention.
  const [isDataOpen, setIsDataOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* On phones the Personal / Business switch wraps onto its own row. */}
        <div className="flex flex-wrap items-center justify-between gap-y-2 py-3 sm:flex-nowrap sm:py-0 sm:h-16">
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
                <div className="flex items-center gap-2">
                  {showDemoAccounts && (
                    <span
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                      data-testid="demo-badge"
                    >
                      DEMO
                    </span>
                  )}
                  {hasImportedAccounts && (
                    <button
                      onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                      data-testid="demo-toggle"
                    >
                      {showDemoAccounts
                        ? 'Hide demo accounts'
                        : 'Show demo accounts'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Type Filter - Centered */}
          {hasBusinessAccounts && (
            <div className="order-last w-full flex justify-center sm:order-none sm:w-auto">
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
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            <FileSyncIndicator onOpenSettings={() => setIsDataOpen(true)} />

            {/* Privacy Toggle */}
            <button
              onClick={togglePrivacyMode}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title={isPrivacyMode ? 'Show amounts' : 'Hide amounts'}
              aria-label={isPrivacyMode ? 'Show amounts' : 'Hide amounts'}
            >
              {isPrivacyMode ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      {storageError && (
        <div
          className="bg-red-50 border-t border-red-200"
          role="alert"
          data-testid="storage-error"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-red-800">
            <span className="flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {storageError}
            </span>
            <button
              onClick={() => setIsDataOpen(true)}
              className="font-medium underline hover:text-red-900"
            >
              Back up now
            </button>
          </div>
        </div>
      )}
      <DataExportModal
        isOpen={isDataOpen}
        onClose={() => setIsDataOpen(false)}
      />
    </header>
  );
};
