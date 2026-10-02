import React from 'react';
import { useFinancial } from '../../contexts/FinancialContext';
import { TAG_CATEGORIES } from '../../constants/financial';
import { BudgetStatus, budgetProgress } from '../../utils/budgets';
import { formatMoney } from '../../utils/format';

interface BudgetsCardProps {
  // Spending by category for the last six months, this month last.
  history: { months: string[]; spending: Record<string, number>[] };
  monthLabel: string;
  onEdit: () => void;
}

// A budget used up by rollover counts as fully used.
const usedPercent = (row: { spent: number; limit: number }) =>
  row.limit > 0
    ? Math.min(100, Math.round((row.spent / row.limit) * 100))
    : 100;

const shortMonth = (month: string) => {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
  });
};

const BAR_COLORS: Record<BudgetStatus, string> = {
  ok: 'bg-green-500',
  near: 'bg-amber-500',
  over: 'bg-red-500',
};

export const BudgetsCard: React.FC<BudgetsCardProps> = ({
  history,
  monthLabel,
  onEdit,
}) => {
  const { budgets, budgetRollover, isPrivacyMode } = useFinancial();
  const last = history.spending.length - 1;
  const spending = history.spending[last] ?? {};
  const rows = budgetProgress(budgets, spending, {
    previousSpending: history.spending[last - 1],
    rollover: budgetRollover,
  });
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
              aria-valuenow={usedPercent(row)}
            >
              <div
                className={`h-full ${BAR_COLORS[row.status]}`}
                style={{ width: `${usedPercent(row)}%` }}
              />
            </div>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div
                className={`text-xs ${
                  row.status === 'over' ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {row.remaining < 0
                  ? `${money(-row.remaining)} over`
                  : `${money(row.remaining)} left`}
                {row.carried !== 0 && (
                  <span
                    className="text-gray-500"
                    data-testid={`carried-${row.category}`}
                  >
                    {' '}
                    · {money(Math.abs(row.carried))}{' '}
                    {row.carried > 0 ? 'rolled over' : 'over last month'}
                  </span>
                )}
              </div>
              {/* The last six months against the budget you set. */}
              <div
                className="flex items-end gap-0.5 h-5 shrink-0"
                role="img"
                aria-label={`${row.category}, last six months: ${history.months
                  .map(
                    (m, i) =>
                      `${shortMonth(m)} ${money(
                        history.spending[i][row.category] || 0
                      )}`
                  )
                  .join(', ')}`}
                data-testid={`history-${row.category}`}
              >
                {history.months.map((m, i) => {
                  const value = history.spending[i][row.category] || 0;
                  return (
                    <span
                      key={m}
                      title={`${shortMonth(m)}: ${money(value)}`}
                      className={`w-1.5 rounded-sm ${
                        value > row.baseLimit ? 'bg-red-400' : 'bg-gray-300'
                      } ${i === last ? 'opacity-60' : ''}`}
                      style={{
                        height: `${Math.max(
                          8,
                          Math.min(100, (value / (row.baseLimit * 1.5)) * 100)
                        )}%`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
