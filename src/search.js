/**
 * @file Stage 3 in-memory prefix search for SHOBDO fixture entries.
 */

/**
 * Normalize a search query using Unicode NFC and lowercase trimming.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeQuery(raw) {
  return String(raw || '').normalize('NFC').trim().toLowerCase();
}

/**
 * Build a searchable index array from dictionary entries.
 * @param {Array<object>} entries
 * @returns {Array<{ entry: object, key: string }>}
 */
export function buildPrefixIndex(entries) {
  return entries
    .map((entry) => ({
      entry,
      key: normalizeQuery(entry.headword)
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Search the prefix index and return matching entries plus elapsed time in ms.
 * @param {Array<{ entry: object, key: string }>} index
 * @param {string} rawQuery
 * @param {number} [limit=10]
 * @returns {{ results: Array<object>, durationMs: number }}
 */
export function searchPrefix(index, rawQuery, limit = 10) {
  const start = performance.now();
  const q = normalizeQuery(rawQuery);

  if (!q) {
    return { results: [], durationMs: performance.now() - start };
  }

  const exact = [];
  const prefix = [];

  for (const item of index) {
    if (item.key === q) {
      exact.push(item.entry);
    } else if (item.key.startsWith(q)) {
      prefix.push(item.entry);
    }
  }

  const results = [...exact, ...prefix].slice(0, limit);
  return { results, durationMs: performance.now() - start };
}
