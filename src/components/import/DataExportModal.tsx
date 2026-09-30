import React, { useState } from 'react';
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { useFinancial } from '../../contexts/FinancialContext';
import { Button } from '../ui/Button';
import { isImportedAccount } from '../../utils/csvImport';
import {
  Backup,
  BackupError,
  createBackup,
  parseBackup,
  transactionsToCsv,
} from '../../utils/backup';
import { toLocalDateString } from '../../utils/date';
import { downloadFile, readFileAsText } from '../../utils/files';

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

const countTransactions = (accounts: { transactions?: unknown[] }[]) =>
  accounts.reduce(
    (sum, account) => sum + (account.transactions?.length || 0),
    0
  );

export const DataExportModal: React.FC<DataExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    state,
    showDemoAccounts,
    setShowDemoAccounts,
    restoreImportedAccounts,
  } = useFinancial();
  const [pendingRestore, setPendingRestore] = useState<Backup | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  if (!isOpen) return null;

  const importedAccounts = state.accounts.filter(isImportedAccount);
  const today = toLocalDateString(new Date());

  const handleClose = () => {
    setPendingRestore(null);
    setRestoreError(null);
    onClose();
  };

  const handleBackup = () => {
    downloadFile(
      `financeapp-backup-${today}.json`,
      JSON.stringify(createBackup(state.accounts, showDemoAccounts), null, 2),
      'application/json'
    );
  };

  const handleCsv = () => {
    downloadFile(
      `financeapp-transactions-${today}.csv`,
      transactionsToCsv(state.accounts),
      'text/csv'
    );
  };

  const handleRestoreFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPendingRestore(null);
    setRestoreError(null);
    try {
      setPendingRestore(parseBackup(await readFileAsText(file)));
    } catch (error) {
      setRestoreError(
        error instanceof BackupError
          ? error.message
          : "This file couldn't be read."
      );
    }
  };

  const handleRestore = () => {
    if (!pendingRestore) return;
    restoreImportedAccounts(pendingRestore.accounts);
    setShowDemoAccounts(pendingRestore.settings.showDemoAccounts);
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-export-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto text-left">
        <div className="flex items-center justify-between p-6 border-b">
          <h3
            id="data-export-title"
            className="text-lg font-semibold text-gray-900"
          >
            Export and back up
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
          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Backup</h4>
            <p className="text-sm text-gray-600 mb-3">
              Your imported accounts are stored only in this browser. Clearing
              site data or switching browser loses them, so keep a backup file
              somewhere safe.
            </p>
            <Button
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleBackup}
              disabled={importedAccounts.length === 0}
              data-testid="download-backup"
            >
              Download backup
            </Button>
            <p
              className="mt-2 text-xs text-gray-500"
              data-testid="backup-summary"
            >
              {importedAccounts.length === 0
                ? 'Import an account first: there is nothing to back up yet.'
                : `${plural(importedAccounts.length, 'account')}, ${plural(
                    countTransactions(importedAccounts),
                    'transaction'
                  )}, with their tags and transfer links.`}
            </p>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              Export transactions
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              A spreadsheet of every transaction in the accounts you're viewing.
            </p>
            <Button
              variant="outline"
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={handleCsv}
              disabled={countTransactions(state.accounts) === 0}
              data-testid="export-csv"
            >
              Export CSV
            </Button>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              Restore from a backup
            </h4>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
              <Upload className="w-4 h-4" />
              Choose a backup file
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={handleRestoreFile}
                data-testid="backup-file-input"
              />
            </label>
            {restoreError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {restoreError}
              </p>
            )}
            {pendingRestore && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p
                  className="text-sm text-gray-800"
                  data-testid="restore-summary"
                >
                  This backup has{' '}
                  {plural(pendingRestore.accounts.length, 'account')} and{' '}
                  {plural(
                    countTransactions(pendingRestore.accounts),
                    'transaction'
                  )}
                  .{' '}
                  {importedAccounts.length > 0
                    ? `Restoring replaces your ${plural(
                        importedAccounts.length,
                        'imported account'
                      )}.`
                    : ''}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleRestore}
                    data-testid="confirm-restore"
                  >
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingRestore(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
