import { Account, Transaction } from '../../types/financial';
import {
  findTransferMatches,
  linkTransfers,
  looksLikeTransfer,
} from '../transfers';

let nextId = 0;
const txn = (
  date: string,
  amount: number,
  description: string,
  transferAccountId?: string
): Transaction => ({
  id: `t${nextId++}`,
  accountId: '',
  description,
  amount,
  date,
  category: 'Other',
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: description,
    logo: '',
    suggestedCategory: 'Other',
    original: description,
  },
  transferAccountId,
  createdAt: '',
  updatedAt: '',
});

const account = (id: string, transactions: Transaction[]): Account => ({
  id,
  name: id,
  type: 'CHECKING',
  balance: 0,
  accountNumber: '',
  bankName: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  transactions,
});

describe('looksLikeTransfer', () => {
  it.each([
    'AUTOMATIC PAYMENT - THANK YOU',
    'Payment Thank You-Mobile',
    'CHASE CREDIT CRD AUTOPAY',
    'CAPITAL ONE ONLINE PMT',
    'Online Transfer to SAV ...1234',
    'ZELLE XFER',
  ])('recognises %s', (description) => {
    expect(looksLikeTransfer(description)).toBe(true);
  });

  it.each(['STARBUCKS STORE 123', 'AMAZON MKTPLACE', 'PAYROLL DEPOSIT'])(
    'does not flag %s',
    (description) => {
      expect(looksLikeTransfer(description)).toBe(false);
    }
  );
});

describe('findTransferMatches', () => {
  const autopay = txn('2025-06-03', -500, 'CHASE CREDIT CRD AUTOPAY');
  const checking = account('acc_checking', [
    autopay,
    txn('2025-06-03', -500, 'RENT'),
  ]);

  it('matches an opposite payment a few days later', () => {
    const payment = txn('2025-06-05', 500, 'PAYMENT THANK YOU');
    expect(findTransferMatches([payment], 'acc_card', [checking])).toEqual([
      {
        transactionId: payment.id,
        otherAccountId: 'acc_checking',
        otherTransactionId: autopay.id,
      },
    ]);
  });

  it('needs one side to look like a payment or transfer', () => {
    // RENT and a $500 refund are not a transfer.
    const refund = txn('2025-06-03', 500, 'REFUND');
    const rentOnly = account('acc_checking', [txn('2025-06-03', -500, 'RENT')]);
    expect(findTransferMatches([refund], 'acc_card', [rentOnly])).toEqual([]);
  });

  it('ignores amounts that differ or dates too far apart', () => {
    expect(
      findTransferMatches(
        [
          txn('2025-06-05', 499.99, 'PAYMENT THANK YOU'),
          txn('2025-06-12', 500, 'PAYMENT THANK YOU'),
          txn('2025-06-05', -500, 'PAYMENT THANK YOU'), // same sign
        ],
        'acc_card',
        [checking]
      )
    ).toEqual([]);
  });

  it('matches each transaction once, to the closest date', () => {
    const early = txn('2025-06-01', -200, 'ONLINE TRANSFER');
    const close = txn('2025-06-09', -200, 'ONLINE TRANSFER');
    const source = account('acc_checking', [early, close]);
    const first = txn('2025-06-10', 200, 'TRANSFER FROM CHECKING');
    const second = txn('2025-06-04', 200, 'TRANSFER FROM CHECKING');
    const matches = findTransferMatches([first, second], 'acc_savings', [
      source,
    ]);
    expect(matches.map((m) => [m.transactionId, m.otherTransactionId])).toEqual(
      [
        [first.id, close.id],
        [second.id, early.id],
      ]
    );
  });

  it('skips transactions that are already transfers, and the same account', () => {
    const linked = account('acc_checking', [
      txn('2025-06-03', -500, 'AUTOPAY', 'acc_other'),
    ]);
    const payment = txn('2025-06-05', 500, 'PAYMENT');
    expect(findTransferMatches([payment], 'acc_card', [linked])).toEqual([]);
    expect(findTransferMatches([payment], 'acc_checking', [checking])).toEqual(
      []
    );
  });
});

describe('linkTransfers', () => {
  it('marks both sides', () => {
    const autopay = txn('2025-06-03', -500, 'AUTOPAY');
    const checking = account('acc_checking', [autopay]);
    const payment = txn('2025-06-05', 500, 'PAYMENT');
    const { transactions, changedAccounts } = linkTransfers(
      [payment],
      'acc_card',
      [checking],
      findTransferMatches([payment], 'acc_card', [checking])
    );
    expect(transactions[0].transferAccountId).toBe('acc_checking');
    expect(transactions[0].category).toBe('Transfer');
    expect(changedAccounts).toHaveLength(1);
    expect(changedAccounts[0].transactions?.[0].transferAccountId).toBe(
      'acc_card'
    );
    expect(changedAccounts[0].transactions?.[0].category).toBe('Transfer');
  });
});
