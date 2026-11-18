/**
 * @file Stage 3 application entry point for SHOBDO (offline prefix search on fixtures).
 */

import { buildPrefixIndex, searchPrefix } from './search.js';

/** @type {'test'} */
const BUILD_MODE = 'test';

/** @type {string} */
const APP_VERSION = '0.2.0-stage3';

/**
 * Register the Service Worker for offline caching.
 * @returns {Promise<ServiceWorkerRegistration | null>}
 */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
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
  if (!response.ok) {
    throw new Error(`Failed to load dictionary.json (${response.status})`);
  }
  const payload = await response.json();
  return payload.entries || [];
}

/**
 * Extract the primary Bengali translation for suggestion display.
 * @param {object} entry
 * @returns {string}
 */
function getPrimaryBengali(entry) {
  const firstSense = entry.senses?.[0];
  return firstSense?.translations?.[0]?.bn || '';
}

/**
 * Render prefix suggestions into the DOM.
 * @param {Array<object>} results
 * @param {HTMLElement} listEl
 * @param {(entry: object) => void} onSelect
 * @returns {void}
 */
function renderSuggestions(results, listEl, onSelect) {
  listEl.innerHTML = '';

  for (const entry of results) {
    const li = document.createElement('li');
    li.className = 'suggestion-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suggestion-btn';

    const left = document.createElement('span');
    const wordSpan = document.createElement('span');
    wordSpan.className = 'suggestion-word';
    wordSpan.textContent = entry.headword;

    const posList = (entry.senses || []).map((s) => s.pos).join(', ');
    const posSpan = document.createElement('span');
    posSpan.className = 'suggestion-pos';
    posSpan.textContent = posList;

    left.append(wordSpan, posSpan);

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
  if (params.get('debug') !== '1') {
    return;
  }

  const panelEl = document.getElementById('debug-panel');
  const outputEl = document.getElementById('debug-output');
  if (!panelEl || !outputEl) {
    return;
  }

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
 * Initialize Stage 3 search UI.
 * @returns {Promise<void>}
 */
async function initStage3() {
  const statusEl = document.getElementById('app-status');
  const versionEl = document.getElementById('app-version');
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-btn');
  const metaEl = document.getElementById('search-meta');
  const listEl = document.getElementById('suggestions-list');
  const previewEl = document.getElementById('selected-preview');
  const previewTitle = document.getElementById('preview-title');
  const previewSummary = document.getElementById('preview-summary');

  if (!statusEl || !versionEl || !searchInput || !clearBtn || !metaEl || !listEl) {
    return;
  }

  versionEl.textContent = `Version: ${APP_VERSION} (${BUILD_MODE} mode)`;
  const registration = await registerServiceWorker();

  let index = [];
  try {
    const entries = await loadFixtures();
    index = buildPrefixIndex(entries);
    metaEl.textContent = `${entries.length} fixture entries ready. Type to search.`;
    statusEl.textContent = registration
      ? 'Offline search ready.'
      : 'Search ready (no Service Worker).';
    await renderDebugPanel(registration, entries.length);
  } catch (err) {
    metaEl.textContent = `Error loading fixtures: ${err.message}`;
    statusEl.textContent = 'Failed to load fixture data.';
    return;
  }

  const handleSearch = () => {
    const query = searchInput.value;
    clearBtn.hidden = query.length === 0;

    if (!query.trim()) {
      listEl.innerHTML = '';
      metaEl.textContent = `${index.length} fixture entries ready. Type to search.`;
      return;
    }

    const { results, durationMs } = searchPrefix(index, query);
    metaEl.textContent = `${results.length} match${results.length === 1 ? '' : 'es'} in ${durationMs.toFixed(2)} ms`;

    renderSuggestions(results, listEl, (entry) => {
      if (previewEl && previewTitle && previewSummary) {
        previewEl.hidden = false;
        previewTitle.textContent = `${entry.headword} — ${getPrimaryBengali(entry)}`;
        previewSummary.textContent = entry.senses?.[0]?.definition_en?.text || '';
      }
    });
  };

  searchInput.addEventListener('input', handleSearch);
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    if (previewEl) previewEl.hidden = true;
    handleSearch();
    searchInput.focus();
  });
}

initStage3();
