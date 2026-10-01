import React from 'react';
import { FilePlus, FolderOpen, RefreshCw } from 'lucide-react';
import { useFileSync } from '../../contexts/FileSyncContext';
import { Button } from '../ui/Button';

// "2:31 PM", or "Sep 30, 2:31 PM" on another day.
export const formatSavedTime = (iso: string, now: Date = new Date()) => {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return date.toDateString() === now.toDateString()
    ? time
    : `${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}, ${time}`;
};

// The "Auto-save to a file" section of the export dialog.
export const FileSyncPanel: React.FC = () => {
  const sync = useFileSync();
  const name = <span className="font-medium">{sync.fileName}</span>;

  let body: React.ReactNode;
  switch (sync.status) {
    case 'unsupported':
      body = (
        <p className="text-sm text-gray-600">
          This browser can't save to a file on your computer. Open FinanceApp in
          Chrome or Edge to auto-save, or download a backup below.
        </p>
      );
      break;
    case 'off':
      body = (
        <>
          <p className="text-sm text-gray-600 mb-3">
            Keep your data in a file on your computer as well as in this
            browser. Every change is saved to it, so clearing the browser
            doesn't lose anything, and you can open the same file in another
            browser.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              leftIcon={<FilePlus className="w-4 h-4" />}
              onClick={sync.createFile}
              data-testid="sync-create"
            >
              Save to a new file
            </Button>
            <Button
              variant="outline"
              leftIcon={<FolderOpen className="w-4 h-4" />}
              onClick={sync.openFile}
              data-testid="sync-open"
            >
              Open an existing file
            </Button>
          </div>
        </>
      );
      break;
    case 'reconnect':
      body = (
        <>
          <p className="text-sm text-gray-600 mb-3">
            Auto-saving to {name} is paused: the browser asks for permission
            again after it restarts.
          </p>
          <Button
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={sync.reconnect}
            data-testid="sync-reconnect"
          >
            Reconnect
          </Button>
        </>
      );
      break;
    case 'conflict':
      body = (
        <>
          <p className="text-sm text-gray-800 mb-3" data-testid="sync-conflict">
            {name} was changed somewhere else, and this browser has changes that
            aren't in it. Which do you want to keep?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={sync.keepFile} data-testid="keep-file">
              Use the file
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={sync.keepBrowser}
              data-testid="keep-browser"
            >
              Keep this browser's data
            </Button>
          </div>
        </>
      );
      break;
    default:
      body = (
        <p className="text-sm text-gray-600" data-testid="sync-summary">
          {sync.status === 'error'
            ? `Auto-saving to ${sync.fileName}.`
            : sync.status === 'saving'
            ? `Saving to ${sync.fileName}…`
            : `Every change is saved to ${sync.fileName}${
                sync.lastSavedAt
                  ? `. Last saved ${formatSavedTime(sync.lastSavedAt)}`
                  : ''
              }.`}
        </p>
      );
  }

  const connected = ['saving', 'saved', 'error'].includes(sync.status);

  return (
    <section>
      <h4 className="text-sm font-semibold text-gray-900 mb-1">
        Auto-save to a file
      </h4>
      {body}
      {sync.error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {sync.error}
        </p>
      )}
      {(connected || sync.status === 'reconnect') && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {sync.status === 'error' && (
            <button
              onClick={sync.saveNow}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Try again
            </button>
          )}
          <button
            onClick={sync.disconnect}
            className="font-medium text-gray-600 hover:text-gray-800"
            data-testid="sync-stop"
          >
            Stop auto-saving
          </button>
        </div>
      )}
    </section>
  );
};
