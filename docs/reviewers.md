# SHOBDO Reviewer Qualification Criteria & Register (`D7` — Proposed Draft)

* **Status:** Proposed draft (`D7_reviewers_registered: false`). No reviewers are registered yet; release builds remain blocked (`G4`) until at least one qualified independent Bengali-reading approver is registered.
* **Privacy & Identity Rule:** `reviewer_id` must be pseudonymous and persistent (e.g., `rev-01`), and must **not** contain personal emails, phone numbers, or legal names unless a reviewer explicitly requests otherwise in writing. Do not collect or publish unnecessary personal information in this public repository.

## 1. Minimum Bengali-Reading Proficiency & Linguistic Competence
A general **Bengali-reading approver** must demonstrate:
* Fluent reading and writing comprehension of standard Bengali script (including conjuncts, *reph*, `ৎ`, and Unicode NFC text).
* Ability to verify English-to-Bengali sense equivalence accurately (`H4`: zero meaning errors permitted).
* Working competence in English sufficient to evaluate simple English learner definitions (`SG-18`) and English example sentences (`SG-20`).

## 2. West Bengal চলিত & Regional Awareness
* Strong familiarity with standard colloquial Bengali (**চলিত ভাষা**) as used in West Bengal (`SG-1`).
* Clear ability to distinguish সাধুভাষা from চলিত (`SG-2`, `SG-3`) and catch unnatural word-for-word calques (`SG-19`).
* Awareness of well-established Bangladesh-standard (`bd`) and shared (`general`) variants so legitimate regional forms are tagged accurately rather than marked wrong (`SD-02`).

## 3. Specialist Review Qualifications (IPA & Pronunciation)
* General Bengali-reading approvers may **not** approve IPA fields (`ipa.uk`, `ipa.us`) unless they meet specialist pronunciation requirements.
* Specialist IPA approval requires **either**:
  * Verification against an **audit-approved primary source** (`licenses/audit-register.json`), **or**
  * **Documented phonetics qualification** (unverified self-declaration is not sufficient; `G5`/`H6`: no AI-only IPA).

## 4. Reviewer Responsibilities, Limitations & Expected Conduct
* **Responsibilities:** Evaluate hard gates (`H1`–`H8`), score `C1`–`C6` honestly in `/data/reviews/<id>.json`, log Critical/Major/Minor defects, and record style precedents in `docs/style-decisions.md`.
* **Limitations:**
  * Reviewers must **never** copy text from published copyrighted dictionaries or unapproved sources (`H8`, `G1`).
  * Reviewers must **never** bypass `H1`/`H2` provenance checks or accept AI-only IPA, `region`, `usage_note`, or common-mistake notes (`H6`).
* **Conduct:** Constructive, evidence-based feedback focused on learner clarity and linguistic accuracy.

## 5. Independence Declarations & Conflicts of Interest
* Every registered reviewer must declare whether they have any financial, employment, or editorial conflict of interest with any third-party dictionary or dataset under review.
* The project owner (`afrajul-ai`) is **not** treated as a qualified independent Bengali-reading approver by default.
* For `EP-100` calibration (`Section 6.5`), double-reviewed entries must be scored independently and blind by two qualified reviewers.

## 6. Author–Approver Separation & Contributor Permission (`H7`, `D10`)
* **Strict Separation:** The author of an entry or field may **never** act as the approver for that same entry (`author_id !== approver_id`).
* **Contributor Permission (`D10`):** Any original-entry contributor or reviewer whose submissions are retained in the repository must confirm contributor permission under `D10` (*"All rights reserved for now"* / project retention terms) before their registration becomes active.
* **Provenance Enforcement:** Reviewers may only approve `original` entries carrying `authoring_method: "independent"` and `contributor_permission: true`, and external entries whose `source_id` is `approved` or `approved_with_conditions` in `licenses/audit-register.json`.

## 7. Escalation, Disagreement Resolution & Reviewer Removal
* **Editorial Disagreements:** If an author and reviewer disagree on a Critical or Major defect—or an entry fails 3 resubmission rounds—escalate to the **project owner and lead Bengali-reading reviewer** (or a second independent reviewer) to decide and log a rule in `docs/style-decisions.md`.
* **Reviewer Removal / Suspension:** The project owner may suspend or remove a reviewer (changing `status` to `inactive` or `removed`) for repeated `H4`/`H8` failures, undisclosed conflicts of interest, or prolonged inactivity. Existing entries approved by a reviewer removed for copyright or accuracy issues must be re-audited before any release.

## 8. Reviewer Register (Template — No Reviewers Registered Yet)

| `reviewer_id` | `display_handle` | `qualifications` | `declared_review_scope` | `independence_declared` | `contributor_permission_confirmed` | `consent_recorded` | `status` | `registration_date` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *(none)* | — | — | — | — | — | — | `unregistered` | — |
