import { Account } from '../../types/financial';
import {
  applyAccountSettings,
  balanceForType,
  isClosed,
} from '../accountSettings';
import { netWorthHistory } from '../netWorthHistory';

const account = (overrides: Partial<Account> = {}): Account => ({
  id: 'acc_import_1',
  name: 'Visa',
  type: 'CHECKING',
  balance: 500,
  accountNumber: '',
  bankName: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  transactions: [],
  ...overrides,
});

const NOW = new Date('2025-06-15T12:00:00Z');

describe('applyAccountSettings', () => {
  it('renames, keeping the old name when left blank', () => {
    const settings = { type: 'CHECKING' as const, closed: false };
    expect(
      applyAccountSettings(account(), { ...settings, name: ' Everyday ' }, NOW)
        .name
    ).toBe('Everyday');
    expect(
      applyAccountSettings(account(), { ...settings, name: '  ' }, NOW).name
    ).toBe('Visa');
  });

  it('makes a card imported as checking a debt', () => {
    const fixed = applyAccountSettings(
      account(),
      { name: 'Visa', type: 'CREDIT', closed: false },
      NOW
    );
    expect(fixed).toMatchObject({ type: 'CREDIT', balance: -500 });
    expect(fixed.updatedAt).toBe(NOW.toISOString());
  });

  it('only flips the sign when moving between a debt and anything else', () => {
    expect(balanceForType(account(), 'SAVINGS')).toBe(500);
    expect(balanceForType(account({ balance: -20 }), 'SAVINGS')).toBe(-20);
    expect(
      balanceForType(account({ type: 'CREDIT', balance: -500 }), 'LOAN')
    ).toBe(-500);
    expect(
      balanceForType(account({ type: 'LOAN', balance: -500 }), 'INVESTMENT')
    ).toBe(500);
  });

  it('marks an account closed and open again', () => {
    const closed = applyAccountSettings(
      account(),
      { name: 'Visa', type: 'CHECKING', closed: true },
      NOW
    );
    expect(isClosed(closed)).toBe(true);
    expect(
      isClosed(
        applyAccountSettings(
          closed,
          { name: 'Visa', type: 'CHECKING', closed: false },
          NOW
        )
      )
    ).toBe(false);
  });
});

describe('closed accounts in net worth', () => {
  it('are left out of the breakdown only while empty', () => {
    const old = account({
      id: 'acc_import_old',
      name: 'Old savings',
      balance: 0,
      isActive: false,
      // Emptied on 10 June.
      transactions: [
        {
          id: 't',
          accountId: 'acc_import_old',
          description: 'Closing withdrawal',
          amount: -300,
          date: '2025-06-10',
          category: 'Other',
          tags: [],
          pending: false,
          cleanMerchant: {
            cleanName: '',
            logo: '',
            suggestedCategory: '',
            original: '',
          },
          createdAt: '',
          updatedAt: '',
        },
      ],
    });
    const [may, june] = netWorthHistory([account(), old], '2025-06-15', 2);
    expect(may.accounts.map((a) => a.name)).toEqual(['Visa', 'Old savings']);
    expect(june.accounts.map((a) => a.name)).toEqual(['Visa']);
    // Its history still counts.
    expect(may.net).toBe(800);
  });
});
