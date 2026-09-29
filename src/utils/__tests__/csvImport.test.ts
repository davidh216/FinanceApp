import {
  buildTransactions,
  categorizeMerchant,
  createImportedAccount,
  detectColumnMapping,
  mergeImportedTransactions,
  parseAmount,
  parseCsv,
  parseCsvRows,
  parseDate,
  splitDuplicates,
} from '../csvImport';

const importCsv = (csv: string, flipSigns = false) => {
  const parsed = parseCsv(csv);
  const mapping = detectColumnMapping(parsed.headers, parsed.rows);
  return {
    parsed,
    mapping,
    ...buildTransactions(parsed, mapping, 'acc_test', flipSigns),
  };
};

describe('parseCsvRows', () => {
  it('handles quoted fields, escaped quotes, CRLF and a BOM', () => {
    const csv =
      '﻿Date,Description,Amount\r\n' +
      '01/02/2025,"ACME, INC ""HQ""",-10.00\r\n';
    expect(parseCsvRows(csv)).toEqual([
      ['Date', 'Description', 'Amount'],
      ['01/02/2025', 'ACME, INC "HQ"', '-10.00'],
    ]);
  });

  it('keeps newlines inside quoted fields', () => {
    expect(parseCsvRows('a,"line1\nline2"\n')).toEqual([['a', 'line1\nline2']]);
  });
});

describe('parseDate', () => {
  it.each([
    ['2025-01-15', '2025-01-15'],
    ['01/15/2025', '2025-01-15'],
    ['1/5/2025', '2025-01-05'],
    ['1/5/25', '2025-01-05'],
    ['2025-01-15T10:00:00Z', '2025-01-15'],
  ])('parses %s', (input, expected) => {
    expect(parseDate(input)).toBe(expected);
  });

  it.each(['', 'Posted', '13/01/2025', '02/30/2025', '15.01.2025'])(
    'rejects %s',
    (input) => {
      expect(parseDate(input)).toBeNull();
    }
  );
});

