import React from 'react';
import { Account } from '../../types/financial';
import { AccountCard } from '../ui/AccountCard';
import { Button } from '../ui/Button';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AccountOverviewProps {
  accounts: Account[];
  onAccountSelect: (account: Account) => void;
}

export const AccountOverview: React.FC<AccountOverviewProps> = ({
  accounts,
  onAccountSelect,
}) => {
  // Calculate summary stats
  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );
  const positiveAccounts = accounts.filter((account) => account.balance > 0);
  const negativeAccounts = accounts.filter((account) => account.balance < 0);
  const totalAssets = positiveAccounts.reduce(
    (sum, account) => sum + account.balance,
    0
  );
  const totalLiabilities = Math.abs(
    negativeAccounts.reduce((sum, account) => sum + account.balance, 0)
  );

  // Account type grouping
  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.type.includes('BUSINESS') ? 'Business' : 'Personal';
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Account Overview
            </h3>
            <p className="text-sm text-gray-600">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''}{' '}
              connected
            </p>
          </div>

          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            size="sm"
            variant="outline"
            onClick={() => alert('Add account coming soon!')}
          >
            Add Account
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Net Worth
                </p>
                <p
                  className={`text-xl font-bold ${
                    totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  $
                  {Math.abs(totalBalance).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              {totalBalance >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Debt Ratio
                </p>
                <p className="text-xl font-bold text-blue-600">
                  {totalAssets > 0
                    ? ((totalLiabilities / totalAssets) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  totalLiabilities / totalAssets < 0.3
                    ? 'bg-green-100'
                    : 'bg-yellow-100'
                }`}
              >
                {totalLiabilities / totalAssets < 0.3 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account List - Flex grow to fill available space */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {Object.entries(accountsByType).map(([type, typeAccounts]) => (
            <div key={type}>
              {/* Type Header */}
              <div className="px-6 py-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                    {type === 'Business' ? '💼' : '👤'} {type} Accounts
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {typeAccounts.length}
                    </span>
                  </h4>
                  <div className="text-sm text-gray-600">
                    Total:{' '}
                    <span
                      className={`font-semibold ${
                        typeAccounts.reduce(
                          (sum, acc) => sum + acc.balance,
                          0
                        ) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      $
                      {Math.abs(
                        typeAccounts.reduce((sum, acc) => sum + acc.balance, 0)
                      ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accounts in this type */}
              <div className="divide-y divide-gray-100">
                {typeAccounts.map((account) => (
                  <div key={account.id} className="relative group">
                    <AccountCard
                      account={account}
                      onClick={onAccountSelect}
                      showTransactionCount={true}
                      className="hover:bg-blue-50 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-gray-50 border-t mt-auto">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Last updated: just now
          </div>
          <button
            className="text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => alert('Refresh coming soon!')}
          >
            Refresh All
          </button>
        </div>
      </div>
    </div>
  );
};
