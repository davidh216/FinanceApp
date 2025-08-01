import React, { useState } from 'react';
import { Account } from '../../types/financial';
import { AccountCard } from '../ui/AccountCard';
import { Button } from '../ui/Button';
import { useFinancial } from '../../contexts/FinancialContext';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface AccountOverviewProps {
  accounts: Account[];
  onAccountSelect: (account: Account) => void;
  accountFilter?: 'both' | 'personal' | 'business';
}

export const AccountOverview: React.FC<AccountOverviewProps> = ({
  accounts,
  onAccountSelect,
  accountFilter = 'both',
}) => {
  const { isPrivacyMode } = useFinancial();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Personal': true,
    'Business': true,
  });
  const [expandedSubsections, setExpandedSubsections] = useState<Record<string, boolean>>({
    'Personal-Assets': false,
    'Personal-Liabilities': false,
    'Business-Assets': false,
    'Business-Liabilities': false,
  });

  // Calculate changes for assets and liabilities
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
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

  // Mock previous values (in a real app, this would come from historical data)
  const prevAssets = totalAssets * 0.95;
  const prevLiabilities = totalLiabilities * 1.05;
  
  const assetsChange = calculateChange(totalAssets, prevAssets);
  const liabilitiesChange = calculateChange(totalLiabilities, prevLiabilities);
  const assetsValueChange = totalAssets - prevAssets;
  const liabilitiesValueChange = totalLiabilities - prevLiabilities;

  // Filter accounts based on accountFilter
  const filteredAccounts = accounts.filter(account => {
    if (accountFilter === 'both') return true;
    if (accountFilter === 'personal') return !account.type.includes('BUSINESS');
    if (accountFilter === 'business') return account.type.includes('BUSINESS');
    return true;
  });

  // Account grouping by Personal/Business with Assets/Liabilities subsections
  const accountGroups = filteredAccounts.reduce((acc, account) => {
    // Determine main group (Personal or Business)
    const mainGroup = account.type.includes('BUSINESS') ? 'Business' : 'Personal';
    
    // Determine subsection (Assets or Liabilities)
    const subsection: 'Assets' | 'Liabilities' = account.balance >= 0 ? 'Assets' : 'Liabilities';
    
    // Initialize structure if it doesn't exist
    if (!acc[mainGroup]) {
      acc[mainGroup] = { Assets: [], Liabilities: [] };
    }
    
    // Add account to appropriate subsection
    acc[mainGroup][subsection].push(account);
    
    return acc;
  }, {} as Record<string, { Assets: Account[]; Liabilities: Account[] }>);

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const toggleSubsection = (mainGroup: string, subsection: string) => {
    const key = `${mainGroup}-${subsection}`;
    setExpandedSubsections(prev => ({
      ...prev,
      [key]: !prev[key]
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
            onClick={() => alert('Add account coming soon!')}
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
                        (subsections.Assets.reduce((sum, acc) => sum + acc.balance, 0) +
                         subsections.Liabilities.reduce((sum, acc) => sum + acc.balance, 0)) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {isPrivacyMode ? (
                        <span className="text-gray-400">••••••</span>
                      ) : (
                        <>
                          $
                          {Math.abs(
                            subsections.Assets.reduce((sum, acc) => sum + acc.balance, 0) +
                            subsections.Liabilities.reduce((sum, acc) => sum + acc.balance, 0)
                          ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                            onClick={() => toggleSubsection(mainGroup, 'Assets')}
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
                              $
                              {Math.abs(
                                subsections.Assets.reduce((sum, acc) => sum + acc.balance, 0)
                              ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </>
                          )}
                        </span>
                        {!isPrivacyMode && (
                          <div className="text-xs text-gray-500 mt-1">
                            {assetsChange >= 0 ? '+' : ''}{assetsChange.toFixed(1)}%
                            <span className="ml-1">
                              ({assetsValueChange >= 0 ? '+' : ''}${Math.abs(assetsValueChange).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                            </span>
                          </div>
                        )}
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
                            onClick={() => toggleSubsection(mainGroup, 'Liabilities')}
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
                              $
                              {Math.abs(
                                subsections.Liabilities.reduce((sum, acc) => sum + acc.balance, 0)
                              ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </>
                          )}
                        </span>
                        {!isPrivacyMode && (
                          <div className="text-xs text-gray-500 mt-1">
                            {liabilitiesChange >= 0 ? '+' : ''}{liabilitiesChange.toFixed(1)}%
                            <span className="ml-1">
                              ({liabilitiesValueChange >= 0 ? '+' : ''}${Math.abs(liabilitiesValueChange).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                            </span>
                          </div>
                        )}
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
