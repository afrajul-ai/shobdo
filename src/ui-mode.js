/**
 * @file Pure helper for mode-aware UI labels and fixture-badge visibility.
 */

export function getUiLabels(mode) {
  const isTest = mode !== 'release';

  if (!isTest) {
    return {
      isTest: false,
      pageTitle: 'SHOBDO (শব্দ)',
      entriesReadyText: (count) => `${count} entries ready. Type to search.`,
      loadErrorText: () => 'Unable to load dictionary data. Please reload.',
      failedStatusText: 'Dictionary unavailable.',
      aboutStatusText: 'Status: Published dictionary build.',
      attributionsEmptyText: 'Sources & attributions: No external sources bundled.',
      showFixtureBadge: () => false
    };
  }

  return {
    isTest: true,
    pageTitle: 'SHOBDO (শব্দ) — Test Build',
    entriesReadyText: (count) => `${count} fixture entries ready. Type to search.`,
    loadErrorText: (message) => `Error loading fixtures: ${message}`,
    failedStatusText: 'Failed to load fixture data.',
    aboutStatusText: 'Status: Technical Pilot (test mode). Licence pending (decisions D1 and D10 unresolved).',
    attributionsEmptyText: 'Sources & attributions: No external sources bundled (test fixtures only; LA-1 audit pending).',
    showFixtureBadge: (entry) => entry?.status === 'fixture'
  };
}
