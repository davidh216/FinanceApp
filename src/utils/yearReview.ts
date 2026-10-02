// src/utils/yearReview.ts
// A year at a glance: what came in, what went out, what was saved, where it
// went, and how net worth moved.
import { Account, Transaction } from '../types/financial';
import { incomeOf, isCashflow, spendingOf } from './cashflow';
import { MonthFlow, monthlyCashflow } from './cashflowHistory';
import { merchantKey } from './categoryRules';
import { CategorySpending, DateRange, spendingReport } from './spendingReport';
import { totalBalanceAsOf } from './balances';

export interface MerchantSpending {
  merchant: string;
  amount: number;
  count: number;
}

export interface Purchase {
  date: string;
  merchant: string;
  category: string;
  amount: number;
}

export interface YearReview {
  year: number;
  // The year so far for the current year, else the whole year.
  range: DateRange;
  // The same days a year earlier, so a year in progress compares fairly.
  previousRange: DateRange;
  // The year isn't over yet.
  partial: boolean;
  income: number;
  spending: number;
  // income - spending
  saved: number;
  // saved / income, 0 when there was no income; can be negative.
  savingsRate: number;
  // Null when your transactions start partway through those days, so a
  // comparison would mislead.
  previousIncome: number | null;
  previousSpending: number | null;
  // Your first transaction, when it's after the year started: the figures
  // only cover the year from then.
  dataStart: string | null;
  // Total balance the day before the year started, and at its end (or
  // today).
  netWorthStart: number;
  netWorthEnd: number;
  // Every month of the year up to the last one covered, oldest first.
  months: MonthFlow[];
  // The month you spent most in, and the one you saved most in.
  biggestMonth: MonthFlow | null;
  bestMonth: MonthFlow | null;
  categories: CategorySpending[];
  merchants: MerchantSpending[];
  biggestPurchase: Purchase | null;
  transactionCount: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

const inRange = (txn: Transaction, range: DateRange) =>
  txn.date >= range.start && txn.date <= range.end;

// The same calendar day a year earlier; 29 February becomes the 28th.
const yearEarlier = (date: string) => {
  const year = Number(date.slice(0, 4)) - 1;
  const rest = date.slice(4) === '-02-29' ? '-02-28' : date.slice(4);
  return `${year}${rest}`;
};

// Years with any income or spending, newest first, always including this
// one.
export const reviewYears = (
  transactions: Transaction[],
  today: string
): number[] => {
  const years = new Set<number>([Number(today.slice(0, 4))]);
  for (const txn of transactions) {
    if (isCashflow(txn) && txn.date <= today) {
      years.add(Number(txn.date.slice(0, 4)));
    }
  }
  return Array.from(years).sort((a, b) => b - a);
};

// The biggest spending by merchant, as positive amounts.
const topMerchants = (
  transactions: Transaction[],
  limit: number
): MerchantSpending[] => {
  const totals = new Map<string, MerchantSpending>();
  for (const txn of transactions) {
    if (!isCashflow(txn) || txn.amount >= 0) continue;
    const key = merchantKey(txn.cleanMerchant) || txn.description;
    const entry = totals.get(key) ?? {
      merchant: txn.cleanMerchant.cleanName || txn.description,
      amount: 0,
      count: 0,
    };
    entry.amount -= txn.amount;
    entry.count += 1;
    totals.set(key, entry);
  }
  return Array.from(totals.values())
    .map((entry) => ({ ...entry, amount: round(entry.amount) }))
    .sort((a, b) => b.amount - a.amount || a.merchant.localeCompare(b.merchant))
    .slice(0, limit);
};

export const yearReview = (
  accounts: Account[],
  year: number,
  today: string,
  limit = 5
): YearReview => {
  const transactions = accounts.flatMap((acc) => acc.transactions || []);
  const yearEnd = `${year}-12-31`;
  const partial = today < yearEnd;
  const range = { start: `${year}-01-01`, end: partial ? today : yearEnd };
  const previousRange = {
    start: `${year - 1}-01-01`,
    end: yearEarlier(range.end),
  };

  const firstDate = transactions.reduce<string | null>(
    (first, txn) => (!first || txn.date < first ? txn.date : first),
    null
  );
  // Data from some time in the earlier January is close enough.
  const comparable =
    firstDate !== null && firstDate.slice(0, 7) <= `${year - 1}-01`;

  const current = transactions.filter((txn) => inRange(txn, range));
  const previous = transactions.filter((txn) => inRange(txn, previousRange));
  const income = round(incomeOf(current));
  const spending = round(spendingOf(current));
  const saved = round(income - spending);

  const lastMonth = range.end.slice(0, 7);
  const months = monthlyCashflow(
    current,
    lastMonth,
    Number(lastMonth.slice(5))
  );
  const withSpending = months.filter((m) => m.spending > 0);
  const withMoney = months.filter((m) => m.income > 0 || m.spending > 0);
  const biggestMonth = withSpending.reduce<MonthFlow | null>(
    (best, m) => (!best || m.spending > best.spending ? m : best),
    null
  );
  const bestMonth = withMoney.reduce<MonthFlow | null>(
    (best, m) => (!best || m.net > best.net ? m : best),
    null
  );

  const biggest = current
    .filter((txn) => isCashflow(txn) && txn.amount < 0)
    .reduce<Transaction | null>(
      (best, txn) => (!best || txn.amount < best.amount ? txn : best),
      null
    );

  return {
    year,
    range,
    previousRange,
    partial,
    income,
    spending,
    saved,
    savingsRate: income > 0 ? saved / income : 0,
    previousIncome: comparable ? round(incomeOf(previous)) : null,
    previousSpending: comparable ? round(spendingOf(previous)) : null,
    dataStart: firstDate && firstDate > range.start ? firstDate : null,
    netWorthStart: totalBalanceAsOf(accounts, `${year - 1}-12-31`),
    netWorthEnd: totalBalanceAsOf(accounts, range.end),
    months,
    biggestMonth,
    bestMonth,
    categories: spendingReport(transactions, range, previousRange)
      .categories.filter((c) => c.amount > 0)
      .slice(0, limit),
    merchants: topMerchants(current, limit),
    biggestPurchase: biggest
      ? {
          date: biggest.date,
          merchant: biggest.cleanMerchant.cleanName || biggest.description,
          category: biggest.category,
          amount: round(-biggest.amount),
        }
      : null,
    transactionCount: current.filter(isCashflow).length,
  };
};
