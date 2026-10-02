import { Account, Transaction } from '../../types/financial';
import { forecastBalances, upcomingEvents } from '../forecast';
import { RecurringPayment, findRecurringPayments } from '../recurring';

const TODAY = '2025-06-15';

const recurring = (overrides: Partial<RecurringPayment>): RecurringPayment => ({
  merchant: 'Netflix',
  merchantKey: 'netflix',
  accountId: 'acc_import_chk',
  category: 'Subscriptions',
  cadence: 'monthly',
  amount: 15.99,
  monthlyCost: 15.99,
  lastDate: '2025-05-20',
  nextDate: '2025-06-20',
  payments: 4,
  ...overrides,
});

const account = (overrides: Partial<Account>): Account => ({
  id: 'acc_import_chk',
  name: 'Checking',
  type: 'CHECKING',
  balance: 100,
  accountNumber: '',
  bankName: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  transactions: [],
  ...overrides,
});

describe('upcomingEvents', () => {
  it('projects each schedule over the next 30 days, soonest first', () => {
    const events = upcomingEvents(
      [recurring({})],
      [
        recurring({
          merchant: 'Payroll',
          cadence: 'weekly',
          amount: 800,
          // Expected two days ago and not seen yet.
          nextDate: '2025-06-13',
        }),
      ],
      TODAY
    );
    expect(events.map((e) => [e.date, e.merchant, e.amount, e.late])).toEqual([
      ['2025-06-15', 'Payroll', 800, true],
      ['2025-06-20', 'Payroll', 800, false],
      ['2025-06-20', 'Netflix', -15.99, false],
      ['2025-06-27', 'Payroll', 800, false],
      ['2025-07-04', 'Payroll', 800, false],
      ['2025-07-11', 'Payroll', 800, false],
    ]);
  });

  it('leaves out anything past the 30 days', () => {
    expect(
      upcomingEvents([recurring({ nextDate: '2025-07-16' })], [], TODAY)
    ).toEqual([]);
  });
});

describe('forecastBalances', () => {
  const events = upcomingEvents(
    [recurring({ amount: 1200, merchant: 'Rent', nextDate: '2025-06-18' })],
    [recurring({ merchant: 'Payroll', amount: 1000, nextDate: '2025-06-28' })],
    TODAY
  );

  it('finds the low point, and warns when an account you own goes negative', () => {
    expect(
      forecastBalances([account({ balance: 500 })], events, TODAY)
    ).toEqual([
      {
        accountId: 'acc_import_chk',
        name: 'Checking',
        now: 500,
        end: 300,
        lowest: -700,
        lowestDate: '2025-06-18',
        goesNegative: true,
      },
    ]);
  });

  it("doesn't warn about a card, which is meant to be below zero", () => {
    const [card] = forecastBalances(
      [account({ type: 'CREDIT', balance: -100 })],
      events,
      TODAY
    );
    expect(card.goesNegative).toBe(false);
  });

  it('skips accounts with nothing coming up', () => {
    expect(forecastBalances([account({ id: 'other' })], events, TODAY)).toEqual(
      []
    );
  });
});

describe('transfers in the forecast', () => {
  it('move both balances but are neither bills nor income', () => {
    const loanPayment = recurring({
      merchant: 'Quicken Loans',
      amount: 1900,
      nextDate: '2025-06-20',
    });
    const events = upcomingEvents([], [], TODAY, 30, {
      out: [loanPayment],
      in: [{ ...loanPayment, accountId: 'acc_import_loan' }],
    });
    expect(events.map((e) => [e.kind, e.accountId, e.amount])).toEqual([
      ['transfer', 'acc_import_loan', 1900],
      ['transfer', 'acc_import_chk', -1900],
    ]);
    const [checking, loan] = forecastBalances(
      [
        account({ balance: 2500 }),
        account({ id: 'acc_import_loan', type: 'LOAN', balance: -150000 }),
      ],
      events,
      TODAY
    );
    expect(checking).toMatchObject({ end: 600, goesNegative: false });
    expect(loan.end).toBe(-148100);
  });
});

describe('findRecurringPayments for money in', () => {
  it('finds a regular paycheck and the account it lands in', () => {
    const pay = (date: string): Transaction => ({
      id: date,
      accountId: 'acc_import_chk',
      description: 'ACME PAYROLL',
      amount: 2000,
      date,
      category: 'Income',
      tags: [],
      pending: false,
      cleanMerchant: {
        cleanName: 'Acme Payroll',
        logo: '',
        suggestedCategory: 'Income',
        original: '',
      },
      createdAt: '',
      updatedAt: '',
    });
    const txns = ['2025-05-02', '2025-05-16', '2025-05-30', '2025-06-13'].map(
      pay
    );
    expect(findRecurringPayments(txns, TODAY)).toEqual([]);
    expect(findRecurringPayments(txns, TODAY, 'in')).toEqual([
      expect.objectContaining({
        merchant: 'Acme Payroll',
        accountId: 'acc_import_chk',
        cadence: 'every 2 weeks',
        amount: 2000,
        nextDate: '2025-06-27',
      }),
    ]);
  });
});

describe('findRecurringPayments for transfers', () => {
  const payment = (date: string, transfer: boolean): Transaction => ({
    id: `${date}_${transfer}`,
    accountId: 'acc_import_chk',
    description: 'QUICKEN LOANS',
    amount: -1900,
    date,
    category: 'Loan Payment',
    tags: [],
    pending: false,
    cleanMerchant: {
      cleanName: 'Quicken Loans',
      logo: '',
      suggestedCategory: 'Loan Payment',
      original: '',
    },
    ...(transfer ? { transferAccountId: 'acc_import_loan' } : {}),
    createdAt: '',
    updatedAt: '',
  });
  const dates = ['2025-03-03', '2025-04-03', '2025-05-03', '2025-06-03'];

  it('finds them only when asked, and never spending as a transfer', () => {
    const transfers = dates.map((d) => payment(d, true));
    expect(findRecurringPayments(transfers, TODAY)).toEqual([]);
    expect(findRecurringPayments(transfers, TODAY, 'out', 'transfers')).toEqual(
      [expect.objectContaining({ merchant: 'Quicken Loans', amount: 1900 })]
    );
    const spending = dates.map((d) => payment(d, false));
    expect(findRecurringPayments(spending, TODAY, 'out', 'transfers')).toEqual(
      []
    );
  });
});
