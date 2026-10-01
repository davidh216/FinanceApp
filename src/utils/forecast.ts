// src/utils/forecast.ts
// What's coming up: recurring bills and income projected over the next few
// weeks, and where that leaves each account's balance.
import { Account } from '../types/financial';
import { RecurringPayment, addCadence } from './recurring';
import { parseLocalDate, toLocalDateString } from './date';
import { isLiabilityType } from './accountSettings';

export const FORECAST_DAYS = 30;

export interface UpcomingEvent {
  date: string;
  merchant: string;
  accountId: string;
  // The effect on the account: negative for a bill.
  amount: number;
  kind: 'bill' | 'income';
  // Its expected date has passed without it appearing yet.
  late: boolean;
}

export interface AccountForecast {
  accountId: string;
  name: string;
  now: number;
  // After everything coming up.
  end: number;
  lowest: number;
  lowestDate: string;
  // An account you own that would go below zero.
  goesNegative: boolean;
}

const round = (value: number) => Math.round(value * 100) / 100;

const addDays = (date: string, days: number) => {
  const d = parseLocalDate(date);
  return toLocalDateString(
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
  );
};

// Every expected bill and paycheck from today to `days` ahead, soonest
// first. One whose date has just passed is expected today: banks post late.
export const upcomingEvents = (
  bills: RecurringPayment[],
  income: RecurringPayment[],
  today: string,
  days: number = FORECAST_DAYS
): UpcomingEvent[] => {
  const horizon = addDays(today, days);
  const events: UpcomingEvent[] = [];
  const project = (payment: RecurringPayment, kind: UpcomingEvent['kind']) => {
    let date = payment.nextDate;
    let late = false;
    if (date < today) {
      date = today;
      late = true;
    }
    let next = payment.nextDate;
    while (date <= horizon) {
      events.push({
        date,
        merchant: payment.merchant,
        accountId: payment.accountId,
        amount: kind === 'bill' ? -payment.amount : payment.amount,
        kind,
        late,
      });
      // The schedule carries on from the expected date, not from today.
      do {
        next = addCadence(next, payment.cadence);
      } while (next <= date);
      date = next;
      late = false;
    }
  };
  bills.forEach((bill) => project(bill, 'bill'));
  income.forEach((pay) => project(pay, 'income'));
  return events.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      // Money in first on the same day, as banks usually post it.
      b.amount - a.amount ||
      a.merchant.localeCompare(b.merchant)
  );
};

// Each account with something coming up: its balance now, after it all,
// and at its lowest along the way.
export const forecastBalances = (
  accounts: Account[],
  events: UpcomingEvent[],
  today: string
): AccountForecast[] =>
  accounts.flatMap((account): AccountForecast[] => {
    const own = events.filter((event) => event.accountId === account.id);
    if (own.length === 0) return [];
    let balance = account.balance;
    let lowest = balance;
    let lowestDate = today;
    for (const event of own) {
      balance = round(balance + event.amount);
      if (balance < lowest) {
        lowest = balance;
        lowestDate = event.date;
      }
    }
    return [
      {
        accountId: account.id,
        name: account.name,
        now: round(account.balance),
        end: balance,
        lowest: round(lowest),
        lowestDate,
        // A card or loan is meant to be below zero.
        goesNegative: !isLiabilityType(account.type) && lowest < 0,
      },
    ];
  });
