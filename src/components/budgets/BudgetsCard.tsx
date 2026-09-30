import React from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { TAG_CATEGORIES } from '../../constants/financial';
import { BudgetStatus, budgetProgress } from '../../utils/budgets';
import { formatMoney } from '../../utils/format';

interface BudgetsCardProps {
  // This month's spending by category.
  spending: Record<string, number>;
  monthLabel: string;
  onEdit: () => void;
}

const BAR_COLORS: Record<BudgetStatus, string> = {
  ok: 'bg-green-500',
  near: 'bg-amber-500',
  over: 'bg-red-500',
};

export const BudgetsCard: React.FC<BudgetsCardProps> = ({
  spending,
  monthLabel,
  onEdit,
}) => {
  const { budgets, isPrivacyMode } = useFinancial();
  const rows = budgetProgress(budgets, spending);
  if (rows.length === 0) return null;

  const over = rows.filter((row) => row.status === 'over').length;
  const money = (amount: number) =>
    isPrivacyMode ? '••••' : formatMoney(amount);

  return (
    <div
      className="bg-white rounded-lg shadow-sm border p-6 text-left"
      data-testid="budgets-card"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-gray-900">
          Budgets · {monthLabel}
        </h3>
        <button
          onClick={onEdit}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Edit
        </button>
      </div>
      <p
        className={`text-sm mb-4 ${
          over > 0 ? 'text-red-600' : 'text-gray-500'
        }`}
        data-testid="budgets-summary"
      >
        {over > 0
          ? `${over} of ${rows.length} over budget`
          : `All ${rows.length} within budget`}
      </p>
      <div className="space-y-4">
        {rows.map((row) => (
          <div
            key={row.category}
            data-testid={`budget-${row.category}`}
            data-status={row.status}
          >
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-gray-900">
                <span className="mr-1">
                  {TAG_CATEGORIES[row.category]?.icon}
                </span>
                {row.category}
              </span>
              <span className="text-gray-600">
                {money(row.spent)} of {money(row.limit)}
              </span>
            </div>
            <div
              className="h-2 rounded-full bg-gray-100 overflow-hidden"
              role="progressbar"
              aria-label={`${row.category} budget used`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(
                100,
                Math.round((row.spent / row.limit) * 100)
              )}
            >
              <div
                className={`h-full ${BAR_COLORS[row.status]}`}
                style={{
                  width: `${Math.min(100, (row.spent / row.limit) * 100)}%`,
                }}
              />
            </div>
            <div
              className={`mt-1 text-xs ${
                row.status === 'over' ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {row.remaining < 0
                ? `${money(-row.remaining)} over`
                : `${money(row.remaining)} left`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
