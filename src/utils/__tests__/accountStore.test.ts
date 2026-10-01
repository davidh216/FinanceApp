import { installFakeIndexedDb } from '../../testUtils/fakeIndexedDb';
import { Account } from '../../types/financial';
import {
  AccountStore,
  LEGACY_ACCOUNTS_KEY,
  indexedDbAccountStore,
  loadAccounts,
  localStorageAccountStore,
} from '../accountStore';
import { STORES, idbRequest } from '../idb';

const account = (id: string): Account => ({
  id: `acc_import_${id}`,
  name: id,
  type: 'CHECKING',
  balance: 100,
  accountNumber: 'CSV import',
  bankName: 'Imported',
  isActive: true,
  createdAt: '2025-06-01',
  updatedAt: '2025-06-01',
  transactions: [],
});

const setLegacy = (value: unknown) =>
  window.localStorage.setItem(LEGACY_ACCOUNTS_KEY, JSON.stringify(value));

beforeEach(() => {
  installFakeIndexedDb();
  window.localStorage.clear();
});

describe('indexedDbAccountStore', () => {
  it('saves and loads accounts, and reports nothing saved yet', async () => {
    expect(await indexedDbAccountStore.load()).toBeNull();
    await indexedDbAccountStore.save([account('a'), account('b')]);
    expect(
      (await indexedDbAccountStore.load())!.map((acc) => acc.name)
    ).toEqual(['a', 'b']);
    await indexedDbAccountStore.save([]);
    expect(await indexedDbAccountStore.load()).toEqual([]);
  });

  it('ignores anything that is not an imported account', async () => {
    await indexedDbAccountStore.save([
      account('a'),
      { id: 'demo_1' },
      null,
    ] as unknown as Account[]);
    expect(
      (await indexedDbAccountStore.load())!.map((acc) => acc.name)
    ).toEqual(['a']);
  });
});

describe('upgrading the database', () => {
  // Version 1, from before accounts moved here, held only the auto-save
  // file's handle.
  const createVersion1 = () =>
    new Promise<void>((resolve, reject) => {
      const open = window.indexedDB.open('financeapp', 1);
      open.onupgradeneeded = () => {
        open.result
          .createObjectStore('fileSync')
          .put({ name: 'finance-data.json' }, 'file');
      };
      open.onsuccess = () => {
        open.result.close();
        resolve();
      };
      open.onerror = () => reject(open.error);
    });

  it("adds the accounts store and keeps the auto-save file's handle", async () => {
    await createVersion1();
    await indexedDbAccountStore.save([account('a')]);
    expect(
      (await indexedDbAccountStore.load())!.map((acc) => acc.name)
    ).toEqual(['a']);
    expect(
      await idbRequest(STORES.fileSync, 'readonly', (store) =>
        store.get('file')
      )
    ).toEqual({ name: 'finance-data.json' });
  });
});

describe('loadAccounts', () => {
  it('moves accounts from localStorage into IndexedDB once', async () => {
    setLegacy([account('a')]);
    expect(
      (await loadAccounts(indexedDbAccountStore)).map((a) => a.name)
    ).toEqual(['a']);
    expect(window.localStorage.getItem(LEGACY_ACCOUNTS_KEY)).toBeNull();
    expect(
      (await indexedDbAccountStore.load())!.map((acc) => acc.name)
    ).toEqual(['a']);

    // Next visit: straight from IndexedDB.
    expect(
      (await loadAccounts(indexedDbAccountStore)).map((a) => a.name)
    ).toEqual(['a']);
  });

  it('starts empty with nothing saved anywhere', async () => {
    expect(await loadAccounts(indexedDbAccountStore)).toEqual([]);
  });

  it('keeps the localStorage copy when the move cannot be checked', async () => {
    setLegacy([account('a')]);
    const broken: AccountStore = {
      kind: 'indexeddb',
      load: async () => null,
      save: async () => {},
    };
    await expect(loadAccounts(broken)).rejects.toThrow("couldn't be moved");
    expect(window.localStorage.getItem(LEGACY_ACCOUNTS_KEY)).not.toBeNull();
  });

  it('uses localStorage directly in browsers without IndexedDB', async () => {
    setLegacy([account('a')]);
    expect(
      (await loadAccounts(localStorageAccountStore)).map((a) => a.name)
    ).toEqual(['a']);
    // Left where it is.
    expect(window.localStorage.getItem(LEGACY_ACCOUNTS_KEY)).not.toBeNull();
  });
});
