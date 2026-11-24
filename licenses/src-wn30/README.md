# LA-1 Audit Archive: `src-wn30` (Princeton WordNet 3.0)

- **Source ID:** `src-wn30`
- **Audited Version:** WordNet Release 3.0 (`Copyright 2006 by Princeton University`)
- **Audit Status:** `approved_with_conditions` (signed off by `afrajul-ai`, `2026-11-24`)
- **Import Status:** Audit-only; no WordNet 3.0 entries are imported into SHOBDO. No import is authorised.
- **Primary Source:** https://wordnet.princeton.edu/license-and-commercial-use

## Licensing & Obligations

1. **WordNet License (`LICENSE.txt`):** Royalty-free permission to use, copy, modify, and distribute for any purpose, with no ShareAlike copyleft on SHOBDO's original Bengali entries or MIT code.
2. **Retain Notices:** Preserve Princeton's copyright notice, warranty disclaimer, and title-preservation statement on all copies and modifications, and surface attribution in *Sources and licences* and `data/attributions.json`.
3. **No-Publicity Rule:** Do **not** use "Princeton University" or "Princeton" in advertising or publicity.
4. **Layer Isolation:** Keep WordNet 3.0-derived fields strictly in `/data/layers/wordnet/` (`rights.class: "wordnet"`), separate from `/data/layers/original/`, `/data/layers/wiktionary/`, `/data/layers/oewn/`, `/data/layers/tatoeba/`, and MIT code.
