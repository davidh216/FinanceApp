import React from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { DashboardHeader } from './DashboardHeader';
import { KPISection } from './KPISection';
import { AccountOverview } from './AccountOverview';
import { RecentActivity } from './RecentActivity';
import { AccountDetail } from '../accounts/AccountDetail';
import { Button } from '../ui/Button';
import {
  Building,
  Plus,
  Calculator,
  Target,
  PieChart,
  Upload,
  Download,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { 
    state, 
    totalBalance, 
    summary, 
    selectAccount,
    changeScreen,
    viewAccountDetail
  } = useFinancial();

  const hasAccounts = state.accounts.length > 0;
  const isLoading = state.isLoading;

  // Add routing logic for account-detail screen
  if (state.currentScreen === 'account-detail') {
    return <AccountDetail />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="mt-4 text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
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
                <span className="text-2xl">🏷️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Auto-Tagging
              </h3>
              <p className="text-gray-600">
                Automatically categorize transactions with AI-powered merchant
                recognition and smart tagging.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Bank-Level Security
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

        {/* KPI Section */}
        <div className="mb-8">
          <KPISection
            summary={summary}
            totalBalance={totalBalance}
            period={state.selectedPeriod}
            trendData={[2000, 2200, 2100, 2400, 2500]}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Account Overview */}
          <div className="flex flex-col">
            <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
              <AccountOverview
                accounts={state.accounts}
                onAccountSelect={(account) => {
                  viewAccountDetail(account);
                }}
              />
            </div>
          </div>

          {/* Right Column - Quick Actions + Recent Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h3>
                <p className="text-sm text-gray-600">Common tasks and tools</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Plus,
                    label: 'Add Transaction',
                    color: 'bg-blue-500',
                  },
                  { icon: Upload, label: 'Import CSV', color: 'bg-green-500' },
                  { icon: Target, label: 'Set Budget', color: 'bg-purple-500' },
                  {
                    icon: Calculator,
                    label: 'Calculator',
                    color: 'bg-orange-500',
                  },
                  {
                    icon: PieChart,
                    label: 'Generate Report',
                    color: 'bg-pink-500',
                  },
                  {
                    icon: Download,
                    label: 'Export Data',
                    color: 'bg-gray-500',
                  },
                ].map((action, index) => (
                  <button
                    key={index}
                    className="group p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left"
                    onClick={() => alert(`${action.label} coming soon!`)}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
                    >
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {action.label}
                      </h4>
                      <p className="text-xs text-gray-500">Click to explore</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <RecentActivity accounts={state.accounts} limit={5} />
          </div>
        </div>

        {/* Additional Insights Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Spending Categories */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Spending Categories
            </h3>
            <div className="space-y-3">
              {[
                { category: 'Food & Dining', amount: 450, color: 'bg-red-500' },
                {
                  category: 'Transportation',
                  amount: 320,
                  color: 'bg-blue-500',
                },
                { category: 'Shopping', amount: 280, color: 'bg-purple-500' },
                { category: 'Utilities', amount: 180, color: 'bg-orange-500' },
              ].map((item, index) => {
                const percentage = (item.amount / 1230) * 100;

                return (
                  <div
                    key={item.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${item.color} mr-3`}
                      ></div>
                      <span className="text-sm text-gray-700">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.color} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        ${item.amount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Health Score */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Financial Health
            </h3>
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg
                  className="w-24 h-24 transform -rotate-90"
                  viewBox="0 0 36 36"
                >
                  {/* Background circle */}
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  {/* Progress circle */}
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="85, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">85</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">Excellent</p>
              <p className="text-xs text-gray-500">
                Your spending is well controlled and savings rate is healthy.
              </p>
            </div>
          </div>

          {/* Monthly Goals */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Goals
            </h3>
            <div className="space-y-4">
              {[
                {
                  goal: 'Save $500',
                  current: 380,
                  target: 500,
                  color: 'bg-green-500',
                },
                {
                  goal: 'Dining Budget',
                  current: 320,
                  target: 400,
                  color: 'bg-yellow-500',
                },
                {
                  goal: 'Emergency Fund',
                  current: 2400,
                  target: 5000,
                  color: 'bg-blue-500',
                },
              ].map((item, index) => {
                const percentage = (item.current / item.target) * 100;

                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.goal}</span>
                      <span className="text-gray-900 font-medium">
                        ${item.current.toLocaleString()} / $
                        {item.target.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
