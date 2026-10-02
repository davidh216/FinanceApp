import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { useCategories } from '../../hooks/useCategories';
import { Button } from '../ui/Button';
import { isImportedAccount } from '../../utils/csvImport';
import { isClosed } from '../../utils/accountSettings';
import { toLocalDateString } from '../../utils/date';
import {
  createManualTransaction,
  parseManualAmount,
  suggestCategory,
} from '../../utils/manualTransactions';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Imported account to pre-select.
  defaultAccountId?: string;
}

const fieldClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const AddTransactionForm: React.FC<
  Omit<AddTransactionModalProps, 'isOpen'>
> = ({ onClose, defaultAccountId }) => {
  const { state, addManualTransaction, categoryRules } = useFinancial();
  const categories = useCategories();
  // Only imported accounts: the demo is regenerated on every load, so a
  // transaction added to it would be lost.
  // Closed accounts are left out, unless it's the one you're looking at.
  const accounts = state.accounts.filter(
    (acc) =>
      isImportedAccount(acc) && (!isClosed(acc) || acc.id === defaultAccountId)
  );
  const [accountId, setAccountId] = useState(
    accounts.some((acc) => acc.id === defaultAccountId)
      ? (defaultAccountId as string)
      : accounts[0]?.id ?? ''
  );
  const [date, setDate] = useState(toLocalDateString(new Date()));
  const [description, setDescription] = useState('');
  const [direction, setDirection] = useState<'out' | 'in'>('out');
  const [amountInput, setAmountInput] = useState('');
  // Follows the description until you pick one yourself.
  const [chosenCategory, setChosenCategory] = useState<string | null>(null);

  const amount = parseManualAmount(amountInput);
  const signed = (amount ?? 1) * (direction === 'out' ? -1 : 1);
  const category =
    chosenCategory ??
    (description.trim()
      ? suggestCategory(description, signed, categoryRules)
      : direction === 'in'
      ? 'Income'
      : 'Other');
  const amountInvalid = amountInput.trim() !== '' && amount === null;
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const canSave =
    !!accountId && dateValid && description.trim() !== '' && amount !== null;

  const handleSave = () => {
    if (!canSave || amount === null) return;
    addManualTransaction(
      createManualTransaction({
        accountId,
        date,
        description,
        amount: direction === 'out' ? -amount : amount,
        category,
      })
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-transaction-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-full overflow-y-auto text-left">
        <div className="flex items-center justify-between p-6 border-b">
          <h3
            id="add-transaction-title"
            className="text-lg font-semibold text-gray-900"
          >
            Add a transaction
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="p-6">
            <p
              className="text-sm text-gray-600"
              data-testid="add-needs-account"
            >
              Transactions are added to accounts you've imported, so import a
              CSV from your bank first. The demo accounts are regenerated each
              time the app loads, so anything added to them would be lost.
            </p>
            <div className="mt-6 flex justify-end">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="p-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Account
              </span>
              <select
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                className={fieldClasses}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={fieldClasses}
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </span>
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Farmers market"
                className={fieldClasses}
              />
            </label>

            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </span>
              <div className="flex gap-2">
                <div
                  className="flex rounded-lg bg-gray-100 p-1"
                  role="radiogroup"
                  aria-label="Direction"
                >
                  {(
                    [
                      ['out', 'Money out'],
                      ['in', 'Money in'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={direction === value}
                      onClick={() => setDirection(value)}
                      className={`px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap ${
                        direction === value
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                    placeholder="0.00"
                    aria-label="Amount"
                    aria-invalid={amountInvalid}
                    className={`${fieldClasses} pl-6 text-right ${
                      amountInvalid ? 'border-red-400' : ''
                    }`}
                  />
                </div>
              </div>
              {amountInvalid && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  Enter an amount above zero, like 12.50. Choose money in or out
                  above rather than typing a minus sign.
                </p>
              )}
            </div>

            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </span>
              <select
                value={category}
                onChange={(event) => setChosenCategory(event.target.value)}
                className={fieldClasses}
              >
                {categories.names.map((name) => (
                  <option key={name} value={name}>
                    {categories.label(name)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSave}
                data-testid="save-transaction"
              >
                Add transaction
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Remounting the form on open starts it empty each time.
export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  ...props
}) => (isOpen ? <AddTransactionForm {...props} /> : null);
