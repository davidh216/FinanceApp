import { Account } from '../../types/financial';
import { moveAccount, orderAccounts } from '../accountOrder';

const account = (id: string) => ({ id } as Account);
const [a, b, c, d] = ['a', 'b', 'c', 'd'].map(account);
const ids = (accounts: Account[]) => accounts.map((acc) => acc.id);

describe('orderAccounts', () => {
  it('puts your order first, and new accounts after in their usual order', () => {
    expect(ids(orderAccounts([a, b, c, d], ['c', 'a']))).toEqual([
      'c',
      'a',
      'b',
      'd',
    ]);
    expect(ids(orderAccounts([a, b], []))).toEqual(['a', 'b']);
    // Ids of accounts that are gone don't matter.
    expect(ids(orderAccounts([a, b], ['gone', 'b']))).toEqual(['b', 'a']);
  });
});

describe('moveAccount', () => {
  it('swaps an account with its neighbour in its group', () => {
    // a and c are listed together (b and d are elsewhere).
    expect(moveAccount([a, b, c, d], [], [a, c], 'c', -1)).toEqual([
      'c',
      'b',
      'a',
      'd',
    ]);
    expect(moveAccount([a, b, c, d], ['d', 'c'], [d, a], 'd', 1)).toEqual([
      'a',
      'c',
      'd',
      'b',
    ]);
  });

  it('leaves the order alone at either end', () => {
    expect(moveAccount([a, b], [], [a, b], 'a', -1)).toEqual(['a', 'b']);
    expect(moveAccount([a, b], [], [a, b], 'b', 1)).toEqual(['a', 'b']);
  });
});
