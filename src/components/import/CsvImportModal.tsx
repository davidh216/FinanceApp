import React, { useMemo, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { AccountType } from '../../types/financial';
import { Button } from '../ui/Button';
import {
  ColumnMapping,
  IMPORTED_ACCOUNT_PREFIX,
  LIABILITY_ACCOUNT_TYPES,
  ParsedCsv,
  buildTransactions,
  createImportedAccount,
  detectColumnMapping,
  parseAmount,
  parseCsv,
} from '../../utils/csvImport';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'CREDIT', label: 'Credit card' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'BUSINESS_CHECKING', label: 'Business checking' },
  { value: 'BUSINESS_SAVINGS', label: 'Business savings' },
  { value: 'BUSINESS_CREDIT', label: 'Business credit card' },
];

const PREVIEW_ROWS = 5;

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const selectClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { importAccount } = useFinancial();
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('CHECKING');
  const [balanceInput, setBalanceInput] = useState('');
  const [flipSigns, setFlipSigns] = useState(false);

  const preview = useMemo(
    () =>
      parsed && mapping
        ? buildTransactions(parsed, mapping, 'preview', flipSigns)
        : null,
    [parsed, mapping, flipSigns]
  );

  if (!isOpen) return null;

  const isLiability = LIABILITY_ACCOUNT_TYPES.includes(accountType);
  const balance = balanceInput.trim() ? parseAmount(balanceInput) : null;
  const balanceIsInvalid = balanceInput.trim() !== '' && balance === null;
  const canImport =
    !!preview &&
    preview.transactions.length > 0 &&
    accountName.trim() !== '' &&
    !balanceIsInvalid;

  const reset = () => {
    setParsed(null);
    setMapping(null);
    setFileError(null);
    setAccountName('');
    setBankName('');
    setAccountType('CHECKING');
    setBalanceInput('');
    setFlipSigns(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = parseCsv(await readFileAsText(file));
      if (result.rows.length === 0) {
        setFileError('No transactions found in this file.');
        return;
      }
      setFileError(null);
      setParsed(result);
      setMapping(detectColumnMapping(result.headers, result.rows));
      setAccountName(file.name.replace(/\.csv$/i, ''));
    } catch {
      setFileError('Could not read this file. Is it a CSV export?');
    }
  };

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    if (!mapping) return;
    setMapping({ ...mapping, [field]: Number(value) });
  };

  const handleImport = () => {
    if (!parsed || !mapping || !canImport) return;
    const id = `${IMPORTED_ACCOUNT_PREFIX}${Date.now().toString(36)}`;
    const { transactions } = buildTransactions(parsed, mapping, id, flipSigns);
    importAccount(
      createImportedAccount({
        id,
        name: accountName,
        type: accountType,
        bankName,
        balance,
        transactions,
      })
    );
    handleClose();
  };

  const columnSelect = (
    field: keyof ColumnMapping,
    label: string,
    noneLabel = 'Not in file'
  ) => (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </span>
      <select
        className={selectClasses}
        value={mapping ? mapping[field] : -1}
        onChange={(e) => updateMapping(field, e.target.value)}
        data-testid={`map-${field}`}
      >
        <option value={-1}>{noneLabel}</option>
        {parsed?.headers.map((header, index) => (
          <option key={index} value={index}>
            {header || `Column ${index + 1}`}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-import-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto text-left">
        <div className="flex items-center justify-between p-6 border-b">
          <h3
            id="csv-import-title"
            className="text-lg font-semibold text-gray-900"
          >
            Import transactions from CSV
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!parsed ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Download a CSV of transactions from your bank's website, then
                choose it here. The file is read in your browser and never
                uploaded.
              </p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-blue-400">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Choose a CSV file
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={handleFile}
                  data-testid="csv-file-input"
                />
              </label>
              {fileError && (
                <p className="mt-3 text-sm text-red-600" role="alert">
                  {fileError}
                </p>
              )}
            </div>
          ) : (
            <>
              <section>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Account
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      Account name
                    </span>
                    <input
                      className={selectClasses}
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      data-testid="account-name-input"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      Bank
                    </span>
                    <input
                      className={selectClasses}
                      value={bankName}
                      placeholder="e.g. Chase"
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      Account type
                    </span>
                    <select
                      className={selectClasses}
                      value={accountType}
                      onChange={(e) =>
                        setAccountType(e.target.value as AccountType)
                      }
                    >
                      {ACCOUNT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {isLiability ? 'Amount owed' : 'Current balance'}
                    </span>
                    <input
                      className={selectClasses}
                      value={balanceInput}
                      placeholder="Optional"
                      inputMode="decimal"
                      onChange={(e) => setBalanceInput(e.target.value)}
                    />
                    <span
                      className={`block text-xs mt-1 ${
                        balanceIsInvalid ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      {balanceIsInvalid
                        ? 'Enter a number, like 1234.56'
                        : 'Leave blank to use the total of the imported transactions.'}
                    </span>
                  </label>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Columns
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {columnSelect('date', 'Date')}
                  {columnSelect('description', 'Description')}
                  {columnSelect(
                    'amount',
                    'Amount',
                    'Separate debit/credit columns'
                  )}
                  {mapping && mapping.amount < 0 && (
                    <>
                      {columnSelect('debit', 'Debit (money out)')}
                      {columnSelect('credit', 'Credit (money in)')}
                    </>
                  )}
                </div>
                <label className="flex items-start mt-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="mt-0.5 mr-2"
                    checked={flipSigns}
                    onChange={(e) => setFlipSigns(e.target.checked)}
                    data-testid="flip-signs"
                  />
                  <span>
                    Flip signs. Use this if purchases show as positive amounts,
                    which is common in credit card exports.
                  </span>
                </label>
              </section>

              {preview && (
                <section>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Preview
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {preview.transactions.length} transactions ready to import
                    {preview.skippedRows.length > 0 &&
                      `, ${
                        preview.skippedRows.length
                      } rows skipped (lines ${preview.skippedRows
                        .slice(0, 5)
                        .join(', ')}${
                        preview.skippedRows.length > 5 ? ', …' : ''
                      }) because they are missing a date, description or amount`}
                    .
                  </p>
                  {preview.transactions.length > 0 && (
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                          <tr>
                            <th className="px-3 py-2 font-medium">Date</th>
                            <th className="px-3 py-2 font-medium">
                              Description
                            </th>
                            <th className="px-3 py-2 font-medium">Category</th>
                            <th className="px-3 py-2 font-medium text-right">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {preview.transactions
                            .slice(0, PREVIEW_ROWS)
                            .map((txn) => (
                              <tr key={txn.id}>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {txn.date}
                                </td>
                                <td className="px-3 py-2">
                                  {txn.cleanMerchant.cleanName}
                                </td>
                                <td className="px-3 py-2">{txn.category}</td>
                                <td
                                  className={`px-3 py-2 text-right whitespace-nowrap ${
                                    txn.amount < 0
                                      ? 'text-red-600'
                                      : 'text-green-600'
                                  }`}
                                >
                                  {txn.amount < 0 ? '-' : '+'}$
                                  {Math.abs(txn.amount).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          {parsed && (
            <Button variant="ghost" onClick={reset}>
              Choose another file
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {parsed && (
            <Button
              onClick={handleImport}
              disabled={!canImport}
              data-testid="confirm-import"
            >
              Import{' '}
              {preview?.transactions.length
                ? `${preview.transactions.length} transactions`
                : ''}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
