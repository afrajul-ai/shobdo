/**
 * @file Stage 2+ negative & gate tests (v0.2.1 Section 3.5 + Release Governance + Provenance).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSite, checkNoExternalRequests } from './build.mjs';

function makeTempProject(name, gov = {
  D1_data_source_approved: false,
  D7_reviewers_registered: false,
  D10_licences_approved: false,
  release_enabled: false
}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `shobdo-neg-${name}-`));
  fs.mkdirSync(path.join(dir, 'licenses'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'docs'), { recursive: true });
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
  if (gov) {
    fs.writeFileSync(path.join(dir, 'docs', 'governance.json'), JSON.stringify(gov));
  }
  return dir;
}

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
    throw new Error(`[${label}] Expected failure, but succeeded!`);
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
    JSON.stringify({ s1: { definition_en: { text: 'Missing rights.' } } })
  );
  expectFail('Missing rights', () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'test', copyStatic: false }), /Missing rights/i);
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
          text: 'Unaudited external.',
          rights: { class: 'wiktionary', source_id: 'src-wikt', audit_ref: 'LA-1' }
        }
      }
    })
  );
  expectFail('Unaudited source', () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'test', copyStatic: false }), /status "not_audited"/i);
}

// 3. Mixed / conflicting layers
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
    JSON.stringify({
      s1: {
        definition_en: {
          text: 'B',
          rights: { class: 'original', author_id: 'a1', authoring_method: 'independent', origin: 'human', contributor_permission: true }
        }
      }
    })
  );
  expectFail('Mixed/conflicting classes', () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'test', copyStatic: false }), /Field conflict/i);
}

// 4. Release fails when D1/D7/D10 are unresolved
{
  const dir = makeTempProject('release-blocked-d1');
  fs.writeFileSync(
    path.join(dir, 'data', 'entries', 'e4.json'),
    JSON.stringify({ id: 'e4', headword: 'test', status: 'published', senses: [{ key: 's1', pos: 'noun' }] })
  );
  expectFail('Release blocked by unresolved D1', () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'release', copyStatic: false }), /D1/i);
}

// 5. Release fails when D7 is false even if D1 & D10 are true
{
  const dir = makeTempProject('release-blocked-d7', {
    D1_data_source_approved: true,
    D7_reviewers_registered: false,
    D10_licences_approved: true,
    release_enabled: true
  });
  expectFail('Release blocked by unresolved D7', () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'release', copyStatic: false }), /D7/i);
}

// 6. Fixture in release mode fails
{
  const dir = makeTempProject('fixture-in-release', {
    D1_data_source_approved: true,
    D7_reviewers_registered: true,
    D10_licences_approved: true,
    release_enabled: true
  });
  fs.writeFileSync(path.join(dir, 'LICENSE'), 'Pending');
  fs.writeFileSync(
    path.join(dir, 'data', 'entries', 'e5.json'),
    JSON.stringify({ id: 'e5', headword: 'test', status: 'fixture', senses: [{ key: 's1', pos: 'noun' }], rights_default: { class: 'fixture' } })
  );
  expectFail('Fixture in release mode', () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'release', copyStatic: false }), /forbidden in release mode/i);
}

// 7. Original provenance checks
{
  const dir = makeTempProject('original-provenance');
  fs.writeFileSync(
    path.join(dir, 'data', 'entries', 'e6.json'),
    JSON.stringify({ id: 'e6', headword: 'test', status: 'draft', senses: [{ key: 's1', pos: 'noun' }] })
  );
  fs.writeFileSync(
    path.join(dir, 'data', 'layers', 'original', 'e6.json'),
    JSON.stringify({
      s1: {
        definition_en: {
          text: 'Test',
          rights: { class: 'original', author_id: 'a1', authoring_method: 'edited_from_source', origin: 'human', contributor_permission: true }
        }
      }
    })
  );
  expectFail('Original edited_from_source rejected', () => buildSite({ rootDir: dir, outDir: path.join(dir, '_out'), mode: 'test', copyStatic: false }), /independent/i);
}

// 8. Recursive external-request check catches nested JS fetch, ignores comments
{
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'shobdo-ext-'));
  fs.mkdirSync(path.join(out, 'src', 'nested'), { recursive: true });
  fs.writeFileSync(path.join(out, 'src', 'nested', 'ok.js'), '// Docs: https://example.com\nconst x = 1;');
  checkNoExternalRequests(out);

  fs.writeFileSync(path.join(out, 'src', 'nested', 'bad.js'), 'fetch("https://evil.example/data.json");');
  expectFail('Nested external fetch rejected', () => checkNoExternalRequests(out), /External URL reference found/i);
}

console.log('All 8 negative & governance tests passed!');
                      
