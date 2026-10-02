import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useFinancial } from './FinancialContext';
import { isImportedAccount } from '../utils/csvImport';
import {
  Backup,
  BackupError,
  createBackup,
  parseBackup,
} from '../utils/backup';
import {
  FileAccess,
  SyncFile,
  browserFileAccess,
  loadSyncMeta,
  reconnectAction,
  saveSyncMeta,
} from '../utils/fileSync';

export type FileSyncStatus =
  // The browser can't write files (Firefox, Safari).
  | 'unsupported'
  // No file chosen.
  | 'off'
  // A file was chosen before; the browser needs a click to allow it again.
  | 'reconnect'
  // The file and this browser both changed: you pick one.
  | 'conflict'
  | 'saving'
  | 'saved'
  | 'error';

export interface FileSyncValue {
  status: FileSyncStatus;
  fileName: string | null;
  // When this browser last wrote or read the file (ISO time).
  lastSavedAt: string | null;
  error: string | null;
  createFile: () => Promise<void>;
  openFile: () => Promise<void>;
  reconnect: () => Promise<void>;
  // Resolving a conflict.
  keepFile: () => void;
  keepBrowser: () => Promise<void>;
  saveNow: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const noop = async () => {};

const UNSUPPORTED: FileSyncValue = {
  status: 'unsupported',
  fileName: null,
  lastSavedAt: null,
  error: null,
  createFile: noop,
  openFile: noop,
  reconnect: noop,
  keepFile: () => {},
  keepBrowser: noop,
  saveNow: noop,
  disconnect: noop,
};

const FileSyncContext = createContext<FileSyncValue>(UNSUPPORTED);

export const useFileSync = () => useContext(FileSyncContext);

// Saves are grouped, so typing a note writes the file once.
export const SAVE_DELAY_MS = 500;

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

const readError = (error: unknown, fileName: string) =>
  error instanceof BackupError
    ? `${fileName} isn't a FinanceApp data file.`
    : `Couldn't read ${fileName}. It may have been moved or deleted.`;

export const FileSyncProvider: React.FC<{
  children: React.ReactNode;
  fileAccess?: FileAccess;
}> = ({ children, fileAccess = browserFileAccess }) => {
  const {
    state,
    showDemoAccounts,
    setShowDemoAccounts,
    budgets,
    setBudgets,
    goals,
    setGoals,
    budgetRollover,
    setBudgetRollover,
    categoryRules,
    setCategoryRules,
    restoreImportedAccounts,
  } = useFinancial();

  const [status, setStatus] = useState<FileSyncStatus>(
    fileAccess.supported ? 'off' : 'unsupported'
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<SyncFile | null>(null);
  // Whether changes go straight to the file.
  const connectedRef = useRef(false);
  const conflictRef = useRef<Backup | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  // Saves run one at a time, in order.
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const backupNow = () =>
    createBackup(
      state.accounts,
      showDemoAccounts,
      budgets,
      new Date(),
      categoryRules,
      goals,
      budgetRollover
    );
  const latestBackup = useRef(backupNow);
  latestBackup.current = backupNow;

  // Everything a save writes, apart from the time.
  const snapshot = useMemo(
    () =>
      JSON.stringify(
        createBackup(
          state.accounts,
          showDemoAccounts,
          budgets,
          new Date(0),
          categoryRules,
          goals,
          budgetRollover
        )
      ),
    [
      state.accounts,
      showDemoAccounts,
      budgets,
      categoryRules,
      goals,
      budgetRollover,
    ]
  );
  const lastSnapshot = useRef(snapshot);

  const write = async () => {
    const file = fileRef.current;
    if (!file) return;
    const backup = latestBackup.current();
    setStatus('saving');
    try {
      await file.write(JSON.stringify(backup, null, 2));
      saveSyncMeta({ lastSyncedAt: backup.exportedAt, pending: false });
      setLastSavedAt(backup.exportedAt);
      setError(null);
      setStatus('saved');
    } catch {
      const meta = loadSyncMeta();
      saveSyncMeta({ lastSyncedAt: meta?.lastSyncedAt ?? '', pending: true });
      setError(
        `Couldn't save to ${file.name}. Your changes are kept in this browser.`
      );
      setStatus('error');
    }
  };

  const queueWrite = () => {
    clearTimeout(timerRef.current);
    queueRef.current = queueRef.current.then(write);
    return queueRef.current;
  };

  const markPending = () => {
    const meta = loadSyncMeta();
    if (meta) saveSyncMeta({ ...meta, pending: true });
  };

  // Every change is saved to the connected file. Without one, a chosen file
  // is told on reconnecting that this browser has changes.
  useEffect(() => {
    if (snapshot === lastSnapshot.current) return;
    lastSnapshot.current = snapshot;
    markPending();
    if (connectedRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(queueWrite, SAVE_DELAY_MS);
    }
    // queueWrite only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const applyBackup = (backup: Backup) => {
    restoreImportedAccounts(backup.accounts);
    setShowDemoAccounts(backup.settings.showDemoAccounts);
    setBudgets(backup.settings.budgets);
    setGoals(backup.settings.goals);
    setBudgetRollover(backup.settings.budgetRollover);
    setCategoryRules(backup.settings.categoryRules);
  };

  const connected = (backup: Backup) => {
    connectedRef.current = true;
    saveSyncMeta({ lastSyncedAt: backup.exportedAt, pending: false });
    setLastSavedAt(backup.exportedAt);
    setError(null);
    setStatus('saved');
  };

  const use = async (file: SyncFile) => {
    fileRef.current = file;
    setFileName(file.name);
    try {
      await fileAccess.rememberFile(file);
    } catch {
      // Saving still works; a reload just won't remember the file.
    }
  };

  // Brings the file and this browser back in step after a reload.
  const sync = async (file: SyncFile) => {
    let backup: Backup;
    try {
      backup = parseBackup(await file.read());
    } catch (err) {
      connectedRef.current = false;
      setError(readError(err, file.name));
      setStatus('error');
      return;
    }
    switch (reconnectAction(backup.exportedAt, loadSyncMeta())) {
      case 'none':
        connected(backup);
        break;
      case 'load':
        applyBackup(backup);
        connected(backup);
        break;
      case 'save':
        connectedRef.current = true;
        await queueWrite();
        break;
      case 'conflict':
        connectedRef.current = false;
        conflictRef.current = backup;
        setStatus('conflict');
        break;
    }
  };

  // Reconnects to the file chosen on an earlier visit.
  useEffect(() => {
    if (!fileAccess.supported) return;
    let cancelled = false;
    (async () => {
      const file = await fileAccess.loadRememberedFile();
      if (cancelled || !file) return;
      fileRef.current = file;
      setFileName(file.name);
      if ((await file.queryPermission()) === 'granted') {
        if (!cancelled) await sync(file);
      } else if (!cancelled) {
        setStatus('reconnect');
      }
    })();
    return () => {
      cancelled = true;
    };
    // Once, on load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createFile = async () => {
    let file: SyncFile | null;
    try {
      file = await fileAccess.pickNewFile();
    } catch {
      setError("Couldn't create the file. Try another folder.");
      return;
    }
    if (!file) return;
    await use(file);
    connectedRef.current = true;
    await queueWrite();
  };

  const openFile = async () => {
    let file: SyncFile | null;
    let backup: Backup;
    try {
      file = await fileAccess.pickExistingFile();
      if (!file) return;
      backup = parseBackup(await file.read());
    } catch (err) {
      setError(
        err instanceof BackupError
          ? "That file isn't a FinanceApp data file."
          : "Couldn't open the file."
      );
      return;
    }
    const current = state.accounts.filter(isImportedAccount).length;
    if (
      current > 0 &&
      !window.confirm(
        `Use ${file.name}? Its ${plural(
          backup.accounts.length,
          'account'
        )} replace the ${plural(current, 'account')} in this browser.`
      )
    ) {
      return;
    }
    await use(file);
    applyBackup(backup);
    connected(backup);
  };

  const reconnect = async () => {
    const file = fileRef.current;
    if (!file) return;
    if ((await file.requestPermission()) !== 'granted') {
      setError(`FinanceApp needs your permission to save to ${file.name}.`);
      return;
    }
    await sync(file);
  };

  const keepFile = () => {
    const backup = conflictRef.current;
    if (!backup) return;
    conflictRef.current = null;
    applyBackup(backup);
    connected(backup);
  };

  const keepBrowser = async () => {
    conflictRef.current = null;
    connectedRef.current = true;
    await queueWrite();
  };

  const saveNow = async () => {
    connectedRef.current = true;
    await queueWrite();
  };

  const disconnect = async () => {
    clearTimeout(timerRef.current);
    connectedRef.current = false;
    conflictRef.current = null;
    fileRef.current = null;
    saveSyncMeta(null);
    setFileName(null);
    setLastSavedAt(null);
    setError(null);
    setStatus('off');
    try {
      await fileAccess.rememberFile(null);
    } catch {
      // Nothing to forget.
    }
  };

  const value: FileSyncValue = {
    status,
    fileName,
    lastSavedAt,
    error,
    createFile,
    openFile,
    reconnect,
    keepFile,
    keepBrowser,
    saveNow,
    disconnect,
  };

  return (
    <FileSyncContext.Provider value={value}>
      {children}
    </FileSyncContext.Provider>
  );
};
