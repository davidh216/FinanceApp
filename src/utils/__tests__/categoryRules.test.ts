import { Transaction } from '../../types/financial';
import {
  applyCategoryRule,
  cleanCategoryRules,
  merchantKey,
} from '../categoryRules';
import { buildTransactions, parseCsv, detectColumnMapping } from '../csvImport';

const txn = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 't1',
  accountId: 'a',
  description: 'STARBUCKS STORE 1234',
  amount: -5.75,
  date: '2025-06-03',
  category: 'Food & Dining',
  tags: [],
  pending: false,
  cleanMerchant: {
    cleanName: 'Starbucks',
    logo: '☕',
    suggestedCategory: 'Food & Dining',
    original: 'STARBUCKS STORE 1234',
  },
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('merchantKey', () => {
  it('ignores case and spacing in the clean name', () => {
    const key = (cleanName: string) =>
      merchantKey({ cleanName, logo: '', suggestedCategory: '', original: '' });
    expect(key(' Joes  Pizza ')).toBe('joes pizza');
    expect(key('JOES PIZZA')).toBe('joes pizza');
  });
});

describe('applyCategoryRule', () => {
  const rules = { starbucks: 'Entertainment' };

  it("gives a transaction its merchant's category", () => {
    const result = applyCategoryRule(txn(), rules);
    expect(result.category).toBe('Entertainment');
    expect(result.cleanMerchant.suggestedCategory).toBe('Entertainment');
  });

  it('leaves other merchants and transfers alone', () => {
    const amazon = txn({
      cleanMerchant: { ...txn().cleanMerchant, cleanName: 'Amazon' },
    });
    expect(applyCategoryRule(amazon, rules)).toBe(amazon);
    const transfer = txn({
      transferAccountId: 'acc_card',
      category: 'Transfer',
    });
    expect(applyCategoryRule(transfer, rules)).toBe(transfer);
  });
});

describe('cleanCategoryRules', () => {
  it('keeps rules that name a known category', () => {
    expect(
      cleanCategoryRules({
        starbucks: 'Entertainment',
        amazon: 'Made Up',
        shell: 42,
        '  ': 'Travel',
      })
    ).toEqual({ starbucks: 'Entertainment' });
    expect(cleanCategoryRules(null)).toEqual({});
    expect(cleanCategoryRules(['x'])).toEqual({});
  });
});

describe('buildTransactions with rules', () => {
  it('uses the remembered category instead of the guess', () => {
    const parsed = parseCsv(
      'Date,Description,Amount\n' +
        '06/03/2025,STARBUCKS #88,-4.00\n' +
        '06/04/2025,AMAZON MKTPLACE,-80.00\n'
    );
    const mapping = detectColumnMapping(parsed.headers, parsed.rows);
    const { transactions } = buildTransactions(
      parsed,
      mapping,
      'acc_import_1',
      false,
      undefined,
      { starbucks: 'Entertainment' }
    );
    const byName = Object.fromEntries(
      transactions.map((t) => [t.cleanMerchant.cleanName, t.category])
    );
    expect(byName).toEqual({ Starbucks: 'Entertainment', Amazon: 'Shopping' });
  });
});
