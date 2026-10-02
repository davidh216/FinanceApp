// src/utils/dashboardSummary.ts
// The dashboard's period figures (the KPI cards and the report's period)
// and the KPI sparklines, for the accounts you're viewing.
import {
  Account,
  CustomDateRange,
  FinancialSummary,
  TimePeriod,
  Transaction,
} from '../types/financial';
import { incomeOf, isCashflow, spendingOf } from './cashflow';
import { totalBalanceAsOf } from './balances';
import { parseLocalDate, toLocalDateString } from './date';

const round = (value: number) => Math.round(value * 100) / 100;

// Each transaction's date as a local-midnight timestamp, parsed once: the
// loops below compare every transaction against many dates.
const timesOf = (transactions: Transaction[]) =>
  new Map(transactions.map((txn) => [txn, parseLocalDate(txn.date).getTime()]));

const between = (
  transactions: Transaction[],
  times: Map<Transaction, number>,
  start: Date,
  end: Date
) =>
  transactions.filter((txn) => {
    const time = times.get(txn)!;
    return time >= start.getTime() && time <= end.getTime();
  });

// Where the selected period starts, and how it's described.
const periodStart = (
  period: TimePeriod,
  customRange: CustomDateRange | undefined,
  today: Date
): { start: Date; label: string } => {
  const year = today.getFullYear();
  const month = today.getMonth();
  switch (period) {
    case 'day':
      return { start: new Date(year, month, today.getDate()), label: 'daily' };
    case 'week': {
      const dayOfWeek = today.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      return {
        start: new Date(year, month, today.getDate() - daysToSubtract),
        label: 'weekly',
      };
    }
    case 'quarter':
      return {
        start: new Date(year, Math.floor(month / 3) * 3, 1),
        label: 'quarterly',
      };
    case 'year':
      return { start: new Date(year, 0, 1), label: 'yearly' };
    case '5year':
      return { start: new Date(year - 5, 0, 1), label: '5-year' };
    case 'custom':
      if (customRange) {
        return {
          start: parseLocalDate(customRange.startDate),
          label: 'custom',
        };
      }
      return { start: new Date(year, month, 1), label: 'monthly' };
    case 'month':
    default:
      return { start: new Date(year, month, 1), label: 'monthly' };
  }
};

// Where the period before it starts; it ends the day before `start`.
const previousStart = (
  period: TimePeriod,
  customRange: CustomDateRange | undefined,
  start: Date,
  today: Date
): Date => {
  const year = today.getFullYear();
  const month = today.getMonth();
  switch (period) {
    case 'day':
      return new Date(year, month, today.getDate() - 1);
    case 'week':
      // The whole week before, Monday to Sunday.
      return new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() - 7
      );
    case 'quarter': {
      const prevQuarter = Math.floor(month / 3) - 1;
      return prevQuarter >= 0
        ? new Date(year, prevQuarter * 3, 1)
        : new Date(year - 1, 9, 1);
    }
    case 'year':
      return new Date(year - 1, 0, 1);
    case '5year':
      return new Date(year - 10, 0, 1);
    case 'custom':
      // The same number of days, straight before the range starts.
      if (customRange) {
        const days =
          Math.round(
            (parseLocalDate(customRange.endDate).getTime() - start.getTime()) /
              86400000
          ) + 1;
        return new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() - days
        );
      }
      return new Date(year, month - 1, 1);
    case 'month':
    default:
      return new Date(year, month - 1, 1);
  }
};

export type DashboardSummary = FinancialSummary & {
  previousPeriodBalance: number;
  previousPeriodEndDate: string;
  periodStartDate: string;
  periodEndDate: string;
  previousPeriodStartDate: string;
};

// Income, spending and savings rate for the selected period and the one
// before it, and the balance at the end of that earlier period.
export const periodSummary = (
  accounts: Account[],
  period: TimePeriod,
  customRange: CustomDateRange | undefined,
  now: Date = new Date()
): DashboardSummary => {
  const transactions = accounts.flatMap((acc) => acc.transactions || []);
  const times = timesOf(transactions);
  const { start, label } = periodStart(period, customRange, now);
  // A custom range ends on its own last day; every other period runs to
  // now.
  const end =
    period === 'custom' && customRange
      ? parseLocalDate(customRange.endDate)
      : now;

  const current = between(transactions, times, start, end);
  const income = incomeOf(current);
  const expenses = spendingOf(current);
  const savingsRate = income > 0 ? (income - expenses) / income : 0;

  const prevStart = previousStart(period, customRange, start, now);
  const prevEnd = new Date(start.getTime() - 1);
  const previous = between(transactions, times, prevStart, prevEnd);
  const previousPeriodEndDate = toLocalDateString(prevEnd);

  const totalBalance = round(
    accounts.reduce((sum, account) => sum + account.balance, 0)
  );
  return {
    totalBalance,
    monthlyIncome: round(income),
    monthlyExpenses: round(expenses),
    netWorth: totalBalance,
    debtToIncomeRatio: income > 0 ? expenses / income : 0,
    savingsRate: Math.max(0, savingsRate),
    previousPeriodIncome: incomeOf(previous),
    previousPeriodExpenses: spendingOf(previous),
    previousPeriodBalance: totalBalanceAsOf(accounts, previousPeriodEndDate),
    previousPeriodEndDate,
    periodStartDate: toLocalDateString(start),
    periodEndDate: toLocalDateString(end),
    previousPeriodStartDate: toLocalDateString(prevStart),
    periodLabel: label,
  };
};

export interface TrendData {
  balance: number[];
  income: number[];
  expenses: number[];
  savings: number[];
}

// How many sparkline points each period shows, and how far apart they are.
const TREND_STEPS: Record<TimePeriod, { points: number; days: number }> = {
  day: { points: 24, days: 1 / 24 },
  week: { points: 7, days: 1 },
  month: { points: 30, days: 1 },
  quarter: { points: 13, days: 7 },
  year: { points: 12, days: 30 },
  '5year': { points: 60, days: 30 },
  custom: { points: 30, days: 1 },
};

// The KPI sparklines, oldest point first.
export const trendData = (
  accounts: Account[],
  period: TimePeriod,
  now: Date = new Date()
): TrendData => {
  const transactions = accounts.flatMap((acc) => acc.transactions || []);
  const times = timesOf(transactions);
  const { points, days } = TREND_STEPS[period] ?? TREND_STEPS.month;

  const result: TrendData = {
    balance: [],
    income: [],
    expenses: [],
    savings: [],
  };
  for (let i = points - 1; i >= 0; i--) {
    const target = new Date(now);
    target.setDate(now.getDate() - i * days);
    const start = new Date(target);
    start.setDate(target.getDate() - days);

    // Today's balance with the transactions after this date undone, kept
    // non-negative for display.
    result.balance.push(
      Math.max(0, totalBalanceAsOf(accounts, toLocalDateString(target)))
    );

    const window = between(transactions, times, start, target);
    result.income.push(
      window
        .filter((txn) => isCashflow(txn) && txn.amount > 0)
        .reduce((sum, txn) => sum + txn.amount, 0)
    );
    result.expenses.push(
      Math.abs(
        window
          .filter((txn) => isCashflow(txn) && txn.amount < 0)
          .reduce((sum, txn) => sum + txn.amount, 0)
      )
    );
    const income = incomeOf(window);
    const spending = spendingOf(window);
    const rate = income > 0 ? (income - spending) / income : 0;
    result.savings.push(Math.max(0, rate * 100));
  }
  return result;
};
