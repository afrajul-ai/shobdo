/**
 * @file Stage 6 application entry point for SHOBDO (IndexedDB user data + backup).
 */

import { buildSearchIndex, searchEntries } from './search.js';
import { renderEntryView } from './entryView.js';
import {
  clearHistory,
  exportAllUserData,
  importUserData,
  listBookmarks,
  listHistory,
  listVocabulary,
  recordHistory
} from './storage.js';

/** @type {'test'} */
const BUILD_MODE = 'test';

/** @type {string} */
const APP_VERSION = '0.5.0-stage6';

/**
 * Register the Service Worker for offline caching.
 * @returns {Promise<ServiceWorkerRegistration | null>}
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('./sw.js', { scope: './' });
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Load dictionary JSON built in Stage 2.
 * @returns {Promise<Array<object>>}
 */
async function loadFixtures() {
  const response = await fetch('./data/dictionary.json');
  if (!response.ok) throw new Error(`Failed to load dictionary.json (${response.status})`);
  const payload = await response.json();
  return payload.entries || [];
}

/**
 * Extract the primary Bengali translation for suggestion display.
 * @param {object} entry
 * @returns {string}
 */
function getPrimaryBengali(entry) {
  return entry.senses?.[0]?.translations?.[0]?.bn || '';
}

/**
 * Render search suggestions into the DOM.
 * @param {Array<{ entry: object, matchType: string, matchedText: string }>} results
 * @param {HTMLElement} listEl
 * @param {(entry: object) => void} onSelect
 * @returns {void}
 */
function renderSuggestions(results, listEl, onSelect) {
  listEl.innerHTML = '';

  for (const { entry, matchType, matchedText } of results) {
    const li = document.createElement('li');
    li.className = 'suggestion-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suggestion-btn';

    const left = document.createElement('span');
    const wordSpan = document.createElement('span');
    wordSpan.className = 'suggestion-word';
    wordSpan.textContent = entry.headword;

    const posSpan = document.createElement('span');
    posSpan.className = 'suggestion-pos';
    posSpan.textContent = (entry.senses || []).map((s) => s.pos).join(', ');

    left.append(wordSpan, posSpan);

    if (matchType === 'form') {
      const hint = document.createElement('span');
      hint.className = 'match-hint';
      hint.textContent = `form: ${matchedText}`;
      left.appendChild(hint);
    } else if (matchType === 'fuzzy') {
      const hint = document.createElement('span');
      hint.className = 'match-hint';
      hint.textContent = 'similar';
      left.appendChild(hint);
    }

    const right = document.createElement('span');
    const bnSpan = document.createElement('span');
    bnSpan.className = 'suggestion-bn';
    bnSpan.lang = 'bn';
    bnSpan.textContent = getPrimaryBengali(entry);

    const tag = document.createElement('span');
    tag.className = 'fixture-tag';
    tag.textContent = 'FIXTURE';
    tag.style.marginLeft = '0.4rem';

    right.append(bnSpan, tag);
    btn.append(left, right);
    btn.addEventListener('click', () => onSelect(entry));

    li.appendChild(btn);
    listEl.appendChild(li);
  }
}

/**
 * Render ?debug=1 diagnostics panel when requested.
 * @param {ServiceWorkerRegistration | null} registration
 * @param {number} entryCount
 * @returns {Promise<void>}
 */
async function renderDebugPanel(registration, entryCount) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') !== '1') return;

  const panelEl = document.getElementById('debug-panel');
  const outputEl = document.getElementById('debug-output');
  if (!panelEl || !outputEl) return;

  panelEl.hidden = false;

  let cacheSummary = 'Cache Storage unavailable';
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    const details = [];
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const entries = await cache.keys();
      details.push(`${name} (${entries.length} files)`);
    }
    cacheSummary = details.length > 0 ? details.join(', ') : 'No caches yet';
  }

  const swState = registration
    ? `registered (active: ${Boolean(registration.active)}, controlling: ${Boolean(navigator.serviceWorker.controller)})`
    : 'not registered';

  outputEl.textContent = [
    `Version: ${APP_VERSION}`,
    `Build mode: ${BUILD_MODE}`,
    `Loaded fixtures: ${entryCount}`,
    `Online: ${navigator.onLine}`,
    `Service Worker: ${swState}`,
    `Caches: ${cacheSummary}`,
    `User-Agent: ${navigator.userAgent}`
  ].join('\n');
}

/**
 * Initialize Stage 6 UI and IndexedDB handlers.
 * @returns {Promise<void>}
 */
