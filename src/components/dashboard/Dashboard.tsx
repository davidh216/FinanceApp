import React, { useMemo, useState } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Account } from '../../types/financial';
import { DashboardHeader } from './DashboardHeader';
import { KPISection } from './KPISection';
import { AccountOverview } from './AccountOverview';
import { RecentActivity } from './RecentActivity';
import { AccountDetail } from '../accounts/AccountDetail';
import { DEFAULT_PERIODS } from '../../constants/financial';
import { Button } from '../ui/Button';
import { CsvImportModal } from '../import/CsvImportModal';
import { AddAccountModal } from '../accounts/AddAccountModal';
import { DataExportModal } from '../import/DataExportModal';
import { BudgetModal } from '../budgets/BudgetModal';
import { BudgetsCard } from '../budgets/BudgetsCard';
import { GoalsCard } from '../goals/GoalsCard';
import { RecurringCard } from '../recurring/RecurringCard';
import { UpcomingCard } from '../recurring/UpcomingCard';
import {
  FORECAST_DAYS,
  forecastBalances,
  upcomingEvents,
} from '../../utils/forecast';
import { findRecurringPayments } from '../../utils/recurring';
import { SpendingReportModal } from '../reports/SpendingReportModal';
import { CashflowChart } from './CashflowChart';
import { NetWorthChart } from './NetWorthChart';
import { netWorthHistory } from '../../utils/netWorthHistory';
import {
  monthBounds,
  monthlyCashflow,
  shiftMonth,
} from '../../utils/cashflowHistory';
import { DateRangePicker } from '../ui/DateRangePicker';
import { AddTransactionModal } from '../transactions/AddTransactionModal';
import { TransactionsPage } from '../transactions/TransactionsPage';
import { monthOf, spendingByCategory } from '../../utils/budgets';
import {
  Building,
  Plus,
  List,
  Target,
  PieChart,
  Upload,
  Download,
} from 'lucide-react';
import { formatDateRange, toLocalDateString } from '../../utils/date';
import { periodSummary, trendData } from '../../utils/dashboardSummary';

