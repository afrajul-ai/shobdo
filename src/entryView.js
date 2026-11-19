/**
 * @file Dictionary Entry screen with Bookmark, Vocabulary note, and Sources panel.
 */

import { getVocabNote, isBookmarked, saveVocabNote, toggleBookmark } from './storage.js';
import { getUiLabels } from './ui-mode.js';

function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function resolveRights(fieldObj, senseObj, entryObj) {
  return fieldObj?.rights || senseObj?.rights_default || entryObj?.rights_default || { class: 'unknown' };
}

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

function appendRightsRow(list, label, rights) {
  const li = el('li');
  const badge = el('span', `rights-badge rights-${rights.class || 'unknown'}`, rights.class || 'unknown');
  li.append(badge, document.createTextNode(` ${label}: ${formatRightsSummary(rights)}`));
  if (rights.source_url) {
    const link = document.createElement('a');
    link.href = rights.source_url;
    link.textContent = ' (source)';
    link.rel = 'noopener noreferrer';
    li.appendChild(link);
  }
  list.appendChild(li);
}

function buildSourcesPanel(entry) {
  const details = document.createElement('details');
  details.className = 'sources-panel';
  details.appendChild(el('summary', 'sources-summary', 'Sources and licences'));

  const body = el('div', 'sources-body');
  const classes = entry.entry_rights_summary?.classes || [];
  body.appendChild(
    el('p', 'sources-classes', `Classes present: ${classes.length ? classes.join(', ') : 'none'}`)
  );

  const list = el('ul', 'sources-list');

  if (entry.ipa) {
    appendRightsRow(list, 'Entry · IPA', resolveRights(entry.ipa, undefined, entry));
  }
  if (entry.forms) {
    const formsObj = Array.isArray(entry.forms) ? undefined : entry.forms;
    appendRightsRow(list, 'Entry · Word forms', resolveRights(formsObj, undefined, entry));
  }

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
      appendRightsRow(list, `Sense ${index + 1} · ${label}`, resolveRights(fieldVal, sense, entry));
    }
  });

  body.appendChild(list);
  details.appendChild(body);
  return details;
}

async function buildVocabBox(entry) {
  const box = el('section', 'vocab-box');
  box.appendChild(el('h3', 'vocab-title', 'Personal Vocabulary Note'));

  const existing = await getVocabNote(entry.id);

  const textarea = document.createElement('textarea');
  textarea.className = 'vocab-input';
  textarea.rows = 2;
  textarea.placeholder = 'Add your own study note or memory tip…';
  textarea.value = existing?.note || '';

  const tagsInput = document.createElement('input');
  tagsInput.type = 'text';
  tagsInput.className = 'vocab-tags-input';
  tagsInput.placeholder = 'Tags (comma-separated, e.g. exam, verb)';
  tagsInput.value = (existing?.tags || []).join(', ');

  const actions = el('div', 'vocab-actions');
  const saveBtn = el('button', 'primary-btn', 'Save note');
  saveBtn.type = 'button';
  const msg = el('span', 'vocab-saved-msg', '');

  saveBtn.addEventListener('click', async () => {
    const tags = tagsInput.value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await saveVocabNote(entry, textarea.value, tags);
    msg.textContent = textarea.value.trim() || tags.length ? 'Saved on device.' : 'Note cleared.';
  });

  actions.append(saveBtn, msg);
  box.append(textarea, tagsInput, actions);
  return box;
}

export async function renderEntryView(containerEl, entry, onBack, buildMode = 'test') {
  containerEl.innerHTML = '';
  const ui = getUiLabels(buildMode);

  const topBar = el('div', 'entry-topbar');
  const backBtn = el('button', 'back-btn', '← Back');
  backBtn.type = 'button';
  backBtn.addEventListener('click', onBack);

  const bmBtn = el('button', 'bookmark-btn', '☆ Bookmark');
  bmBtn.type = 'button';
  const bookmarked = await isBookmarked(entry.id);
  bmBtn.textContent = bookmarked ? '★ Bookmarked' : '☆ Bookmark';
  bmBtn.setAttribute('aria-pressed', String(bookmarked));
  bmBtn.addEventListener('click', async () => {
    const nowSaved = await toggleBookmark(entry);
    bmBtn.textContent = nowSaved ? '★ Bookmarked' : '☆ Bookmark';
    bmBtn.setAttribute('aria-pressed', String(nowSaved));
  });

  topBar.append(backBtn, bmBtn);
  containerEl.appendChild(topBar);

  const header = el('div', 'entry-header');
  const titleRow = el('div', 'entry-title-row');
  titleRow.appendChild(el('h2', 'entry-headword', entry.headword));
  if (ui.showFixtureBadge(entry)) {
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

  const formsList = Array.isArray(entry.forms) ? entry.forms : entry.forms?.values;
  if (Array.isArray(formsList) && formsList.length > 0) {
    header.appendChild(el('p', 'entry-forms', `Forms: ${formsList.join(', ')}`));
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
      card.appendChild(el('p', 'usage-note', `Usage note: ${sense.usage_note.text}`));
    }

    containerEl.appendChild(card);
  });

  containerEl.appendChild(await buildVocabBox(entry));
  containerEl.appendChild(buildSourcesPanel(entry));
}
  
