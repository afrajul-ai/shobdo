
/**
 * @file Pure helper for identifying SHOBDO-owned Service Worker registrations.
 */

/**
 * Determine whether a ServiceWorkerRegistration belongs strictly to SHOBDO.
 *
 * @param {ServiceWorkerRegistration | null | undefined} reg
 * @param {string} pageHref
 * @returns {boolean}
 */
export function isShobdoRegistration(reg, pageHref) {
  if (!reg || typeof pageHref !== 'string' || !pageHref) {
    return false;
  }

  let expectedScope;
  let expectedScriptUrl;

  try {
    expectedScope = new URL('./', pageHref).href;
    expectedScriptUrl = new URL('./sw.js', pageHref).href;
  } catch {
    return false;
  }

  if (reg.scope !== expectedScope) {
    return false;
  }

  const workers = [reg.active, reg.waiting, reg.installing].filter(Boolean);

  if (workers.length === 0) {
    return false;
  }

  return workers.every(
    (worker) => worker.scriptURL === expectedScriptUrl
  );
}
