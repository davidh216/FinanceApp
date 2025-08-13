import React from 'react';
import { Account } from '../../types/financial';
import { CreditCard, ArrowRight } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';

interface AccountCardProps {
  account: Account;
  onClick?: (account: Account) => void;
  showTransactionCount?: boolean;
  className?: string;
}

export const AccountCard = React.memo<AccountCardProps>(({
  account,
  onClick,
  showTransactionCount = false,
  className = '',
}) => {
  const { isPrivacyMode } = useFinancial();
  const isClickable = !!onClick;

  const Component = isClickable ? 'button' : 'div';

  return (
    <Component
      onClick={() => onClick?.(account)}
      className={`w-full p-6 flex items-center justify-between text-left transition-colors ${
        isClickable ? 'hover:bg-gray-50 cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-center flex-1">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
          {account.type === 'INVESTMENT' && account.name.includes('Home') ? (
            <span className="text-xl">🏠</span>
          ) : account.type === 'LOAN' ? (
            <span className="text-xl">🏦</span>
          ) : (
            <CreditCard className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {account.name}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {account.bankName} • {account.accountNumber}
          </div>
          {/* Sync Status */}
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
            <span className="text-xs text-gray-500">
              Synced •{' '}
              {new Date().toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="text-right flex items-center flex-shrink-0">
        <div>
          <div
            className={`text-lg font-semibold ${
              account.balance < 0 ? 'text-red-600' : 'text-green-600'
            }`}
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
            <div className="text-sm text-gray-500">
              Limit: ${account.limit.toLocaleString()}
            </div>
          )}
        </div>
        {isClickable && <ArrowRight className="w-5 h-5 text-gray-400 ml-4" />}
      </div>
    </Component>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for account card props
  return prevProps.account.id === nextProps.account.id &&
         prevProps.account.balance === nextProps.account.balance &&
         prevProps.showTransactionCount === nextProps.showTransactionCount &&
         prevProps.className === nextProps.className;
});

AccountCard.displayName = 'AccountCard';
