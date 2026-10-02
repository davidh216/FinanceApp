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
  Sealer,
  WrongPasswordError,
  createSealer,
  isEncrypted,
  openSealed,
} from '../utils/encryption';
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
  // The file is password-protected and needs the password.
  | 'locked'
  | 'saving'
  | 'saved'
  | 'error';

export interface FileSyncValue {
  status: FileSyncStatus;
  fileName: string | null;
  // When this browser last wrote or read the file (ISO time).
  lastSavedAt: string | null;
  error: string | null;
  // The file is saved encrypted with a password you set.
  isProtected: boolean;
  createFile: () => Promise<void>;
  openFile: () => Promise<void>;
  reconnect: () => Promise<void>;
  // Resolving a conflict.
  keepFile: () => void;
  keepBrowser: () => Promise<void>;
  saveNow: () => Promise<void>;
  disconnect: () => Promise<void>;
  // Opens a locked file; false for a wrong password.
  unlock: (password: string) => Promise<boolean>;
  // Saves the file encrypted with this password from now on.
  protect: (password: string) => Promise<void>;
  // Saves it as plain JSON again.
  unprotect: () => Promise<void>;
}

const noop = async () => {};

const UNSUPPORTED: FileSyncValue = {
  status: 'unsupported',
  fileName: null,
  lastSavedAt: null,
  error: null,
  isProtected: false,
  createFile: noop,
  openFile: noop,
  reconnect: noop,
  keepFile: () => {},
  keepBrowser: noop,
  saveNow: noop,
  disconnect: noop,
  unlock: async () => false,
  protect: noop,
  unprotect: noop,
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
  const { state, settings, restoreSettings, restoreImportedAccounts } =
    useFinancial();

  const [status, setStatus] = useState<FileSyncStatus>(
    fileAccess.supported ? 'off' : 'unsupported'
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProtected, setIsProtected] = useState(false);

  const fileRef = useRef<SyncFile | null>(null);
  // Whether changes go straight to the file.
  const connectedRef = useRef(false);
  const conflictRef = useRef<Backup | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  // Saves run one at a time, in order.
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  // A protected file's password, for this visit only, and the key it gives.
  const passwordRef = useRef<string | null>(null);
  const sealerRef = useRef<Sealer | null>(null);
  // A protected file waiting for its password, and what to do once open.
  const lockedRef = useRef<{
    file: SyncFile;
    text: string;
    then: 'sync' | 'open';
  } | null>(null);

  const backupNow = () => createBackup(state.accounts, settings);
  const latestBackup = useRef(backupNow);
  latestBackup.current = backupNow;

  // Everything a save writes, apart from the time.
  const snapshot = useMemo(
    () => JSON.stringify(createBackup(state.accounts, settings, new Date(0))),
    [state.accounts, settings]
  );
  const lastSnapshot = useRef(snapshot);

  const write = async () => {
    const file = fileRef.current;
    if (!file) return;
    const backup = latestBackup.current();
    setStatus('saving');
    try {
      const json = JSON.stringify(backup, null, 2);
      await file.write(
        sealerRef.current ? await sealerRef.current.seal(json) : json
      );
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
    restoreSettings(backup.settings);
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

  // A file's text as plain JSON. A protected one is opened with the
  // password you gave on this visit; without one (or with a wrong one), it
  // waits for it and this returns null.
  const unseal = async (
    file: SyncFile,
    text: string,
    then: 'sync' | 'open'
  ): Promise<string | null> => {
    if (!isEncrypted(text)) {
      passwordRef.current = null;
      sealerRef.current = null;
      setIsProtected(false);
      return text;
    }
    if (passwordRef.current) {
      try {
        const opened = await openSealed(text, passwordRef.current);
        sealerRef.current = opened.sealer;
        setIsProtected(true);
        return opened.text;
      } catch (err) {
        if (!(err instanceof WrongPasswordError)) throw err;
      }
    }
    connectedRef.current = false;
    lockedRef.current = { file, text, then };
    fileRef.current = file;
    setFileName(file.name);
    setError(null);
    setStatus('locked');
    return null;
  };

  // Brings the file and this browser back in step after a reload.
  const sync = async (file: SyncFile) => {
    let text: string | null;
    try {
      text = await unseal(file, await file.read(), 'sync');
    } catch (err) {
      connectedRef.current = false;
      setError(readError(err, file.name));
      setStatus('error');
      return;
    }
    if (text !== null) await syncWith(text, file);
  };

  const syncWith = async (text: string, file: SyncFile) => {
    let backup: Backup;
    try {
      backup = parseBackup(text);
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
    let text: string | null;
    try {
      file = await fileAccess.pickExistingFile();
      if (!file) return;
      text = await unseal(file, await file.read(), 'open');
    } catch {
      setError("Couldn't open the file.");
      return;
    }
    if (text !== null) await openWith(text, file);
  };

  const openWith = async (text: string, file: SyncFile) => {
    let backup: Backup;
    try {
      backup = parseBackup(text);
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
      // A protected file you unlocked and then turned down isn't used.
      if (fileRef.current === file && !connectedRef.current) {
        fileRef.current = null;
        passwordRef.current = null;
        sealerRef.current = null;
        setIsProtected(false);
        setFileName(null);
        setStatus('off');
      }
      return;
    }
    await use(file);
    applyBackup(backup);
    connected(backup);
  };

  const unlock = async (password: string) => {
    const locked = lockedRef.current;
    if (!locked) return false;
    let opened: { text: string; sealer: Sealer };
    try {
      opened = await openSealed(locked.text, password);
    } catch (err) {
      setError(
        err instanceof WrongPasswordError
          ? err.message
          : `Couldn't read ${locked.file.name}.`
      );
      return false;
    }
    lockedRef.current = null;
    passwordRef.current = password;
    sealerRef.current = opened.sealer;
    setIsProtected(true);
    setError(null);
    if (locked.then === 'sync') {
      await syncWith(opened.text, locked.file);
    } else {
      await openWith(opened.text, locked.file);
    }
    return true;
  };

  const protect = async (password: string) => {
    sealerRef.current = await createSealer(password);
    passwordRef.current = password;
    setIsProtected(true);
    connectedRef.current = true;
    await queueWrite();
  };

  const unprotect = async () => {
    sealerRef.current = null;
    passwordRef.current = null;
    setIsProtected(false);
    connectedRef.current = true;
    await queueWrite();
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
    lockedRef.current = null;
    passwordRef.current = null;
    sealerRef.current = null;
    setIsProtected(false);
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
    isProtected,
    createFile,
    openFile,
    reconnect,
    keepFile,
    keepBrowser,
    saveNow,
    disconnect,
    unlock,
    protect,
    unprotect,
  };

  return (
    <FileSyncContext.Provider value={value}>
      {children}
    </FileSyncContext.Provider>
  );
};
