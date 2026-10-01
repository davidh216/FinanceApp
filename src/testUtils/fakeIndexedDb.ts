// Gives tests a real (in-memory) IndexedDB. jsdom has none, and no
// structuredClone, which fake-indexeddb uses to store values.
import { IDBFactory } from 'fake-indexeddb';
import { deserialize, serialize } from 'v8';

export const installFakeIndexedDb = () => {
  const global = globalThis as any;
  if (typeof global.structuredClone !== 'function') {
    global.structuredClone = (value: unknown) => deserialize(serialize(value));
  }
  // A fresh, empty database each time.
  window.indexedDB = new IDBFactory();
};

export const removeIndexedDb = () => {
  delete (window as any).indexedDB;
};
