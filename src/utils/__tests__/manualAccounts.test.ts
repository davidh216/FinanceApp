import { Account, Transaction } from '../../types/financial';
import {
  MANUAL_ACCOUNT_KINDS,
  createManualAccount,
  updateBalance,
} from '../manualAccounts';
import { incomeOf, spendingOf } from '../cashflow';
import { balanceAsOf } from '../balances';
import { isImportedAccount } from '../csvImport';
import { findTransferMatches } from '../transfers';
import { spendingByCategory } from '../budgets';

const NOW = new Date('2025-06-15T12:00:00Z');
const kind = (key: string) => MANUAL_ACCOUNT_KINDS.find((k) => k.key === key)!;

const txn = (date: string, amount: number): Transaction => ({
  id: `t_${date}_${amount}`,
  accountId: 'acc_import_chk',
  description: 'X',
  amount,
  date,
  category: 'Shopping',
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: 'X',
    logo: '',
    suggestedCategory: '',
    original: '',
  },
  createdAt: '',
  updatedAt: '',
});

const checking = (): Account => ({
  id: 'acc_import_chk',
  name: 'Checking',
  type: 'CHECKING',
  balance: 1000,
  accountNumber: '',
  bankName: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  // 1,100 at the end of 1 June; 1,000 after a 100 purchase on the 10th.
  transactions: [txn('2025-06-10', -100)],
});

describe('createManualAccount', () => {
  it('makes an asset with a positive balance, kept like an import', () => {
    const home = createManualAccount(
      { name: ' Home ', kind: kind('property'), amount: 425000 },
      NOW
    );
    expect(home).toMatchObject({
      name: 'Home',
      type: 'INVESTMENT',
      balance: 425000,
      bankName: '🏠 Property',
      accountNumber: 'Entered by hand',
      manual: true,
      transactions: [],
    });
    // Saved, backed up and removable like an imported account.
    expect(isImportedAccount(home)).toBe(true);
  });

  it('stores what you owe as a negative balance', () => {
    const loan = createManualAccount(
      { name: 'Car loan', kind: kind('loan'), amount: 12500.5 },
      NOW
    );
    expect(loan).toMatchObject({ type: 'LOAN', balance: -12500.5 });
  });

  it('gives each account its own id', () => {
    const details = { name: 'Cash', kind: kind('cash'), amount: 1 };
    expect(createManualAccount(details, NOW).id).not.toBe(
      createManualAccount(details, NOW).id
    );
  });
});

describe('updateBalance', () => {
  it('records the change today and moves the balance', () => {
    const updated = updateBalance(checking(), 1250, '2025-06-15', NOW);
    expect(updated.balance).toBe(1250);
    const adjustment = updated.transactions![0];
    expect(adjustment).toMatchObject({
      date: '2025-06-15',
      amount: 250,
      adjustment: true,
      manual: true,
      description: 'Balance update',
    });
    // History before the update is unchanged.
    expect(balanceAsOf(updated, '2025-06-14')).toBe(1000);
  });

  it('sets the balance on an earlier day, keeping later transactions', () => {
    // The balance at the end of 5 June was 1,100; it was really 1,500.
    const updated = updateBalance(checking(), 1500, '2025-06-05', NOW);
    expect(balanceAsOf(updated, '2025-06-05')).toBe(1500);
    expect(balanceAsOf(updated, '2025-06-04')).toBe(1100);
    // The 100 purchase on the 10th still happened after it.
    expect(updated.balance).toBe(1400);
  });

  it('changes nothing when the balance is already right', () => {
    const account = checking();
    expect(updateBalance(account, 1000, '2025-06-15', NOW)).toBe(account);
  });

  it("isn't income, spending, budget spending or a transfer", () => {
    const up = updateBalance(checking(), 5000, '2025-06-15', NOW);
    const down = updateBalance(up, 10, '2025-06-15', NOW);
    const adjustments = down.transactions!.filter((t) => t.adjustment);
    expect(adjustments.map((t) => t.amount)).toEqual([4000, -4990]);
    expect(incomeOf(adjustments)).toBe(0);
    expect(spendingOf(adjustments)).toBe(0);
    expect(spendingByCategory(adjustments, '2025-06')).toEqual({});
    // An equal and opposite transfer in another account on the same day
    // would be matched with it if it weren't an adjustment.
    const savings: Account = {
      ...checking(),
      id: 'acc_import_sav',
      transactions: [
        {
          ...txn('2025-06-15', -4000),
          accountId: 'acc_import_sav',
          description: 'TRANSFER TO CHECKING',
        },
      ],
    };
    expect(findTransferMatches(adjustments, down.id, [savings])).toEqual([]);
  });
});
