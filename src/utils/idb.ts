// src/utils/idb.ts
// The app's IndexedDB database, shared by every feature that uses it so
// they agree on its version and stores.

const DB_NAME = 'financeapp';
// 1: fileSync. 2: data (imported accounts).
const DB_VERSION = 2;

export const STORES = {
  // The auto-save file's handle.
  fileSync: 'fileSync',
  // Imported accounts.
  data: 'data',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

export const isIndexedDbAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.indexedDB;
  } catch {
    // Some browsers throw when storage is blocked.
    return false;
  }
};

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const open = window.indexedDB.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = () => {
      const db = open.result;
      for (const name of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      }
    };
    open.onsuccess = () => {
      const db = open.result;
      // Let a newer version of the app, open in another tab, upgrade.
      db.onversionchange = () => db.close();
      resolve(db);
    };
    open.onerror = () => reject(open.error);
    open.onblocked = () =>
      reject(new Error('Another tab is using an older version of the app.'));
  });

// Runs one request and resolves with its result once the transaction has
// committed, so a resolved write is on disk.
export const idbRequest = async <T>(
  store: StoreName,
  mode: IDBTransactionMode,
  use: (store: IDBObjectStore) => IDBRequest
): Promise<T> => {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(store, mode);
      const request = use(transaction.objectStore(store));
      transaction.oncomplete = () => resolve(request.result as T);
      transaction.onerror = () =>
        reject(transaction.error ?? request.error ?? new Error('IDB error'));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('IDB transaction aborted'));
    });
  } finally {
    db.close();
  }
};