describe('parseAmount', () => {
  it.each([
    ['12.34', 12.34],
    ['-12.34', -12.34],
    ['$1,234.56', 1234.56],
    ['-$1,234.56', -1234.56],
    ['(45.00)', -45],
    ['45.00-', -45],
    [' 7 ', 7],
  ])('parses %s', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(['', '*', 'N/A', 'SHELL OIL 57444'])('rejects %s', (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});

describe('categorizeMerchant', () => {
  it('matches known merchants', () => {
    const merchant = categorizeMerchant('STARBUCKS STORE 12345', -5.5);
    expect(merchant.cleanName).toBe('Starbucks');
    expect(merchant.original).toBe('STARBUCKS STORE 12345');
  });

  it('does not match short merchant keys inside other words', () => {
    // "ATT" and "BP" are merchant keys.
    expect(categorizeMerchant('MATTRESS FIRM', -300).cleanName).toBe(
      'Mattress Firm'
    );
    expect(categorizeMerchant('BPAY TRANSFER', -20).suggestedCategory).toBe(
      'Other'
    );
  });

  it('cleans unknown merchants and guesses income from the sign', () => {
    const expense = categorizeMerchant('LOCAL BAKERY   #0042193 NY', -8);
    expect(expense.cleanName).toBe('Local Bakery');
    expect(expense.suggestedCategory).toBe('Other');
    expect(categorizeMerchant('ZELLE FROM J DOE', 50).suggestedCategory).toBe(
      'Income'
    );
  });
});

describe('bank export formats', () => {
  it('imports a Chase checking export', () => {
    const { mapping, transactions, skippedRows } = importCsv(
      'Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #\n' +
        'DEBIT,01/14/2025,STARBUCKS STORE 1234,-5.75,DEBIT_CARD,994.25,,\n' +
        'CREDIT,01/15/2025,ACME PAYROLL PPD,2500.00,ACH_CREDIT,3494.25,,\n'
    );
    expect(mapping).toMatchObject({ date: 1, description: 2, amount: 3 });
    expect(skippedRows).toEqual([]);
    expect(transactions.map((t) => [t.date, t.amount])).toEqual([
      ['2025-01-15', 2500],
      ['2025-01-14', -5.75],
    ]);
    expect(transactions[0].category).toBe('Income');
  });

  it('imports separate debit and credit columns (Capital One)', () => {
    const { mapping, transactions } = importCsv(
      'Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit\n' +
        '2025-01-10,2025-01-11,1234,NETFLIX.COM,Entertainment,15.49,\n' +
        '2025-01-12,2025-01-12,1234,PAYMENT THANK YOU,Payment,,200.00\n'
    );
    expect(mapping).toMatchObject({
      date: 0,
      description: 3,
      amount: -1,
      debit: 5,
      credit: 6,
    });
    expect(transactions.map((t) => t.amount)).toEqual([200, -15.49]);
  });

  it('prefers debit/credit columns over "Debit Amount" style headers', () => {
    const { mapping } = importCsv(
      'Date,Description,Debit Amount,Credit Amount\n' +
        '01/01/2025,COFFEE,4.00,\n'
    );
    expect(mapping).toMatchObject({ amount: -1, debit: 2, credit: 3 });
  });

  it('imports a headerless Wells Fargo export', () => {
    const { parsed, mapping, transactions } = importCsv(
      '"01/15/2025","-45.67","*","","SHELL OIL 57444"\n' +
        '"01/16/2025","1200.00","*","","ONLINE TRANSFER FROM SAVINGS"\n'
    );
    expect(parsed.headers[0]).toBe('Column 1');
    expect(mapping).toMatchObject({ date: 0, amount: 1, description: 4 });
    expect(transactions).toHaveLength(2);
    expect(transactions[1].cleanMerchant.cleanName).toBe('Shell');
  });

  it('skips summary lines above the header (Bank of America)', () => {
    const { parsed, transactions } = importCsv(
      'Description,,Summary Amt.\n' +
        'Beginning balance as of 01/01/2025,,"1,000.00"\n' +
        'Total credits,,"2,000.00"\n' +
        '\n' +
        'Date,Description,Amount,Running Bal.\n' +
        '01/01/2025,Beginning balance as of 01/01/2025,,"1,000.00"\n' +
        '01/02/2025,"UBER TRIP","-23.10","976.90"\n' +
        '01/03/2025,"WHOLE FOODS MARKET","-88.02","888.88"\n' +
        '01/04/2025,"SPOTIFY USA","-11.99","876.89"\n'
    );
    expect(parsed.headers).toEqual([
      'Date',
      'Description',
      'Amount',
      'Running Bal.',
    ]);
    expect(transactions).toHaveLength(3);
  });

  it('reports rows missing a date, description or amount', () => {
    const { transactions, skippedRows } = importCsv(
      'Date,Description,Amount\n' +
        '01/01/2025,VALID,-1.00\n' +
        'pending,NO DATE,-2.00\n' +
        '01/03/2025,,-3.00\n' +
        '01/04/2025,NO AMOUNT,\n'
    );
    expect(transactions).toHaveLength(1);
    expect(skippedRows).toEqual([3, 4, 5]);
  });

  it('flips signs for exports that list charges as positive', () => {
    const { transactions } = importCsv(
      'Date,Description,Amount\n01/01/2025,TARGET,25.00\n',
      true
    );
    expect(transactions[0].amount).toBe(-25);
  });
});

describe('createImportedAccount', () => {
  const { transactions } = importCsv(
    'Date,Description,Amount\n' +
      '01/01/2025,PAYCHECK,1000.00\n' +
      '01/02/2025,RENT,-600.50\n'
  );

  it('uses the transaction total when no balance is given', () => {
    const account = createImportedAccount({
      id: 'acc_import_1',
      name: ' Checking ',
      type: 'CHECKING',
      bankName: '',
      balance: null,
      transactions,
    });
    expect(account.balance).toBe(399.5);
    expect(account.name).toBe('Checking');
    expect(account.bankName).toBe('Imported');
  });

  it('stores the amount owed on credit accounts as a negative balance', () => {
    const account = createImportedAccount({
      id: 'acc_import_2',
      name: 'Visa',
      type: 'CREDIT',
      bankName: 'Chase',
      balance: 450,
      transactions,
    });
    expect(account.balance).toBe(-450);
  });
});

describe('splitDuplicates', () => {
  const build = (csv: string, idPrefix = 'batch') => {
    const parsed = parseCsv(`Date,Description,Amount\n${csv}`);
    return buildTransactions(
      parsed,
      detectColumnMapping(parsed.headers, parsed.rows),
      'acc_test',
      false,
      idPrefix
    ).transactions;
  };

  it('skips transactions that are already in the account', () => {
    const existing = build(
      '01/01/2025,COFFEE SHOP,-4.50\n01/02/2025,RENT,-1200.00\n',
      'first'
    );
    const incoming = build(
      '01/02/2025,RENT,-1200.00\n01/03/2025,GROCERIES,-60.00\n',
      'second'
    );
    const { fresh, duplicates } = splitDuplicates(incoming, existing);
    expect(fresh.map((t) => t.description)).toEqual(['GROCERIES']);
    expect(duplicates.map((t) => t.description)).toEqual(['RENT']);
  });

  it('matches descriptions regardless of case and spacing', () => {
    const existing = build('01/01/2025,Coffee  Shop,-4.50\n');
    const incoming = build('01/01/2025,COFFEE SHOP ,-4.50\n');
    expect(splitDuplicates(incoming, existing).fresh).toEqual([]);
  });

  it('treats a different date or amount as a new transaction', () => {
    const existing = build('01/01/2025,COFFEE SHOP,-4.50\n');
    const incoming = build(
      '01/02/2025,COFFEE SHOP,-4.50\n01/01/2025,COFFEE SHOP,-5.00\n'
    );
    expect(splitDuplicates(incoming, existing).fresh).toHaveLength(2);
  });

  it('keeps identical transactions beyond the number already imported', () => {
    // Two identical coffees on the same day; only one was imported before.
    const existing = build('01/01/2025,COFFEE SHOP,-4.50\n');
    const incoming = build(
      '01/01/2025,COFFEE SHOP,-4.50\n01/01/2025,COFFEE SHOP,-4.50\n'
    );
    const { fresh, duplicates } = splitDuplicates(incoming, existing);
    expect(fresh).toHaveLength(1);
    expect(duplicates).toHaveLength(1);
  });

  it('gives each batch distinct transaction IDs', () => {
    const first = build('01/01/2025,A,-1.00\n', 'acc_test_one');
    const second = build('01/01/2025,A,-1.00\n', 'acc_test_two');
    expect(first[0].id).not.toBe(second[0].id);
  });
});

describe('mergeImportedTransactions', () => {
  const account = createImportedAccount({
    id: 'acc_import_1',
    name: 'Checking',
    type: 'CHECKING',
    bankName: 'Chase',
    balance: 1000,
    transactions: importCsv(
      'Date,Description,Amount\n01/05/2025,PAYCHECK,1000.00\n'
    ).transactions,
  });
  const newTransactions = importCsv(
    'Date,Description,Amount\n' +
      '01/10/2025,RENT,-600.00\n' +
      '01/01/2025,REFUND,25.25\n'
  ).transactions;

  it('adds the new transactions to the balance and keeps dates sorted', () => {
    const merged = mergeImportedTransactions(
      account,
      newTransactions,
      null,
      false
    );
    expect(merged.balance).toBe(425.25);
    expect(merged.transactions?.map((t) => t.date)).toEqual([
      '2025-01-10',
      '2025-01-05',
      '2025-01-01',
    ]);
  });

  it('uses an entered balance, stored negative for liabilities', () => {
    expect(
      mergeImportedTransactions(account, newTransactions, 999, false).balance
    ).toBe(999);
    const card = { ...account, type: 'CREDIT' as const };
    expect(
      mergeImportedTransactions(card, newTransactions, 300, true).balance
    ).toBe(-300);
  });

  it('remembers the sign setting for the next import', () => {
    expect(account.importSettings).toEqual({ flipSigns: false });
    expect(
      mergeImportedTransactions(account, [], null, true).importSettings
    ).toEqual({ flipSigns: true });
  });
});
