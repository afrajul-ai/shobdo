# LA-1 Audit Archive: `src-oewn` (Open English WordNet)

- **Source ID:** `src-oewn`
- **Audited Release:** Open English WordNet `2025` / `2025 Plus` (2025-12-31)
- **Primary Sources:**
  - Repository: https://github.com/globalwordnet/english-wordnet
  - Upstream `LICENSE.md`: https://github.com/globalwordnet/english-wordnet/blob/master/LICENSE.md
  - Downloads: https://en-word.net/downloads
  - CC BY 4.0 Legal Code: https://creativecommons.org/licenses/by/4.0/legalcode.txt
  - Princeton WordNet License: https://wordnet.princeton.edu/license-and-commercial-use
- **Audit Status:** `approved_with_conditions` (signed off by `afrajul-ai`, `2026-11-24`)
- **Import Status:** Audit-only; no OEWN entries are imported into SHOBDO yet.

## Licensing & Obligations

1. **Dual-Layer Licence:** OEWN contributions (`2019–present`, The Open English WordNet Team) are under **CC BY 4.0**; underlying Princeton WordNet data is under the **WordNet License** (`WORDNET-LICENSE.txt`).
2. **Attribution Required (`CC BY 4.0` + `LICENSE.md`):** Credit both **The Open English WordNet Team** and **Princeton WordNet**, link to the OEWN source and `https://creativecommons.org/licenses/by/4.0/`, retain warranty disclaimers, and record whether SHOBDO modified the field (`none | minor | substantial`).
3. **No-Publicity Rule:** Do **not** use "Princeton University" or "Princeton" in advertising or publicity.
4. **Layer Isolation:** Keep OEWN-derived fields strictly in `/data/layers/oewn/` (`rights.class: "oewn"`), separate from `/data/layers/original/`, `/data/layers/wiktionary/`, and MIT code.
