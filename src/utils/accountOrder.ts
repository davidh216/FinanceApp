// src/utils/accountOrder.ts
// The order you put your accounts in, as a list of account ids.
import { Account } from '../types/financial';

// Accounts in your order; ones you haven't placed (new imports) keep their
// usual order after them.
export const orderAccounts = (
  accounts: Account[],
  order: string[]
): Account[] => {
  const position = new Map(order.map((id, i) => [id, i]));
  return accounts
    .map((account, i) => ({ account, i }))
    .sort(
      (a, b) =>
        (position.get(a.account.id) ?? order.length + a.i) -
        (position.get(b.account.id) ?? order.length + b.i)
    )
    .map(({ account }) => account);
};

// The new order after moving `id` past its neighbour in `group` (the
// accounts listed together with it, in their current order). Every account
// keeps its place apart from the two that swap.
export const moveAccount = (
  accounts: Account[],
  order: string[],
  group: Account[],
  id: string,
  direction: -1 | 1
): string[] => {
  const index = group.findIndex((account) => account.id === id);
  const neighbour = group[index + direction];
  const ids = orderAccounts(accounts, order).map((account) => account.id);
  if (index === -1 || !neighbour) return ids;
  const a = ids.indexOf(id);
  const b = ids.indexOf(neighbour.id);
  [ids[a], ids[b]] = [ids[b], ids[a]];
  return ids;
};
