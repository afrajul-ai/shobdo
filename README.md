# SHOBDO (শব্দ)

An offline-first, learner-focused English-to-Bengali and Bengali-to-English dictionary Progressive Web App (PWA), built under **PRD and Technical Specification v0.2.1**.

* **Current version:** `v0.6.4-stage7` (`test` build mode only; `"TEST DATA, NOT VERIFIED"` banner active)
* **Technical Pilot (`TP-20`):** Stages 0–7 implemented and awaiting formal owner/reviewer sign-off
* **Hosting & Audience:** Publicly accessible via GitHub Pages (intended for a small group of friends, treated as public distribution rather than private)
* **Code Licence:** MIT License (`LICENSE` — applies to software/code only)
* **Font Licence:** SIL Open Font License 1.1 (`licenses/src-bn-font/OFL-1.1.txt` — applies only to the bundled Noto Sans Bengali `v3.011` font files, separate from MIT code and dictionary data licences)
* **Original Entries Licence:** All rights reserved for now (`/data/layers/original/`)
* **External Data:** External sources remain gated pending `D1` / `LA-1` (Wiktionary-derived entries, if approved, are `CC BY-SA 4.0` in their own layer)
* **Privacy Notice:** Draft (`docs/privacy-notice.md` v0.1; pending legal review and project contact point)

## Implemented Features (Stages 0–7)
* Zero-bundler plain JavaScript ES modules + JSDoc, Cache Storage, and IndexedDB
* Installable offline PWA (`manifest.json`, `sw.js`, CI-generated PNG icons, `?debug=1` diagnostics)
* Self-hosted Bengali typography (`v0.6.4-stage7`): Noto Sans Bengali `v3.011` (`fonts/NotoSansBengali-Regular.woff2`, `fonts/NotoSansBengali-Bold.woff2`) bundled locally with `@font-face` declarations, About-section SIL OFL-1.1 notice (`licenses/src-bn-font/OFL-1.1.txt`), and all 17 shell assets cached in `sw.js` with zero external font/CDN requests
* Layered data build & fail-closed governance gates (`scripts/build.mjs`, `docs/governance.json`, `licenses/audit-register.json`)
* 20 `TP-20` illustrative `fixture` entries (`fix-001` to `fix-020`)
* Offline search (`src/search.js`): exact, prefix, inflected-form, and fuzzy matching
* Dictionary Entry screen (`src/entryView.js`) with dynamic *"Sources and licences"* panel
* Local persistence (`src/storage.js`): Bookmarks, Personal Vocabulary notes/tags, Search History, JSON Export/Import
* A–Z Browse, Settings (scoped SHOBDO cache & Service Worker cleanup), About shell, and Draft Privacy Notice view

## Tested Features
* **CI (`Node.js 24` via GitHub Actions):**
  * `scripts/test-negative.mjs` (10 negative, governance, provenance, and external-request tests)
  * `scripts/test-storage.mjs` (IndexedDB transaction completion, error, and abort handling)
  * `scripts/test-sw-cleanup.mjs` (10 Service Worker scope/scriptURL safety test groups)
  * `scripts/test-sw-update.mjs` (Node-based isolated Service Worker update-resilience test harness, covering 5 test groups: simulated failed downloads, preservation of the previous cache, successful subsequent updates, and offline fallback; not a real-browser integration test)
  * `scripts/test-ui-mode.mjs` (release-mode UI label & `FIXTURE` badge suppression checks)
  * `scripts/test-attribution.mjs` (IPA, word-form, and sense attribution checks)
  * `scripts/build.mjs --mode=test --out=_site` (20 fixtures validated, local font and `OFL-1.1.txt` assets verified, `node --check sw.js`, zero external requests)
* **Device (`OPPO CPH2617`, `Android 15`, `Brave / Chromium 157.0.0.0`):**
  * Live `test` deployment, PWA install, Airplane Mode offline reopen (including self-hosted Noto Sans Bengali `v0.6.4-stage7` rendering, visually verified clean on `উৎসব`, `constitution`, and `behold`), `?debug=1`, search, Entry screen, IndexedDB persistence across restarts, JSON Export/Import, A–Z, Settings, About, and Draft Privacy view
* **Device (`OPPO CPH2617`, `Android 15`, standalone Chrome `157.0.8103.78` — `B10`):**
  * Standalone Chrome version verified separately from `Brave / Chromium 157.0.0.0`

## Awaiting Verification (Before Formal TP-20 Acceptance)
No remaining manual TP-20 verification items. Formal owner/reviewer sign-off is still pending.

## Unresolved Governance Decisions
* **D1:** Primary-source licence audits (`LA-1`) and owner sign-off
* **D5:** Reviewer sign-off on Bengali Editorial Style Guide (`SG-0.1`) and named West Bengal spelling reference
* **D7:** Named qualified human reviewers, written criteria, and independence declarations (`G4` blocks release)
* **D10:** Code, data, and contributor licence approvals (`G6`)
* **B9:** Privacy-notice legal review and `[project contact]` address

## Not Yet Implemented
* `EP-100` (100-entry editorial pilot) and `Alpha 300` / `1,000` real dictionary entries
* Bengali-to-English reverse search (Stage 9) and Bengali alphabetical browsing
* Production `release` deployment (blocked by `D1`, `D5`, `D7`, `D10`)

See `docs/DECISIONS.md` and `docs/governance.json` for current decision statuses
