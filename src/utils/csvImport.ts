// src/utils/csvImport.ts
import {
  Account,
  AccountType,
  MerchantInfo,
  Transaction,
} from '../types/financial';
import {
  BUSINESS_MERCHANT_PATTERNS,
  LOAN_MERCHANT_PATTERNS,
  MERCHANT_PATTERNS,
} from '../constants/financial';

export const IMPORTED_ACCOUNT_PREFIX = 'acc_import_';

export const LIABILITY_ACCOUNT_TYPES: AccountType[] = [
  'CREDIT',
  'BUSINESS_CREDIT',
  'LOAN',
];

// Column indexes into a CSV row; -1 means "not mapped".
export interface ColumnMapping {
  date: number;
  description: number;
  amount: number;
  debit: number;
  credit: number;
}

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  // 1-based line number of each data row in the original file.
  rowNumbers: number[];
}

export interface BuildResult {
  transactions: Transaction[];
  skippedRows: number[];
}

// RFC 4180-style parser: quoted fields, escaped quotes, CRLF, BOM.
export const parseCsvRows = (text: string): string[][] => {
  const input = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

export const parseDate = (raw: string): string | null => {
  const value = raw.trim();
  let year: number;
  let month: number;
  let day: number;

  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (iso) {
    [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (us) {
    [month, day, year] = [Number(us[1]), Number(us[2]), Number(us[3])];
    if (us[3].length === 2) year += 2000;
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().split('T')[0];
};

// Handles "$1,234.56", "-12.00", "(12.00)" and "12.00-".
export const parseAmount = (raw: string): number | null => {
  const value = raw.trim();
  if (!value || /[a-z]/i.test(value)) return null;
  const isNegative =
    value.startsWith('-') ||
    value.endsWith('-') ||
    (value.startsWith('(') && value.endsWith(')'));
  const digits = value.replace(/[^0-9.]/g, '');
  if (!/\d/.test(digits)) return null;
  const amount = Number(digits);
  if (Number.isNaN(amount)) return null;
  return Math.round((isNegative ? -amount : amount) * 100) / 100;
};

// Some bank exports put summary lines above the real header, and some have
// no header at all. The header is the row just above the first row that
// contains a date; if that first row is the top of the file, there is no
// header and columns get numbered.
export const parseCsv = (text: string): ParsedCsv => {
  const allRows = parseCsvRows(text)
    .map((cells, index) => ({ cells, lineNumber: index + 1 }))
    .filter(({ cells }) => cells.some((cell) => cell.trim() !== ''));
  if (allRows.length === 0) {
    return { headers: [], rows: [], rowNumbers: [] };
  }

  const hasDate = (cells: string[]) =>
    cells.some((cell) => parseDate(cell) !== null);
  const firstDataIndex = allRows.findIndex(({ cells }) => hasDate(cells));

  let headerCells: string[] | null;
  let dataRows: typeof allRows;
  if (firstDataIndex === -1) {
    headerCells = allRows[0].cells;
    dataRows = allRows.slice(1);
  } else if (firstDataIndex === 0) {
    headerCells = null;
    dataRows = allRows;
  } else {
    headerCells = allRows[firstDataIndex - 1].cells;
    dataRows = allRows.slice(firstDataIndex);
  }

  const headers = headerCells
    ? headerCells.map((cell) => cell.trim())
    : allRows[0].cells.map((_, index) => `Column ${index + 1}`);

  return {
    headers,
    rows: dataRows.map(({ cells }) => cells),
    rowNumbers: dataRows.map(({ lineNumber }) => lineNumber),
  };
};

const findHeader = (headers: string[], patterns: RegExp[]): number => {
  for (const pattern of patterns) {
    const index = headers.findIndex((header) => pattern.test(header));
    if (index !== -1) return index;
  }
  return -1;
};

export const detectColumnMapping = (
  headers: string[],
  rows: string[][] = []
): ColumnMapping => {
  const mapping: ColumnMapping = {
    date: findHeader(headers, [/trans.*date/i, /^date$/i, /date/i]),
    description: findHeader(headers, [
      /description/i,
      /payee/i,
      /merchant/i,
      /^name$/i,
      /memo/i,
      /details/i,
    ]),
    amount: findHeader(headers, [
      /^amount$/i,
      /^(?!.*(debit|credit)).*amount/i,
    ]),
    debit: findHeader(headers, [/debit/i, /withdrawal/i, /money out/i]),
    credit: findHeader(headers, [/credit/i, /deposit/i, /money in/i]),
  };

  // Headerless files: infer columns from the first data row's contents.
  const sample = rows[0];
  if (sample) {
    if (mapping.date === -1) {
      mapping.date = sample.findIndex((cell) => parseDate(cell) !== null);
    }
    if (mapping.amount === -1 && mapping.debit === -1) {
      mapping.amount = sample.findIndex(
        (cell, index) => index !== mapping.date && parseAmount(cell) !== null
      );
    }
    if (mapping.description === -1) {
      let longest = -1;
      sample.forEach((cell, index) => {
        const isOther = index === mapping.date || index === mapping.amount;
        if (
          !isOther &&
          parseAmount(cell) === null &&
          (longest === -1 || cell.length > sample[longest].length)
        ) {
          longest = index;
        }
      });
      mapping.description = longest;
    }
  }
  return mapping;
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ALL_MERCHANT_PATTERNS = {
  ...MERCHANT_PATTERNS,
  ...BUSINESS_MERCHANT_PATTERNS,
  ...LOAN_MERCHANT_PATTERNS,
};

const cleanDescription = (description: string): string => {
  const trimmed = description
    .replace(/\s+/g, ' ')
    .replace(/\s*[#*]?\d{4,}.*$/, '')
    .trim();
  const base = trimmed || description.trim();
  return base
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
};

export const categorizeMerchant = (
  description: string,
  amount: number
): MerchantInfo => {
  const upper = description.toUpperCase();
  // Word boundaries keep short keys like "BP" or "ATT" from matching
  // inside unrelated words.
  const key = Object.keys(ALL_MERCHANT_PATTERNS).find((pattern) =>
    new RegExp(`\\b${escapeRegExp(pattern)}\\b`).test(upper)
  );
  if (key) {
    return { ...ALL_MERCHANT_PATTERNS[key], original: description };
  }
  return {
    cleanName: cleanDescription(description),
    logo: '💳',
    suggestedCategory: amount > 0 ? 'Income' : 'Other',
    original: description,
    confidence: 0,
  };
};

export const buildTransactions = (
  parsed: ParsedCsv,
  mapping: ColumnMapping,
  accountId: string,
  flipSigns = false
): BuildResult => {
  const transactions: Transaction[] = [];
  const skippedRows: number[] = [];
  const now = new Date().toISOString();

  parsed.rows.forEach((row, index) => {
    const date = mapping.date >= 0 ? parseDate(row[mapping.date] || '') : null;
    const description =
      mapping.description >= 0 ? (row[mapping.description] || '').trim() : '';

    let amount: number | null = null;
    if (mapping.amount >= 0) {
      amount = parseAmount(row[mapping.amount] || '');
    } else if (mapping.debit >= 0 || mapping.credit >= 0) {
      const debit =
        mapping.debit >= 0 ? parseAmount(row[mapping.debit] || '') : null;
      const credit =
        mapping.credit >= 0 ? parseAmount(row[mapping.credit] || '') : null;
      if (debit !== null || credit !== null) {
        amount =
          Math.round((Math.abs(credit || 0) - Math.abs(debit || 0)) * 100) /
          100;
      }
    }

    if (!date || !description || amount === null) {
      skippedRows.push(parsed.rowNumbers[index]);
      return;
    }
    if (flipSigns) amount = -amount;

    const cleanMerchant = categorizeMerchant(description, amount);
    transactions.push({
      id: `txn_${accountId}_${index}`,
      accountId,
      description,
      amount,
      date,
      category: cleanMerchant.suggestedCategory,
      tags: [],
      pending: false,
      cleanMerchant,
      createdAt: now,
      updatedAt: now,
    });
  });

  transactions.sort((a, b) => b.date.localeCompare(a.date));
  return { transactions, skippedRows };
};

export const createImportedAccount = (details: {
  id: string;
  name: string;
  type: AccountType;
  bankName: string;
  balance: number | null;
  transactions: Transaction[];
}): Account => {
  const now = new Date().toISOString();
  const transactionTotal =
    Math.round(
      details.transactions.reduce((sum, txn) => sum + txn.amount, 0) * 100
    ) / 100;
  let balance = details.balance ?? transactionTotal;
  // Liabilities are stored as negative balances; users enter the amount owed.
  if (
    details.balance !== null &&
    LIABILITY_ACCOUNT_TYPES.includes(details.type)
  ) {
    balance = -Math.abs(details.balance);
  }

  return {
    id: details.id,
    name: details.name.trim(),
    type: details.type,
    balance,
    accountNumber: 'CSV import',
    bankName: details.bankName.trim() || 'Imported',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    transactions: details.transactions,
  };
};

export const isImportedAccount = (account: Account): boolean =>
  account.id.startsWith(IMPORTED_ACCOUNT_PREFIX);
