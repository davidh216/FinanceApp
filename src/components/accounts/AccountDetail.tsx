import React, { useState, useMemo } from 'react';
import { hasCategory } from '../../utils/splits';
import { useFinancial } from '../../contexts/FinancialContext';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { Button } from '../ui/Button';
import { TransactionItem } from '../ui/TransactionItem';
import { isImportedAccount } from '../../utils/csvImport';
import { CsvImportModal } from '../import/CsvImportModal';
import {
  ArrowLeft,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Scale,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import { UpdateBalanceModal } from './UpdateBalanceModal';
import { AccountSettingsModal } from './AccountSettingsModal';
import { isClosed } from '../../utils/accountSettings';
import { parseLocalDate } from '../../utils/date';
import { AddTransactionModal } from '../transactions/AddTransactionModal';
import { formatMoney, formatSignedMoney } from '../../utils/format';
import {
  incomeOf,
  isTransfer,
  spendingOf,
  transfersOf,
} from '../../utils/cashflow';

interface AccountDetailProps {
  accountId?: string;
}

export const AccountDetail: React.FC<AccountDetailProps> = ({ accountId }) => {
  const {
    state,
    addTag,
    removeTag,
    changeScreen,
    removeAccount,
    isPrivacyMode,
  } = useFinancial();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'merchant'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBalanceOpen, setIsBalanceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Look the account up in state.accounts rather than using
  // state.selectedAccount directly: that is a snapshot from when the account
  // was opened, so tags and imports added since would not show.
  const account = useMemo(() => {
    const id = accountId ?? state.selectedAccount?.id;
    return (
      state.accounts.find((acc) => acc.id === id) ??
      (accountId ? undefined : state.selectedAccount ?? undefined)
    );
  }, [accountId, state.accounts, state.selectedAccount]);

  // Filter and sort transactions
  const { filteredTransactions, monthlyStats } = useMemo(() => {
    if (!account?.transactions) {
      return { filteredTransactions: [], monthlyStats: null };
    }

    let filtered = account.transactions.filter((txn) => {
      const matchesSearch =
        txn.cleanMerchant.cleanName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (txn.notes ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory =
        !selectedCategory ||
        hasCategory(txn, selectedCategory) ||
        txn.tags.includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'amount':
          aVal = Math.abs(a.amount);
          bVal = Math.abs(b.amount);
          break;
        case 'merchant':
          aVal = a.cleanMerchant.cleanName.toLowerCase();
          bVal = b.cleanMerchant.cleanName.toLowerCase();
          break;
        default: // date
          aVal = parseLocalDate(a.date);
          bVal = parseLocalDate(b.date);
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Calculate period-based stats based on selectedPeriod
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;

    // Calculate period boundaries based on selectedPeriod
    switch (state.selectedPeriod) {
      case 'day':
        startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        endDate = new Date(); // Today
        periodLabel = 'Today';
        break;
      case 'week':
        const dayOfWeek = today.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
        startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - daysToSubtract
        );
        endDate = new Date(); // Today
        periodLabel = 'This Week';
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(); // Today
        periodLabel = 'This Month';
        break;
      case 'quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(); // Today
        periodLabel = 'This Quarter';
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(); // Today
        periodLabel = 'This Year';
        break;
      case '5year':
        startDate = new Date(today.getFullYear() - 5, 0, 1);
        endDate = new Date(); // Today
        periodLabel = 'Last 5 Years';
        break;
      case 'custom':
        if (state.customDateRange) {
          startDate = parseLocalDate(state.customDateRange.startDate);
          endDate = parseLocalDate(state.customDateRange.endDate);
          periodLabel = state.customDateRange.label || 'Custom Range';
        } else {
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(); // Today
          periodLabel = 'This Month';
        }
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(); // Today
        periodLabel = 'This Month';
    }

    // Filter transactions for the selected period
    const periodTransactions = account.transactions.filter((txn) => {
      const txnDate = parseLocalDate(txn.date);
      return txnDate >= startDate && txnDate <= endDate;
    });

    const periodIncome = incomeOf(periodTransactions);

    const periodExpenses = spendingOf(periodTransactions);
    // Transfers (like loan payments) aren't income or spending, but they do
    // move money in or out of this account.
    const periodTransfers = transfersOf(periodTransactions);

    const stats = {
      totalTransactions: account.transactions.length,
      periodTransactions: periodTransactions.length,
      periodIncome,
      periodExpenses,
      periodTransfers,
      hasTransfers: periodTransactions.some(isTransfer),
      // The account's actual change: income - expenses +/- transfers.
      netFlow: periodIncome - periodExpenses + periodTransfers,
      periodLabel,
    };

    return { filteredTransactions: filtered, monthlyStats: stats };
  }, [
    account,
    searchTerm,
    selectedCategory,
    sortBy,
    sortDirection,
    state.selectedPeriod,
    state.customDateRange,
  ]);

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Account Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The requested account could not be found.
            </p>
            <Button onClick={() => changeScreen('dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleSort = (newSortBy: 'date' | 'amount' | 'merchant') => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          {/* Phones: name above balance. Wider screens: side by side. */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center min-w-0 text-left">
              <button
                onClick={() => changeScreen('dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Back to dashboard"
                data-testid="back-button"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1
                  className="text-2xl font-bold text-gray-900 break-words"
                  data-testid="account-name"
                >
                  {account.name}
                </h1>
                <p className="text-gray-600" data-testid="account-info">
                  {account.bankName} • {account.accountNumber}
                  {isClosed(account) && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                      Closed
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div
                className={`text-3xl font-bold ${
                  account.balance < 0 ? 'text-red-600' : 'text-green-600'
                }`}
                data-testid="account-balance"
              >
                {isPrivacyMode ? (
                  <span className="text-gray-400">••••••</span>
                ) : (
                  <>{formatMoney(account.balance)}</>
                )}
              </div>
              {account.limit && !isPrivacyMode && (
                <div
                  className="text-sm text-gray-500"
                  data-testid="account-limit"
                >
                  Limit: {formatMoney(account.limit)}
                </div>
              )}
              {isImportedAccount(account) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  leftIcon={<Settings className="w-4 h-4" />}
                  onClick={() => setIsSettingsOpen(true)}
                  data-testid="account-settings-button"
                >
                  Settings
                </Button>
              )}
              {isImportedAccount(account) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  leftIcon={<Scale className="w-4 h-4" />}
                  onClick={() => setIsBalanceOpen(true)}
                  data-testid="update-balance-button"
                >
                  Update balance
                </Button>
              )}
              {/* Accounts entered by hand have no statements to import. */}
              {isImportedAccount(account) && !account.manual && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  leftIcon={<Upload className="w-4 h-4" />}
                  onClick={() => setIsImportOpen(true)}
                  data-testid="import-more-button"
                >
                  Import CSV
                </Button>
              )}
              {isImportedAccount(account) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => {
                    if (
                      window.confirm(
                        account.manual
                          ? `Remove ${account.name}?`
                          : `Remove ${account.name} and its imported transactions?`
                      )
                    ) {
                      removeAccount(account.id);
                    }
                  }}
                  data-testid="remove-account-button"
                >
                  Remove account
                </Button>
              )}
            </div>
          </div>

          {/* Monthly Stats */}
          {monthlyStats && (
            <div className="mb-6">
              <div
                className={`grid grid-cols-2 gap-4 ${
                  monthlyStats.hasTransfers
                    ? 'md:grid-cols-5'
                    : 'md:grid-cols-4'
                }`}
              >
                <div
                  className="bg-gray-50 rounded-lg p-4 text-center"
                  data-testid="stat-period"
                >
                  <div className="text-sm text-gray-600">
                    {monthlyStats.periodLabel}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {monthlyStats.periodTransactions}{' '}
                    {monthlyStats.periodTransactions === 1
                      ? 'transaction'
                      : 'transactions'}
                  </div>
                </div>
                <div
                  className="bg-gray-50 rounded-lg p-4 text-center"
                  data-testid="stat-income"
                >
                  <div className="text-sm text-gray-600">Income</div>
                  <div className="text-lg font-semibold text-green-600">
                    {isPrivacyMode ? (
                      <span className="text-gray-400">••••••</span>
                    ) : (
                      <>+{formatMoney(monthlyStats.periodIncome)}</>
                    )}
                  </div>
                </div>
                <div
                  className="bg-gray-50 rounded-lg p-4 text-center"
                  data-testid="stat-expenses"
                >
                  <div className="text-sm text-gray-600">Expenses</div>
                  <div className="text-lg font-semibold text-red-600">
                    {isPrivacyMode ? (
                      <span className="text-gray-400">••••••</span>
                    ) : (
                      <>-{formatMoney(monthlyStats.periodExpenses)}</>
                    )}
                  </div>
                </div>
                {monthlyStats.hasTransfers && (
                  <div
                    className="bg-gray-50 rounded-lg p-4 text-center"
                    data-testid="stat-transfers"
                    title="Money moved between your own accounts, like loan payments. Not counted as income or expenses."
                  >
                    <div className="text-sm text-gray-600">Transfers</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {isPrivacyMode ? (
                        <span className="text-gray-400">••••••</span>
                      ) : (
                        formatSignedMoney(monthlyStats.periodTransfers)
                      )}
                    </div>
                  </div>
                )}
                <div
                  className="bg-gray-50 rounded-lg p-4 text-center"
                  data-testid="stat-net"
                >
                  <div className="text-sm text-gray-600">Net Flow</div>
                  <div
                    className={`text-lg font-semibold flex items-center justify-center ${
                      monthlyStats.netFlow >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {monthlyStats.netFlow >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {isPrivacyMode ? (
                      <span className="text-gray-400">••••••</span>
                    ) : (
                      formatSignedMoney(monthlyStats.netFlow)
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="search-input"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="category-filter"
            >
              <option value="">All Categories</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="Transportation">Transportation</option>
              <option value="Shopping">Shopping</option>
              <option value="Utilities">Utilities</option>
              <option value="Income">Income</option>
              <option value="Transfer">Transfers</option>
            </select>

            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              size="sm"
              onClick={() => setIsAddOpen(true)}
              data-testid="add-transaction-button"
            >
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Table Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                Transactions ({filteredTransactions.length})
              </h2>
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <button
                  onClick={() => handleSort('date')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    sortBy === 'date'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid="sort-date"
                >
                  Date{' '}
                  {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('amount')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    sortBy === 'amount'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid="sort-amount"
                >
                  Amount{' '}
                  {sortBy === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('merchant')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    sortBy === 'merchant'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid="sort-merchant"
                >
                  Merchant{' '}
                  {sortBy === 'merchant' &&
                    (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div
            className="divide-y divide-gray-200"
            data-testid="transaction-list"
          >
            {filteredTransactions.length === 0 ? (
              <div
                className="p-8 text-center text-gray-500"
                data-testid="empty-state"
              >
                <p className="text-sm">
                  {searchTerm || selectedCategory
                    ? 'No transactions match your filters'
                    : 'No transactions found'}
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                  showAccountName={false}
                  showTagging={true}
                  showCategory={true}
                />
              ))
            )}
          </div>
        </div>
      </main>
      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        defaultAccountId={account.id}
      />
      {isSettingsOpen && (
        <AccountSettingsModal
          account={account}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      {isBalanceOpen && (
        <UpdateBalanceModal
          account={account}
          onClose={() => setIsBalanceOpen(false)}
        />
      )}
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        defaultAccountId={account.id}
      />
    </div>
  );
};
