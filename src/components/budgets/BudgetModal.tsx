import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { TAG_CATEGORIES } from '../../constants/financial';
import { Button } from '../ui/Button';
import { Budgets, isBudgetCategory } from '../../utils/budgets';
import { formatMoney } from '../../utils/format';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  // This month's spending by category, to help pick a limit.
  spending: Record<string, number>;
}

const CATEGORIES = Object.keys(TAG_CATEGORIES).filter(isBudgetCategory);

// "" means no budget; anything else must be a positive amount.
const parseLimit = (value: string): number | null | 'invalid' => {
  const trimmed = value.replace(/[$,\s]/g, '');
  if (trimmed === '') return null;
  const limit = Number(trimmed);
  return Number.isFinite(limit) && limit > 0 ? limit : 'invalid';
};

const BudgetForm: React.FC<Omit<BudgetModalProps, 'isOpen'>> = ({
  onClose,
  spending,
}) => {
  const {
    budgets,
    setBudgets,
    budgetRollover,
    setBudgetRollover,
    isPrivacyMode,
  } = useFinancial();
  const [rollover, setRollover] = useState<string[]>(budgetRollover);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      CATEGORIES.map((category) => [
        category,
        budgets[category] ? budgets[category].toFixed(2) : '',
      ])
    )
  );

  const parsed = Object.fromEntries(
    CATEGORIES.map((category) => [category, parseLimit(values[category])])
  );
  const hasErrors = Object.values(parsed).includes('invalid');

  const handleSave = () => {
    const next: Budgets = {};
    for (const [category, limit] of Object.entries(parsed)) {
      if (typeof limit === 'number') next[category] = limit;
    }
    setBudgets(next);
    // Only budgets that are set can roll over.
    setBudgetRollover(rollover.filter((category) => category in next));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto text-left">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 id="budget-title" className="text-lg font-semibold text-gray-900">
            Monthly budgets
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Set a monthly limit for the categories you want to keep an eye on.
            Leave the rest blank. Transfers between your own accounts don't
            count as spending. With Roll over, what's left of a month's budget
            is added to the next month's, and going over takes it off.
          </p>
          <div className="space-y-3">
            {CATEGORIES.map((category) => {
              const invalid = parsed[category] === 'invalid';
              const spent = spending[category] || 0;
              return (
                <div
                  key={category}
                  className="flex items-center gap-3 flex-wrap sm:flex-nowrap"
                >
                  <span className="text-lg w-6 text-center">
                    {TAG_CATEGORIES[category].icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {category}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isPrivacyMode
                        ? 'Spent this month: ••••'
                        : `Spent this month: ${formatMoney(spent)}`}
                    </div>
                    {typeof parsed[category] === 'number' && (
                      <label className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                        <input
                          type="checkbox"
                          checked={rollover.includes(category)}
                          onChange={(event) =>
                            setRollover(
                              event.target.checked
                                ? [...rollover, category]
                                : rollover.filter((c) => c !== category)
                            )
                          }
                          aria-label={`Roll over ${category}`}
                        />
                        Roll over
                      </label>
                    )}
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        $
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values[category]}
                        onChange={(event) =>
                          setValues({
                            ...values,
                            [category]: event.target.value,
                          })
                        }
                        placeholder="No limit"
                        aria-label={`Monthly budget for ${category}`}
                        aria-invalid={invalid}
                        className={`w-full border rounded-lg pl-6 pr-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          invalid ? 'border-red-400' : 'border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasErrors && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              Budgets must be amounts above zero, like 250 or 99.50.
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={hasErrors}
              data-testid="save-budgets"
            >
              Save budgets
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Remounting the form on open starts it from the saved budgets each time.
export const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, ...props }) =>
  isOpen ? <BudgetForm {...props} /> : null;
