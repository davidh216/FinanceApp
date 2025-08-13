import { Transaction, Account } from '../types/financial';

export interface ExportOptions {
  format: 'csv' | 'json';
  includeHeaders: boolean;
  dateFormat: string;
  currencyFormat: string;
}

export const defaultExportOptions: ExportOptions = {
  format: 'csv',
  includeHeaders: true,
  dateFormat: 'YYYY-MM-DD',
  currencyFormat: 'USD',
};

// Browser-compatible CSV export function
function convertToCSV(data: any[], headers?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Generate headers if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = csvHeaders.map(header => `"${header}"`).join(',');
  
  // Create CSV data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      // Handle different data types
      if (value === null || value === undefined) {
        return '""';
      }
      if (typeof value === 'string') {
        // Escape quotes and wrap in quotes
        return `"${value.replace(/"/g, '""')}"`;
      }
      if (typeof value === 'number') {
        return value.toString();
      }
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      }
      if (value instanceof Date) {
        return `"${value.toISOString().split('T')[0]}"`;
      }
      // For objects/arrays, convert to JSON string
      return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

// Format currency for display
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Format date for display
function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
}

// Export transactions to CSV
export function exportTransactionsToCSV(
  transactions: Transaction[],
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...defaultExportOptions, ...options };
  
  const csvData = transactions.map(transaction => ({
    Date: formatDate(transaction.date, opts.dateFormat),
    Description: transaction.description,
    Amount: formatCurrency(transaction.amount, opts.currencyFormat),
    Category: transaction.category,
    AccountID: transaction.accountId,
    Tags: transaction.tags?.join(', ') || '',
    Merchant: transaction.cleanMerchant?.cleanName || '',
    TransactionID: transaction.id,
    Status: transaction.pending ? 'Pending' : 'Cleared',
    Notes: transaction.notes || '',
  }));
  
  const headers = opts.includeHeaders ? [
    'Date', 'Description', 'Amount', 'Category', 'AccountID', 'Tags', 'Merchant', 'TransactionID', 'Status', 'Notes'
  ] : undefined;
  
  return convertToCSV(csvData, headers);
}

// Export accounts to CSV
export function exportAccountsToCSV(
  accounts: Account[],
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...defaultExportOptions, ...options };
  
  const csvData = accounts.map(account => ({
    AccountName: account.name,
    AccountType: account.type,
    Balance: formatCurrency(account.balance, opts.currencyFormat),
    BankName: account.bankName || '',
    AccountNumber: account.accountNumber || '',
    Status: account.isActive ? 'Active' : 'Inactive',
    LastUpdated: formatDate(account.updatedAt || new Date(), opts.dateFormat),
  }));
  
  const headers = opts.includeHeaders ? [
    'AccountName', 'AccountType', 'Balance', 'BankName', 'AccountNumber', 'Status', 'LastUpdated'
  ] : undefined;
  
  return convertToCSV(csvData, headers);
}

// Export financial summary to CSV
export function exportSummaryToCSV(
  summary: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    period: string;
  },
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...defaultExportOptions, ...options };
  
  const csvData = [{
    Period: summary.period,
    TotalBalance: formatCurrency(summary.totalBalance, opts.currencyFormat),
    TotalIncome: formatCurrency(summary.totalIncome, opts.currencyFormat),
    TotalExpenses: formatCurrency(summary.totalExpenses, opts.currencyFormat),
    NetSavings: formatCurrency(summary.netSavings, opts.currencyFormat),
  }];
  
  const headers = opts.includeHeaders ? [
    'Period', 'TotalBalance', 'TotalIncome', 'TotalExpenses', 'NetSavings'
  ] : undefined;
  
  return convertToCSV(csvData, headers);
}

// Download file function
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

// Export transactions with download
export function exportTransactions(
  transactions: Transaction[],
  filename: string = 'transactions.csv',
  options: Partial<ExportOptions> = {}
): void {
  const csvContent = exportTransactionsToCSV(transactions, options);
  downloadFile(csvContent, filename);
}

// Export accounts with download
export function exportAccounts(
  accounts: Account[],
  filename: string = 'accounts.csv',
  options: Partial<ExportOptions> = {}
): void {
  const csvContent = exportAccountsToCSV(accounts, options);
  downloadFile(csvContent, filename);
}

// Export summary with download
export function exportSummary(
  summary: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    period: string;
  },
  filename: string = 'financial-summary.csv',
  options: Partial<ExportOptions> = {}
): void {
  const csvContent = exportSummaryToCSV(summary, options);
  downloadFile(csvContent, filename);
}

// Export to JSON
export function exportToJSON(
  data: any,
  filename: string = 'data.json'
): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
} 