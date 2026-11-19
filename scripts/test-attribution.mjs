/**
 * @file Attribution completeness tests for IPA, word forms, and senses.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSite } from './build.mjs';

function makeProject(sources) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shobdo-attr-'));
  fs.mkdirSync(path.join(dir, 'licenses'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data', 'entries'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data', 'layers', 'original'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'licenses', 'audit-register.json'),
    JSON.stringify({ schema_version: 'LA-1', sources })
  );
  return dir;
}

// 1. Valid external IPA, forms, and sense attributions are all included
{
  const dir = makeProject([
    { source_id: 'src-wikt', name: 'English Wiktionary', status: 'approved' },
    { source_id: 'src-wn30', name: 'Princeton WordNet 3.0', status: 'approved_with_conditions' }
  ]);
  fs.mkdirSync(path.join(dir, 'data', 'layers', 'wiktionary'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data', 'layers', 'wordnet'), { recursive: true });

  fs.writeFileSync(
    path.join(dir, 'data', 'entries', 'e1.json'),
    JSON.stringify({ id: 'e1', headword: 'light', status: 'draft', senses: [{ key: 's1', pos: 'noun' }] })
  );
  fs.writeFileSync(
    path.join(dir, 'data', 'layers', 'wiktionary', 'e1.json'),
    JSON.stringify({
      ipa: {
        uk: '/laɪt/',
        rights: {
          class: 'wiktionary',
          source_id: 'src-wikt',
          licence_id: 'CC BY-SA',
          attribution_text: 'Wiktionary CC BY-SA 4.0',
          audit_ref: 'LA-1'
        }
      },
      forms: {
        values: ['lights'],
        rights: {
          class: 'wiktionary',
          source_id: 'src-wikt',
          licence_id: 'CC BY-SA',
          attribution_text: 'Wiktionary CC BY-SA 4.0',
          audit_ref: 'LA-1'
        }
      }
    })
  );
  fs.writeFileSync(
    path.join(dir, 'data', 'layers', 'wordnet', 'e1.json'),
    JSON.stringify({
      s1: {
        definition_en: {
          text: 'Visible illumination.',
          rights: {
            class: 'wordnet',
            source_id: 'src-wn30',
            licence_id: 'WordNet',
            attribution_text: 'Princeton WordNet 3.0 Notice',
            audit_ref: 'LA-2'
          }
        }
      }
    })
  );

  const outDir = path.join(dir, '_out');
  const res = buildSite({ rootDir: dir, outDir, mode: 'test', copyStatic: false });
  assert.equal(res.attributionCount, 2);

  const attributions = JSON.parse(fs.readFileSync(path.join(outDir, 'data', 'attributions.json'), 'utf8'));
  const byId = new Map(attributions.sources);
  assert.equal(byId.get('src-wikt'), 'Wiktionary CC BY-SA 4.0');
  assert.equal(byId.get('src-wn30'), 'Princeton WordNet 3.0 Notice');
  console.log('PASS: Valid external IPA, forms, and sense attributions included.');
}

// 2. Unapproved source on IPA fails
{
  const dir = makeProject([
    { source_id: 'src-wikt', name: 'English Wiktionary', status: 'not_audited' }
  ]);
  fs.writeFileSync(
    path.join(dir, 'data', 'entries', 'e2.json'),
    JSON.stringify({ id: 'e2', headword: 'test', status: 'draft', senses: [{ key: 's1', pos: 'noun' }] })
  );
  fs.writeFileSync(
    path.join(dir, 'data', 'layers', 'original', 'e2.json'),
    JSON.stringify({
      ipa: {
        uk: '/test/',
        rights: {
          class: 'wiktionary',
          source_id: 'src-wikt',
          attribution_text: 'Wiktionary',
          audit_ref: 'LA-1'
        }
      }
    })
  );

  assert.throws(
    () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'test', copyStatic: false }),
    /status "not_audited"/i
  );
  console.log('PASS: Unapproved source on IPA rejected.');
}

// 3. External forms missing attribution_text and licence_id fails
{
  const dir = makeProject([
    { source_id: 'src-wikt', name: 'English Wiktionary', status: 'approved' }
  ]);
  fs.mkdirSync(path.join(dir, 'data', 'layers', 'wiktionary'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'data', 'entries', 'e3.json'),
    JSON.stringify({ id: 'e3', headword: 'test', status: 'draft', senses: [{ key: 's1', pos: 'noun' }] })
  );
  fs.writeFileSync(
    path.join(dir, 'data', 'layers', 'wiktionary', 'e3.json'),
    JSON.stringify({
      forms: {
        values: ['tests'],
        rights: {
          class: 'wiktionary',
          source_id: 'src-wikt',
          audit_ref: 'LA-1'
        }
      }
    })
  );

  assert.throws(
    () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'test', copyStatic: false }),
    /Missing attribution_text and licence_id/i
  );
  console.log('PASS: External forms missing attribution_text and licence_id rejected.');
}

console.log('All attribution completeness tests passed!');
