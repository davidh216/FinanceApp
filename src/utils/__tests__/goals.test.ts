import { Account, Transaction } from '../../types/financial';
import {
  Goal,
  cleanGoals,
  createGoal,
  goalProgress,
  monthFromNow,
  updateGoal,
} from '../goals';
import { createBackup, parseBackup } from '../backup';

const TODAY = new Date(2025, 5, 15, 12);

const deposit = (date: string, amount: number): Transaction => ({
  id: `${date}_${amount}`,
  accountId: 'acc_import_sav',
  description: 'TRANSFER FROM CHECKING',
  amount,
  date,
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
});

// 6,000 today, after three 500 deposits since mid-March: 500 a month.
const savings: Account = {
  id: 'acc_import_sav',
  name: 'Savings',
  type: 'SAVINGS',
  balance: 6000,
  accountNumber: '',
  bankName: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  transactions: [
    deposit('2025-06-01', 500),
    deposit('2025-05-01', 500),
    deposit('2025-04-01', 500),
  ],
};

const goal = (overrides: Partial<Goal>): Goal => ({
  id: 'g',
  name: 'Emergency fund',
  target: 10000,
  createdAt: '',
  ...overrides,
});

describe('goalProgress', () => {
  it('is behind when the pace is short of what each month needs', () => {
    const p = goalProgress(
      goal({ accountId: savings.id, by: '2025-12' }),
      [savings],
      TODAY
    );
    expect(p).toMatchObject({
      saved: 6000,
      remaining: 4000,
      fraction: 0.6,
      // June to December.
      monthsLeft: 7,
      monthlyNeeded: 571.43,
      monthlyPace: 500,
      status: 'behind',
    });
  });

  it('is on track with more time', () => {
    const p = goalProgress(
      goal({ accountId: savings.id, by: '2026-03' }),
      [savings],
      TODAY
    );
    expect(p).toMatchObject({ monthlyNeeded: 400, status: 'on-track' });
  });

  it('estimates when it will be reached without a date', () => {
    const p = goalProgress(goal({ accountId: savings.id }), [savings], TODAY);
    expect(p).toMatchObject({ monthsAtPace: 8, status: 'open' });
    expect(monthFromNow(8, TODAY)).toBe('2026-02');
  });

  it('uses the amount you entered when tracked by hand', () => {
    const p = goalProgress(
      goal({ target: 5000, saved: 2500, by: '2025-10' }),
      [savings],
      TODAY
    );
    expect(p).toMatchObject({
      saved: 2500,
      monthsLeft: 5,
      monthlyNeeded: 500,
      monthlyPace: null,
      status: 'open',
    });
  });

  it('is reached, or overdue once its month has passed', () => {
    expect(
      goalProgress(
        goal({ target: 5000, accountId: savings.id }),
        [savings],
        TODAY
      ).status
    ).toBe('reached');
    expect(
      goalProgress(goal({ saved: 100, by: '2025-05' }), [], TODAY)
    ).toMatchObject({ status: 'overdue', monthsLeft: 0, remaining: 9900 });
  });

  it('counts an overdrawn or missing account as nothing saved', () => {
    const overdrawn = { ...savings, balance: -50, transactions: [] };
    expect(
      goalProgress(goal({ accountId: savings.id }), [overdrawn], TODAY).saved
    ).toBe(0);
    expect(goalProgress(goal({ accountId: 'gone' }), [], TODAY).saved).toBe(0);
  });
});

describe('creating and keeping goals', () => {
  it('keeps either an account or a saved amount', () => {
    const now = new Date('2025-06-15T12:00:00Z');
    const created = createGoal(
      { name: ' Trip ', target: 3000.456, saved: 100, by: '2025-12' },
      now
    );
    expect(created).toMatchObject({
      name: 'Trip',
      target: 3000.46,
      saved: 100,
      by: '2025-12',
      createdAt: now.toISOString(),
    });
    const linked = updateGoal(created, {
      name: 'Trip',
      target: 3000,
      accountId: 'acc_import_sav',
    });
    expect(linked).toEqual({
      id: created.id,
      createdAt: created.createdAt,
      name: 'Trip',
      target: 3000,
      accountId: 'acc_import_sav',
    });
  });

  it('drops malformed goals', () => {
    expect(
      cleanGoals([
        { id: 'a', name: 'Fine', target: 100, by: 'soon', saved: -5 },
        { id: 'b', name: ' ', target: 100 },
        { id: 'c', name: 'Zero', target: 0 },
        { name: 'No id', target: 10 },
        null,
      ])
    ).toEqual([
      { id: 'a', name: 'Fine', target: 100, saved: 0, createdAt: '' },
    ]);
    expect(cleanGoals('nope')).toEqual([]);
  });

  it('go into backups and come back out', () => {
    const goals = [goal({ saved: 250, by: '2026-01' })];
    const backup = createBackup([], { goals });
    expect(parseBackup(JSON.stringify(backup)).settings.goals).toEqual(goals);
  });
});
