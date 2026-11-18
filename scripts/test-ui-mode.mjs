/**
 * @file Unit tests for src/ui-mode.js (release-mode UI correctness).
 */

import assert from 'node:assert/strict';
import { getUiLabels } from '../src/ui-mode.js';

const testLabels = getUiLabels('test');
const releaseLabels = getUiLabels('release');
const fallbackLabels = getUiLabels('unexpected');

// 1. Test mode preserves fixture & test-mode wording
assert.equal(testLabels.isTest, true);
assert.match(testLabels.pageTitle, /Test Build/);
assert.match(testLabels.entriesReadyText(20), /fixture entries/);
assert.match(testLabels.loadErrorText('404'), /fixtures/);
assert.match(testLabels.failedStatusText, /fixture/);
assert.match(testLabels.aboutStatusText, /test mode/i);
assert.equal(testLabels.showFixtureBadge({ status: 'fixture' }), true);
assert.equal(testLabels.showFixtureBadge({ status: 'published' }), false);

// 2. Release mode removes all test/fixture wording and hides FIXTURE badges
assert.equal(releaseLabels.isTest, false);
assert.equal(releaseLabels.pageTitle, 'SHOBDO (শব্দ)');
assert.equal(releaseLabels.showFixtureBadge({ status: 'fixture' }), false);
assert.equal(releaseLabels.showFixtureBadge({ status: 'published' }), false);

const releaseStrings = [
  releaseLabels.pageTitle,
  releaseLabels.entriesReadyText(100),
  releaseLabels.loadErrorText('fixture leak'),
  releaseLabels.failedStatusText,
  releaseLabels.aboutStatusText,
  releaseLabels.attributionsEmptyText
];

for (const text of releaseStrings) {
  assert.equal(/fixture/i.test(text), false, `Unexpected "fixture" in release string: ${text}`);
  assert.equal(/\btest\b/i.test(text), false, `Unexpected "test" in release string: ${text}`);
}

// 3. Unknown mode fails safe to test mode
assert.equal(fallbackLabels.isTest, true);
assert.equal(fallbackLabels.showFixtureBadge({ status: 'fixture' }), true);

console.log('All release-mode UI correctness tests passed!');
  
