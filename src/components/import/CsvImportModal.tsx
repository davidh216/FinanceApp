import React, { useMemo, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { AccountType } from '../../types/financial';
import { Button } from '../ui/Button';
import { ACCOUNT_TYPE_OPTIONS, isClosed } from '../../utils/accountSettings';
import {
  ColumnMapping,
  IMPORTED_ACCOUNT_PREFIX,
  LIABILITY_ACCOUNT_TYPES,
  ParsedCsv,
  buildTransactions,
  createImportedAccount,
  detectColumnMapping,
  isImportedAccount,
  mergeImportedTransactions,
  parseAmount,
  parseCsv,
  splitDuplicates,
} from '../../utils/csvImport';
import { findTransferMatches, linkTransfers } from '../../utils/transfers';
import { formatMoney } from '../../utils/format';
import { readFileAsText } from '../../utils/files';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Imported account to pre-select as the import target.
  defaultAccountId?: string;
}

const NEW_ACCOUNT = 'new';

const PREVIEW_ROWS = 5;

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

const selectClasses =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  defaultAccountId,
}) => {
  const {
    state,
    importAccount,
    updateImportedAccount,
    replaceAccount,
    categoryRules,
  } = useFinancial();
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('CHECKING');
  const [balanceInput, setBalanceInput] = useState('');
  const [flipSigns, setFlipSigns] = useState(false);
  const [targetAccountId, setTargetAccountId] = useState(NEW_ACCOUNT);

  // Only imported accounts are offered: the built-in demo accounts are
  // regenerated on every load, so transactions added to them would be lost.
  const importableAccounts = state.accounts.filter(isImportedAccount);
  const targetAccount = importableAccounts.find(
    (acc) => acc.id === targetAccountId
  );

  // Other imported accounts this file's transactions can be transfers with.
  const transferAccounts = importableAccounts.filter(
    (acc) => acc.id !== targetAccount?.id
  );

  const preview = useMemo(() => {
    if (!parsed || !mapping) return null;
    const built = buildTransactions(
      parsed,
      mapping,
      'preview',
      flipSigns,
      undefined,
      categoryRules
    );
    const { fresh, duplicates } = targetAccount
      ? splitDuplicates(built.transactions, targetAccount.transactions || [])
      : { fresh: built.transactions, duplicates: [] };
    const transferMatches = findTransferMatches(
      fresh,
      targetAccount?.id ?? 'preview',
      transferAccounts
    );
    const transferAccountNames = Array.from(
      new Set(
        transferMatches.map(
          (m) =>
            transferAccounts.find((acc) => acc.id === m.otherAccountId)?.name
        )
      )
    );
    // Show matched transactions as they will be saved: as transfers.
    const rows = linkTransfers(
      fresh,
      targetAccount?.id ?? 'preview',
      transferAccounts,
      transferMatches
    ).transactions;
    return {
      ...built,
      fresh,
      rows,
      duplicates,
      transferMatches,
      transferAccountNames,
    };
    // transferAccounts is derived from state.accounts and targetAccount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    parsed,
    mapping,
    flipSigns,
    targetAccount,
    state.accounts,
    categoryRules,
  ]);

  if (!isOpen) return null;

  const isLiability = LIABILITY_ACCOUNT_TYPES.includes(
    targetAccount?.type ?? accountType
  );
  const balance = balanceInput.trim() ? parseAmount(balanceInput) : null;
  const balanceIsInvalid = balanceInput.trim() !== '' && balance === null;
  const canImport =
    !!preview &&
    preview.fresh.length > 0 &&
    (!!targetAccount || accountName.trim() !== '') &&
    !balanceIsInvalid;

  const selectTarget = (id: string) => {
    setTargetAccountId(id);
    const account = importableAccounts.find((acc) => acc.id === id);
    setFlipSigns(account?.importSettings?.flipSigns ?? false);
  };

  const reset = () => {
    setParsed(null);
    setMapping(null);
    setFileError(null);
    setAccountName('');
    setBankName('');
    setAccountType('CHECKING');
    setBalanceInput('');
    setFlipSigns(false);
    setTargetAccountId(NEW_ACCOUNT);
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
      selectTarget(
        importableAccounts.some((acc) => acc.id === defaultAccountId)
          ? (defaultAccountId as string)
          : NEW_ACCOUNT
      );
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
    const batch = Date.now().toString(36);

    if (targetAccount) {
      const { transactions } = buildTransactions(
        parsed,
        mapping,
        targetAccount.id,
        flipSigns,
        `${targetAccount.id}_${batch}`,
        categoryRules
      );
      const { fresh } = splitDuplicates(
        transactions,
        targetAccount.transactions || []
      );
      const linked = linkTransfers(
        fresh,
        targetAccount.id,
        transferAccounts,
        findTransferMatches(fresh, targetAccount.id, transferAccounts)
      );
      linked.changedAccounts.forEach(replaceAccount);
      updateImportedAccount(
        mergeImportedTransactions(
          targetAccount,
          linked.transactions,
          balance,
          flipSigns
        )
      );
    } else {
      const id = `${IMPORTED_ACCOUNT_PREFIX}${batch}`;
      const { transactions } = buildTransactions(
        parsed,
        mapping,
        id,
        flipSigns,
        undefined,
        categoryRules
      );
      const linked = linkTransfers(
        transactions,
        id,
        transferAccounts,
        findTransferMatches(transactions, id, transferAccounts)
      );
      linked.changedAccounts.forEach(replaceAccount);
      importAccount(
        createImportedAccount({
          id,
          name: accountName,
          type: accountType,
          bankName,
          balance,
          transactions: linked.transactions,
          flipSigns,
        })
      );
    }
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
                  {importableAccounts.length > 0 && (
                    <label className="block sm:col-span-2">
                      <span className="block text-sm font-medium text-gray-700 mb-1">
                        Import into
                      </span>
                      <select
                        className={selectClasses}
                        value={targetAccountId}
                        onChange={(e) => selectTarget(e.target.value)}
                        data-testid="import-target"
                      >
                        <option value={NEW_ACCOUNT}>New account</option>
                        {importableAccounts
                          .filter(
                            (acc) =>
                              acc.id === targetAccountId ||
                              (!acc.manual && !isClosed(acc))
                          )
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  {!targetAccount && (
                    <>
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
                    </>
                  )}
                  <label className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-1">
                      {isLiability ? 'Amount owed' : 'Current balance'}
                      {targetAccount && ' (optional)'}
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
                        : targetAccount
                        ? 'Leave blank to add the new transactions to the current balance.'
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
                  <p
                    className="text-sm text-gray-600 mb-3"
                    data-testid="import-summary"
                  >
                    {targetAccount
                      ? preview.fresh.length === 0 &&
                        preview.duplicates.length > 0
                        ? `Everything in this file is already in ${targetAccount.name}`
                        : `${plural(
                            preview.fresh.length,
                            'new transaction'
                          )} to import${
                            preview.duplicates.length > 0
                              ? `, ${preview.duplicates.length} already in ${targetAccount.name} will be skipped`
                              : ''
                          }`
                      : `${plural(
                          preview.fresh.length,
                          'transaction'
                        )} ready to import`}
                    {preview.skippedRows.length > 0 &&
                      `, ${plural(
                        preview.skippedRows.length,
                        'row'
                      )} skipped (lines ${preview.skippedRows
                        .slice(0, 5)
                        .join(', ')}${
                        preview.skippedRows.length > 5 ? ', …' : ''
                      }) because they are missing a date, description or amount`}
                    .
                  </p>
                  {preview.transferMatches.length > 0 && (
                    <p
                      className="text-sm text-gray-600 mb-3"
                      data-testid="import-transfers"
                    >
                      {plural(preview.transferMatches.length, 'transaction')}{' '}
                      {preview.transferMatches.length === 1
                        ? 'matches a payment'
                        : 'match payments'}{' '}
                      in {preview.transferAccountNames.join(' and ')} and will
                      be recorded as{' '}
                      {preview.transferMatches.length === 1
                        ? 'a transfer'
                        : 'transfers'}
                      , not income or spending.
                    </p>
                  )}
                  {preview.fresh.length > 0 && (
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
                          {preview.rows.slice(0, PREVIEW_ROWS).map((txn) => (
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
                                {txn.amount < 0 ? '-' : '+'}
                                {formatMoney(txn.amount)}
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
              {preview?.fresh.length
                ? plural(preview.fresh.length, 'transaction')
                : ''}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
