/**
 * @file Stage 1 application entry point for SHOBDO (installable offline shell).
 */

/** @type {'test'} */
const BUILD_MODE = 'test';

/** @type {string} */
const APP_VERSION = '0.1.0-stage1';

/**
 * Register the Service Worker for offline shell caching.
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
 * Collect and render diagnostics when ?debug=1 is present in the URL.
 * @param {ServiceWorkerRegistration | null} registration
 * @returns {Promise<void>}
 */
async function renderDebugPanel(registration) {
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

  const lines = [
    `Version: ${APP_VERSION}`,
    `Build mode: ${BUILD_MODE}`,
    `Online: ${navigator.onLine}`,
    `Service Worker: ${swState}`,
    `Caches: ${cacheSummary}`,
    `User-Agent: ${navigator.userAgent}`
  ];

  outputEl.textContent = lines.join('\n');
}

/**
 * Initialize the Stage 1 PWA shell.
 * @returns {Promise<void>}
 */
async function initStage1() {
  const bannerEl = document.getElementById('test-banner');
  const statusEl = document.getElementById('app-status');
  const versionEl = document.getElementById('app-version');

  if (!bannerEl || !statusEl || !versionEl) {
    return;
  }

  versionEl.textContent = `Version: ${APP_VERSION} (${BUILD_MODE} mode)`;
  statusEl.textContent = 'Registering offline shell…';

  const registration = await registerServiceWorker();
  statusEl.textContent = registration
    ? 'Offline shell ready. Installable PWA active.'
    : 'Running without Service Worker support.';

  await renderDebugPanel(registration);
}

initStage1();
  
