import React, { useState } from 'react';
import { PenLine, Upload, X } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Button } from '../ui/Button';
import {
  MANUAL_ACCOUNT_KINDS,
  createManualAccount,
} from '../../utils/manualAccounts';
import { parseManualAmount } from '../../utils/manualTransactions';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Opens the CSV import instead.
  onImportCsv: () => void;
}

const fieldClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';

const owned = MANUAL_ACCOUNT_KINDS.filter((kind) => !kind.owed);
const owed = MANUAL_ACCOUNT_KINDS.filter((kind) => kind.owed);

const AddAccountForm: React.FC<Omit<AddAccountModalProps, 'isOpen'>> = ({
  onClose,
  onImportCsv,
}) => {
  const { importAccount } = useFinancial();
  const [step, setStep] = useState<'choose' | 'manual'>('choose');
  const [name, setName] = useState('');
  const [kindKey, setKindKey] = useState(owned[0].key);
  const [amountInput, setAmountInput] = useState('');

  const kind =
    MANUAL_ACCOUNT_KINDS.find((k) => k.key === kindKey) ??
    MANUAL_ACCOUNT_KINDS[0];
  // Zero is fine: a loan just paid off, an empty cash jar.
  const amount =
    amountInput.trim() === '0' ? 0 : parseManualAmount(amountInput);
  const amountInvalid = amountInput.trim() !== '' && amount === null;
  const canSave = name.trim() !== '' && amount !== null;

  const handleSave = () => {
    if (!canSave || amount === null) return;
    importAccount(createManualAccount({ name, kind, amount }));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-account-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-full overflow-y-auto text-left">
        <div className="flex items-center justify-between p-6 border-b">
          <h3
            id="add-account-title"
            className="text-lg font-semibold text-gray-900"
          >
            Add an account
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'choose' ? (
          <div className="p-6 space-y-3">
            <button
              onClick={() => {
                onClose();
                onImportCsv();
              }}
              className="w-full flex items-start gap-3 rounded-lg border p-4 text-left hover:border-blue-400 hover:bg-blue-50"
              data-testid="add-account-csv"
            >
              <Upload className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>
                <span className="block font-medium text-gray-900">
                  Import a CSV from your bank
                </span>
                <span className="block text-sm text-gray-600">
                  Checking, savings and credit cards, with their transactions.
                </span>
              </span>
            </button>
            <button
              onClick={() => setStep('manual')}
              className="w-full flex items-start gap-3 rounded-lg border p-4 text-left hover:border-blue-400 hover:bg-blue-50"
              data-testid="add-account-manual"
            >
              <PenLine className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>
                <span className="block font-medium text-gray-900">
                  Enter it by hand
                </span>
                <span className="block text-sm text-gray-600">
                  A house, a car, investments, cash or a loan: anything without
                  a statement to import. Update its balance whenever it changes.
                </span>
              </span>
            </button>
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
              <span className={labelClasses}>What is it?</span>
              <select
                value={kindKey}
                onChange={(event) => setKindKey(event.target.value)}
                className={fieldClasses}
              >
                <optgroup label="Something you own">
                  {owned.map((k) => (
                    <option key={k.key} value={k.key}>
                      {k.icon} {k.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Something you owe">
                  {owed.map((k) => (
                    <option key={k.key} value={k.key}>
                      {k.icon} {k.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <label className="block">
              <span className={labelClasses}>Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  kind.key === 'property'
                    ? 'Home'
                    : kind.key === 'vehicle'
                    ? 'Car'
                    : kind.owed
                    ? 'Car loan'
                    : 'Brokerage account'
                }
                className={fieldClasses}
              />
            </label>

            <div>
              <label className="block">
                <span className={labelClasses}>
                  {kind.owed ? 'Amount owed' : "What it's worth"}
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
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                    placeholder="0.00"
                    aria-invalid={amountInvalid}
                    className={`${fieldClasses} pl-6 ${
                      amountInvalid ? 'border-red-400' : ''
                    }`}
                  />
                </div>
              </label>
              {amountInvalid && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  Enter an amount like 250000 or 12,500.50.
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {kind.owed
                  ? 'Counted as a debt in your net worth.'
                  : 'Counted as something you own in your net worth.'}
              </p>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('choose')}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={!canSave}
                data-testid="save-manual-account"
              >
                Add account
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Remounting on open starts at the choice each time.
export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  ...props
}) => (isOpen ? <AddAccountForm {...props} /> : null);
