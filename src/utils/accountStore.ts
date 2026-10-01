// src/utils/accountStore.ts
// Where imported accounts are kept between visits. IndexedDB holds hundreds
// of megabytes; localStorage, used before and as a fallback, only about 5
// MB, which runs out at roughly 11,000 transactions.
import { Account } from '../types/financial';
import { isImportedAccount } from './csvImport';
import { STORES, idbRequest, isIndexedDbAvailable } from './idb';

export const LEGACY_ACCOUNTS_KEY = 'financeapp.importedAccounts';
const RECORD_KEY = 'importedAccounts';

export interface AccountStore {
  kind: 'indexeddb' | 'localStorage';
  // null when nothing has been saved here yet.
  load: () => Promise<Account[] | null>;
  // Rejects when the browser couldn't save, for example when it's full.
  save: (accounts: Account[]) => Promise<void>;
}

// Keeps what looks like an imported account; anything else in storage is
// ignored rather than breaking the app.
export const cleanStoredAccounts = (value: unknown): Account[] =>
  Array.isArray(value)
    ? value.filter(
        (account) =>
          typeof account?.id === 'string' && isImportedAccount(account)
      )
    : [];

// The accounts saved in localStorage (before IndexedDB, or as the fallback).
export const loadLegacyAccounts = (): Account[] | null => {
  try {
    const stored = window.localStorage.getItem(LEGACY_ACCOUNTS_KEY);
    return stored === null ? null : cleanStoredAccounts(JSON.parse(stored));
  } catch {
    return null;
  }
};

export const removeLegacyAccounts = () => {
  try {
    window.localStorage.removeItem(LEGACY_ACCOUNTS_KEY);
  } catch {
    // Nothing to remove.
  }
};

export const localStorageAccountStore: AccountStore = {
  kind: 'localStorage',
  load: async () => loadLegacyAccounts(),
  save: async (accounts) => {
    window.localStorage.setItem(LEGACY_ACCOUNTS_KEY, JSON.stringify(accounts));
  },
};

export const indexedDbAccountStore: AccountStore = {
  kind: 'indexeddb',
  load: async () => {
    const value = await idbRequest<unknown>(STORES.data, 'readonly', (store) =>
      store.get(RECORD_KEY)
    );
    return value === undefined ? null : cleanStoredAccounts(value);
  },
  save: async (accounts) => {
    await idbRequest(STORES.data, 'readwrite', (store) =>
      store.put(accounts, RECORD_KEY)
    );
  },
};

export const defaultAccountStore = (): AccountStore =>
  isIndexedDbAvailable() ? indexedDbAccountStore : localStorageAccountStore;

// Loads the saved accounts, moving them from localStorage into IndexedDB.
// A localStorage copy can only come from a version of the app before
// IndexedDB, so it's the newest and replaces what IndexedDB holds. It's
// removed only once the new copy has been read back, so a failed move loses
// nothing.
export const loadAccounts = async (store: AccountStore): Promise<Account[]> => {
  if (store.kind === 'localStorage') return (await store.load()) ?? [];
  const legacy = loadLegacyAccounts();
  if (legacy === null) return (await store.load()) ?? [];
  await store.save(legacy);
  const check = await store.load();
  if (check === null || check.length !== legacy.length) {
    throw new Error("The accounts couldn't be moved to IndexedDB.");
  }
  removeLegacyAccounts();
  return legacy;
};
