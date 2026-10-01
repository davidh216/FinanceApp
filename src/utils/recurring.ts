// src/utils/recurring.ts
import { Transaction } from '../types/financial';
import { isAdjustment, isCashflow, isTransfer } from './cashflow';
import { merchantKey } from './categoryRules';
import { parseLocalDate, toLocalDateString } from './date';

export type Cadence =
  | 'weekly'
  | 'every 2 weeks'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

// Typical gap in days for each cadence, and how far a single gap may stray
// from it (banks post a few days early or late, months differ in length).
const CADENCES: { cadence: Cadence; days: number; slack: number }[] = [
  { cadence: 'weekly', days: 7, slack: 1 },
  { cadence: 'every 2 weeks', days: 14, slack: 2 },
  { cadence: 'monthly', days: 30.44, slack: 4 },
  { cadence: 'quarterly', days: 91.31, slack: 8 },
  { cadence: 'yearly', days: 365.25, slack: 12 },
];

// A payment counts as the same price if it's within this share of the
// usual amount; bills that vary more (like groceries) aren't recurring.
const AMOUNT_TOLERANCE = 0.2;

// Needs this many payments to call it a pattern.
const MIN_PAYMENTS = 3;

export interface RecurringPayment {
  merchant: string;
  // The account the latest payment was in.
  accountId: string;
  merchantKey: string;
  category: string;
  cadence: Cadence;
  // The latest payment, as a positive amount.
  amount: number;
  // What it costs in an average month.
  monthlyCost: number;
  lastDate: string;
  nextDate: string;
  payments: number;
  // Set when the latest payment differs from the one before.
  priceChange?: { from: number; to: number };
}

const DAY = 86400000;
const dayNumber = (date: string) =>
  Math.round(parseLocalDate(date).getTime() / DAY);
const round = (value: number) => Math.round(value * 100) / 100;

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const addCadence = (date: string, cadence: Cadence): string => {
  const d = parseLocalDate(date);
  const next =
    cadence === 'weekly'
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
      : cadence === 'every 2 weeks'
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 14)
      : cadence === 'monthly'
      ? new Date(d.getFullYear(), d.getMonth() + 1, d.getDate())
      : cadence === 'quarterly'
      ? new Date(d.getFullYear(), d.getMonth() + 3, d.getDate())
      : new Date(d.getFullYear() + 1, d.getMonth(), d.getDate());
  // "31 Jan + 1 month" overflows into March; use the month's last day.
  const intendedMonth =
    cadence === 'monthly' || cadence === 'quarterly'
      ? (d.getMonth() + (cadence === 'monthly' ? 1 : 3)) % 12
      : next.getMonth();
  return toLocalDateString(
    next.getMonth() === intendedMonth
      ? next
      : new Date(next.getFullYear(), next.getMonth(), 0)
  );
};

// Finds payments made to the same merchant on a regular schedule for about
// the same amount, and still going as of `today` ("YYYY-MM-DD"). Money out
// by default, or money in (a paycheck) with `direction` 'in'; transfers
// between your own accounts don't count, unless `kind` is 'transfers' (a
// monthly loan payment, say), which looks only at those. Amounts are
// positive either way. Largest first.
export const findRecurringPayments = (
  transactions: Transaction[],
  today: string,
  direction: 'out' | 'in' = 'out',
  kind: 'cashflow' | 'transfers' = 'cashflow'
): RecurringPayment[] => {
  const sign = direction === 'out' ? -1 : 1;
  const counts = (txn: Transaction) =>
    kind === 'cashflow'
      ? isCashflow(txn)
      : isTransfer(txn) && !isAdjustment(txn);
  const groups = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    if (txn.amount * sign <= 0 || !counts(txn) || txn.pending) continue;
    const key = merchantKey(txn.cleanMerchant);
    groups.set(key, [...(groups.get(key) || []), txn]);
  }

  const found: RecurringPayment[] = [];
  groups.forEach((group, key) => {
    if (group.length < MIN_PAYMENTS) return;
    const sorted = [...group].sort((a, b) => a.date.localeCompare(b.date));
    const gaps = sorted
      .slice(1)
      .map((txn, i) => dayNumber(txn.date) - dayNumber(sorted[i].date));
    const typicalGap = median(gaps);
    const match = CADENCES.find(
      ({ days, slack }) => Math.abs(typicalGap - days) <= slack
    );
    if (!match) return;
    // Every gap fits the schedule, allowing one missed or doubled period.
    const offSchedule = gaps.filter(
      (gap) => Math.abs(gap - match.days) > match.slack
    ).length;
    if (offSchedule > 1) return;

    const amounts = sorted.map((txn) => txn.amount * sign);
    const usual = median(amounts);
    const offPrice = amounts.filter(
      (amount) => Math.abs(amount - usual) > usual * AMOUNT_TOLERANCE
    ).length;
    if (offPrice > 1) return;

    const last = sorted[sorted.length - 1];
    // Stopped if it has missed about two payments.
    if (
      dayNumber(today) - dayNumber(last.date) >
      match.days * 2 + match.slack
    ) {
      return;
    }

    const amount = round(last.amount * sign);
    const previous = round(sorted[sorted.length - 2].amount * sign);
    found.push({
      merchant: last.cleanMerchant.cleanName,
      accountId: last.accountId,
      merchantKey: key,
      category: last.category,
      cadence: match.cadence,
      amount,
      monthlyCost: round((amount * 30.44) / match.days),
      lastDate: last.date,
      nextDate: addCadence(last.date, match.cadence),
      payments: sorted.length,
      ...(amount !== previous
        ? { priceChange: { from: previous, to: amount } }
        : {}),
    });
  });

  return found.sort(
    (a, b) =>
      b.monthlyCost - a.monthlyCost || a.merchant.localeCompare(b.merchant)
  );
};
