import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Transaction } from '../../types/financial';
import { TransactionItem } from './TransactionItem';
import { Button } from './Button';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';

interface VirtualizedTransactionListProps {
  transactions: Transaction[];
  height?: number;
  itemHeight?: number;
  className?: string;
  onTransactionClick?: (transaction: Transaction) => void;
  loading?: boolean;
  error?: string | null;
}

interface SortConfig {
  key: keyof Transaction;
  direction: 'asc' | 'desc';
}

export const VirtualizedTransactionList: React.FC<VirtualizedTransactionListProps> = ({
  transactions,
  height = 400,
  itemHeight = 72,
  className = '',
  onTransactionClick,
  loading = false,
  error = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [amountFilter, setAmountFilter] = useState<string>('all');

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(transactions.map(tx => tx.category))];
    return ['all', ...uniqueCategories.sort()];
  }, [transactions]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;

      // Amount filter
      let matchesAmount = true;
      if (amountFilter === 'income') {
        matchesAmount = transaction.amount > 0;
      } else if (amountFilter === 'expense') {
        matchesAmount = transaction.amount < 0;
      }

      return matchesSearch && matchesCategory && matchesAmount;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, sortConfig, categoryFilter, amountFilter]);

  // Handle sort
  const handleSort = useCallback((key: keyof Transaction) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Render individual transaction item
  const renderTransactionItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const transaction = filteredAndSortedTransactions[index];
    if (!transaction) return null;

    return (
      <div style={style}>
        <TransactionItem
          transaction={transaction}
          onClick={() => onTransactionClick?.(transaction)}
          className="border-b border-gray-100 last:border-b-0"
        />
      </div>
    );
  }, [filteredAndSortedTransactions, onTransactionClick]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="p-4 text-center text-red-600">
          <p>Error loading transactions: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header with search and filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Transactions ({filteredAndSortedTransactions.length})
          </h3>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Type
              </label>
              <select
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Transactions</option>
                <option value="income">Income Only</option>
                <option value="expense">Expenses Only</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setAmountFilter('all');
                }}
                variant="outline"
                size="sm"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Sort controls */}
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600">Sort by:</span>
          <button
            onClick={() => handleSort('date')}
            className={`flex items-center space-x-1 px-2 py-1 rounded ${
              sortConfig.key === 'date' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Date</span>
            {sortConfig.key === 'date' && (
              sortConfig.direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={() => handleSort('amount')}
            className={`flex items-center space-x-1 px-2 py-1 rounded ${
              sortConfig.key === 'amount' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Amount</span>
            {sortConfig.key === 'amount' && (
              sortConfig.direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={() => handleSort('category')}
            className={`flex items-center space-x-1 px-2 py-1 rounded ${
              sortConfig.key === 'category' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Category</span>
            {sortConfig.key === 'category' && (
              sortConfig.direction === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Virtualized list */}
      {filteredAndSortedTransactions.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No transactions found matching your criteria.</p>
        </div>
      ) : (
        <div style={{ height }}>
          <List
            height={height}
            itemCount={filteredAndSortedTransactions.length}
            itemSize={itemHeight}
            width="100%"
          >
            {renderTransactionItem}
          </List>
        </div>
      )}
    </div>
  );
}; 