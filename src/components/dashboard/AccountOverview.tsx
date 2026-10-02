import React, { useState } from 'react';
import { isClosed } from '../../utils/accountSettings';
import { Account } from '../../types/financial';
import { AccountCard } from '../ui/AccountCard';
import { Button } from '../ui/Button';
import { useFinancial } from '../../contexts/FinancialContext';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { formatMoney, formatSignedMoney } from '../../utils/format';
import { totalBalanceAsOf } from '../../utils/balances';

interface AccountOverviewProps {
  accounts: Account[];
  onAccountSelect: (account: Account) => void;
  accountFilter?: 'both' | 'personal' | 'business';
  // End of the previous period ("YYYY-MM-DD"), for the change lines.
  comparisonDate?: string;
  // Accounts are added by importing a CSV.
  onAddAccount?: () => void;
}

export const AccountOverview: React.FC<AccountOverviewProps> = ({
  accounts,
  onAccountSelect,
  accountFilter = 'both',
  comparisonDate,
  onAddAccount,
}) => {
  const { isPrivacyMode } = useFinancial();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    Personal: true,
    Business: true,
  });
  const [expandedSubsections, setExpandedSubsections] = useState<
    Record<string, boolean>
  >({
    'Personal-Assets': false,
    'Personal-Liabilities': false,
    'Business-Assets': false,
    'Business-Liabilities': false,
  });

  // A group's total now versus at the end of the previous period, from its
  // own accounts. Liabilities compare the amount owed, so growing debt shows
  // as an increase.
  const renderChange = (groupAccounts: Account[]) => {
    if (!comparisonDate || isPrivacyMode) return null;
    const current = Math.abs(
      groupAccounts.reduce((sum, account) => sum + account.balance, 0)
    );
    const previous = Math.abs(totalBalanceAsOf(groupAccounts, comparisonDate));
    const valueChange = current - previous;
    const percent = previous === 0 ? null : (valueChange / previous) * 100;
    return (
      <div className="text-xs text-gray-500 mt-1">
        {percent !== null && (
          <>
            {percent >= 0 ? '+' : ''}
            {percent.toFixed(1)}%{' '}
          </>
        )}
        <span>({formatSignedMoney(valueChange)})</span>
      </div>
    );
  };

  // Filter accounts based on accountFilter
  const typeFiltered = accounts.filter((account) => {
    if (accountFilter === 'both') return true;
    if (accountFilter === 'personal') return !account.type.includes('BUSINESS');
    if (accountFilter === 'business') return account.type.includes('BUSINESS');
    return true;
  });
  // Closed accounts are listed only on request.
  const [showClosed, setShowClosed] = useState(false);
  const closedCount = typeFiltered.filter(isClosed).length;
  const filteredAccounts = showClosed
    ? typeFiltered
    : typeFiltered.filter((account) => !isClosed(account));

  // Account grouping by Personal/Business with Assets/Liabilities subsections
  const accountGroups = filteredAccounts.reduce((acc, account) => {
    // Determine main group (Personal or Business)
    const mainGroup = account.type.includes('BUSINESS')
      ? 'Business'
      : 'Personal';

    // Determine subsection (Assets or Liabilities)
    const subsection: 'Assets' | 'Liabilities' =
      account.balance >= 0 ? 'Assets' : 'Liabilities';

    // Initialize structure if it doesn't exist
    if (!acc[mainGroup]) {
      acc[mainGroup] = { Assets: [], Liabilities: [] };
    }

    // Add account to appropriate subsection
    acc[mainGroup][subsection].push(account);

    return acc;
  }, {} as Record<string, { Assets: Account[]; Liabilities: Account[] }>);

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const toggleSubsection = (mainGroup: string, subsection: string) => {
    const key = `${mainGroup}-${subsection}`;
    setExpandedSubsections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Account Overview
            </h3>
          </div>

          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            size="sm"
            variant="outline"
            onClick={onAddAccount}
          >
            Add Account
          </Button>
        </div>
      </div>

      {/* Account List - Flex grow to fill available space */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {Object.entries(accountGroups).map(([mainGroup, subsections]) => (
            <div key={mainGroup}>
              {/* Main Group Header */}
              <div className="px-6 py-3 bg-gray-100">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSection(mainGroup)}
                    className="flex items-center hover:bg-gray-200 rounded px-2 py-1 transition-colors"
                  >
                    {expandedSections[mainGroup] ? (
                      <ChevronDown className="w-4 h-4 text-gray-600 mr-2" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600 mr-2" />
                    )}
                    <h3 className="text-base font-semibold text-gray-900 flex items-center">
                      {mainGroup === 'Business' ? '💼' : '👤'} {mainGroup}
                    </h3>
                  </button>
                  <div className="text-sm text-gray-600">
                    Net:{' '}
                    <span
                      className={`font-semibold ${
                        subsections.Assets.reduce(
                          (sum, acc) => sum + acc.balance,
                          0
                        ) +
                          subsections.Liabilities.reduce(
                            (sum, acc) => sum + acc.balance,
                            0
                          ) >=
                        0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {isPrivacyMode ? (
                        <span className="text-gray-400">••••••</span>
                      ) : (
                        <>
                          {formatMoney(
                            subsections.Assets.reduce(
                              (sum, acc) => sum + acc.balance,
                              0
                            ) +
                              subsections.Liabilities.reduce(
                                (sum, acc) => sum + acc.balance,
                                0
                              )
                          )}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subsections - Only show if expanded */}
              {expandedSections[mainGroup] && (
                <>
                  {/* Assets Subsection */}
                  {subsections.Assets.length > 0 && (
                    <div>
                      <div className="px-6 py-2 bg-gray-50 border-b">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() =>
                              toggleSubsection(mainGroup, 'Assets')
                            }
                            className="flex items-center hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                          >
                            {expandedSubsections[`${mainGroup}-Assets`] ? (
                              <ChevronDown className="w-4 h-4 text-gray-600 mr-2" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600 mr-2" />
                            )}
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                              📈 Assets
                              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                {subsections.Assets.length}
                              </span>
                            </h4>
                          </button>
                          <div className="text-sm text-gray-600">
                            Total:{' '}
                            <span className="font-semibold text-green-600">
                              {isPrivacyMode ? (
                                <span className="text-gray-400">••••••</span>
                              ) : (
                                <>
                                  {formatMoney(
                                    subsections.Assets.reduce(
                                      (sum, acc) => sum + acc.balance,
                                      0
                                    )
                                  )}
                                </>
                              )}
                            </span>
                            {renderChange(subsections.Assets)}
                          </div>
                        </div>
                      </div>
                      {expandedSubsections[`${mainGroup}-Assets`] && (
                        <div className="divide-y divide-gray-100">
                          {subsections.Assets.map((account) => (
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
                      )}
                    </div>
                  )}

                  {/* Liabilities Subsection */}
                  {subsections.Liabilities.length > 0 && (
                    <div>
                      <div className="px-6 py-2 bg-gray-50 border-b">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() =>
                              toggleSubsection(mainGroup, 'Liabilities')
                            }
                            className="flex items-center hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                          >
                            {expandedSubsections[`${mainGroup}-Liabilities`] ? (
                              <ChevronDown className="w-4 h-4 text-gray-600 mr-2" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600 mr-2" />
                            )}
                            <h4 className="text-sm font-medium text-gray-700 flex items-center">
                              🏦 Liabilities
                              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                {subsections.Liabilities.length}
                              </span>
                            </h4>
                          </button>
                          <div className="text-sm text-gray-600">
                            Total:{' '}
                            <span className="font-semibold text-red-600">
                              {isPrivacyMode ? (
                                <span className="text-gray-400">••••••</span>
                              ) : (
                                <>
                                  {formatMoney(
                                    subsections.Liabilities.reduce(
                                      (sum, acc) => sum + acc.balance,
                                      0
                                    )
                                  )}
                                </>
                              )}
                            </span>
                            {renderChange(subsections.Liabilities)}
                          </div>
                        </div>
                      </div>
                      {expandedSubsections[`${mainGroup}-Liabilities`] && (
                        <div className="divide-y divide-gray-100">
                          {subsections.Liabilities.map((account) => (
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
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        {closedCount > 0 && (
          <button
            onClick={() => setShowClosed(!showClosed)}
            className="w-full px-6 py-3 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-t"
            data-testid="toggle-closed-accounts"
          >
            {showClosed
              ? 'Hide closed accounts'
              : `Show ${closedCount} closed account${
                  closedCount === 1 ? '' : 's'
                }`}
          </button>
        )}
      </div>
    </div>
  );
};
