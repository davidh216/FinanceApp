import React, { useState } from 'react';
import { Transaction } from '../../types/financial';
import { TAG_CATEGORIES } from '../../constants/financial';
import { useFinancial } from '../../contexts/FinancialContext';
import { formatMoney } from '../../utils/format';
import { isTransfer } from '../../utils/cashflow';
import { isImportedAccount } from '../../utils/csvImport';
import { EXTERNAL_ACCOUNT_ID } from '../../utils/transfers';

const CATEGORY_OPTIONS = Object.keys(TAG_CATEGORIES);

interface TransactionItemProps {
  transaction: Transaction;
  onAddTag?: (transactionId: string, tag: string) => void;
  onRemoveTag?: (transactionId: string, tag: string) => void;
  showAccountName?: boolean;
  showTagging?: boolean;
  // Shows the category, with a menu to change it and to fix transfers.
  showCategory?: boolean;
  className?: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onAddTag,
  onRemoveTag,
  showAccountName = false,
  showTagging = true,
  showCategory = false,
  className = '',
}) => {
  const { isPrivacyMode, state, setCategory, unlinkTransfer, markAsTransfer } =
    useFinancial();
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const account = state.accounts.find(
    (acc) => acc.id === transaction.accountId
  );
  // Transfers can be fixed only in imported accounts; the demo's are
  // regenerated on every load.
  const canFixTransfers = !!account && isImportedAccount(account);
  const transferTargets = state.accounts.filter(
    (acc) => isImportedAccount(acc) && acc.id !== transaction.accountId
  );
  const transferName =
    transaction.transferAccountId === EXTERNAL_ACCOUNT_ID
      ? 'an account not in FinanceApp'
      : state.accounts.find((acc) => acc.id === transaction.transferAccountId)
          ?.name;

  const chooseCategory = (category: string) => {
    setCategory(transaction.id, category);
    setShowCategoryMenu(false);
  };

  const chooseTransfer = (otherAccountId: string) => {
    markAsTransfer(transaction.id, otherAccountId);
    setShowCategoryMenu(false);
  };

  const categoryMenuItem =
    'w-full flex items-center px-2 py-1.5 text-xs rounded hover:bg-gray-50 text-left text-gray-700';

  const categoryControl = !showCategory ? null : isTransfer(transaction) ? (
    <div className="relative">
      <button
        onClick={() => setShowCategoryMenu(!showCategoryMenu)}
        disabled={!canFixTransfers}
        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:hover:bg-transparent disabled:cursor-default"
        data-testid="category-button"
        title={transferName ? `Transfer with ${transferName}` : 'Transfer'}
      >
        ↔ Transfer{canFixTransfers && ' ▾'}
      </button>
      {showCategoryMenu && (
        <div
          className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2"
          role="menu"
        >
          {transferName && (
            <p className="px-2 py-1 text-xs text-gray-500">
              Transfer with {transferName}
            </p>
          )}
          <button
            role="menuitem"
            onClick={() => {
              unlinkTransfer(transaction.id);
              setShowCategoryMenu(false);
            }}
            className={categoryMenuItem}
          >
            Not a transfer
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="relative">
      <button
        onClick={() => setShowCategoryMenu(!showCategoryMenu)}
        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
        data-testid="category-button"
      >
        <span className="mr-1">
          {TAG_CATEGORIES[transaction.category]?.icon || '📝'}
        </span>
        {transaction.category} ▾
      </button>
      {showCategoryMenu && (
        <div
          className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2 max-h-64 overflow-y-auto"
          role="menu"
        >
          {CATEGORY_OPTIONS.map((category) => (
            <button
              key={category}
              role="menuitem"
              onClick={() => chooseCategory(category)}
              className={categoryMenuItem}
            >
              <span className="mr-2">{TAG_CATEGORIES[category].icon}</span>
              {category}
              {category === transaction.category && (
                <span className="ml-auto text-gray-400">✓</span>
              )}
            </button>
          ))}
          {canFixTransfers && (
            <>
              <p className="mt-2 border-t px-2 pt-2 pb-1 text-xs text-gray-500">
                A transfer between your own accounts
              </p>
              {transferTargets.map((acc) => (
                <button
                  key={acc.id}
                  role="menuitem"
                  onClick={() => chooseTransfer(acc.id)}
                  className={categoryMenuItem}
                >
                  ↔ Transfer with {acc.name}
                </button>
              ))}
              <button
                role="menuitem"
                onClick={() => chooseTransfer(EXTERNAL_ACCOUNT_ID)}
                className={categoryMenuItem}
              >
                ↔ Transfer with an account not in FinanceApp
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  const handleAddTag = (tagName: string) => {
    if (onAddTag && !transaction.tags.includes(tagName)) {
      onAddTag(transaction.id, tagName);
      setShowTagDropdown(false);
    }
  };

  const handleRemoveTag = (tagName: string) => {
    if (onRemoveTag) {
      onRemoveTag(transaction.id, tagName);
    }
  };

  return (
    <div
      className={`p-2 hover:bg-gray-50 transition-colors ${className}`}
      data-testid={`transaction-${transaction.id}`}
    >
      <div className="grid grid-cols-4 gap-4 items-center">
        {/* Column 1: Merchant Name - Left aligned */}
        <div className="min-w-0 text-left">
          <div className="font-medium text-gray-900 truncate text-sm">
            {transaction.cleanMerchant.cleanName}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {transaction.cleanMerchant.original}
          </div>
        </div>

        {/* Column 2: Date and Account */}
        <div className="min-w-0">
          <div className="text-sm text-gray-900">{transaction.date}</div>
          <div className="text-xs text-gray-500">
            {showAccountName ? transaction.accountId : ''}
            {transaction.pending && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Pending
              </span>
            )}
          </div>
        </div>

        {/* Column 3: Tags */}
        {(showTagging || showCategory) && (
          <div className="flex items-center gap-1 flex-wrap">
            {categoryControl}
            {showTagging && (
              <>
                {transaction.tags.map((tag) => {
                  const tagInfo = TAG_CATEGORIES[tag];
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium group cursor-pointer ${
                        tagInfo?.color || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <span className="mr-1">{tagInfo?.icon || '📝'}</span>
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-current hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}

                {/* Add Tag Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    + Tag
                  </button>

                  {/* Tag Dropdown */}
                  {showTagDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <div className="p-2 max-h-48 overflow-y-auto">
                        {Object.entries(TAG_CATEGORIES).map(
                          ([tagName, tagInfo]) => (
                            <button
                              key={tagName}
                              onClick={() => handleAddTag(tagName)}
                              className="w-full flex items-center px-2 py-1.5 text-xs rounded hover:bg-gray-50 text-left disabled:opacity-50"
                              disabled={transaction.tags.includes(tagName)}
                            >
                              <span className="mr-2">{tagInfo.icon}</span>
                              <span
                                className={
                                  transaction.tags.includes(tagName)
                                    ? 'text-gray-400'
                                    : 'text-gray-700'
                                }
                              >
                                {tagName}
                              </span>
                              {transaction.tags.includes(tagName) && (
                                <span className="ml-auto text-gray-400">✓</span>
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Auto-suggest tag if untagged */}
                {transaction.tags.length === 0 &&
                  !isTransfer(transaction) &&
                  transaction.cleanMerchant.suggestedCategory !== 'Other' && (
                    <button
                      onClick={() =>
                        handleAddTag(
                          transaction.cleanMerchant.suggestedCategory
                        )
                      }
                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <span className="mr-1">
                        {
                          TAG_CATEGORIES[
                            transaction.cleanMerchant.suggestedCategory
                          ]?.icon
                        }
                      </span>
                      Suggest: {transaction.cleanMerchant.suggestedCategory}
                    </button>
                  )}
              </>
            )}
          </div>
        )}

        {/* Column 4: Amount */}
        <div className="text-right">
          <div
            className={`text-sm font-semibold ${
              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isPrivacyMode ? (
              <span className="text-gray-400">••••••</span>
            ) : (
              <>
                {transaction.amount > 0 ? '+' : ''}
                {formatMoney(transaction.amount)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
