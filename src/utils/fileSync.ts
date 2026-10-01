// src/utils/fileSync.ts
import { STORES, idbRequest, isIndexedDbAvailable } from './idb';
// Auto-saving to a file on your computer, through the browser's File System
// Access API (Chrome and Edge). Nothing is uploaded: the browser reads and
// writes the file you pick.

export const DEFAULT_FILE_NAME = 'finance-data.json';
export const FILE_SYNC_STORAGE_KEY = 'financeapp.fileSync';

export type Permission = 'granted' | 'prompt' | 'denied';

// The parts of a file handle the app uses, so tests can supply their own.
export interface SyncFile {
  name: string;
  queryPermission: () => Promise<Permission>;
  // Must be called from a click: browsers only ask in response to one.
  requestPermission: () => Promise<Permission>;
  read: () => Promise<string>;
  write: (text: string) => Promise<void>;
}

export interface FileAccess {
  supported: boolean;
  // Resolve to null when you cancel the picker.
  pickNewFile: () => Promise<SyncFile | null>;
  pickExistingFile: () => Promise<SyncFile | null>;
  // The file chosen before, remembered across visits.
  loadRememberedFile: () => Promise<SyncFile | null>;
  rememberFile: (file: SyncFile | null) => Promise<void>;
}

// Remembered in localStorage next to the app's data, so a reload knows
// whether this browser has changes the file hasn't seen.
export interface SyncMeta {
  // The exportedAt of the last backup this browser wrote or read.
  lastSyncedAt: string;
  // Changes made while the file wasn't connected, or a save failed.
  pending: boolean;
}

export const loadSyncMeta = (): SyncMeta | null => {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(FILE_SYNC_STORAGE_KEY) || 'null'
    );
    return value && typeof value.lastSyncedAt === 'string'
      ? { lastSyncedAt: value.lastSyncedAt, pending: value.pending === true }
      : null;
  } catch {
    return null;
  }
};

export const saveSyncMeta = (meta: SyncMeta | null) => {
  try {
    if (meta) {
      window.localStorage.setItem(FILE_SYNC_STORAGE_KEY, JSON.stringify(meta));
    } else {
      window.localStorage.removeItem(FILE_SYNC_STORAGE_KEY);
    }
  } catch {
    // Without storage the file is still saved; a reload just can't tell
    // whether this browser had unsaved changes.
  }
};

export type ReconnectAction =
  // The file is as this browser left it, so nothing to do.
  | 'none'
  // Changed elsewhere (another browser or computer): use the file.
  | 'load'
  // Only this browser changed: save its changes to the file.
  | 'save'
  // Both changed: you choose which to keep.
  | 'conflict';

// What to do when reconnecting to the file after a reload.
export const reconnectAction = (
  fileExportedAt: string,
  meta: SyncMeta | null
): ReconnectAction => {
  const changedElsewhere = !meta || fileExportedAt !== meta.lastSyncedAt;
  const pending = meta?.pending === true;
  if (changedElsewhere && pending) return 'conflict';
  if (changedElsewhere) return 'load';
  return pending ? 'save' : 'none';
};

// ---- The browser's implementation ----

// Chrome and Edge's file handles; not yet in TypeScript's DOM types.
interface BrowserFileHandle {
  name: string;
  queryPermission: (options: { mode: 'readwrite' }) => Promise<Permission>;
  requestPermission: (options: { mode: 'readwrite' }) => Promise<Permission>;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
}

const JSON_FILE_TYPES = [
  {
    description: 'FinanceApp data',
    accept: { 'application/json': ['.json'] },
  },
];

const wrap = (
  handle: BrowserFileHandle
): SyncFile & {
  handle: BrowserFileHandle;
} => ({
  handle,
  name: handle.name,
  queryPermission: () => handle.queryPermission({ mode: 'readwrite' }),
  requestPermission: () => handle.requestPermission({ mode: 'readwrite' }),
  read: async () => (await handle.getFile()).text(),
  write: async (text: string) => {
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  },
});

const isCancel = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

// File handles can't go in localStorage, but IndexedDB keeps them.
const HANDLE_KEY = 'file';

const withStore = <T>(
  mode: IDBTransactionMode,
  use: (store: IDBObjectStore) => IDBRequest
): Promise<T> => idbRequest<T>(STORES.fileSync, mode, use);

const picker = (window as any) || {};

export const browserFileAccess: FileAccess = {
  supported:
    typeof window !== 'undefined' &&
    typeof picker.showSaveFilePicker === 'function' &&
    isIndexedDbAvailable(),

  pickNewFile: async () => {
    try {
      const handle = await picker.showSaveFilePicker({
        suggestedName: DEFAULT_FILE_NAME,
        types: JSON_FILE_TYPES,
      });
      return wrap(handle);
    } catch (error) {
      if (isCancel(error)) return null;
      throw error;
    }
  },

  pickExistingFile: async () => {
    try {
      const [handle] = await picker.showOpenFilePicker({
        types: JSON_FILE_TYPES,
        multiple: false,
      });
      return wrap(handle);
    } catch (error) {
      if (isCancel(error)) return null;
      throw error;
    }
  },

  loadRememberedFile: async () => {
    try {
      const handle = await withStore<BrowserFileHandle | undefined>(
        'readonly',
        (store) => store.get(HANDLE_KEY)
      );
      return handle ? wrap(handle) : null;
    } catch {
      return null;
    }
  },

  rememberFile: async (file) => {
    await withStore('readwrite', (store) =>
      file
        ? store.put((file as ReturnType<typeof wrap>).handle, HANDLE_KEY)
        : store.delete(HANDLE_KEY)
    );
  },
};
