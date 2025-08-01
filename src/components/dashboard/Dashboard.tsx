import React, { useMemo } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Account, Transaction } from '../../types/financial';
import { DashboardHeader } from './DashboardHeader';
import { KPISection } from './KPISection';
import { AccountOverview } from './AccountOverview';
import { RecentActivity } from './RecentActivity';
import { AccountDetail } from '../accounts/AccountDetail';
import { DEFAULT_PERIODS } from '../../constants/financial';
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
    viewAccountDetail,
    accountFilter,
    changePeriod,
  } = useFinancial();

  const hasAccounts = state.accounts.length > 0;
  const isLoading = state.isLoading;

  // Filter accounts based on accountFilter
  const filteredAccounts = useMemo(() => {
    return state.accounts.filter((account: Account) => {
      if (accountFilter === 'both') return true;
      if (accountFilter === 'personal')
        return !account.type.includes('BUSINESS');
      if (accountFilter === 'business')
        return account.type.includes('BUSINESS');
      return true;
    });
  }, [state.accounts, accountFilter]);

  // Calculate filtered total balance
  const filteredTotalBalance = useMemo(() => {
    return filteredAccounts.reduce(
      (sum: number, account: Account) => sum + account.balance,
      0
    );
  }, [filteredAccounts]);

  // Calculate filtered summary
  const filteredSummary = useMemo(() => {
    const filteredTransactions = filteredAccounts.flatMap(
      (acc: Account) => acc.transactions || []
    );
    // const totalBalance = filteredTotalBalance;

    const today = new Date();
    let startDate: Date;
    let periodLabel: string;

    // Calculate period boundaries based on selectedPeriod
    switch (state.selectedPeriod) {
      case 'day':
        startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        periodLabel = 'daily';
        break;
      case 'week':
        const dayOfWeek = today.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - daysToSubtract
        );
        periodLabel = 'weekly';
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        periodLabel = 'monthly';
        break;
      case 'quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
        periodLabel = 'quarterly';
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        periodLabel = 'yearly';
        break;
      case '5year':
        startDate = new Date(today.getFullYear() - 5, 0, 1);
        periodLabel = '5-year';
        break;
      case 'custom':
        if (state.customDateRange) {
          startDate = new Date(state.customDateRange.startDate);
          periodLabel = 'custom';
        } else {
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          periodLabel = 'monthly';
        }
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        periodLabel = 'monthly';
    }

    const endDate = new Date();

    // Filter transactions for the selected period
    const periodTransactions = filteredTransactions.filter(
      (txn: Transaction) => {
        const txnDate = new Date(txn.date);
        return txnDate >= startDate && txnDate <= endDate;
      }
    );

    const periodIncome = periodTransactions
      .filter((txn: Transaction) => txn.amount > 0)
      .reduce((sum: number, txn: Transaction) => sum + txn.amount, 0);

    const periodExpenses = Math.abs(
      periodTransactions
        .filter((txn: Transaction) => txn.amount < 0)
        .reduce((sum: number, txn: Transaction) => sum + txn.amount, 0)
    );

    const savingsRate =
      periodIncome > 0 ? (periodIncome - periodExpenses) / periodIncome : 0;

    // Calculate previous period for comparison
    let prevStartDate: Date;
    switch (state.selectedPeriod) {
      case 'day':
        prevStartDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 1
        );
        break;
      case 'week':
        prevStartDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 7
        );
        break;
      case 'month':
        prevStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        break;
      case 'quarter':
        const prevQuarter = Math.floor(today.getMonth() / 3) - 1;
        prevStartDate =
          prevQuarter >= 0
            ? new Date(today.getFullYear(), prevQuarter * 3, 1)
            : new Date(today.getFullYear() - 1, 9, 1);
        break;
      case 'year':
        prevStartDate = new Date(today.getFullYear() - 1, 0, 1);
        break;
      case '5year':
        prevStartDate = new Date(today.getFullYear() - 10, 0, 1);
        break;
      default:
        prevStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    }

    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevPeriodTransactions = filteredTransactions.filter(
      (txn: Transaction) => {
        const txnDate = new Date(txn.date);
        return txnDate >= prevStartDate && txnDate <= prevEndDate;
      }
    );

    const prevPeriodIncome = prevPeriodTransactions
      .filter((txn: Transaction) => txn.amount > 0)
      .reduce((sum: number, txn: Transaction) => sum + txn.amount, 0);

    const prevPeriodExpenses = Math.abs(
      prevPeriodTransactions
        .filter((txn: Transaction) => txn.amount < 0)
        .reduce((sum: number, txn: Transaction) => sum + txn.amount, 0)
    );

    return {
      totalBalance,
      monthlyIncome: Math.round(periodIncome * 100) / 100,
      monthlyExpenses: Math.round(periodExpenses * 100) / 100,
      netWorth: totalBalance,
      debtToIncomeRatio: periodIncome > 0 ? periodExpenses / periodIncome : 0,
      savingsRate: Math.max(0, savingsRate),
      previousPeriodIncome: prevPeriodIncome,
      previousPeriodExpenses: prevPeriodExpenses,
      periodLabel,
    };
  }, [
    filteredAccounts,
    state.selectedPeriod,
    state.customDateRange,
    totalBalance,
  ]);

  // Generate actual trend data based on selected period
  const generateTrendData = useMemo(() => {
    const filteredTransactions = filteredAccounts.flatMap(
      (acc: Account) => acc.transactions || []
    );
    const today = new Date();

    // Determine number of data points based on period
    let dataPoints: number;
    let intervalDays: number;

    switch (state.selectedPeriod) {
      case 'day':
        dataPoints = 24; // Hourly data for the day
        intervalDays = 1 / 24;
        break;
      case 'week':
        dataPoints = 7; // Daily data for the week
        intervalDays = 1;
        break;
      case 'month':
        dataPoints = 30; // Daily data for the month
        intervalDays = 1;
        break;
      case 'quarter':
        dataPoints = 13; // Weekly data for the quarter
        intervalDays = 7;
        break;
      case 'year':
        dataPoints = 12; // Monthly data for the year
        intervalDays = 30;
        break;
      case '5year':
        dataPoints = 60; // Monthly data for 5 years
        intervalDays = 30;
        break;
      default:
        dataPoints = 30;
        intervalDays = 1;
    }

    // Generate trend data for balance over time
    const balanceTrend = [];
    for (let i = dataPoints - 1; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i * intervalDays);

      // Calculate balance up to this point in time
      const transactionsUpToDate = filteredTransactions.filter(
        (txn: Transaction) => {
          const txnDate = new Date(txn.date);
          return txnDate <= targetDate;
        }
      );

      const balanceAtDate =
        filteredAccounts.reduce((sum: number, account: Account) => {
          return sum + account.balance;
        }, 0) +
        transactionsUpToDate.reduce(
          (sum: number, txn: Transaction) => sum + txn.amount,
          0
        );

      balanceTrend.push(Math.max(0, balanceAtDate)); // Ensure non-negative for display
    }

    // Generate trend data for income over time
    const incomeTrend = [];
    for (let i = dataPoints - 1; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i * intervalDays);

      const startDate = new Date(targetDate);
      startDate.setDate(targetDate.getDate() - intervalDays);

      const periodTransactions = filteredTransactions.filter(
        (txn: Transaction) => {
          const txnDate = new Date(txn.date);
          return (
            txnDate >= startDate && txnDate <= targetDate && txn.amount > 0
          );
        }
      );

      const periodIncome = periodTransactions.reduce(
        (sum: number, txn: Transaction) => sum + txn.amount,
        0
      );
      incomeTrend.push(periodIncome);
    }

    // Generate trend data for expenses over time
    const expenseTrend = [];
    for (let i = dataPoints - 1; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i * intervalDays);

      const startDate = new Date(targetDate);
      startDate.setDate(targetDate.getDate() - intervalDays);

      const periodTransactions = filteredTransactions.filter(
        (txn: Transaction) => {
          const txnDate = new Date(txn.date);
          return (
            txnDate >= startDate && txnDate <= targetDate && txn.amount < 0
          );
        }
      );

      const periodExpenses = Math.abs(
        periodTransactions.reduce(
          (sum: number, txn: Transaction) => sum + txn.amount,
          0
        )
      );
      expenseTrend.push(periodExpenses);
    }

    // Generate trend data for savings rate over time
    const savingsTrend = [];
    for (let i = dataPoints - 1; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i * intervalDays);

      const startDate = new Date(targetDate);
      startDate.setDate(targetDate.getDate() - intervalDays);

      const periodTransactions = filteredTransactions.filter(
        (txn: Transaction) => {
          const txnDate = new Date(txn.date);
          return txnDate >= startDate && txnDate <= targetDate;
        }
      );

      const periodIncome = periodTransactions
        .filter((txn: Transaction) => txn.amount > 0)
        .reduce((sum: number, txn: Transaction) => sum + txn.amount, 0);

      const periodExpenses = Math.abs(
        periodTransactions
          .filter((txn: Transaction) => txn.amount < 0)
          .reduce((sum: number, txn: Transaction) => sum + txn.amount, 0)
      );

      const savingsRate =
        periodIncome > 0 ? (periodIncome - periodExpenses) / periodIncome : 0;
      savingsTrend.push(Math.max(0, savingsRate * 100)); // Convert to percentage
    }

    return {
      balance: balanceTrend,
      income: incomeTrend,
      expenses: expenseTrend,
      savings: savingsTrend,
    };
  }, [filteredAccounts, state.selectedPeriod]);

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
          <KPISection
            summary={filteredSummary}
            totalBalance={filteredTotalBalance}
            period={state.selectedPeriod}
            balanceTrend={generateTrendData.balance}
            incomeTrend={generateTrendData.income}
            expenseTrend={generateTrendData.expenses}
            savingsTrend={generateTrendData.savings}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Account Overview */}
          <div className="flex flex-col">
            <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
              <AccountOverview
                accounts={state.accounts}
                onAccountSelect={(account) => {
                  viewAccountDetail(account);
                }}
                accountFilter={accountFilter}
              />
            </div>
          </div>

          {/* Right Column - Quick Actions + Recent Activity */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
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
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <RecentActivity accounts={filteredAccounts} limit={5} />
          </div>
        </div>
      </main>
    </div>
  );
};
