# SHOBDO Bengali Editorial Style Guide (SG-0.1 — Proposed Draft)

* **Status:** Proposed draft (`D5_style_guide_approved: false`). Not enforceable for publishing until co-signed by a qualified Bengali-reading reviewer.
* **Scope:** Original project policy for SHOBDO V1 (`EP-100` and beyond). Never copy text from any external dictionary or orthography manual.

## 1. Primary Spelling Standard & Reference
* **Language Variety:** Standard colloquial Bengali (**চলিত ভাষা**) as used in West Bengal (`SG-1`).
* **Primary Orthographic Reference:** Paschimbanga Bangla Akademi's *Akademi Banan Abhidhan* (*আকাদেমি বানান অভিধান*). **Edition status: `unverified`** (exact edition, publication year, and bibliographic details to be recorded in `docs/style-decisions.md` after a reviewer verifies the physical book or a reliable catalogue record). Consult for spelling rules only; never copy its entries.

## 2. Regional Variants (`wb`, `bd`, `general`)
* Retain well-established Bangladesh-standard variants in V1 labelled **`bd`** alongside West Bengal headline forms labelled **`wb`**.
* Use **`general`** only when shared usage across both regions is established.
* List the West Bengal headline form first, keeping regional equivalents side by side (e.g., `জল (WB)` and `পানি (BD)`). Never treat a regional variant as incorrect merely because it is not the West Bengal headline form.
* Strictly local/sub-regional dialect words remain out of V1 scope unless a reviewer adds an explicit note.
* Region tags require human reviewer agreement (`G5`: AI may not assign region tags).

## 3. সাধু and চলিত Policy
* **Default (`SG-1`):** All definitions, explanations, and example translations use natural **চলিত**.
* **সাধুভাষা (`SG-2`):** Allowed only when an English sense is itself literary, archaic, or formal and a reviewer confirms genuine Bengali usage; must be tagged `bn_style: "sadhu"` and `register: "literary"`.
* **No Mixing (`SG-3`):** Never mix সাধু and চলিত verb or pronoun forms within one sentence or field.
* **Verb Citation Forms (`SG-5`):** Verbs translating English infinitives are cited in their **dictionary citation form / verb headword form** (e.g., `করা`, `যাওয়া`).
* **Address Form (`SG-13`):** Examples default to neutral-polite **`আপনি`** with matching verb forms, unless demonstrating informality (`informal`).

## 4. Unicode, Punctuation & Spelling Variants
* **Unicode (`SG-6`–`SG-7`):** Store all text in Unicode **NFC**; never hand-edit code points. `ZWJ`/`ZWNJ` are permitted only from a reviewer-approved list.
* **Digits (`SG-9`):** Use Bengali digits (`০–৯`) in Bengali text and ASCII digits (`0–9`) in English text.
* **Punctuation (`SG-10`):** End complete Bengali sentences with the Bengali **দাড়ি (`।`, `U+0964`)**, never `.`, and never mix both in one field. Do **not** force sentence punctuation into headwords, labels, fragments, or other non-sentence fields.
* **Spelling Variants (`SG-8`):** Keep one preferred headline form distinct from a `variants` field used for search only. Include only documented, accepted alternatives—never arbitrary typos or every possible phonetic spelling.

## 5. Transliteration Policy (`SG-22`–`SG-24`)
* **`transliteration_bn` is deferred until after `EP-100`.** Do not implement it or treat any sound-mapping table as binding policy during `EP-100`.
* Romanization of Bengali words (Latin-letter spellings of Bengali) is out of V1 scope.

## 6. Definitions, Explanations, Examples, Labels & IPA
* **Editorial Targets (with Reviewer Exceptions):**
  * Simple English definition (`SG-18`): target 1 clear sentence, `<= 25` words, no headword, no circularity, matching POS.
  * Bengali explanation (`SG-19`): target `<= 2` sentences in natural চলিত, no word-for-word calques.
  * Examples (`SG-20`): target 1 clause, `~15` words or fewer in English, with natural meaning-equivalent Bengali translation.
  * Reviewers may approve documented exceptions to these word limits where clarity requires them (logged in review notes).
* **Labels (`SG-12`, `SG-14`):** Apply `register` (`formal`, `neutral`, `informal`, `slang`, `literary`) and `sense_type` (`literal`, `figurative`, `idiomatic`, `technical`) only with reviewer agreement; leave blank rather than guess. Never present slang or offensive usage as neutral.
* **IPA (`ipa.uk`, `ipa.us`):** Require a documented audit-approved source or qualified human review (`G5`/`H6`), matching the stated accent and pronunciation.
* **Relations (`SG-21`):** Link synonyms and antonyms to a specific sense, not just the headword.

## 7. Reviewer Scoring, Defects & Escalation (`SC-1` — Proposed Pending `EP-100` Calibration)
* **Hard Gates (`H1`–`H8`):** Rights complete (`H1`), provenance traceable (`H2`), schema/lint valid (`H3`), zero meaning errors (`H4`), sense separation (`H5`), no prohibited AI-only fields (`H6`), independent approver `author !== approver` (`H7`), no unattributed/copied third-party text (`H8`). Any hard-gate failure prevents approval.
* **Scored Criteria (100 applicable points; optional absent fields are N/A):**
  * `C1` English definition quality (`15` pts)
  * `C2` Bengali naturalness & style (`25` pts = `15` pts reviewer naturalness rating `0–2` per translation/explanation + `5` pts চলিত consistency + `5` pts conformity to `docs/style-decisions.md`)
  * `C3` Labels (`15` pts)
  * `C4` Examples (`20` pts)
  * `C5` Related data (`10` pts)
  * `C6` Conformity & review record (`15` pts)
* **Proposed Thresholds (to be calibrated and confirmed after `EP-100`):**
  * *Basic tier:* All hard gates pass, score `>= 80`, `C2 >= 70%` (`>= 17.5/25`), zero open Critical or Major defects.
  * *Full tier:* All hard gates pass, score `>= 90`, every criterion `>= 70%`, zero open Critical or Major defects.
* **Defect Severity Levels:**
  * **Critical:** Wrong meaning/merged senses, rights/licence violation, copied third-party text, prohibited AI-only field, offensive usage marked neutral.
  * **Major:** Wrong register/region/sense_type/POS, ungrammatical or unnatural Bengali, example mismatched to sense, সাধু/চলিত mixing.
  * **Minor:** Typo, spacing/punctuation slip, missed accepted spelling variant.
* **Returned vs. Rejected / Parked:**
  * **Returned:** Entry fails a threshold or has open defects and is sent back to the author/editor with a defect list in `/data/reviews/<id>.json` for correction and resubmission.
  * **Rejected / Parked:** Entry fails an incurable hard gate (e.g., copied/prohibited content) or fails 3 resubmission rounds; escalated to the **project owner and lead Bengali-reading reviewer** for an editorial decision.

## 8. Source Hierarchy (Orthography vs. Usage)
* **For Spelling & Orthographic Conventions:**
  1. `docs/style-decisions.md` (binding project precedents recorded by reviewers).
  2. *Akademi Banan Abhidhan* (Paschimbanga Bangla Akademi — edition `unverified`; consulted for rules only).
* **For Actual Usage & Meaning:**
  1. Qualified Bengali-reading reviewers and verified published Bengali/English usage evidence.
  2. Audit-approved reference sources (`licenses/audit-register.json`).
* **When Disputed:** If neither spelling nor usage is settled, park the entry rather than guessing.
