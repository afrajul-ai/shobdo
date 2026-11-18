/**
 * @file Stage 4 Dictionary Entry screen renderer with dynamic Sources & Licences panel.
 */

/**
 * Create an element with optional className and textContent.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/**
 * Resolve effective rights for a field, sense, or entry.
 * @param {object | undefined} fieldObj
 * @param {object | undefined} senseObj
 * @param {object | undefined} entryObj
 * @returns {object}
 */
function resolveRights(fieldObj, senseObj, entryObj) {
  return fieldObj?.rights || senseObj?.rights_default || entryObj?.rights_default || { class: 'unknown' };
}

/**
 * Format a human-readable label for a rights class.
 * @param {object} rights
 * @returns {string}
 */
function formatRightsSummary(rights) {
  const cls = rights.class || 'unknown';
  if (cls === 'fixture') {
    return 'Fixture (test data only, not verified)';
  }
  if (cls === 'original') {
    return `Original (author: ${rights.author_id || 'project'})`;
  }
  const licence = [rights.licence_id, rights.licence_version].filter(Boolean).join(' ');
  return licence ? `${cls} — ${licence}` : cls;
}

/**
 * Render the collapsible "Sources and licences" panel driven by rights data.
 * @param {object} entry
 * @returns {HTMLDetailsElement}
 */
function buildSourcesPanel(entry) {
  const details = document.createElement('details');
  details.className = 'sources-panel';

  const summary = el('summary', 'sources-summary', 'Sources and licences');
  details.appendChild(summary);

  const body = el('div', 'sources-body');
  const classes = entry.entry_rights_summary?.classes || [];
  body.appendChild(
    el('p', 'sources-classes', `Classes present: ${classes.length ? classes.join(', ') : 'none'}`)
  );

  const list = el('ul', 'sources-list');
  (entry.senses || []).forEach((sense, index) => {
    const fieldGroups = [
      ['Definition (EN)', sense.definition_en],
      ['Explanation (BN)', sense.explanation_bn],
      ['Translations', sense.translations?.[0]],
      ['Examples', sense.examples?.[0]],
      ['Relations', sense.relations],
      ['Phrases', sense.phrases?.[0]],
      ['Usage note', sense.usage_note]
    ];

    for (const [label, fieldVal] of fieldGroups) {
      if (!fieldVal) continue;
      const rights = resolveRights(fieldVal, sense, entry);
      const li = el('li');
      const badge = el('span', `rights-badge rights-${rights.class || 'unknown'}`, rights.class || 'unknown');
      li.append(badge, document.createTextNode(` Sense ${index + 1} · ${label}: ${formatRightsSummary(rights)}`));
      if (rights.source_url) {
        const link = document.createElement('a');
        link.href = rights.source_url;
        link.textContent = ' (source)';
        link.rel = 'noopener noreferrer';
        li.appendChild(link);
      }
      list.appendChild(li);
    }
  });

  body.appendChild(list);
  details.appendChild(body);
  return details;
}

/**
 * Render a full dictionary entry into containerEl.
 * @param {HTMLElement} containerEl
 * @param {object} entry
 * @param {() => void} onBack
 * @returns {void}
 */
