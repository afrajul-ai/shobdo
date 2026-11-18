/**
 * @file Unit tests for src/storage.js IndexedDB transaction completion & abort handling.
 */

import assert from 'node:assert/strict';

function createMockIndexedDB(behavior = 'complete') {
  const stores = new Map([
    ['bookmarks', new Map()],
    ['vocabulary', new Map()],
    ['history', new Map()],
    ['settings', new Map()]
  ]);

  const db = {
    objectStoreNames: { contains: (n) => stores.has(n) },
    transaction() {
      const tx = { oncomplete: null, onerror: null, onabort: null, error: null };
      tx.objectStore = (name) => ({
        put(val) {
          const req = { onsuccess: null, onerror: null, result: val.key || val.id };
          queueMicrotask(() => {
            stores.get(name).set(req.result, val);
            req.onsuccess?.();
            queueMicrotask(() => {
              if (behavior === 'abort') {
                tx.error = new Error('Simulated abort');
                tx.onabort?.();
              } else if (behavior === 'tx_error') {
                tx.error = new Error('Simulated tx error');
                tx.onerror?.();
              } else {
                tx.oncomplete?.();
              }
            });
          });
          return req;
        },
        get(key) {
          const req = { onsuccess: null, onerror: null, result: stores.get(name).get(key) };
          queueMicrotask(() => {
            req.onsuccess?.();
            queueMicrotask(() => tx.oncomplete?.());
          });
          return req;
        }
      });
      return tx;
    }
  };

  return {
    open() {
      const req = { onupgradeneeded: null, onsuccess: null, onerror: null, result: db };
      queueMicrotask(() => req.onsuccess?.());
      return req;
    }
  };
}

globalThis.indexedDB = createMockIndexedDB('complete');
const { setSetting, getSetting } = await import('../src/storage.js');
await setSetting('saveHistory', false);
assert.equal(await getSetting('saveHistory', true), false);
console.log('PASS: IndexedDB write resolved after transaction completion.');

globalThis.indexedDB = createMockIndexedDB('abort');
await assert.rejects(() => setSetting('saveHistory', true), /Simulated abort/);
console.log('PASS: Aborted transaction rejected.');

globalThis.indexedDB = createMockIndexedDB('tx_error');
await assert.rejects(() => setSetting('saveHistory', true), /Simulated tx error/);
console.log('PASS: Failed transaction rejected.');
    
