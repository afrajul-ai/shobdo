/**
 * @file Unit tests for src/sw-cleanup.js (Service Worker registration safety).
 */

import assert from 'node:assert/strict';
import { isShobdoRegistration } from '../src/sw-cleanup.js';

const PAGE_URL = 'https://afrajul-ai.github.io/shobdo/?tab=settings';
const SHOBDO_SCOPE = 'https://afrajul-ai.github.io/shobdo/';
const SHOBDO_SW = 'https://afrajul-ai.github.io/shobdo/sw.js';

// 1. Matching scope + matching active worker -> true
assert.equal(
  isShobdoRegistration({ scope: SHOBDO_SCOPE, active: { scriptURL: SHOBDO_SW } }, PAGE_URL),
  true
);

// 2. Matching scope + matching waiting worker -> true
assert.equal(
  isShobdoRegistration({ scope: SHOBDO_SCOPE, waiting: { scriptURL: SHOBDO_SW } }, PAGE_URL),
  true
);

// 3. Matching scope + matching installing worker -> true
assert.equal(
  isShobdoRegistration({ scope: SHOBDO_SCOPE, installing: { scriptURL: SHOBDO_SW } }, PAGE_URL),
  true
);

// 4. Matching scope + different scriptURL -> false
assert.equal(
  isShobdoRegistration(
    { scope: SHOBDO_SCOPE, active: { scriptURL: 'https://afrajul-ai.github.io/shobdo/other-sw.js' } },
    PAGE_URL
  ),
  false
);

// 5. Matching scope + no workers -> false
assert.equal(
  isShobdoRegistration({ scope: SHOBDO_SCOPE, active: null, waiting: null, installing: null }, PAGE_URL),
  false
);

// 6. Different scopes on same origin -> false
assert.equal(
  isShobdoRegistration(
    { scope: 'https://afrajul-ai.github.io/other-app/', active: { scriptURL: 'https://afrajul-ai.github.io/other-app/sw.js' } },
    PAGE_URL
  ),
  false
);
assert.equal(
  isShobdoRegistration(
    { scope: 'https://afrajul-ai.github.io/', active: { scriptURL: 'https://afrajul-ai.github.io/sw.js' } },
    PAGE_URL
  ),
  false
);
assert.equal(
  isShobdoRegistration(
    { scope: 'https://afrajul-ai.github.io/shobdo-v2/', active: { scriptURL: 'https://afrajul-ai.github.io/shobdo-v2/sw.js' } },
    PAGE_URL
  ),
  false
);

// 7. Null / undefined registration -> false
assert.equal(isShobdoRegistration(null, PAGE_URL), false);
assert.equal(isShobdoRegistration(undefined, PAGE_URL), false);

// 8. Present worker without scriptURL -> false
assert.equal(
  isShobdoRegistration({ scope: SHOBDO_SCOPE, active: {} }, PAGE_URL),
  false
);
assert.equal(
  isShobdoRegistration({ scope: SHOBDO_SCOPE, active: { scriptURL: '' } }, PAGE_URL),
  false
);

// 9. One matching worker + another worker with different scriptURL -> false
assert.equal(
  isShobdoRegistration(
    {
      scope: SHOBDO_SCOPE,
      active: { scriptURL: SHOBDO_SW },
      waiting: { scriptURL: 'https://afrajul-ai.github.io/other-app/sw.js' }
    },
    PAGE_URL
  ),
  false
);

// 10. Invalid pageHref URL input -> false (does not throw)
assert.equal(
  isShobdoRegistration({ scope: SHOBDO_SCOPE, active: { scriptURL: SHOBDO_SW } }, 'not-a-valid-url'),
  false
);
assert.equal(
  isShobdoRegistration({ scope: SHOBDO_SCOPE, active: { scriptURL: SHOBDO_SW } }, ''),
  false
);

console.log('All 10 Service Worker cleanup test groups passed!');
