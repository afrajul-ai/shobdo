/**
 * @file Stage 2 build and rights-enforcement script for SHOBDO.
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

/**
 * Validate a single resolved rights object against audit register and build mode.
 * @param {object | null} rights
 * @param {string} contextLabel
 * @param {Map<string, object>} auditMap
 * @param {'test' | 'release'} mode
 * @returns {void}
 */
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

/**
 * Scan built web files for forbidden external http(s) requests.
 * @param {string} outDir
 * @returns {void}
 */
function checkNoExternalRequests(outDir) {
  const targets = ['index.html', 'manifest.json', 'sw.js'];
  const srcDir = path.join(outDir, 'src');
  if (fs.existsSync(srcDir)) {
    for (const file of fs.readdirSync(srcDir)) {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        targets.push(path.join('src', file));
      }
    }
  }

  const urlPattern = /https?:\/\//i;
  for (const relPath of targets) {
    const fullPath = path.join(outDir, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    if (urlPattern.test(content)) {
      throw new Error(`External URL reference found in built file: ${relPath}`);
    }
  }
}

/**
 * Build and validate the SHOBDO site data and static shell.
 * @param {{ rootDir: string, outDir: string, mode: 'test' | 'release', copyStatic?: boolean }} options
 * @returns {{ entryCount: number, attributionCount: number }}
 */
export function buildSite({ rootDir, outDir, mode, copyStatic = true }) {
  if (mode !== 'test' && mode !== 'release') {
    throw new Error(`Invalid build mode: ${mode}`);
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

  fs.mkdirSync(path.join(outDir, 'data'), { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'data', 'dictionary.json'),
    JSON.stringify({ mode, entries: builtEntries }, null, 2)
  );
  fs.writeFileSync(
    path.join(outDir, 'data', 'attributions.json'),
    JSON.stringify({ sources: [...attributions.entries()] }, null, 2)
  );

  if (copyStatic) {
    for (const staticFile of ['index.html', 'manifest.json', 'sw.js']) {
      const src = path.join(rootDir, staticFile);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(outDir, staticFile));
      }
    }
    const srcFolder = path.join(rootDir, 'src');
    if (fs.existsSync(srcFolder)) {
      fs.cpSync(srcFolder, path.join(outDir, 'src'), { recursive: true });
    }
    checkNoExternalRequests(outDir);
  }

  return { entryCount: builtEntries.length, attributionCount: attributions.size };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = new Map(
    process.argv.slice(2).map((arg) => {
      const [k, v] = arg.replace(/^--/, '').split('=');
      return [k, v];
    })
  );
  const mode = args.get('mode') || 'test';
  const outDir = path.resolve(args.get('out') || '_site');
  const rootDir = process.cwd();

  const result = buildSite({ rootDir, outDir, mode, copyStatic: true });
  console.log(`Build succeeded (${mode}): ${result.entryCount} entries.`);
  }
  
