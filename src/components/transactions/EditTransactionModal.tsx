import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Transaction } from '../../types/financial';
import { useFinancial } from '../../contexts/FinancialContext';
import { Button } from '../ui/Button';
import { categorizeMerchant } from '../../utils/csvImport';
import { formatSignedMoney } from '../../utils/format';
import { parseManualAmount } from '../../utils/manualTransactions';

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export const NOTES_MAX_LENGTH = 500;

const fieldClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';

// Shown only while open, so each opening starts from the transaction as it
// is now.
export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  onClose,
}) => {
  const { editTransaction, isPrivacyMode } = useFinancial();
  const manual = transaction.manual === true;

  // Blank while the name is the one the description gives, so it keeps
  // following the description as you fix it.
  const [name, setName] = useState(() => {
    const current = transaction.cleanMerchant.cleanName;
    return current ===
      categorizeMerchant(transaction.description, transaction.amount).cleanName
      ? ''
      : current;
  });
  const [notes, setNotes] = useState(transaction.notes ?? '');
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description);
  const [direction, setDirection] = useState<'out' | 'in'>(
    transaction.amount < 0 ? 'out' : 'in'
  );
  const [amountInput, setAmountInput] = useState(
    Math.abs(transaction.amount).toFixed(2)
  );

  const amount = parseManualAmount(amountInput);
  const signed = (amount ?? 0) * (direction === 'out' ? -1 : 1);
  const amountInvalid = manual && amount === null;
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const canSave =
    !manual || (dateValid && description.trim() !== '' && amount !== null);
  // What a blank name falls back to.
  const defaultName = categorizeMerchant(
    (manual ? description : transaction.description).trim(),
    manual ? signed : transaction.amount
  ).cleanName;

  const handleSave = () => {
    if (!canSave) return;
    editTransaction(transaction.id, {
      name,
      notes,
      ...(manual ? { date, description, amount: signed } : {}),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-transaction-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-full overflow-y-auto text-left">
        <div className="flex items-center justify-between p-6 border-b">
          <h3
            id="edit-transaction-title"
            className="text-lg font-semibold text-gray-900"
          >
            Edit transaction
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
          {manual ? (
            <>
              <label className="block">
                <span className={labelClasses}>Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={fieldClasses}
                />
              </label>

              <label className="block">
                <span className={labelClasses}>Description</span>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className={fieldClasses}
                />
              </label>

              <div>
                <span className={labelClasses}>Amount</span>
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
                    Enter an amount above zero, like 12.50. Choose money in or
                    out above rather than typing a minus sign.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div
              className="rounded-lg bg-gray-50 p-3 text-sm"
              data-testid="imported-details"
            >
              <div className="flex justify-between gap-3">
                <span className="text-gray-900 break-words min-w-0">
                  {transaction.description}
                </span>
                <span className="font-medium text-gray-900 tabular-nums whitespace-nowrap">
                  {isPrivacyMode
                    ? '••••'
                    : formatSignedMoney(transaction.amount)}
                </span>
              </div>
              <div className="text-gray-500">{transaction.date}</div>
              <p className="mt-2 text-xs text-gray-500">
                The date, description and amount are what your bank reported, so
                they can't be changed here.
              </p>
            </div>
          )}

          <div>
            <label className="block">
              <span className={labelClasses}>Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={defaultName}
                aria-describedby="edit-name-hint"
                className={fieldClasses}
              />
            </label>
            <p id="edit-name-hint" className="mt-1 text-xs text-gray-500">
              Shown in your lists. Leave blank to use "{defaultName}".
            </p>
          </div>

          <label className="block">
            <span className={labelClasses}>Note</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={NOTES_MAX_LENGTH}
              rows={3}
              placeholder="Split with Sam, reimbursed by work…"
              className={fieldClasses}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave} data-testid="save-edit">
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
