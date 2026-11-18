/**
 * @file Stage 6 IndexedDB persistence for bookmarks, vocabulary, history, and settings.
 */

const DB_NAME = 'shobdo-user-db';
const DB_VERSION = 1;
const STORES = ['bookmarks', 'vocabulary', 'history', 'settings'];

/**
 * Open (and initialize if needed) the SHOBDO IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
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

/**
 * Run a single store operation inside a transaction.
 * @template T
 * @param {string} storeName
 * @param {'readonly' | 'readwrite'} mode
 * @param {(store: IDBObjectStore) => IDBRequest<T>} fn
 * @returns {Promise<T>}
 */
async function withStore(storeName, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all records from a store.
 * @param {string} storeName
 * @returns {Promise<Array<any>>}
 */
export function getAllRecords(storeName) {
  return withStore(storeName, 'readonly', (s) => s.getAll());
}

/**
 * Toggle bookmark state for an entry.
 * @param {object} entry
 * @returns {Promise<boolean>} true if now bookmarked, false if removed
 */
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

/**
 * Check if an entry is bookmarked.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function isBookmarked(id) {
  const item = await withStore('bookmarks', 'readonly', (s) => s.get(id));
  return Boolean(item);
}

/**
 * List all bookmarks newest-first.
 * @returns {Promise<Array<{ id: string, headword: string, savedAt: string }>>}
 */
export async function listBookmarks() {
  const items = await getAllRecords('bookmarks');
  return items.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/**
 * Save or delete a personal vocabulary note for an entry.
 * @param {object} entry
 * @param {string} note
 * @param {Array<string>} tags
 * @returns {Promise<void>}
 */
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

/**
 * Get a personal vocabulary note by entry ID.
 * @param {string} id
 * @returns {Promise<{ id: string, headword: string, note: string, tags: Array<string>, updatedAt: string } | undefined>}
 */
export function getVocabNote(id) {
  return withStore('vocabulary', 'readonly', (s) => s.get(id));
}

/**
 * List all saved vocabulary notes newest-first.
 * @returns {Promise<Array<object>>}
 */
export async function listVocabulary() {
  const items = await getAllRecords('vocabulary');
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Record a search query in history.
 * @param {string} rawQuery
 * @returns {Promise<void>}
 */
export async function recordHistory(rawQuery) {
  const query = rawQuery.trim();
  if (!query) return;
  await withStore('history', 'readwrite', (s) =>
    s.put({ query, searchedAt: new Date().toISOString() })
  );
}

/**
 * List recent search history newest-first.
 * @param {number} [limit=20]
 * @returns {Promise<Array<{ query: string, searchedAt: string }>>}
 */
export async function listHistory(limit = 20) {
  const items = await getAllRecords('history');
  return items.sort((a, b) => b.searchedAt.localeCompare(a.searchedAt)).slice(0, limit);
}

/**
 * Clear all search history.
 * @returns {Promise<void>}
 */
export function clearHistory() {
  return withStore('history', 'readwrite', (s) => s.clear());
}

/**
 * Export all user data into a portable JSON object.
 * @returns {Promise<object>}
 */
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

/**
 * Import user data from an exported JSON object.
 * @param {object} payload
 * @returns {Promise<{ bookmarks: number, vocabulary: number, history: number }>}
 */
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
    tx.onerror = () => reject(tx.error);
  });
          }
          
/**
 * Read a setting value from IndexedDB.
 * @template T
 * @param {string} key
 * @param {T} defaultValue
 * @returns {Promise<T>}
 */
export async function getSetting(key, defaultValue) {
  const row = await withStore('settings', 'readonly', (s) => s.get(key));
  return row ? row.value : defaultValue;
}

/**
 * Save a setting value in IndexedDB.
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
export async function setSetting(key, value) {
  await withStore('settings', 'readwrite', (s) => s.put({ key, value }));
}

/**
 * Clear bookmarks and personal vocabulary stores.
 * @returns {Promise<void>}
 */
export async function clearBookmarksAndVocab() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['bookmarks', 'vocabulary'], 'readwrite');
    tx.objectStore('bookmarks').clear();
    tx.objectStore('vocabulary').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Clear all user data stores in IndexedDB.
 * @returns {Promise<void>}
 */
export async function clearAllUserData() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');
    for (const storeName of STORES) {
      tx.objectStore(storeName).clear();
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

