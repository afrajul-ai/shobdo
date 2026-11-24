# LA-1 Audit Archive: `src-oewn` (Open English WordNet)

- **Source ID:** `src-oewn`
- **Intended Audit Target:** Open English WordNet `2025` Edition (standard edition: common nouns, verbs, adjectives, and adverbs; GitHub release tag `2025-edition`, commit `dc343f2`, released 2025-12-30; `en-word.net` date `2025-12-31`)
- **Not Assessed:** Open English WordNet `2025 Plus` (`2025+`, which adds curated proper nouns from Open English Namenet) has **not** been independently assessed in this audit.
- **Audit Status:** `not_audited` — audit documentation under review; owner approval pending.
- **Import Status:** Audit-only; no OEWN entries are imported into SHOBDO. No import is authorised.
- **Primary Sources:**
  - Repository: https://github.com/globalwordnet/english-wordnet
  - Releases (`2025-edition`, `dc343f2`): https://github.com/globalwordnet/english-wordnet/releases
  - Upstream `LICENSE.md`: https://github.com/globalwordnet/english-wordnet/blob/master/LICENSE.md
  - Upstream `WNDB_License.txt` (reference): https://github.com/globalwordnet/english-wordnet/blob/main/WNDB_License.txt
  - Downloads: https://en-word.net/downloads
  - CC BY 4.0 Legal Code: https://creativecommons.org/licenses/by/4.0/legalcode.txt

## Licensing & Snapshot Verification Notes

1. **Dual-Layer Licence:** OEWN contributions (`2019–present`, The Open English WordNet Team) are under **CC BY 4.0**; underlying Princeton WordNet data is subject to the **WordNet License** (`WNDB_License.txt`).
2. **Unresolved Snapshot Limitation:** `licenses/src-oewn/WORDNET-LICENSE.txt` currently contains WordNet 3.0 / Copyright 2006 text, whereas upstream `main` references WordNet 3.1 / Copyright 2011 (`WNDB_License.txt`). A current `main`-branch file does not prove the exact historical snapshot bundled in the `2025-edition` (`dc343f2`) release archive; this must be verified directly from `dc343f2` before owner sign-off.
3. **Attribution Required (`CC BY 4.0` + `LICENSE.md`):** Credit both **The Open English WordNet Team** and **Princeton WordNet**, link to the OEWN source and `https://creativecommons.org/licenses/by/4.0/`, retain warranty disclaimers, and record whether SHOBDO modified the field (`none | minor | substantial`).
4. **No-Publicity Rule:** Do **not** use "Princeton University" or "Princeton" in advertising or publicity.
5. **Layer Isolation:** Keep OEWN-derived fields strictly in `/data/layers/oewn/` (`rights.class: "oewn"`), separate from `/data/layers/original/`, `/data/layers/wiktionary/`, and MIT code.
