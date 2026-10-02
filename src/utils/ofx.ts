// src/utils/ofx.ts
// OFX and QFX statements (Quicken / Money downloads), which most US banks
// offer alongside CSV. Each transaction carries the bank's own ID (FITID),
// so re-importing an overlapping statement can skip exactly what's already
// there. Handles both OFX 1.x (SGML, leaf tags left open) and 2.x (XML).
import { AccountType } from '../types/financial';
import { ParsedCsv } from './csvImport';

export interface OfxTransaction {
  // The bank's ID for the transaction (FITID).
  id: string;
  // "YYYY-MM-DD"
  date: string;
  // The effect on the account: negative for money out.
  amount: number;
  description: string;
}

export interface OfxStatement {
  accountType: AccountType | null;
  // The statement's closing balance, as the bank reports it (negative for
  // what's owed on a card).
  balance: number | null;
  transactions: OfxTransaction[];
}

export class OfxError extends Error {}

export const isOfx = (text: string): boolean =>
  /^\s*(OFXHEADER\s*:|<\?xml[^>]*>\s*<\?OFX|<OFX>)/i.test(text) ||
  /<OFX>/i.test(text.slice(0, 2000));

const decode = (value: string) =>
  value
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .trim();

// A leaf value: up to the next tag or line break, so it works whether or
// not the closing tag is there.
const field = (block: string, tag: string): string | null => {
  const match = block.match(new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i'));
  return match ? decode(match[1]) : null;
};

const blocks = (text: string, tag: string): string[] =>
  Array.from(
    text.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'gi')),
    (m) => m[1]
  );

// "20250603120000.000[-5:EST]" → "2025-06-03"
const ofxDate = (raw: string | null): string | null => {
  const match = raw?.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  const [year, month, day] = [match[1], match[2], match[3]].map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
};

// Some banks write "1.234,56"; OFX amounts never have thousands separators.
const ofxAmount = (raw: string | null): number | null => {
  if (!raw) return null;
  const value = Number(raw.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
};

const ACCOUNT_TYPES: Record<string, AccountType> = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  MONEYMRKT: 'SAVINGS',
  CD: 'SAVINGS',
  CREDITLINE: 'CREDIT',
};

const GENERIC_NAME =
  /^(|.{1,2}|POS|DEBIT|CREDIT|PURCHASE|PAYMENT|ACH|CHECK|DEPOSIT|WITHDRAWAL|TRANSFER|DIRECTDEBIT|DIRECTDEP|OTHER)$/i;

export const parseOfx = (text: string): OfxStatement => {
  if (!isOfx(text)) throw new OfxError("This file isn't an OFX statement.");
  const isCard = /<CCSTMTRS>/i.test(text);
  const accountType = isCard
    ? 'CREDIT'
    : ACCOUNT_TYPES[(field(text, 'ACCTTYPE') || '').toUpperCase()] ?? null;

  const ledger = blocks(text, 'LEDGERBAL')[0];
  const balance = ledger ? ofxAmount(field(ledger, 'BALAMT')) : null;

  const seen = new Set<string>();
  const transactions: OfxTransaction[] = [];
  blocks(text, 'STMTTRN').forEach((block, index) => {
    const date = ofxDate(field(block, 'DTPOSTED'));
    const amount = ofxAmount(field(block, 'TRNAMT'));
    const name = field(block, 'NAME') || '';
    const memo = field(block, 'MEMO') || '';
    // Some banks put the merchant in MEMO and a generic word in NAME.
    const description =
      (memo && GENERIC_NAME.test(name) ? memo : name) ||
      memo ||
      field(block, 'PAYEE');
    if (!date || amount === null || !description) return;
    // FITIDs should be unique; a bank that repeats one still gets every
    // transaction imported.
    let id = field(block, 'FITID') || `${date}:${amount}:${index}`;
    if (seen.has(id)) id = `${id}:${index}`;
    seen.add(id);
    transactions.push({ id, date, amount, description });
  });

  if (transactions.length === 0 && blocks(text, 'STMTTRN').length > 0) {
    throw new OfxError("This statement's transactions couldn't be read.");
  }
  return { accountType, balance, transactions };
};

export const OFX_HEADERS = ['Date', 'Description', 'Amount', 'Bank ID'];

// The statement as a table, so it goes through the same import preview as
// a CSV, with its columns already chosen.
export const ofxToParsed = (statement: OfxStatement): ParsedCsv => ({
  headers: OFX_HEADERS,
  rows: statement.transactions.map((txn) => [
    txn.date,
    txn.description,
    txn.amount.toFixed(2),
    txn.id,
  ]),
  rowNumbers: statement.transactions.map((_, i) => i + 1),
});
