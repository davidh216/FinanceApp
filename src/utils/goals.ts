// src/utils/goals.ts
// Savings goals: a target amount, optionally by a month, tracked by an
// account's balance or by an amount you keep up to date yourself.
import { Account } from '../types/financial';
import { balanceAsOf } from './balances';
import { shiftMonth } from './cashflowHistory';
import { toLocalDateString } from './date';

export interface Goal {
  id: string;
  name: string;
  target: number;
  // "YYYY-MM": the month to reach it by. Optional.
  by?: string;
  // Progress is this account's balance. Without one, `saved` is.
  accountId?: string;
  saved?: number;
  createdAt: string;
}

export type GoalStatus =
  | 'reached'
  // Saving at least what's needed each month.
  | 'on-track'
  | 'behind'
  // The month has passed without reaching it.
  | 'overdue'
  // Nothing to compare with: no date, or no saving pace to go on.
  | 'open';

export interface GoalProgress {
  goal: Goal;
  saved: number;
  remaining: number;
  // 0 to 1.
  fraction: number;
  // Months left, counting this one, when there's a date.
  monthsLeft: number | null;
  // What's needed each month to reach it in time.
  monthlyNeeded: number | null;
  // How much the linked account has grown a month, over the last 3 months.
  monthlyPace: number | null;
  // At that pace, months until it's reached.
  monthsAtPace: number | null;
  status: GoalStatus;
}

const round = (value: number) => Math.round(value * 100) / 100;

// Months from `from` to `to` ("YYYY-MM"), counting both.
const monthsBetween = (from: string, to: string) => {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm) + 1;
};

// The months a pace is measured over.
export const PACE_MONTHS = 3;

export const goalProgress = (
  goal: Goal,
  accounts: Account[],
  today: Date = new Date()
): GoalProgress => {
  const todayText = toLocalDateString(today);
  const thisMonth = todayText.slice(0, 7);
  const account = goal.accountId
    ? accounts.find((acc) => acc.id === goal.accountId)
    : undefined;

  const saved = round(
    account ? Math.max(0, account.balance) : Math.max(0, goal.saved ?? 0)
  );
  const remaining = round(Math.max(0, goal.target - saved));
  const fraction = goal.target > 0 ? Math.min(1, saved / goal.target) : 1;

  // Growth of the linked account over the last few months, as a monthly
  // average. Same day of the month, PACE_MONTHS ago.
  let monthlyPace: number | null = null;
  if (account) {
    const then = new Date(today);
    then.setMonth(today.getMonth() - PACE_MONTHS);
    monthlyPace = round(
      (account.balance - balanceAsOf(account, toLocalDateString(then))) /
        PACE_MONTHS
    );
  }

  const monthsLeft = goal.by
    ? Math.max(0, monthsBetween(thisMonth, goal.by))
    : null;
  const monthlyNeeded =
    monthsLeft && monthsLeft > 0 ? round(remaining / monthsLeft) : null;
  const monthsAtPace =
    monthlyPace && monthlyPace > 0 && remaining > 0
      ? Math.ceil(remaining / monthlyPace)
      : null;

  let status: GoalStatus;
  if (remaining === 0) status = 'reached';
  else if (monthsLeft === 0) status = 'overdue';
  else if (monthlyNeeded === null || monthlyPace === null) status = 'open';
  else status = monthlyPace >= monthlyNeeded ? 'on-track' : 'behind';

  return {
    goal,
    saved,
    remaining,
    fraction,
    monthsLeft,
    monthlyNeeded,
    monthlyPace,
    monthsAtPace,
    status,
  };
};

// The month `months` from this one, for "at this pace, by …".
export const monthFromNow = (months: number, today: Date = new Date()) =>
  shiftMonth(toLocalDateString(today).slice(0, 7), months);

let sequence = 0;

export const createGoal = (
  details: Omit<Goal, 'id' | 'createdAt'>,
  now: Date = new Date()
): Goal => {
  sequence += 1;
  return {
    ...cleanGoal(details),
    id: `goal_${now.getTime().toString(36)}_${sequence}`,
    createdAt: now.toISOString(),
  };
};

const cleanGoal = (details: Omit<Goal, 'id' | 'createdAt'>) => ({
  name: details.name.trim(),
  target: round(details.target),
  ...(details.by ? { by: details.by } : {}),
  ...(details.accountId
    ? { accountId: details.accountId }
    : { saved: round(Math.max(0, details.saved ?? 0)) }),
});

export const updateGoal = (
  goal: Goal,
  details: Omit<Goal, 'id' | 'createdAt'>
): Goal => ({ id: goal.id, createdAt: goal.createdAt, ...cleanGoal(details) });

// Keeps well-formed goals. Used for saved goals and backups, which may be
// hand-edited.
export const cleanGoals = (value: unknown): Goal[] =>
  Array.isArray(value)
    ? value.flatMap((raw): Goal[] => {
        if (
          typeof raw !== 'object' ||
          raw === null ||
          typeof raw.id !== 'string' ||
          typeof raw.name !== 'string' ||
          !raw.name.trim() ||
          typeof raw.target !== 'number' ||
          !Number.isFinite(raw.target) ||
          raw.target <= 0
        ) {
          return [];
        }
        return [
          {
            id: raw.id,
            name: raw.name.trim(),
            target: round(raw.target),
            ...(typeof raw.by === 'string' && /^\d{4}-\d{2}$/.test(raw.by)
              ? { by: raw.by }
              : {}),
            ...(typeof raw.accountId === 'string'
              ? { accountId: raw.accountId }
              : {
                  saved:
                    typeof raw.saved === 'number' && Number.isFinite(raw.saved)
                      ? round(Math.max(0, raw.saved))
                      : 0,
                }),
            createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
          },
        ];
      })
    : [];
