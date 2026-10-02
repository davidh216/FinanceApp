import React, { useId, useState } from 'react';
import { X } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Button } from '../ui/Button';
import { Goal, createGoal, updateGoal } from '../../utils/goals';
import { isImportedAccount } from '../../utils/csvImport';
import { isClosed, isLiabilityType } from '../../utils/accountSettings';
import { parseManualAmount } from '../../utils/manualTransactions';
import { toLocalDateString } from '../../utils/date';

interface GoalModalProps {
  // The goal to edit; a new one when absent.
  goal?: Goal;
  onClose: () => void;
}

const fieldClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';
const BY_HAND = '';

const AmountField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, invalid, placeholder }) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"
          aria-hidden="true"
        >
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={invalid}
          className={`${fieldClasses} pl-6 ${invalid ? 'border-red-400' : ''}`}
        />
      </div>
    </div>
  );
};

// Shown only while open, so it always starts from the goal as it is.
export const GoalModal: React.FC<GoalModalProps> = ({ goal, onClose }) => {
  const { state, goals, setGoals } = useFinancial();
  // Accounts whose balance can show progress: yours, open, not debts.
  const accounts = state.accounts.filter(
    (acc) =>
      isImportedAccount(acc) &&
      !isLiabilityType(acc.type) &&
      (!isClosed(acc) || acc.id === goal?.accountId)
  );

  const [name, setName] = useState(goal?.name ?? '');
  const [targetInput, setTargetInput] = useState(
    goal ? String(goal.target) : ''
  );
  const [by, setBy] = useState(goal?.by ?? '');
  const [accountId, setAccountId] = useState(
    goal?.accountId && accounts.some((acc) => acc.id === goal.accountId)
      ? goal.accountId
      : BY_HAND
  );
  const [savedInput, setSavedInput] = useState(
    goal?.saved ? String(goal.saved) : ''
  );

  const target = parseManualAmount(targetInput);
  const targetInvalid = targetInput.trim() !== '' && target === null;
  const saved =
    savedInput.trim() === '' || savedInput.trim() === '0'
      ? 0
      : parseManualAmount(savedInput);
  const savedInvalid = accountId === BY_HAND && saved === null;
  const thisMonth = toLocalDateString(new Date()).slice(0, 7);
  const byInvalid = by !== '' && (!/^\d{4}-\d{2}$/.test(by) || by < thisMonth);
  const canSave =
    name.trim() !== '' && target !== null && !savedInvalid && !byInvalid;

  const handleSave = () => {
    if (!canSave || target === null) return;
    const details = {
      name,
      target,
      ...(by ? { by } : {}),
      ...(accountId ? { accountId } : { saved: saved ?? 0 }),
    };
    setGoals(
      goal
        ? goals.map((g) => (g.id === goal.id ? updateGoal(g, details) : g))
        : [...goals, createGoal(details)]
    );
    onClose();
  };

  const handleDelete = () => {
    if (!goal || !window.confirm(`Delete the goal "${goal.name}"?`)) return;
    setGoals(goals.filter((g) => g.id !== goal.id));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-full overflow-y-auto text-left">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 id="goal-title" className="text-lg font-semibold text-gray-900">
            {goal ? 'Edit goal' : 'New savings goal'}
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
              placeholder="Emergency fund"
              className={fieldClasses}
            />
          </label>

          <div>
            <AmountField
              label="Target"
              value={targetInput}
              onChange={setTargetInput}
              invalid={targetInvalid}
              placeholder="10,000"
            />
            {targetInvalid && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                Enter a target above zero, like 10,000.
              </p>
            )}
          </div>

          <div>
            <label className="block">
              <span className={labelClasses}>By (optional)</span>
              <input
                type="month"
                value={by}
                min={thisMonth}
                onChange={(event) => setBy(event.target.value)}
                className={fieldClasses}
              />
            </label>
            {byInvalid && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                Choose this month or a later one.
              </p>
            )}
          </div>

          <div>
            <label className="block">
              <span className={labelClasses}>Track it with</span>
              <select
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                aria-describedby="goal-tracking-hint"
                className={fieldClasses}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}'s balance
                  </option>
                ))}
                <option value={BY_HAND}>An amount I update myself</option>
              </select>
            </label>
            <p id="goal-tracking-hint" className="mt-1 text-xs text-gray-500">
              {accountId
                ? 'Progress is the account’s balance, and your pace is how fast it has grown over the last 3 months.'
                : 'Edit the goal to update how much you’ve saved.'}
            </p>
          </div>

          {accountId === BY_HAND && (
            <div>
              <AmountField
                label="Saved so far"
                value={savedInput}
                onChange={setSavedInput}
                invalid={savedInvalid}
                placeholder="0"
              />
              {savedInvalid && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  Enter an amount like 2,500, or leave it empty.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            {goal ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSave} data-testid="save-goal">
                {goal ? 'Save' : 'Add goal'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
