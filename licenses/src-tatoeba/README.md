# LA-1 Audit Archive: `src-tatoeba` (Tatoeba)

- **Source ID:** `src-tatoeba`
- **Intended Audit Target:** Tatoeba textual sentences & English–Bengali sentence pairs (`sentences_detailed.tar.bz2` + `links.tar.bz2`, weekly exports)
- **Excluded Scope:** Tatoeba audio files (mixed contributor licences, including `CC-BY-NC` / `CC-BY-SA` / unlicensed) are **excluded** and not audited.
- **Audit Status:** `approved_with_conditions` (signed off by `afrajul-ai`, `2026-11-24`)
- **Import Status:** Audit-only; no Tatoeba sentences are imported into SHOBDO yet.
- **Primary Sources:**
  - Downloads: https://tatoeba.org/en/downloads
  - Terms of Use: https://tatoeba.org/en/terms_of_use
  - FAQ (Attribution Guide): https://en.wiki.tatoeba.org/articles/show/faq
  - CC BY 2.0 FR: https://creativecommons.org/licenses/by/2.0/fr/

## Licensing & Obligations

1. **Textual Licence (`CC BY 2.0 FR` / `CC0 1.0`):** Textual sentences are released under **CC BY 2.0 FR** (with a subset available under `CC0 1.0`). No ShareAlike copyleft applies to SHOBDO's original Bengali entries or MIT code.
2. **Attribution Required:** Credit **Tatoeba** (`https://tatoeba.org`), state **`CC BY 2.0 FR`**, and preserve each sentence ID URL, contributor username (from `sentences_detailed.tar.bz2`), `modified` (`none | minor | substantial`), and `attribution_text` in *Sources and licences* and `data/attributions.json`.
3. **Quality & Copyright Filter:** Use only weekly export files (which exclude flagged `"red"` sentences) and require human review under `D5` / `D7` before any future release.
4. **Layer Isolation:** Keep Tatoeba-derived examples strictly in `/data/layers/tatoeba/` (`rights.class: "tatoeba"`), separate from `/data/layers/original/`, `/data/layers/wiktionary/`, `/data/layers/oewn/`, and MIT code.