export const Dashboard: React.FC = () => {
  const {
    state,
    viewAccountDetail,
    accountFilter,
    changePeriod,
    setCustomDateRange,
    changeScreen,
  } = useFinancial();

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  // A month picked on the cash flow chart; the report shows it, compared
  // with the month before, instead of the selected period.
  const [reportMonth, setReportMonth] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const hasAccounts = state.accounts.length > 0;

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

  // Budgets always cover the current calendar month, across the accounts
  // you're viewing.
  const budgetMonth = useMemo(() => {
    const today = new Date();
    return {
      key: monthOf(today),
      label: today.toLocaleString('en-US', { month: 'long' }),
    };
  }, []);
  const monthSpending = useMemo(
    () =>
      spendingByCategory(
        filteredAccounts.flatMap((acc) => acc.transactions || []),
        budgetMonth.key
      ),
    [filteredAccounts, budgetMonth]
  );

  const filteredTransactions = useMemo(
    () => filteredAccounts.flatMap((acc) => acc.transactions || []),
    [filteredAccounts]
  );

  const recurringPayments = useMemo(
    () =>
      findRecurringPayments(
        filteredTransactions,
        toLocalDateString(new Date())
      ),
    [filteredTransactions]
  );
  // Bills and paychecks expected in the next 30 days.
  const upcoming = useMemo(() => {
    const today = toLocalDateString(new Date());
    const events = upcomingEvents(
      recurringPayments,
      findRecurringPayments(filteredTransactions, today, 'in'),
      today,
      FORECAST_DAYS,
      {
        out: findRecurringPayments(
          filteredTransactions,
          today,
          'out',
          'transfers'
        ),
        in: findRecurringPayments(
          filteredTransactions,
          today,
          'in',
          'transfers'
        ),
      }
    );
    return {
      events,
      forecasts: forecastBalances(filteredAccounts, events, today),
    };
  }, [recurringPayments, filteredTransactions, filteredAccounts]);

  const cashflowMonths = useMemo(
    () => monthlyCashflow(filteredTransactions, budgetMonth.key),
    [filteredTransactions, budgetMonth]
  );
  const netWorthMonths = useMemo(
    () => netWorthHistory(filteredAccounts, toLocalDateString(new Date())),
    [filteredAccounts]
  );

  // The KPI cards' figures, and the period the report covers.
  const filteredSummary = useMemo(
    () =>
      periodSummary(
        filteredAccounts,
        state.selectedPeriod,
        state.customDateRange
      ),
    [filteredAccounts, state.selectedPeriod, state.customDateRange]
  );

  // The report covers the same period, and the same comparison, as the
  // KPI cards.
  const reportPeriod = useMemo(
    () => ({
      start: filteredSummary.periodStartDate,
      end: filteredSummary.periodEndDate,
    }),
    [filteredSummary.periodStartDate, filteredSummary.periodEndDate]
  );
  const reportPrevious = useMemo(
    () => ({
      start: filteredSummary.previousPeriodStartDate,
      end: filteredSummary.previousPeriodEndDate,
    }),
    [
      filteredSummary.previousPeriodStartDate,
      filteredSummary.previousPeriodEndDate,
    ]
  );

  const generateTrendData = useMemo(
    () => trendData(filteredAccounts, state.selectedPeriod),
    [filteredAccounts, state.selectedPeriod]
  );

  const importModal = (
    <>
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onImportCsv={() => setIsImportOpen(true)}
      />
    </>
  );

  // Add routing logic for account-detail screen
  if (state.currentScreen === 'account-detail') {
    return <AccountDetail />;
  }

  if (state.currentScreen === 'transactions') {
    return <TransactionsPage accounts={filteredAccounts} />;
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
              Import a CSV export from your bank to get started with smart
              financial management. We'll help you track spending, categorize
              transactions, and gain insights into your financial health.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={() => setIsImportOpen(true)}
              >
                Import your first account
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddAccountOpen(true)}
              >
                Enter one by hand
              </Button>
            </div>
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
        {importModal}
      </div>
    );
  }

  // Main dashboard with data
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector - Centered above KPI Section */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {DEFAULT_PERIODS.map((period) => (
              <button
                key={period}
                onClick={() => {
                  if (period === 'custom') {
                    setIsDatePickerOpen(true);
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
                  ? state.selectedPeriod === 'custom' && state.customDateRange
                    ? formatDateRange(
                        state.customDateRange.startDate,
                        state.customDateRange.endDate
                      )
                    : 'Custom'
                  : period}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Section */}
        <div className="mb-6">
          <KPISection
            summary={filteredSummary}
            totalBalance={filteredSummary.totalBalance}
            period={state.selectedPeriod}
            balanceTrend={generateTrendData.balance}
            incomeTrend={generateTrendData.income}
            expenseTrend={generateTrendData.expenses}
            savingsTrend={generateTrendData.savings}
          />
        </div>

        <div className="mb-8">
          <CashflowChart
            months={cashflowMonths}
            currentMonth={budgetMonth.key}
            onSelectMonth={setReportMonth}
          />
        </div>

        {filteredAccounts.length > 0 && (
          <div className="mb-8">
            <NetWorthChart
              months={netWorthMonths}
              onOpenAccount={(id) => {
                const account = filteredAccounts.find((acc) => acc.id === id);
                if (account) viewAccountDetail(account);
              }}
            />
          </div>
        )}

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
                comparisonDate={filteredSummary.previousPeriodEndDate}
                onAddAccount={() => setIsAddAccountOpen(true)}
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
                    onClick: () => setIsAddOpen(true),
                  },
                  {
                    icon: Upload,
                    label: 'Import CSV',
                    color: 'bg-green-500',
                    onClick: () => setIsImportOpen(true),
                  },
                  {
                    icon: Target,
                    label: 'Set Budget',
                    color: 'bg-purple-500',
                    onClick: () => setIsBudgetOpen(true),
                  },
                  {
                    icon: List,
                    label: 'All Transactions',
                    color: 'bg-orange-500',
                    onClick: () => changeScreen('transactions'),
                  },
                  {
                    icon: PieChart,
                    label: 'Generate Report',
                    color: 'bg-pink-500',
                    onClick: () => setIsReportOpen(true),
                  },
                  {
                    icon: Download,
                    label: 'Export Data',
                    color: 'bg-gray-500',
                    onClick: () => setIsExportOpen(true),
                  },
                ].map((action, index) => (
                  <button
                    key={index}
                    className="group p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left"
                    onClick={action.onClick}
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

            <GoalsCard />

            <BudgetsCard
              spending={monthSpending}
              monthLabel={budgetMonth.label}
              onEdit={() => setIsBudgetOpen(true)}
            />

            <UpcomingCard
              events={upcoming.events}
              forecasts={upcoming.forecasts}
              accounts={filteredAccounts}
            />

            <RecurringCard payments={recurringPayments} />

            {/* Recent Activity */}
            <RecentActivity accounts={filteredAccounts} limit={5} />
          </div>
        </div>
      </main>
      {importModal}
      <DataExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
      <BudgetModal
        isOpen={isBudgetOpen}
        onClose={() => setIsBudgetOpen(false)}
        spending={monthSpending}
      />
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
      <DateRangePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onDateRangeSelect={(start, end) => setCustomDateRange(start, end)}
        currentStartDate={state.customDateRange?.startDate}
        currentEndDate={state.customDateRange?.endDate}
      />
      <SpendingReportModal
        isOpen={isReportOpen || reportMonth !== null}
        onClose={() => {
          setIsReportOpen(false);
          setReportMonth(null);
        }}
        transactions={filteredTransactions}
        period={reportMonth ? monthBounds(reportMonth) : reportPeriod}
        previous={
          reportMonth
            ? monthBounds(shiftMonth(reportMonth, -1))
            : reportPrevious
        }
      />
    </div>
  );
};
