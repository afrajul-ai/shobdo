/**
 * @file Stage 0 application entry point for SHOBDO (test mode only).
 */

/** @type {'test'} */
const BUILD_MODE = 'test';

/**
 * Initialize the Stage 0 shell and verify the test-mode banner is present.
 * @returns {void}
 */
function initStage0() {
  const bannerEl = document.getElementById('test-banner');
  const statusEl = document.getElementById('app-status');

  if (!bannerEl || !statusEl) {
    return;
  }

  statusEl.textContent = `Build mode: ${BUILD_MODE}. ES module loaded successfully. No dictionary data loaded yet.`;
}

initStage0();
