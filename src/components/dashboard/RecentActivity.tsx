import React, { useState } from 'react';
import { Account } from '../../types/financial';
import { TransactionItem } from '../ui/TransactionItem';
import { Button } from '../ui/Button';
import { useFinancial } from '../../contexts/FinancialContext';
import { Eye, Filter, ArrowUpDown } from 'lucide-react';

interface RecentActivityProps {
  accounts: Account[];
  limit?: number;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  accounts,
  limit = 5,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const { addTag, removeTag, changeScreen } = useFinancial();

  // Get all recent transactions
  const allTransactions = accounts
    .flatMap(
      (account) =>
        account.transactions?.map((txn) => ({
          ...txn,
          accountName: account.name,
          accountType: account.type,
        })) || []
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return Math.abs(b.amount) - Math.abs(a.amount);
      }
    })
    .slice(0, limit);

  const handleViewAll = () => {
    changeScreen('transactions');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-2 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-600">
              Latest {limit} transactions across all accounts
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Sort Toggle */}
            <button
              onClick={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title={`Sort by ${sortBy === 'date' ? 'amount' : 'date'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md transition-colors ${
                showFilters
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* View All Button */}
            <Button
              leftIcon={<Eye className="w-4 h-4" />}
              size="sm"
              variant="outline"
              onClick={handleViewAll}
            >
              View All
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        {showFilters && (
          <div className="flex items-center space-x-4 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select className="text-sm border border-gray-300 rounded px-2 py-1">
                <option value="">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Account:
              </label>
              <select className="text-sm border border-gray-300 rounded px-2 py-1">
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-200">
        {allTransactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-sm">No recent transactions found</p>
            <p className="text-xs text-gray-400 mt-1">
              Transactions will appear here once you connect accounts
            </p>
          </div>
        ) : (
          allTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              showAccountName={true}
              showTagging={true}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {allTransactions.length > 0 && (
        <div className="p-2 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-500">
              Showing {allTransactions.length} of{' '}
              {accounts.reduce(
                (sum, acc) => sum + (acc.transactions?.length || 0),
                0
              )}{' '}
              total transactions
            </div>
            <button
              onClick={handleViewAll}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View all transactions →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
