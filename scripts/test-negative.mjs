/**
 * @file Stage 2 negative tests (v0.2.1 Section 3.5).
 * Each deliberately invalid fixture MUST cause buildSite() to throw.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSite } from './build.mjs';

/**
 * Create an isolated temporary project directory for a negative test.
 * @param {string} name
 * @returns {string}
 */
function makeTempProject(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `shobdo-neg-${name}-`));
  fs.mkdirSync(path.join(dir, 'licenses'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data', 'entries'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data', 'layers', 'fixture'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data', 'layers', 'original'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'licenses', 'audit-register.json'),
    JSON.stringify({
      schema_version: 'LA-1',
      sources: [{ source_id: 'src-wikt', name: 'English Wiktionary', status: 'not_audited' }]
    })
  );
  return dir;
}

/**
 * Assert that a test case throws an error matching expectedPattern.
 * @param {string} label
 * @param {() => void} fn
 * @param {RegExp} expectedPattern
 */
function expectFail(label, fn, expectedPattern) {
  let failed = false;
  try {
    fn();
  } catch (err) {
    failed = true;
    if (!expectedPattern.test(err.message)) {
      throw new Error(`[${label}] Failed with unexpected error: ${err.message}`);
    }
    console.log(`PASS (failed as intended): ${label} -> ${err.message}`);
  }
  if (!failed) {
    throw new Error(`[${label}] Expected build to fail, but it succeeded!`);
  }
}

// 1. Missing rights
{
  const dir = makeTempProject('missing-rights');
  fs.writeFileSync(
    path.join(dir, 'data', 'entries', 'e1.json'),
    JSON.stringify({ id: 'e1', headword: 'test', status: 'fixture', senses: [{ key: 's1', pos: 'noun' }] })
  );
  fs.writeFileSync(
    path.join(dir, 'data', 'layers', 'fixture', 'e1.json'),
    JSON.stringify({ s1: { definition_en: { text: 'Missing rights here.' } } })
  );
  expectFail(
    'Missing rights',
    () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'test', copyStatic: false }),
    /Missing rights/i
  );
}

// 2. Unaudited source
{
  const dir = makeTempProject('unaudited-source');
  fs.writeFileSync(
    path.join(dir, 'data', 'entries', 'e2.json'),
    JSON.stringify({ id: 'e2', headword: 'test', status: 'draft', senses: [{ key: 's1', pos: 'noun' }] })
  );
  fs.writeFileSync(
    path.join(dir, 'data', 'layers', 'original', 'e2.json'),
    JSON.stringify({
      s1: {
        definition_en: {
          text: 'Unaudited external claim.',
          rights: { class: 'wiktionary', source_id: 'src-wikt', audit_ref: 'LA-1' }
        }
      }
    })
  );
  expectFail(
    'Unaudited source',
    () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'test', copyStatic: false }),
    /status "not_audited"/i
  );
}

// 3. Mixed / conflicting layers on the same field
{
  const dir = makeTempProject('mixed-classes');
  fs.writeFileSync(
    path.join(dir, 'data', 'entries', 'e3.json'),
    JSON.stringify({ id: 'e3', headword: 'test', status: 'fixture', senses: [{ key: 's1', pos: 'noun' }] })
  );
  fs.writeFileSync(
    path.join(dir, 'data', 'layers', 'fixture', 'e3.json'),
    JSON.stringify({ s1: { definition_en: { text: 'A', rights: { class: 'fixture' } } } })
  );
  fs.writeFileSync(
    path.join(dir, 'data', 'layers', 'original', 'e3.json'),
    JSON.stringify({ s1: { definition_en: { text: 'B', rights: { class: 'original' } } } })
  );
  expectFail(
    'Mixed/conflicting classes',
    () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'test', copyStatic: false }),
    /Field conflict/i
  );
}

// 4. Fixture entry in release mode
{
  const dir = makeTempProject('fixture-in-release');
  fs.writeFileSync(
    path.join(dir, 'data', 'entries', 'e4.json'),
    JSON.stringify({
      id: 'e4',
      headword: 'test',
      status: 'fixture',
      senses: [{ key: 's1', pos: 'noun' }],
      rights_default: { class: 'fixture' }
    })
  );
  expectFail(
    'Fixture in release mode',
    () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'release', copyStatic: false }),
    /forbidden in release mode/i
  );
}

console.log('All 4 negative tests passed!');
                                                                              
