// src/utils/netWorthHistory.ts
import { Account } from '../types/financial';
import { balanceAsOf } from './balances';
import { monthBounds, shiftMonth } from './cashflowHistory';

export interface AccountBalance {
  id: string;
  name: string;
  balance: number;
}

export interface MonthWorth {
  // "YYYY-MM"
  month: string;
  // The day the balances are taken: the month's last day, or `today` for
  // the current month.
  date: string;
  // What you own: accounts with money in them.
  assets: number;
  // What you owe, as a positive number: overdrawn accounts, card balances
  // and loans (which are stored as negative balances).
  debts: number;
  // assets - debts
  net: number;
  // Every account's balance that day, largest first.
  accounts: AccountBalance[];
}

const round = (value: number) => Math.round(value * 100) / 100;

// Net worth at the end of each of the `count` months ending with `today`'s,
// oldest first. Balances are worked back from today's by undoing later
// transactions, so an account counts at its opening balance before its
// first transaction.
export const netWorthHistory = (
  accounts: Account[],
  today: string,
  count = 12
): MonthWorth[] => {
  const lastMonth = today.slice(0, 7);
  return Array.from({ length: count }, (_, i) => {
    const month = shiftMonth(lastMonth, i - count + 1);
    const { end } = monthBounds(month);
    const date = end < today ? end : today;
    const balances = accounts
      .map((account) => ({
        id: account.id,
        name: account.name,
        balance: balanceAsOf(account, date),
        closed: account.isActive === false,
      }))
      // A closed account with nothing in it that day isn't worth listing.
      .filter((a) => !(a.closed && a.balance === 0))
      .map(({ closed, ...rest }) => rest)
      .sort((a, b) => b.balance - a.balance);
    const assets = round(
      balances.reduce((sum, a) => sum + Math.max(0, a.balance), 0)
    );
    const debts = round(
      balances.reduce((sum, a) => sum + Math.max(0, -a.balance), 0)
    );
    return {
      month,
      date,
      assets,
      debts,
      net: round(assets - debts),
      accounts: balances,
    };
  });
};