export function renderEntryView(containerEl, entry, onBack) {
  containerEl.innerHTML = '';

  const backBtn = el('button', 'back-btn', '← Back to search');
  backBtn.type = 'button';
  backBtn.addEventListener('click', onBack);
  containerEl.appendChild(backBtn);

  const header = el('div', 'entry-header');
  const titleRow = el('div', 'entry-title-row');
  titleRow.appendChild(el('h2', 'entry-headword', entry.headword));
  if (entry.status === 'fixture') {
    titleRow.appendChild(el('span', 'fixture-tag', 'FIXTURE'));
  }
  header.appendChild(titleRow);

  if (entry.ipa && (entry.ipa.uk || entry.ipa.us)) {
    const ipaRow = el('div', 'entry-ipa');
    if (entry.ipa.uk) ipaRow.appendChild(el('span', 'ipa-pill', `UK ${entry.ipa.uk}`));
    if (entry.ipa.us) ipaRow.appendChild(el('span', 'ipa-pill', `US ${entry.ipa.us}`));
    header.appendChild(ipaRow);
  }

  if (entry.transliteration_bn) {
    const tr = el('p', 'entry-translit');
    tr.lang = 'bn';
    tr.textContent = `Pronunciation (approx.): ${entry.transliteration_bn}`;
    header.appendChild(tr);
  }

  if (Array.isArray(entry.forms) && entry.forms.length > 0) {
    header.appendChild(el('p', 'entry-forms', `Forms: ${entry.forms.join(', ')}`));
  }

  containerEl.appendChild(header);

  (entry.senses || []).forEach((sense, idx) => {
    const card = el('article', 'sense-card');

    const metaRow = el('div', 'sense-meta');
    metaRow.appendChild(el('span', 'sense-num', `${idx + 1}.`));
    metaRow.appendChild(el('span', 'pos-badge', sense.pos));
    if (sense.register) {
      metaRow.appendChild(el('span', 'register-badge', sense.register));
    }
    card.appendChild(metaRow);

    if (Array.isArray(sense.translations) && sense.translations.length > 0) {
      const trList = el('div', 'translations-row');
      sense.translations.forEach((t) => {
        const item = el('span', 'bn-translation');
        item.lang = 'bn';
        item.textContent = t.bn;
        if (t.region && t.region !== 'general') {
          item.appendChild(el('span', 'sub-tag', ` (${t.region.toUpperCase()})`));
        }
        if (t.bn_style && t.bn_style !== 'cholito') {
          item.appendChild(el('span', 'sub-tag', ` [${t.bn_style}]`));
        }
        trList.appendChild(item);
      });
      card.appendChild(trList);
    }

    if (sense.definition_en?.text) {
      card.appendChild(el('p', 'def-en', sense.definition_en.text));
    }

    if (sense.explanation_bn?.text) {
      const exp = el('p', 'exp-bn', sense.explanation_bn.text);
      exp.lang = 'bn';
      card.appendChild(exp);
    }

    if (Array.isArray(sense.examples) && sense.examples.length > 0) {
      const exWrap = el('div', 'examples-block');
      sense.examples.forEach((ex) => {
        const exItem = el('div', 'example-item');
        exItem.appendChild(el('p', 'example-en', `“${ex.en}”`));
        const exBn = el('p', 'example-bn', ex.bn);
        exBn.lang = 'bn';
        exItem.appendChild(exBn);
        exWrap.appendChild(exItem);
      });
      card.appendChild(exWrap);
    }

    if (Array.isArray(sense.phrases) && sense.phrases.length > 0) {
      const phWrap = el('div', 'phrases-block');
      phWrap.appendChild(el('strong', 'block-label', 'Phrases:'));
      sense.phrases.forEach((p) => {
        const pLine = el('p', 'phrase-item');
        pLine.innerHTML = '';
        pLine.appendChild(el('strong', '', `${p.phrase}: `));
        pLine.appendChild(document.createTextNode(`${p.meaning_en} — `));
        const bnSpan = el('span', '', p.meaning_bn);
        bnSpan.lang = 'bn';
        pLine.appendChild(bnSpan);
        phWrap.appendChild(pLine);
      });
      card.appendChild(phWrap);
    }

    if (sense.relations) {
      const relWrap = el('div', 'relations-block');
      if (sense.relations.synonyms?.length) {
        relWrap.appendChild(el('p', 'rel-line', `Synonyms: ${sense.relations.synonyms.join(', ')}`));
      }
      if (sense.relations.antonyms?.length) {
        relWrap.appendChild(el('p', 'rel-line', `Antonyms: ${sense.relations.antonyms.join(', ')}`));
      }
      if (relWrap.childElementCount > 0) card.appendChild(relWrap);
    }

    if (sense.usage_note?.text) {
      const note = el('p', 'usage-note', `Usage note: ${sense.usage_note.text}`);
      card.appendChild(note);
    }

    containerEl.appendChild(card);
  });

  containerEl.appendChild(buildSourcesPanel(entry));
                                                         }
    
