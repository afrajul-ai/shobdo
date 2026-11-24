/**
 * @file Isolated Node test harness for sw.js failed-download update resilience.
 * Zero external dependencies. Runs sw.js inside node:vm against an in-memory CacheStorage mock.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SW_PATH = path.resolve(__dirname, '..', 'sw.js');
const ORIGIN = 'https://afrajul-ai.github.io';
const BASE_URL = `${ORIGIN}/shobdo/`;

function normalizeUrl(input) {
  const raw = typeof input === 'string' ? input : input?.url;
  return new URL(raw, BASE_URL).href;
}

function createCacheStorage() {
  const store = new Map();

  function makeCache(name) {
    if (!store.has(name)) {
      store.set(name, new Map());
    }
    const entries = store.get(name);
    return {
      async put(req, res) {
        entries.set(normalizeUrl(req), res);
      },
      async match(req) {
        return entries.get(normalizeUrl(req));
      }
    };
  }

  return {
    _store: store,
    async open(name) {
      return makeCache(name);
    },
    async keys() {
      return [...store.keys()];
    },
    async delete(name) {
      return store.delete(name);
    },
    async match(req) {
      const target = normalizeUrl(req);
      for (const entries of store.values()) {
        if (entries.has(target)) {
          return entries.get(target);
        }
      }
      return undefined;
    }
  };
}

function loadWorker(swSource, cachesMock, { failingAssets = new Set(), networkOffline = false } = {}) {
  const listeners = new Map();
  let skipWaitingCalled = false;
  let clientsClaimCalled = false;

  class MockResponse {
    constructor(body = '', init = {}) {
      this.body = body;
      this.status = init.status ?? 200;
      this.statusText = init.statusText ?? 'OK';
      this.ok = this.status >= 200 && this.status < 300;
    }
  }

  const cachesProxy = {
    async open(name) {
      const inner = await cachesMock.open(name);
      return {
        put: inner.put,
        match: inner.match,
        async addAll(assets) {
          const staged = [];
          for (const asset of assets) {
            if (failingAssets.has(asset)) {
              throw new Error(`Simulated download failure for ${asset}`);
            }
            staged.push([asset, new MockResponse(`cached:${asset}`, { status: 200 })]);
          }
          for (const [asset, res] of staged) {
            await inner.put(asset, res);
          }
        }
      };
    },
    keys: () => cachesMock.keys(),
    delete: (name) => cachesMock.delete(name),
    match: (req) => cachesMock.match(req)
  };

  const selfMock = {
    location: { origin: ORIGIN, href: `${BASE_URL}sw.js` },
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
    skipWaiting() {
      skipWaitingCalled = true;
    },
    clients: {
      claim() {
        clientsClaimCalled = true;
      }
    }
  };

  const context = vm.createContext({
    self: selfMock,
    caches: cachesProxy,
    URL,
    Response: MockResponse,
    fetch: async (req) => {
      if (networkOffline) {
        throw new Error(`Simulated offline fetch for ${normalizeUrl(req)}`);
      }
      return new MockResponse(`network:${normalizeUrl(req)}`, { status: 200 });
    }
  });

  vm.runInContext(swSource, context, { filename: 'sw.js' });

  async function dispatchLifecycle(type) {
    const handler = listeners.get(type);
    assert.ok(handler, `Missing "${type}" listener in sw.js`);
    const pending = [];
    handler({
      waitUntil(promise) {
        pending.push(Promise.resolve(promise));
      }
    });
    await Promise.all(pending);
  }

  async function dispatchFetch(url, { method = 'GET', mode = 'cors' } = {}) {
    const handler = listeners.get('fetch');
    assert.ok(handler, 'Missing "fetch" listener in sw.js');
    let respondedWith = null;
    handler({
      request: { url, method, mode },
      respondWith(promise) {
        respondedWith = Promise.resolve(promise);
      }
    });
    return respondedWith ? await respondedWith : undefined;
  }

  return {
    dispatchLifecycle,
    dispatchFetch,
    get state() {
      return { skipWaitingCalled, clientsClaimCalled };
    }
  };
}

const swSource = fs.readFileSync(SW_PATH, 'utf8');
const cachesMock = createCacheStorage();

// 1. Baseline install & activate with real sw.js (v0.6.4-stage7)
const v1 = loadWorker(swSource, cachesMock, { networkOffline: true });
await v1.dispatchLifecycle('install');
await v1.dispatchLifecycle('activate');

assert.deepEqual(await cachesMock.keys(), ['shobdo-shell-0.6.4-stage7']);
assert.equal(cachesMock._store.get('shobdo-shell-0.6.4-stage7').size, 17);
const v1Home = await v1.dispatchFetch(`${BASE_URL}`, { mode: 'navigate' });
assert.equal(v1Home.status, 200);
assert.equal(v1Home.body, 'cached:./');
console.log('PASS 1: Baseline sw.js installed, activated, and cached all 17 assets.');

// 2. Simulated failed-download update (1 asset fails during cache.addAll)
const failingSwSource = swSource.replace(
  "const APP_VERSION = '0.6.4-stage7';",
  "const APP_VERSION = '0.6.5-test-fail';"
);
const v2Fail = loadWorker(failingSwSource, cachesMock, {
  failingAssets: new Set(['./fonts/NotoSansBengali-Bold.woff2']),
  networkOffline: true
});

await assert.rejects(
  () => v2Fail.dispatchLifecycle('install'),
  /Simulated download failure for \.\/fonts\/NotoSansBengali-Bold\.woff2/
);
// Per SW spec, activate never runs when install rejects; v2Fail is discarded.
console.log('PASS 2: Failed asset download caused new SW install to reject safely.');

// 3. Old active worker & cache remain intact and usable offline after failed update
const oldCache = cachesMock._store.get('shobdo-shell-0.6.4-stage7');
assert.ok(oldCache, 'Old active cache must still exist');
assert.equal(oldCache.size, 17, 'All 17 old assets must remain cached');

const resIndex = await v1.dispatchFetch(`${BASE_URL}index.html`, { mode: 'navigate' });
const resDict = await v1.dispatchFetch(`${BASE_URL}data/dictionary.json`);
const resFont = await v1.dispatchFetch(`${BASE_URL}fonts/NotoSansBengali-Regular.woff2`);
assert.equal(resIndex.body, 'cached:./index.html');
assert.equal(resDict.body, 'cached:./data/dictionary.json');
assert.equal(resFont.body, 'cached:./fonts/NotoSansBengali-Regular.woff2');
console.log('PASS 3: Old active worker and cached shell remain usable offline.');

// 4. Subsequent successful update installs, activates, and cleans up old caches
const okSwSource = swSource.replace(
  "const APP_VERSION = '0.6.4-stage7';",
  "const APP_VERSION = '0.6.5-test-ok';"
);
const v3Ok = loadWorker(okSwSource, cachesMock, { networkOffline: true });
await v3Ok.dispatchLifecycle('install');
await v3Ok.dispatchLifecycle('activate');

assert.deepEqual(await cachesMock.keys(), ['shobdo-shell-0.6.5-test-ok']);
assert.equal(cachesMock._store.get('shobdo-shell-0.6.5-test-ok').size, 17);
assert.equal(v3Ok.state.skipWaitingCalled, true);
assert.equal(v3Ok.state.clientsClaimCalled, true);
console.log('PASS 4: Subsequent successful update activated and cleaned up old caches.');

// 5. Uncached offline fallback behavior (navigation -> index.html, asset -> 503 Offline)
const navFallback = await v3Ok.dispatchFetch(`${BASE_URL}unknown-route`, { mode: 'navigate' });
assert.equal(navFallback.status, 200);
assert.equal(navFallback.body, 'cached:./index.html');

const assetFallback = await v3Ok.dispatchFetch(`${BASE_URL}missing.json`);
assert.equal(assetFallback.status, 503);
assert.equal(assetFallback.body, 'Offline');
console.log('PASS 5: Offline fallbacks work cleanly for uncached requests.');

console.log('All 5 Service Worker update-resilience test groups passed!');
        
