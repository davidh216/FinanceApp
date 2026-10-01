import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Account, AccountType } from '../../types/financial';
import { useFinancial } from '../../contexts/FinancialContext';
import { Button } from '../ui/Button';
import {
  ACCOUNT_TYPE_OPTIONS,
  balanceForType,
  isClosed,
  isLiabilityType,
} from '../../utils/accountSettings';
import { formatMoney } from '../../utils/format';

interface AccountSettingsModalProps {
  account: Account;
  onClose: () => void;
}

const fieldClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';

// Shown only while open, so it always starts from the account as it is.
export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  account,
  onClose,
}) => {
  const { updateAccountSettings, isPrivacyMode } = useFinancial();
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<AccountType>(account.type);
  const [closed, setClosed] = useState(isClosed(account));

  const money = (amount: number) =>
    isPrivacyMode ? '••••' : formatMoney(amount);
  const nowOwed = isLiabilityType(type);
  const flips = nowOwed !== isLiabilityType(account.type);
  const newBalance = balanceForType(account, type);
  const canSave = name.trim() !== '';

  const handleSave = () => {
    if (!canSave) return;
    updateAccountSettings(account.id, { name, type, closed });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-settings-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-full overflow-y-auto text-left">
        <div className="flex items-center justify-between p-6 border-b">
          <h3
            id="account-settings-title"
            className="text-lg font-semibold text-gray-900"
          >
            Account settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          className="p-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <label className="block">
            <span className={labelClasses}>Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClasses}
            />
          </label>

          <div>
            <label className="block">
              <span className={labelClasses}>Type</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as AccountType)}
                className={fieldClasses}
              >
                {ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {flips && (
              <p
                className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
                data-testid="type-change-note"
              >
                {nowOwed
                  ? `Its balance will count as ${money(
                      -newBalance
                    )} owed, a debt in your net worth.`
                  : `Its balance will count as ${money(
                      newBalance
                    )} you own, not a debt.`}{' '}
                If its transactions also have the wrong signs, remove it and
                import the CSV again with the signs flipped.
              </p>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={closed}
              onChange={(event) => setClosed(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              This account is closed
              <span className="block text-gray-500">
                It's hidden from your account lists. Its history still counts in
                every total.
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSave}
              data-testid="save-account-settings"
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
