import { OfxError, isOfx, ofxToParsed, parseOfx } from '../ofx';
import { buildTransactions, splitDuplicates } from '../csvImport';
import { CARD_OFX_XML, CHECKING_OFX_SGML } from '../../test/ofxSamples';

describe('parseOfx', () => {
  it('reads an OFX 1.x (SGML) checking statement', () => {
    const statement = parseOfx(CHECKING_OFX_SGML);
    expect(statement.accountType).toBe('CHECKING');
    // The ledger balance, not the available one.
    expect(statement.balance).toBe(3446.4);
    expect(statement.transactions).toEqual([
      {
        id: 'FIT-0001',
        date: '2025-06-02',
        amount: 2500,
        description: 'PAYROLL DEPOSIT',
      },
      {
        id: 'FIT-0002',
        date: '2025-06-03',
        amount: -5.75,
        description: 'STARBUCKS STORE 1234',
      },
      {
        id: 'FIT-0003',
        date: '2025-06-03',
        amount: -5.75,
        description: 'STARBUCKS STORE 1234',
      },
      // A generic NAME gives way to the MEMO, with entities decoded.
      {
        id: 'FIT-0004',
        date: '2025-06-05',
        amount: -42.1,
        description: 'JOE&S DINER',
      },
    ]);
  });

  it('reads an OFX 2.x (XML) credit card statement', () => {
    const statement = parseOfx(CARD_OFX_XML);
    expect(statement.accountType).toBe('CREDIT');
    expect(statement.balance).toBe(-1234.56);
    expect(statement.transactions.map((t) => [t.id, t.amount])).toEqual([
      ['CC-77', -89.99],
      ['CC-78', 15],
    ]);
  });

  it('tells OFX from CSV, and rejects what it cannot read', () => {
    expect(isOfx(CHECKING_OFX_SGML)).toBe(true);
    expect(isOfx(CARD_OFX_XML)).toBe(true);
    expect(isOfx('Date,Description,Amount\n06/01/2025,X,1')).toBe(false);
    expect(() => parseOfx('Date,Amount')).toThrow(OfxError);
    expect(() => parseOfx('<OFX><STMTTRN><TRNAMT>abc</STMTTRN></OFX>')).toThrow(
      "transactions couldn't be read"
    );
  });

  it('keeps every transaction when a bank repeats a FITID', () => {
    const text = CHECKING_OFX_SGML.replace('FIT-0003', 'FIT-0002');
    const ids = parseOfx(text).transactions.map((t) => t.id);
    expect(new Set(ids).size).toBe(4);
  });
});

describe('importing OFX', () => {
  const mapping = {
    date: 0,
    description: 1,
    amount: 2,
    debit: -1,
    credit: -1,
    bankId: 3,
  };
  const build = (text: string, prefix: string) =>
    buildTransactions(
      ofxToParsed(parseOfx(text)),
      mapping,
      'acc_import_x',
      false,
      prefix
    ).transactions;

  it('keeps the bank ID on each transaction', () => {
    expect(build(CHECKING_OFX_SGML, 'a').map((t) => t.bankId)).toEqual([
      'FIT-0004',
      'FIT-0002',
      'FIT-0003',
      'FIT-0001',
    ]);
  });

  it('skips exactly the transactions already imported, by bank ID', () => {
    const first = build(CHECKING_OFX_SGML, 'a');
    // A later statement repeats FIT-0003 and adds a third identical coffee.
    const later = build(
      CHECKING_OFX_SGML.replace('FIT-0001', 'FIT-0005').replace(
        'FIT-0002',
        'FIT-0006'
      ),
      'b'
    );
    const { fresh, duplicates } = splitDuplicates(later, first);
    expect(fresh.map((t) => t.bankId).sort()).toEqual(['FIT-0005', 'FIT-0006']);
    expect(duplicates.map((t) => t.bankId).sort()).toEqual([
      'FIT-0003',
      'FIT-0004',
    ]);
  });

  it('matches a CSV import of the same days either way round', () => {
    const fromOfx = build(CHECKING_OFX_SGML, 'a');
    const fromCsv = fromOfx.map(({ bankId, ...txn }) => ({
      ...txn,
      id: `csv_${txn.id}`,
    }));
    expect(splitDuplicates(fromOfx, fromCsv).fresh).toEqual([]);
    expect(splitDuplicates(fromCsv, fromOfx).fresh).toEqual([]);
  });
});