async function initStage6() {
  const statusEl = document.getElementById('app-status');
  const versionEl = document.getElementById('app-version');
  const searchSection = document.getElementById('search-section');
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-btn');
  const metaEl = document.getElementById('search-meta');
  const listEl = document.getElementById('suggestions-list');
  const entryViewEl = document.getElementById('entry-view');

  const panelBookmarks = document.getElementById('panel-bookmarks');
  const panelVocabulary = document.getElementById('panel-vocabulary');
  const panelHistory = document.getElementById('panel-history');
  const panelBackup = document.getElementById('panel-backup');
  const bookmarksList = document.getElementById('bookmarks-list');
  const vocabularyList = document.getElementById('vocabulary-list');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const exportBtn = document.getElementById('export-btn');
  const importInput = document.getElementById('import-input');
  const backupStatus = document.getElementById('backup-status');
  const tabButtons = document.querySelectorAll('.tab-btn');

  versionEl.textContent = `Version: ${APP_VERSION} (${BUILD_MODE} mode)`;
  const registration = await registerServiceWorker();

  let index = [];
  const entriesById = new Map();
  try {
    const entries = await loadFixtures();
    entries.forEach((e) => entriesById.set(e.id, e));
    index = buildSearchIndex(entries);
    metaEl.textContent = `${entries.length} fixture entries ready. Type to search.`;
    statusEl.textContent = registration
      ? 'Offline dictionary & local storage ready.'
      : 'Dictionary ready (no Service Worker).';
    await renderDebugPanel(registration, entries.length);
  } catch (err) {
    metaEl.textContent = `Error loading fixtures: ${err.message}`;
    statusEl.textContent = 'Failed to load fixture data.';
    return;
  }

  let activeTab = 'search';

  const hideAllPanels = () => {
    searchSection.hidden = true;
    panelBookmarks.hidden = true;
    panelVocabulary.hidden = true;
    panelHistory.hidden = true;
    panelBackup.hidden = true;
    entryViewEl.hidden = true;
  };

  const showEntry = async (entry, fromSearchQuery = '') => {
    if (fromSearchQuery) {
      await recordHistory(fromSearchQuery);
    }
    hideAllPanels();
    entryViewEl.hidden = false;
    await renderEntryView(entryViewEl, entry, () => switchTab(activeTab));
  };

  const renderSavedList = (ulEl, items, formatRight, onClickItem) => {
    ulEl.innerHTML = '';
    for (const item of items) {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'suggestion-btn';
      const left = document.createElement('span');
      left.className = 'suggestion-word';
      left.textContent = item.headword || item.query;
      const right = document.createElement('span');
      right.className = 'suggestion-pos';
      right.textContent = formatRight(item);
      btn.append(left, right);
      btn.addEventListener('click', () => onClickItem(item));
      li.appendChild(btn);
      ulEl.appendChild(li);
    }
  };

  const switchTab = async (tabName) => {
    activeTab = tabName;
    tabButtons.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabName));
    hideAllPanels();

    if (tabName === 'search') {
      searchSection.hidden = false;
    } else if (tabName === 'bookmarks') {
      panelBookmarks.hidden = false;
      const items = await listBookmarks();
      renderSavedList(bookmarksList, items, () => 'Open →', (item) => {
        const entry = entriesById.get(item.id);
        if (entry) showEntry(entry);
      });
    } else if (tabName === 'vocabulary') {
      panelVocabulary.hidden = false;
      const items = await listVocabulary();
      renderSavedList(
        vocabularyList,
        items,
        (item) => (item.tags?.length ? item.tags.join(', ') : 'Note'),
        (item) => {
          const entry = entriesById.get(item.id);
          if (entry) showEntry(entry);
        }
      );
    } else if (tabName === 'history') {
      panelHistory.hidden = false;
      const items = await listHistory();
      renderSavedList(historyList, items, () => 'Search →', (item) => {
        searchInput.value = item.query;
        switchTab('search');
        handleSearch();
      });
    } else if (tabName === 'backup') {
      panelBackup.hidden = false;
    }
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  const handleSearch = () => {
    const query = searchInput.value;
    clearBtn.hidden = query.length === 0;

    if (!query.trim()) {
      listEl.innerHTML = '';
      metaEl.textContent = `${index.length} fixture entries ready. Type to search.`;
      return;
    }

    const { results, durationMs } = searchEntries(index, query);
    metaEl.textContent = `${results.length} match${results.length === 1 ? '' : 'es'} in ${durationMs.toFixed(2)} ms`;
    renderSuggestions(results, listEl, (entry) => showEntry(entry, query));
  };

  searchInput.addEventListener('input', handleSearch);
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    handleSearch();
    searchInput.focus();
  });

  clearHistoryBtn.addEventListener('click', async () => {
    await clearHistory();
    switchTab('history');
  });

  exportBtn.addEventListener('click', async () => {
    const data = await exportAllUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shobdo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    backupStatus.textContent = `Exported ${data.bookmarks.length} bookmarks, ${data.vocabulary.length} notes, ${data.history.length} history items.`;
  });

  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const counts = await importUserData(parsed);
      backupStatus.textContent = `Restored ${counts.bookmarks} bookmarks, ${counts.vocabulary} notes, ${counts.history} history items.`;
    } catch (err) {
      backupStatus.textContent = `Import failed: ${err.message}`;
    }
    importInput.value = '';
  });
}

initStage6();
