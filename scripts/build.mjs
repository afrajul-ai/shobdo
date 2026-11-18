/**
 * @file Stage 2+ build, governance-gate, provenance, and external-request enforcement script.
 * Zero external dependencies. Supports --mode=test|release and --out=<dir>.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const VALID_CLASSES = new Set([
  'original',
  'wiktionary',
  'wordnet',
  'tatoeba',
  'oewn',
  'fixture'
]);

const EXTERNAL_CLASSES = new Set(['wiktionary', 'wordnet', 'tatoeba', 'oewn']);

const SENSE_CONTENT_FIELDS = [
  'definition_en',
  'explanation_bn',
  'translations',
  'examples',
  'relations',
  'phrases',
  'usage_note'
];

function assertReleaseGovernance(rootDir) {
  const govPath = path.join(rootDir, 'docs', 'governance.json');
  if (!fs.existsSync(govPath)) {
    throw new Error('Release blocked: missing docs/governance.json');
  }
  const gov = JSON.parse(fs.readFileSync(govPath, 'utf8'));
  if (gov.D1_data_source_approved !== true) {
    throw new Error('Release blocked: D1 (data source & LA-1 audit) is not approved');
  }
  if (gov.D7_reviewers_registered !== true) {
    throw new Error('Release blocked: D7 (qualified reviewers) is not registered');
  }
  if (gov.D10_licences_approved !== true) {
    throw new Error('Release blocked: D10 (code/data licences) is not approved');
  }
  if (gov.release_enabled !== true) {
    throw new Error('Release blocked: release_enabled is false in docs/governance.json');
  }
  if (!fs.existsSync(path.join(rootDir, 'LICENSE'))) {
    throw new Error('Release blocked: LICENSE file missing (D10/G6)');
  }
}

function validateRights(rights, contextLabel, auditMap, mode) {
  if (!rights || typeof rights !== 'object') {
    throw new Error(`Missing rights on ${contextLabel}`);
  }
  if (!VALID_CLASSES.has(rights.class)) {
    throw new Error(`Invalid rights class "${rights.class}" on ${contextLabel}`);
  }
  if (mode === 'release' && rights.class === 'fixture') {
    throw new Error(`Fixture rights class is forbidden in release mode (${contextLabel})`);
  }

  if (rights.class === 'original') {
    if (!rights.author_id || typeof rights.author_id !== 'string') {
      throw new Error(`Original field missing author_id on ${contextLabel}`);
    }
    if (rights.authoring_method !== 'independent') {
      throw new Error(
        `Original field must have authoring_method "independent" (got "${rights.authoring_method}") on ${contextLabel}`
      );
    }
    if (rights.origin !== 'human' && rights.origin !== 'ai_assisted') {
      throw new Error(`Original field has invalid origin "${rights.origin}" on ${contextLabel}`);
    }
    if (rights.origin === 'ai_assisted' && (!rights.ai_model || !rights.prompt_id)) {
      throw new Error(`AI-assisted original field missing ai_model or prompt_id on ${contextLabel}`);
    }
    if (rights.contributor_permission !== true) {
      throw new Error(`Original field missing contributor_permission: true on ${contextLabel}`);
    }
  }

  if (EXTERNAL_CLASSES.has(rights.class)) {
    const audit = auditMap.get(rights.source_id);
    if (!audit) {
      throw new Error(`Unknown source_id "${rights.source_id}" on ${contextLabel}`);
    }
    if (audit.status !== 'approved' && audit.status !== 'approved_with_conditions') {
      throw new Error(
        `Source "${rights.source_id}" has status "${audit.status}" (must be approved) on ${contextLabel}`
      );
    }
    if (!rights.audit_ref) {
      throw new Error(`Missing audit_ref on external field ${contextLabel}`);
    }
  }
}

function walkFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

export function checkNoExternalRequests(outDir) {
  const inspectExts = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg']);
  const urlPattern = /https?:\/\//i;

  for (const fullPath of walkFiles(outDir)) {
    const ext = path.extname(fullPath).toLowerCase();
    if (!inspectExts.has(ext)) continue;

    const relPath = path.relative(outDir, fullPath).replace(/\\/g, '/');
    let content = fs.readFileSync(fullPath, 'utf8');

    if (ext === '.js' || ext === '.mjs' || ext === '.css') {
      content = stripComments(content);
    } else if (ext === '.svg') {
      content = content.replace(/http:\/\/www\.w3\.org\/(2000\/svg|1999\/xlink)/g, '');
    } else if (relPath === 'data/dictionary.json' || relPath === 'data/attributions.json') {
      content = content.replace(/"source_url"\s*:\s*"https?:\/\/[^"]*"/g, '"source_url": ""');
    }

    if (urlPattern.test(content)) {
      throw new Error(`External URL reference found in built asset: ${relPath}`);
    }
  }
}

export function buildSite({ rootDir, outDir, mode, copyStatic = true }) {
  if (mode !== 'test' && mode !== 'release') {
    throw new Error(`Invalid build mode: ${mode}`);
  }

  if (mode === 'release') {
    assertReleaseGovernance(rootDir);
  }

  const auditPath = path.join(rootDir, 'licenses', 'audit-register.json');
  const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  const auditMap = new Map(auditData.sources.map((s) => [s.source_id, s]));

  const layersRoot = path.join(rootDir, 'data', 'layers');
  const activeLayers = fs.existsSync(layersRoot)
    ? fs.readdirSync(layersRoot).filter((name) =>
        fs.statSync(path.join(layersRoot, name)).isDirectory()
      )
    : [];

  for (const layerName of activeLayers) {
    if (EXTERNAL_CLASSES.has(layerName)) {
      const hasApproved = auditData.sources.some(
        (s) =>
          (s.status === 'approved' || s.status === 'approved_with_conditions') &&
          s.name.toLowerCase().includes(layerName)
      );
      if (!hasApproved) {
        throw new Error(`External layer folder "/data/layers/${layerName}" exists without audit approval`);
      }
    }
  }

  const entriesDir = path.join(rootDir, 'data', 'entries');
  const entryFiles = fs.existsSync(entriesDir)
    ? fs.readdirSync(entriesDir).filter((f) => f.endsWith('.json')).sort()
    : [];

  const builtEntries = [];
  const attributions = new Map();

  for (const file of entryFiles) {
    const skeleton = JSON.parse(fs.readFileSync(path.join(entriesDir, file), 'utf8'));
    const entryId = skeleton.id;

    if (mode === 'release' && skeleton.status !== 'published') {
      throw new Error(`Non-published entry "${entryId}" (status: ${skeleton.status}) forbidden in release mode`);
    }

    const merged = structuredClone(skeleton);
    const entryDefaultRights = skeleton.rights_default || null;
    const classesUsed = new Set();
    const fieldOwners = new Map();

    for (const layerName of activeLayers) {
      const layerFile = path.join(layersRoot, layerName, `${entryId}.json`);
      if (!fs.existsSync(layerFile)) continue;

      const layerData = JSON.parse(fs.readFileSync(layerFile, 'utf8'));

      for (const topField of ['ipa', 'forms']) {
        if (layerData[topField] !== undefined) {
          if (fieldOwners.has(topField)) {
            throw new Error(
              `Field conflict on "${entryId}.${topField}" between "${fieldOwners.get(topField)}" and "${layerName}"`
            );
          }
          fieldOwners.set(topField, layerName);
          merged[topField] = layerData[topField];
          const resolved = layerData[topField]?.rights || entryDefaultRights;
          validateRights(resolved, `${entryId}.${topField}`, auditMap, mode);
          classesUsed.add(resolved.class);
        }
      }

      for (const sense of merged.senses || []) {
        const layerSense = layerData[sense.key];
        if (!layerSense) continue;
        const senseDefault = sense.rights_default || entryDefaultRights;

        for (const fieldName of SENSE_CONTENT_FIELDS) {
          if (layerSense[fieldName] === undefined) continue;
          const fieldKey = `${sense.key}.${fieldName}`;
          if (fieldOwners.has(fieldKey)) {
            throw new Error(
              `Field conflict on "${entryId}.${fieldKey}" between "${fieldOwners.get(fieldKey)}" and "${layerName}"`
            );
          }
          fieldOwners.set(fieldKey, layerName);
          sense[fieldName] = layerSense[fieldName];

          const value = layerSense[fieldName];
          if (Array.isArray(value)) {
            value.forEach((item, idx) => {
              const resolved = item?.rights || senseDefault;
              validateRights(resolved, `${entryId}.${fieldKey}[${idx}]`, auditMap, mode);
              classesUsed.add(resolved.class);
              if (EXTERNAL_CLASSES.has(resolved.class)) {
                attributions.set(resolved.source_id, resolved.attribution_text || resolved.licence_id);
              }
            });
          } else {
            const resolved = value?.rights || senseDefault;
            validateRights(resolved, `${entryId}.${fieldKey}`, auditMap, mode);
            classesUsed.add(resolved.class);
            if (EXTERNAL_CLASSES.has(resolved.class)) {
              attributions.set(resolved.source_id, resolved.attribution_text || resolved.licence_id);
            }
          }
        }
      }
    }

    merged.entry_rights_summary = { classes: [...classesUsed].sort() };
    builtEntries.push(merged);
  }

      
