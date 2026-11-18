/**
 * @file IndexedDB persistence for bookmarks, vocabulary, history, and settings.
 */

const DB_NAME = 'shobdo-user-db';
const DB_VERSION = 1;
const STORES = ['bookmarks', 'vocabulary', 'history', 'settings'];

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('bookmarks')) {
        db.createObjectStore('bookmarks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('vocabulary')) {
        db.createObjectStore('vocabulary', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'query' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = fn(store);
    let result;

    req.onsuccess = () => {
      result = req.result;
    };
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed'));
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

export function getAllRecords(storeName) {
  return withStore(storeName, 'readonly', (s) => s.getAll());
}

export async function toggleBookmark(entry) {
  const existing = await withStore('bookmarks', 'readonly', (s) => s.get(entry.id));
  if (existing) {
    await withStore('bookmarks', 'readwrite', (s) => s.delete(entry.id));
    return false;
  }
  await withStore('bookmarks', 'readwrite', (s) =>
    s.put({ id: entry.id, headword: entry.headword, savedAt: new Date().toISOString() })
  );
  return true;
}

export async function isBookmarked(id) {
  const item = await withStore('bookmarks', 'readonly', (s) => s.get(id));
  return Boolean(item);
}

export async function listBookmarks() {
  const items = await getAllRecords('bookmarks');
  return items.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function saveVocabNote(entry, note, tags) {
  const trimmed = note.trim();
  if (!trimmed && tags.length === 0) {
    await withStore('vocabulary', 'readwrite', (s) => s.delete(entry.id));
    return;
  }
  await withStore('vocabulary', 'readwrite', (s) =>
    s.put({
      id: entry.id,
      headword: entry.headword,
      note: trimmed,
      tags,
      updatedAt: new Date().toISOString()
    })
  );
}

export function getVocabNote(id) {
  return withStore('vocabulary', 'readonly', (s) => s.get(id));
}

export async function listVocabulary() {
  const items = await getAllRecords('vocabulary');
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function recordHistory(rawQuery) {
  const query = rawQuery.trim();
  if (!query) return;
  await withStore('history', 'readwrite', (s) =>
    s.put({ query, searchedAt: new Date().toISOString() })
  );
}

export async function listHistory(limit = 20) {
  const items = await getAllRecords('history');
  return items.sort((a, b) => b.searchedAt.localeCompare(a.searchedAt)).slice(0, limit);
}

export function clearHistory() {
  return withStore('history', 'readwrite', (s) => s.clear());
}

export async function exportAllUserData() {
  const [bookmarks, vocabulary, history, settings] = await Promise.all(
    STORES.map((name) => getAllRecords(name))
  );
  return {
    schema: 'shobdo-user-v1',
    exportedAt: new Date().toISOString(),
    bookmarks,
    vocabulary,
    history,
    settings
  };
}

export async function importUserData(payload) {
  if (!payload || payload.schema !== 'shobdo-user-v1') {
    throw new Error('Invalid backup file (expected schema "shobdo-user-v1").');
  }

  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');
    for (const storeName of STORES) {
      const store = tx.objectStore(storeName);
      store.clear();
      const rows = Array.isArray(payload[storeName]) ? payload[storeName] : [];
      for (const row of rows) {
        store.put(row);
      }
    }
    tx.oncomplete = () =>
      resolve({
        bookmarks: (payload.bookmarks || []).length,
        vocabulary: (payload.vocabulary || []).length,
        history: (payload.history || []).length
      });
    tx.onerror = () => reject(tx.error || new Error('IndexedDB import failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB import aborted'));
  });
}

export async function getSetting(key, defaultValue) {
  const row = await withStore('settings', 'readonly', (s) => s.get(key));
  return row ? row.value : defaultValue;
}

export async function setSetting(key, value) {
  await withStore('settings', 'readwrite', (s) => s.put({ key, value }));
}

export async function clearBookmarksAndVocab() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['bookmarks', 'vocabulary'], 'readwrite');
    tx.objectStore('bookmarks').clear();
    tx.objectStore('vocabulary').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB clear failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB clear aborted'));
  });
}

export async function clearAllUserData() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');
    for (const storeName of STORES) {
      tx.objectStore(storeName).clear();
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB clear failed'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB clear aborted'));
  });
}
