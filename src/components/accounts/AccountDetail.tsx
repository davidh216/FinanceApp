import React, { useState, useMemo } from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { Button } from '../ui/Button';
import { TransactionItem } from '../ui/TransactionItem';
import {
  ArrowLeft,
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';


interface AccountDetailProps {
  accountId?: string;
}

export const AccountDetail: React.FC<AccountDetailProps> = ({ accountId }) => {
  const { state, addTag, removeTag, changeScreen, isPrivacyMode } =
    useFinancial();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'merchant'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Get the selected account
  const account = useMemo(() => {
    return accountId
      ? state.accounts.find((acc) => acc.id === accountId)
      : state.selectedAccount;
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
        txn.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory =
        !selectedCategory || txn.tags.includes(selectedCategory);

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
          aVal = new Date(a.date);
          bVal = new Date(b.date);
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
          startDate = new Date(state.customDateRange.startDate);
          endDate = new Date(state.customDateRange.endDate);
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
      const txnDate = new Date(txn.date);
      return txnDate >= startDate && txnDate <= endDate;
    });

    const periodIncome = periodTransactions
      .filter((txn) => txn.amount > 0)
      .reduce((sum, txn) => sum + txn.amount, 0);

    const periodExpenses = Math.abs(
      periodTransactions
        .filter((txn) => txn.amount < 0)
        .reduce((sum, txn) => sum + txn.amount, 0)
    );

    const stats = {
      totalTransactions: account.transactions.length,
      periodTransactions: periodTransactions.length,
      periodIncome,
      periodExpenses,
      netFlow: periodIncome - periodExpenses,
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={() => changeScreen('dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                data-testid="back-button"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1
                  className="text-2xl font-bold text-gray-900"
                  data-testid="account-name"
                >
                  {account.name}
                </h1>
                <p className="text-gray-600" data-testid="account-info">
                  {account.bankName} • {account.accountNumber}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-3xl font-bold ${
                  account.balance < 0 ? 'text-red-600' : 'text-green-600'
                }`}
                data-testid="account-balance"
              >
                {isPrivacyMode ? (
                  <span className="text-gray-400">••••••</span>
                ) : (
                  <>
                    $
                    {Math.abs(account.balance).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </>
                )}
              </div>
              {account.limit && !isPrivacyMode && (
                <div
                  className="text-sm text-gray-500"
                  data-testid="account-limit"
                >
                  Limit: ${account.limit.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Stats */}
          {monthlyStats && (
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600">
                    {monthlyStats.periodLabel}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {monthlyStats.periodTransactions} transactions
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600">Income</div>
                  <div className="text-lg font-semibold text-green-600">
                    {isPrivacyMode ? (
                      <span className="text-gray-400">••••••</span>
                    ) : (
                      <>+${monthlyStats.periodIncome.toLocaleString()}</>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600">Expenses</div>
                  <div className="text-lg font-semibold text-red-600">
                    {isPrivacyMode ? (
                      <span className="text-gray-400">••••••</span>
                    ) : (
                      <>-${monthlyStats.periodExpenses.toLocaleString()}</>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
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
                      <>${Math.abs(monthlyStats.netFlow).toLocaleString()}</>
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
            </select>

            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              size="sm"
              onClick={() => alert('Add transaction coming soon!')}
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Transactions ({filteredTransactions.length})
              </h2>
              <div className="flex items-center space-x-2">
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
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
