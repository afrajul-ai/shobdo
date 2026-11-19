# SHOBDO Decision Log (v0.2.1)

| ID | Topic | Position | Status |
| :--- | :--- | :--- | :--- |
| D1 | Data source and licence | Three classes (`original`, `wiktionary`, `wordnet`); no external import before `LA-1` | Pending final approval (`D1_data_source_approved: false`) |
| D2 | Distribution | Public PWA on GitHub Pages (intended for a small group of friends, treated as public distribution, not private); Play Store postponed | Provisionally approved |
| D3 | Storage engine | JSON shards + in-memory index; Cache Storage; IndexedDB for user data | Provisionally approved |
| D4 | Framework | Plain JavaScript ES modules + JSDoc; no bundler | Provisionally approved |
| D5 | Bengali dialect and style | West Bengal standard চলিত (`SG-0.1`) | Proposed; needs reviewer sign-off and spelling reference (`D5_style_guide_approved: false`) |
| D10 | Licences of code and data | **Code:** MIT (`LICENSE`). **Original entries:** All rights reserved for now. **Wiktionary-derived entries:** CC BY-SA 4.0 (subject to `LA-1` audit). | **Approved** (`D10_licences_approved: true`) |
| D7 | Reviewers | Volunteers; author is never approver; Bengali-reading approver required | **BLOCKED** (`D7_reviewers_registered: false`; publishing disabled) |
| D8 | Analytics | None; privacy notice (`docs/privacy-notice.md`, Draft v0.1) | Provisionally approved |
| D9 | Vocabulary scope | TP-20 and EP-100 separate; Alpha 300, launch 1,000, stretch 2,500 | Provisionally approved |
| D10 | Licences of code and data | **Code:** MIT License (LICENSE). **Original data & contributor submissions:** CC BY-SA 4.0 (kept separate from code). External data licences pending LA-1. | **Approved** (D10_licences_approved: true) |

## Technical Pilot (`TP-20`) & Test Device (`B10`)

- **Current Build:** `v0.6.3-stage7` (`test` mode; `TP-20` awaiting formal owner/reviewer sign-off)
- **Device:** OPPO CPH2617
- **OS:** Android 15
- **Browser:** Brave (Chromium `157.0.0.0`); standalone Chrome version confirmation pending
- 
