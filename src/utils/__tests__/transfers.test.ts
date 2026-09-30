import { Account, Transaction } from '../../types/financial';
import {
  EXTERNAL_ACCOUNT_ID,
  findTransferMatches,
  linkTransfers,
  looksLikeTransfer,
  markAsTransfer,
  unlinkTransfer,
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

// Two imported accounts with a linked card payment, as an import leaves them.
const linkedPair = () => {
  const out = {
    ...txn('2025-06-03', -500, 'CHASE CREDIT CRD AUTOPAY'),
    accountId: 'acc_import_chk',
  };
  const into = {
    ...txn('2025-06-05', 500, 'PAYMENT THANK YOU'),
    accountId: 'acc_import_card',
  };
  const checking = account('acc_import_chk', [out]);
  const card = account('acc_import_card', [into]);
  const { transactions, changedAccounts } = linkTransfers(
    [into],
    card.id,
    [checking],
    findTransferMatches([into], card.id, [checking])
  );
  return {
    accounts: [changedAccounts[0], { ...card, transactions }],
    out,
    into,
  };
};

const find = (accounts: Account[], id: string) =>
  accounts.flatMap((a) => a.transactions || []).find((t) => t.id === id)!;

describe('unlinkTransfer', () => {
  it('undoes both sides and categorises them again', () => {
    const { accounts, out, into } = linkedPair();
    const changed = unlinkTransfer(accounts, into.id);

    expect(changed.map((a) => a.id).sort()).toEqual([
      'acc_import_card',
      'acc_import_chk',
    ]);
    const card = find(changed, into.id);
    expect(card.transferAccountId).toBeUndefined();
    expect(card.notTransfer).toBe(true);
    // Money in with no known merchant is income again.
    expect(card.category).toBe('Income');
    expect(card.cleanMerchant.suggestedCategory).toBe('Income');
    const checking = find(changed, out.id);
    expect(checking.transferAccountId).toBeUndefined();
    expect(checking.category).toBe('Other');
  });

  it('is never matched automatically again', () => {
    const { accounts, into } = linkedPair();
    const unlinked = unlinkTransfer(accounts, into.id);
    const checking = unlinked.find((a) => a.id === 'acc_import_chk')!;
    const again = find(unlinked, into.id);

    expect(findTransferMatches([again], 'acc_import_card', [checking])).toEqual(
      []
    );
    // Nor is its old partner, by a new payment into another account.
    const other = { ...txn('2025-06-04', 500, 'PAYMENT'), accountId: 'x' };
    expect(findTransferMatches([other], 'acc_import_sav', [checking])).toEqual(
      []
    );
  });

  it('does nothing to a transaction that is not a transfer', () => {
    const plain = {
      ...txn('2025-06-03', -5, 'COFFEE'),
      accountId: 'acc_import_chk',
    };
    expect(
      unlinkTransfer([account('acc_import_chk', [plain])], plain.id)
    ).toEqual([]);
  });
});

describe('markAsTransfer', () => {
  it('links both sides when the other account has the opposite transaction', () => {
    const out = {
      ...txn('2025-06-01', -200, 'ONLINE BANKING'),
      accountId: 'acc_import_chk',
    };
    const into = {
      ...txn('2025-06-02', 200, 'DEPOSIT'),
      accountId: 'acc_import_sav',
    };
    const decoy = {
      ...txn('2025-06-20', 200, 'DEPOSIT'),
      accountId: 'acc_import_sav',
    };
    const accounts = [
      account('acc_import_chk', [out]),
      account('acc_import_sav', [into, decoy]),
    ];

    const changed = markAsTransfer(accounts, out.id, 'acc_import_sav');
    expect(find(changed, out.id)).toMatchObject({
      transferAccountId: 'acc_import_sav',
      category: 'Transfer',
    });
    expect(find(changed, into.id).transferAccountId).toBe('acc_import_chk');
    // Too far apart to be the other side.
    expect(find(changed, decoy.id).transferAccountId).toBeUndefined();
  });

  it('marks one side when the other account has no match', () => {
    const out = {
      ...txn('2025-06-01', -200, 'ONLINE BANKING'),
      accountId: 'acc_import_chk',
    };
    const changed = markAsTransfer(
      [account('acc_import_chk', [out]), account('acc_import_sav', [])],
      out.id,
      'acc_import_sav'
    );
    expect(changed).toHaveLength(1);
    expect(find(changed, out.id).transferAccountId).toBe('acc_import_sav');
  });

  it('can record a transfer with an account not in the app', () => {
    const venmo = {
      ...txn('2025-06-01', 300, 'VENMO CASHOUT'),
      accountId: 'acc_import_chk',
    };
    const changed = markAsTransfer(
      [account('acc_import_chk', [venmo])],
      venmo.id,
      EXTERNAL_ACCOUNT_ID
    );
    expect(find(changed, venmo.id).transferAccountId).toBe(EXTERNAL_ACCOUNT_ID);
  });

  it('re-links a transaction you unlinked by mistake', () => {
    const { accounts, into } = linkedPair();
    const unlinked = unlinkTransfer(accounts, into.id);
    const changed = markAsTransfer(unlinked, into.id, 'acc_import_chk');
    expect(find(changed, into.id).notTransfer).toBeUndefined();
    expect(changed).toHaveLength(2);
  });

  it('refuses a transfer to its own account or an unknown one', () => {
    const t = { ...txn('2025-06-01', -1, 'X'), accountId: 'acc_import_chk' };
    const accounts = [account('acc_import_chk', [t])];
    expect(markAsTransfer(accounts, t.id, 'acc_import_chk')).toEqual([]);
    expect(markAsTransfer(accounts, t.id, 'acc_import_gone')).toEqual([]);
  });
});
