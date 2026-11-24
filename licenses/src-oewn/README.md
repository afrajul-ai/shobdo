# LA-1 Audit Archive: `src-oewn` (Open English WordNet)

- **Source ID:** `src-oewn`
- **Intended Audit Target:** Open English WordNet `2025` Edition (standard edition: common nouns, verbs, adjectives, and adverbs; GitHub release tag `2025-edition`, commit `dc343f2`, released 2025-12-30; `en-word.net` date `2025-12-31`)
- **Not Assessed:** Open English WordNet `2025 Plus` (`2025+`, which adds curated proper nouns from Open English Namenet) has **not** been independently assessed in this audit.
- **Audit Status:** `not_audited` — snapshot verified; owner approval pending.
- **Import Status:** Audit-only; no OEWN entries are imported into SHOBDO. No import is authorised.
- **Primary Sources:**
  - Repository: https://github.com/globalwordnet/english-wordnet
  - Releases (`2025-edition`, `dc343f2`): https://github.com/globalwordnet/english-wordnet/releases
  - Verified WNDB Archive (GitHub): https://github.com/globalwordnet/english-wordnet/releases/download/2025-edition/english-wordnet-2025.zip
  - Verified WNDB Archive (`en-word.net`): https://en-word.net/static/english-wordnet-2025.zip
  - Verified `WNDB_License.txt` (`dc343f2`): https://raw.githubusercontent.com/globalwordnet/english-wordnet/dc343f2/WNDB_License.txt
  - Upstream `LICENSE.md`: https://github.com/globalwordnet/english-wordnet/blob/master/LICENSE.md
  - CC BY 4.0 Legal Code: https://creativecommons.org/licenses/by/4.0/legalcode.txt

## Licensing & Snapshot Verification

1. **Verified Snapshot (`2025-edition` / `dc343f2`):** Verified in GitHub Actions (`Verify OEWN 2025 Snapshot (Read-Only)`) on `2026-11-24`: both `english-wordnet-2025.zip` downloads (GitHub release asset and `en-word.net` static archive) matched size `9,618,697` bytes and SHA-256 `73355e48f8117a24ca9ebc23ed75b35434e6cd21cc9dd3984e80aff5a5f63636`, and the extracted `WNDB_License.txt` matched `dc343f2/WNDB_License.txt` byte-for-byte (`cmp -s`). `licenses/src-oewn/WORDNET-LICENSE.txt` stores that exact verified text.
2. **Dual-Layer Licence:** OEWN contributions (`Open English Wordnet 2023 Copyright 2023 by the Open English Wordnet team`) are under **CC BY 4.0**; underlying Princeton WordNet data is subject to the **WordNet 3.1 License** (`WordNet 3.1 Copyright 2011 by Princeton University. All rights reserved.`).
3. **Attribution Required (`CC BY 4.0` + `LICENSE.md`):** Credit both **The Open English WordNet Team** and **Princeton WordNet**, link to the OEWN source and `https://creativecommons.org/licenses/by/4.0/`, retain warranty disclaimers, and record whether SHOBDO modified the field (`none | minor | substantial`).
4. **No-Publicity Rule:** Do **not** use "Princeton University" or "Princeton" in advertising or publicity.
5. **Layer Isolation:** Keep OEWN-derived fields strictly in `/data/layers/oewn/` (`rights.class: "oewn"`), separate from `/data/layers/original/`, `/data/layers/wiktionary/`, and MIT code.
