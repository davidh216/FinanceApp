import React, { Suspense, useState } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Budget } from '../../types/financial';
import { DashboardHeader } from './DashboardHeader';
import { DEFAULT_PERIODS } from '../../constants/financial';
import { Button } from '../ui/Button';
import { FullScreenSpinner, InlineSpinner } from '../ui/LoadingSpinner';
import {
  Building,
  Plus,
  Upload,
  Download,
} from 'lucide-react';
import { ChartContainer } from '../charts';
import { useCharts } from '../../hooks/useCharts';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useBudget } from '../../hooks/useBudget';

// Lazy load components for code splitting
const AccountDetail = React.lazy(() => import('../accounts/AccountDetail').then(module => ({ default: module.AccountDetail })));
const KPISection = React.lazy(() => import('./KPISection').then(module => ({ default: module.KPISection })));
const AccountOverview = React.lazy(() => import('./AccountOverview').then(module => ({ default: module.AccountOverview })));
const RecentActivity = React.lazy(() => import('./RecentActivity').then(module => ({ default: module.RecentActivity })));
const BudgetOverview = React.lazy(() => import('../budget/BudgetOverview').then(module => ({ default: module.BudgetOverview })));
const BudgetForm = React.lazy(() => import('../budget/BudgetForm').then(module => ({ default: module.BudgetForm })));

export const Dashboard: React.FC = () => {
  const {
    state,
    viewAccountDetail,
    accountFilter,
    changePeriod,
  } = useFinancial();

  // Budget management state
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Use budget hook
  const { budgets } = useBudget();

  // Use consolidated dashboard data hook
  const dashboardData = useDashboardData({
    accounts: state.accounts,
    accountFilter,
    selectedPeriod: state.selectedPeriod,
    customDateRange: state.customDateRange,
    isLoading: state.isLoading,
  });

  const { filteredAccounts, filteredSummary, trendData, allTransactions, hasAccounts } = dashboardData;
  const isLoading = state.isLoading;

  // Use charts hook
  const {
    isExporting,
    exportError,
    handleExportTransactions,
    handleExportSummary,
    refreshCharts,
  } = useCharts(allTransactions, filteredAccounts, state.selectedPeriod, state.filters);

  // Check if we're in demo mode
  const isDemoMode = localStorage.getItem('financeapp-demo-mode') === 'true' || 
                    new URLSearchParams(window.location.search).get('demo') === 'true';

  // Add routing logic for account-detail screen with lazy loading
  if (state.currentScreen === 'account-detail') {
    return (
      <Suspense fallback={<FullScreenSpinner text="Loading Account Details..." />}>
        <AccountDetail />
      </Suspense>
    );
  }

  // Loading state
  if (isLoading) {
    return <FullScreenSpinner text="Loading your financial data..." />;
  }

  // Empty state - no accounts connected
  if (!hasAccounts) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to FinanceApp
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Connect your bank accounts to get started with smart financial
              management. We'll help you track spending, categorize
              transactions, and gain insights into your financial health.
            </p>
            <Button onClick={() => alert('Bank connection coming soon!')}>
              Connect Your First Account
            </Button>
          </div>

          {/* Feature Preview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Smart Analytics
              </h3>
              <p className="text-gray-600">
                Get insights into your spending patterns and financial trends
                with interactive charts and KPIs.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Budget Management
              </h3>
              <p className="text-gray-600">
                Set budgets, track spending, and get alerts when you're
                approaching your limits.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Your data is protected with 256-bit encryption and
                industry-leading security practices.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main dashboard with data
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-semibold text-lg">Demo Mode Active</h3>
                  <p className="text-blue-100 text-sm">
                    You're viewing sample data. Sign in to connect your real accounts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('financeapp-demo-mode');
                  window.location.href = '/';
                }}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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
                <p className="text-sm text-red-800">{state.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Period Selector - Centered above KPI Section */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {DEFAULT_PERIODS.map((period) => (
              <button
                key={period}
                onClick={() => {
                  if (period === 'custom') {
                    // Handle custom date picker
                    alert('Custom date picker coming soon!');
                  } else {
                    changePeriod(period as any);
                  }
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  state.selectedPeriod === period
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {period === 'day'
                  ? 'D'
                  : period === 'week'
                  ? 'W'
                  : period === 'month'
                  ? 'M'
                  : period === 'quarter'
                  ? 'Q'
                  : period === 'year'
                  ? 'Y'
                  : period === '5year'
                  ? '5Y'
                  : period === 'custom'
                  ? 'Custom'
                  : period}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Section */}
        <div className="mb-6">
          <Suspense fallback={<InlineSpinner />}>
            <KPISection
              summary={filteredSummary}
              totalBalance={filteredSummary.totalBalance}
              period={state.selectedPeriod}
              budgets={budgets}
              balanceTrend={trendData?.balance}
              incomeTrend={trendData?.income}
              expenseTrend={trendData?.expenses}
              savingsTrend={trendData?.savings}
            />
          </Suspense>
        </div>

        {/* Account Overview */}
        <div className="mb-6">
          <Suspense fallback={<InlineSpinner />}>
            <AccountOverview
              accounts={filteredAccounts}
              onAccountSelect={viewAccountDetail}
              accountFilter={accountFilter}
            />
          </Suspense>
        </div>

        {/* Charts Section */}
        <div className="mb-6">
          <ChartContainer
            transactions={allTransactions}
            accounts={filteredAccounts}
            period={state.selectedPeriod}
            budgets={budgets}
            loading={isLoading}
            error={state.error}
            onExport={handleExportTransactions}
            onRefresh={refreshCharts}
          />
        </div>

        {/* Budget Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Budget Management</h2>
            <Button
              onClick={() => setShowBudgetForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Budget</span>
            </Button>
          </div>
          
          <Suspense fallback={<InlineSpinner />}>
            <BudgetOverview
              onBudgetSelect={setSelectedBudget}
              onCreateBudget={() => setShowBudgetForm(true)}
            />
          </Suspense>
        </div>

        {/* Recent Activity */}
        <div className="mb-6">
          <Suspense fallback={<InlineSpinner />}>
            <RecentActivity
              accounts={filteredAccounts}
              limit={10}
            />
          </Suspense>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleExportTransactions}
              disabled={isExporting}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Transactions'}</span>
            </Button>
            <Button
              onClick={handleExportSummary}
              disabled={isExporting}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Summary'}</span>
            </Button>
          </div>
          {exportError && (
            <p className="text-red-600 text-sm mt-2">{exportError}</p>
          )}
        </div>
      </main>

      {/* Budget Form Modal */}
      {showBudgetForm && (
        <Suspense fallback={<FullScreenSpinner text="Loading Budget Form..." />}>
          <BudgetForm
            budget={selectedBudget}
            onSave={(budget) => {
              // TODO: Save budget
              setShowBudgetForm(false);
            }}
            onCancel={() => setShowBudgetForm(false)}
            isOpen={showBudgetForm}
          />
        </Suspense>
      )}
    </div>
  );
};
