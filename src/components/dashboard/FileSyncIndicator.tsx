import React from 'react';
import { AlertTriangle, Check, Lock, RefreshCw } from 'lucide-react';
import { useFileSync } from '../../contexts/FileSyncContext';
import { formatSavedTime } from '../import/FileSyncPanel';

// The header's auto-save status. Problems are buttons, since fixing them
// takes a click (browsers only grant file access in response to one).
export const FileSyncIndicator: React.FC<{ onOpenSettings?: () => void }> = ({
  onOpenSettings,
}) => {
  const sync = useFileSync();
  const chip =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap';

  switch (sync.status) {
    case 'saving':
    case 'saved':
      return (
        <span
          className={`${chip} text-gray-500`}
          title={
            sync.lastSavedAt
              ? `Saved to ${sync.fileName} at ${formatSavedTime(
                  sync.lastSavedAt
                )}`
              : undefined
          }
          data-testid="sync-indicator"
        >
          <Check className="w-3.5 h-3.5 text-green-600" />
          <span className="sr-only sm:not-sr-only">
            {sync.status === 'saving' ? 'Saving…' : 'Saved to file'}
          </span>
        </span>
      );
    case 'reconnect':
      return (
        <button
          onClick={sync.reconnect}
          className={`${chip} bg-amber-50 text-amber-800 hover:bg-amber-100`}
          title={`Allow FinanceApp to save to ${sync.fileName} again`}
          data-testid="sync-indicator"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reconnect file
        </button>
      );
    case 'locked':
      return (
        <button
          onClick={onOpenSettings}
          className={`${chip} bg-amber-50 text-amber-800 hover:bg-amber-100`}
          title={`Enter the password for ${sync.fileName} to keep auto-saving`}
          data-testid="sync-indicator"
        >
          <Lock className="w-3.5 h-3.5" />
          File locked
        </button>
      );
    case 'conflict':
    case 'error':
      return (
        <button
          onClick={onOpenSettings}
          className={`${chip} bg-red-50 text-red-700 hover:bg-red-100`}
          data-testid="sync-indicator"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {sync.status === 'conflict' ? 'File changed' : 'Not saved'}
        </button>
      );
    default:
      return null;
  }
};
