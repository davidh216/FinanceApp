import React, { useMemo, useState } from 'react';
import { ArrowLeft, ListChecks, Search } from 'lucide-react';
import { CategoryRulesModal } from './CategoryRulesModal';
import { Account } from '../../types/financial';
import { useFinancial } from '../../contexts/FinancialContext';
import { useCategories } from '../../hooks/useCategories';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { TransactionItem } from '../ui/TransactionItem';
import { Button } from '../ui/Button';
import { incomeOf, spendingOf, transfersOf } from '../../utils/cashflow';
import { formatMoney, formatSignedMoney } from '../../utils/format';
import {
  NO_FILTERS,
  TransactionFilters,
  filterTransactions,
  hasFilters,
} from '../../utils/transactionFilters';

interface TransactionsPageProps {
  // The accounts you're viewing (after the Personal / Business switch).
  accounts: Account[];
}

// Long lists render a page at a time.
export const PAGE_SIZE = 100;

const fieldClasses =
  'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  accounts,
}) => {
  const { changeScreen, addTag, removeTag, isPrivacyMode } = useFinancial();
  const categories = useCategories();
  const [filters, setFilters] = useState<TransactionFilters>(NO_FILTERS);
  const [shown, setShown] = useState(PAGE_SIZE);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const all = useMemo(
    () =>
      accounts
        .flatMap((account) => account.transactions || [])
        .sort((a, b) => b.date.localeCompare(a.date)),
    [accounts]
  );
  const matching = useMemo(
    () => filterTransactions(all, filters),
    [all, filters]
  );

  const update = (change: Partial<TransactionFilters>) => {
    setFilters({ ...filters, ...change });
    setShown(PAGE_SIZE);
  };

  const money = (amount: number) =>
    isPrivacyMode ? '••••' : formatMoney(amount);
  const income = incomeOf(matching);
  const spending = spendingOf(matching);
  const transfers = transfersOf(matching);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
        <div className="flex items-center mb-6">
          <button
            onClick={() => changeScreen('dashboard')}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back to dashboard"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            All transactions
          </h1>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto whitespace-nowrap"
            leftIcon={<ListChecks className="w-4 h-4" />}
            onClick={() => setIsRulesOpen(true)}
            aria-label="Categories and rules"
          >
            <span className="sm:hidden">Categories</span>
            <span className="hidden sm:inline">Categories and rules</span>
          </Button>
        </div>
        {isRulesOpen && (
          <CategoryRulesModal onClose={() => setIsRulesOpen(false)} />
        )}

        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => update({ search: event.target.value })}
                placeholder="Search merchants, descriptions, tags"
                aria-label="Search"
                className={`${fieldClasses} w-full pl-9`}
              />
            </div>
            <select
              value={filters.accountId}
              onChange={(event) => update({ accountId: event.target.value })}
              aria-label="Account"
              className={fieldClasses}
            >
              <option value="">All accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(event) => update({ category: event.target.value })}
              aria-label="Category"
              className={fieldClasses}
            >
              <option value="">All categories</option>
              {categories.names.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
              <option value="Transfer">Transfers</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.from}
                onChange={(event) => update({ from: event.target.value })}
                aria-label="From"
                className={`${fieldClasses} min-w-0 flex-1`}
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="date"
                value={filters.to}
                onChange={(event) => update({ to: event.target.value })}
                aria-label="To"
                className={`${fieldClasses} min-w-0 flex-1`}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-gray-700" data-testid="transactions-summary">
              {matching.length.toLocaleString('en-US')} transaction
              {matching.length === 1 ? '' : 's'} · Income {money(income)} ·
              Spending {money(spending)}
              {Math.round(transfers * 100) !== 0 &&
                ` · Transfers ${
                  isPrivacyMode ? '••••' : formatSignedMoney(transfers)
                }`}
            </p>
            {hasFilters(filters) && (
              <button
                onClick={() => update(NO_FILTERS)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          {matching.length === 0 ? (
            <p
              className="p-8 text-center text-sm text-gray-500"
              data-testid="transactions-empty"
            >
              {all.length === 0
                ? 'No transactions yet. Import a CSV from your bank to get started.'
                : 'No transactions match these filters.'}
            </p>
          ) : (
            <div
              className="divide-y divide-gray-200"
              data-testid="transaction-list"
            >
              {matching.slice(0, shown).map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                  showAccountName
                  showCategory
                />
              ))}
            </div>
          )}
          {matching.length > shown && (
            <div className="p-4 border-t flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Showing {shown.toLocaleString('en-US')} of{' '}
                {matching.length.toLocaleString('en-US')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShown(shown + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, matching.length - shown)} more
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
