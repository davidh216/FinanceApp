import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Account } from '../../types/financial';
import { useFinancial } from '../../contexts/FinancialContext';
import { Button } from '../ui/Button';
import { LIABILITY_ACCOUNT_TYPES, parseAmount } from '../../utils/csvImport';
import { balanceAsOf } from '../../utils/balances';
import { toLocalDateString } from '../../utils/date';
import { formatMoney, formatSignedMoney } from '../../utils/format';

interface UpdateBalanceModalProps {
  account: Account;
  onClose: () => void;
}

const fieldClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';

// Shown only while open, so it always starts from today's balance.
export const UpdateBalanceModal: React.FC<UpdateBalanceModalProps> = ({
  account,
  onClose,
}) => {
  const { updateAccountBalance, isPrivacyMode } = useFinancial();
  // Debts are entered as the amount owed, as when importing.
  const owed = LIABILITY_ACCOUNT_TYPES.includes(account.type);
  const today = toLocalDateString(new Date());
  const [date, setDate] = useState(today);
  const [input, setInput] = useState('');

  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today;
  const before = balanceAsOf(account, dateValid ? date : today);
  const parsed = parseAmount(input);
  // A debt's amount owed can't be negative; anything else can (overdrawn).
  const amountInvalid =
    input.trim() !== '' && (parsed === null || (owed && parsed < 0));
  const target =
    parsed === null || amountInvalid ? null : owed ? -parsed : parsed;
  const change =
    target === null ? null : Math.round((target - before) * 100) / 100;
  const canSave = dateValid && change !== null && change !== 0;

  const money = (amount: number) =>
    isPrivacyMode ? '••••' : formatMoney(amount);
  const shown = (balance: number) => money(owed ? -balance : balance);

  const handleSave = () => {
    if (!canSave || target === null) return;
    updateAccountBalance(account.id, target, date);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-balance-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-full overflow-y-auto text-left">
        <div className="flex items-center justify-between p-6 border-b">
          <h3
            id="update-balance-title"
            className="text-lg font-semibold text-gray-900"
          >
            Update {account.name}
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
            <span className={labelClasses}>As of</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(event) => setDate(event.target.value)}
              className={fieldClasses}
            />
          </label>

          <div>
            <label className="block">
              <span className={labelClasses}>
                {owed ? 'Amount owed' : 'Balance'}
              </span>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"
                  aria-hidden="true"
                >
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={(owed ? -before : before).toFixed(2)}
                  aria-invalid={amountInvalid}
                  className={`${fieldClasses} pl-6 ${
                    amountInvalid ? 'border-red-400' : ''
                  }`}
                />
              </div>
            </label>
            {amountInvalid && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {owed
                  ? 'Enter the amount owed as a positive number, like 12,500.'
                  : 'Enter an amount like 2,450.75.'}
              </p>
            )}
          </div>

          <div
            className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700"
            data-testid="balance-change"
          >
            {dateValid ? (
              <>
                <p>
                  {owed ? 'Owed' : 'Balance'} on that day: {shown(before)}
                </p>
                {change !== null && change !== 0 && (
                  <p className="mt-1">
                    A balance update of{' '}
                    {isPrivacyMode ? '••••' : formatSignedMoney(change)} is
                    recorded on that day. It isn't counted as income or
                    spending.
                  </p>
                )}
                {change === 0 && (
                  <p className="mt-1">That's already the balance.</p>
                )}
              </>
            ) : (
              <p className="text-red-600">Choose a day up to today.</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSave}
              data-testid="save-balance"
            >
              Update balance
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
