import React, { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import {
  Goal,
  GoalProgress,
  goalProgress,
  monthFromNow,
} from '../../utils/goals';
import { formatMoney } from '../../utils/format';
import { GoalModal } from './GoalModal';

const monthName = (month: string) => {
  const [year, mon] = month.split('-').map(Number);
  return new Date(year, mon - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const STATUS_STYLE: Record<GoalProgress['status'], string> = {
  reached: 'text-green-700',
  'on-track': 'text-green-700',
  behind: 'text-amber-700',
  overdue: 'text-red-600',
  open: 'text-gray-600',
};

// The dashboard's savings goals: progress, and whether you're on pace.
export const GoalsCard: React.FC = () => {
  const { state, goals, isPrivacyMode } = useFinancial();
  // null: closed; undefined inside: a new goal.
  const [editing, setEditing] = useState<{ goal?: Goal } | null>(null);

  const money = (amount: number) =>
    isPrivacyMode ? '••••' : formatMoney(amount);

  const describe = (p: GoalProgress): string => {
    const { goal } = p;
    if (
      goal.accountId &&
      !state.accounts.some((a) => a.id === goal.accountId)
    ) {
      return 'Its account was removed. Edit the goal to choose another.';
    }
    const pace =
      p.monthlyPace !== null
        ? `you're saving ${money(Math.max(0, p.monthlyPace))} a month`
        : null;
    switch (p.status) {
      case 'reached':
        return 'Reached!';
      case 'on-track':
        return `On track: ${money(p.monthlyNeeded!)} a month until ${monthName(
          goal.by!
        )}, and ${pace}.`;
      case 'behind':
        return `Behind: needs ${money(
          p.monthlyNeeded!
        )} a month until ${monthName(goal.by!)}, and ${pace}.`;
      case 'overdue':
        return `${monthName(goal.by!)} has passed, with ${money(
          p.remaining
        )} to go.`;
      default:
        if (p.monthlyNeeded !== null) {
          return `Save ${money(
            p.monthlyNeeded
          )} a month to reach it by ${monthName(goal.by!)}.`;
        }
        if (p.monthsAtPace !== null) {
          return `At ${money(
            p.monthlyPace!
          )} a month, you'll reach it around ${monthName(
            monthFromNow(p.monthsAtPace)
          )}.`;
        }
        return `${money(p.remaining)} to go.`;
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border p-6 text-left"
      data-testid="goals-card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Savings goals</h3>
        {goals.length > 0 && (
          <button
            onClick={() => setEditing({})}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add goal
          </button>
        )}
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-4">
          <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-3">
            Set a goal, like an emergency fund or a trip, and see whether you're
            saving enough to reach it.
          </p>
          <button
            onClick={() => setEditing({})}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Add a goal
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {goals.map((goal) => {
            const p = goalProgress(goal, state.accounts);
            return (
              <li key={goal.id}>
                <button
                  onClick={() => setEditing({ goal })}
                  className="w-full text-left rounded-md -m-1 p-1 hover:bg-gray-50"
                  aria-label={`${goal.name}: ${money(p.saved)} of ${money(
                    goal.target
                  )}. ${describe(p)} Edit goal.`}
                  data-testid={`goal-${goal.id}`}
                >
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium text-gray-900 truncate">
                      {goal.name}
                    </span>
                    <span className="text-gray-700 tabular-nums whitespace-nowrap">
                      {money(p.saved)} of {money(goal.target)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-full rounded-full ${
                        p.status === 'reached' ? 'bg-green-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.round(p.fraction * 100)}%` }}
                    />
                  </div>
                  <p className={`mt-1.5 text-xs ${STATUS_STYLE[p.status]}`}>
                    {describe(p)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <GoalModal goal={editing.goal} onClose={() => setEditing(null)} />
      )}
    </div>
  );
};
