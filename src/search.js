/**
 * @file Stage 5 search engine: exact, prefix, inflected-form, and fuzzy matching.
 */

/**
 * Normalize a query or word using Unicode NFC and lowercase trimming.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeQuery(raw) {
  return String(raw || '').normalize('NFC').trim().toLowerCase();
}

/**
 * Compute Levenshtein edit distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 3;

  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const temp = dp[i];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[m];
}

/**
 * Build a searchable index with headword and normalized inflected forms.
 * @param {Array<object>} entries
 * @returns {Array<{ entry: object, key: string, forms: Array<string> }>}
 */
export function buildSearchIndex(entries) {
  return entries
    .map((entry) => ({
      entry,
      key: normalizeQuery(entry.headword),
      forms: (entry.forms || []).map((f) => normalizeQuery(f)).filter(Boolean)
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Search entries by exact headword, prefix, inflected form, and fuzzy typo tolerance.
 * @param {Array<{ entry: object, key: string, forms: Array<string> }>} index
 * @param {string} rawQuery
 * @param {number} [limit=10]
 * @returns {{ results: Array<{ entry: object, matchType: string, matchedText: string }>, durationMs: number }}
 */
export function searchEntries(index, rawQuery, limit = 10) {
  const start = performance.now();
  const q = normalizeQuery(rawQuery);

  if (!q) {
    return { results: [], durationMs: performance.now() - start };
  }

  const exact = [];
  const prefix = [];
  const formMatches = [];
  const fuzzy = [];
  const seenIds = new Set();

  for (const item of index) {
    if (item.key === q) {
      exact.push({ entry: item.entry, matchType: 'exact', matchedText: item.key });
      seenIds.add(item.entry.id);
    } else if (item.key.startsWith(q)) {
      prefix.push({ entry: item.entry, matchType: 'prefix', matchedText: item.key });
      seenIds.add(item.entry.id);
    }
  }

  for (const item of index) {
    if (seenIds.has(item.entry.id)) continue;
    const matchedForm = item.forms.find((f) => f === q || (q.length >= 3 && f.startsWith(q)));
    if (matchedForm) {
      formMatches.push({ entry: item.entry, matchType: 'form', matchedText: matchedForm });
      seenIds.add(item.entry.id);
    }
  }

  if (q.length >= 3 && exact.length + prefix.length + formMatches.length < limit) {
    const maxDist = q.length >= 6 ? 2 : 1;
    const candidates = [];

    for (const item of index) {
      if (seenIds.has(item.entry.id)) continue;
      let bestDist = editDistance(q, item.key);
      for (const f of item.forms) {
        const d = editDistance(q, f);
        if (d < bestDist) bestDist = d;
      }
      if (bestDist <= maxDist) {
        candidates.push({ entry: item.entry, matchType: 'fuzzy', matchedText: item.key, dist: bestDist });
        seenIds.add(item.entry.id);
      }
    }

    candidates.sort((a, b) => a.dist - b.dist);
    for (const c of candidates) {
      fuzzy.push({ entry: c.entry, matchType: c.matchType, matchedText: c.matchedText });
    }
  }

  const results = [...exact, ...prefix, ...formMatches, ...fuzzy].slice(0, limit);
  return { results, durationMs: performance.now() - start };
}
