import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Transaction } from '../../types/financial';
import { useFinancial } from '../../contexts/FinancialContext';
import { useCategories } from '../../hooks/useCategories';
import { Button } from '../ui/Button';
import { formatMoney } from '../../utils/format';
import { parseManualAmount } from '../../utils/manualTransactions';
import { isSplit, splitError } from '../../utils/splits';

interface SplitTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

interface Row {
  category: string;
  // As typed, without a sign.
  amount: string;
}

const fieldClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const toCents = (value: number) => Math.round(value * 100);

// Divides one transaction between categories. Shown only while open, so
// each opening starts from the transaction as it is now.
export const SplitTransactionModal: React.FC<SplitTransactionModalProps> = ({
  transaction,
  onClose,
}) => {
  const { splitTransaction, isPrivacyMode } = useFinancial();
  const categories = useCategories();
  const sign = transaction.amount < 0 ? -1 : 1;
  const total = Math.abs(transaction.amount);
  const alreadySplit = isSplit(transaction);

  const [rows, setRows] = useState<Row[]>(() =>
    alreadySplit
      ? transaction.splits!.map((part) => ({
          category: part.category,
          amount: Math.abs(part.amount).toFixed(2),
        }))
      : [
          { category: transaction.category, amount: total.toFixed(2) },
          { category: '', amount: '' },
        ]
  );

  const amounts = rows.map((row) => parseManualAmount(row.amount) ?? 0);
  const leftCents =
    toCents(total) - amounts.reduce((sum, a) => sum + toCents(a), 0);
  const parts = rows.map((row, i) => ({
    category: row.category,
    amount: sign * amounts[i],
  }));
  const error = splitError(transaction.amount, parts);
  const money = (value: number) =>
    isPrivacyMode ? '••••' : formatMoney(value);

  const update = (index: number, change: Partial<Row>) =>
    setRows(rows.map((row, i) => (i === index ? { ...row, ...change } : row)));

  const addRow = () =>
    setRows([
      ...rows,
      {
        category: '',
        amount: leftCents > 0 ? (leftCents / 100).toFixed(2) : '',
      },
    ]);

  const handleSave = () => {
    if (error) return;
    splitTransaction(transaction.id, parts);
    onClose();
  };

  const handleUnsplit = () => {
    splitTransaction(transaction.id, null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="split-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-full overflow-y-auto text-left">
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h3
              id="split-title"
              className="text-lg font-semibold text-gray-900"
            >
              Split between categories
            </h3>
            <p className="text-sm text-gray-500">
              {transaction.cleanMerchant.cleanName} · {money(total)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          className="p-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={row.category}
                onChange={(event) =>
                  update(i, { category: event.target.value })
                }
                aria-label={`Part ${i + 1} category`}
                className={`${fieldClasses} flex-1 min-w-0`}
              >
                <option value="">Choose…</option>
                {categories.names.map((name) => (
                  <option key={name} value={name}>
                    {categories.label(name)}
                  </option>
                ))}
              </select>
              <div className="relative w-28 shrink-0">
                <span
                  className="absolute left-3 top-2 text-sm text-gray-500"
                  aria-hidden="true"
                >
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={row.amount}
                  onChange={(event) =>
                    update(i, { amount: event.target.value })
                  }
                  aria-label={`Part ${i + 1} amount`}
                  className={`${fieldClasses} pl-6 text-right`}
                />
              </div>
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
                disabled={rows.length <= 2}
                className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400"
                aria-label={`Remove part ${i + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" /> Add a part
          </button>

          <p
            className={`text-sm ${
              leftCents === 0 ? 'text-green-700' : 'text-amber-700'
            }`}
            data-testid="split-remaining"
            aria-live="polite"
          >
            {leftCents === 0
              ? `All ${money(total)} assigned`
              : leftCents > 0
              ? `${money(leftCents / 100)} left to assign`
              : `${money(-leftCents / 100)} more than the total`}
          </p>
          {error && leftCents === 0 && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-3">
            {alreadySplit ? (
              <button
                type="button"
                onClick={handleUnsplit}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Undo split
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={error !== null}
                data-testid="save-split"
              >
                Save split
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
